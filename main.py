from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
import pypdf
import io
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
import uvicorn
import ollama
import random

import database
from database import Chat, Message, Document
from rag_engine import VectorStoreManager
from audio_engine import transcribe_audio, generate_audio
import shutil
import os
from fastapi.staticfiles import StaticFiles

# Initialize database tables
database.Base.metadata.create_all(bind=database.engine)

# Cleanup static files on startup
def startup_cleanup():
    static_dir = "static"
    if os.path.exists(static_dir):
        for f in os.listdir(static_dir):
            if f.endswith(".wav") or f.startswith("temp_"):
                try:
                    os.remove(os.path.join(static_dir, f))
                except Exception as e:
                    print(f"Error cleaning {f}: {e}")
    else:
        os.makedirs(static_dir, exist_ok=True)

startup_cleanup()

app = FastAPI(title="Local RAG Chatbot")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for audio files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Vector Store
vsm = VectorStoreManager()

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Models for Response
class ChatResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime
    audio_url: Optional[str] = None
    sources: List[str] = []

    class Config:
        from_attributes = True

class ChatListResponse(BaseModel):
    id: int
    title: str

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    user_message: str
    use_history: bool = True
    model: str = "gemma3:1b"

class ChatUpdate(BaseModel):
    title: str

@app.post("/chats", response_model=ChatResponse)
def create_chat(db: Session = Depends(get_db)):
    """Creates a new chat session."""
    try:
        # Default title initially, we can update it after commit to include ID if we want
        new_chat = Chat(title="New Chat") 
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        
        # Update title with ID for better visibility by default
        new_chat.title = f"Chat {new_chat.id}"
        db.commit()
        db.refresh(new_chat)
        
        return new_chat
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/chats/{chat_id}", response_model=ChatResponse)
def update_chat(chat_id: int, chat_update: ChatUpdate, db: Session = Depends(get_db)):
    """Updates a chat's title."""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    chat.title = chat_update.title
    db.commit()
    db.refresh(chat)
    return chat

@app.get("/chats", response_model=List[ChatListResponse])
def list_chats(db: Session = Depends(get_db)):
    """Returns a list of all chats, sorted by ID descending."""
    chats = db.query(Chat).order_by(Chat.id.desc()).all()
    return chats

@app.delete("/chats/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(chat_id: int, db: Session = Depends(get_db)):
    """
    Deletes a chat from SQL and removes associated vectors.
    """
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # 1. Delete vectors from ChromaDB
    vsm.delete_chat(chat_id)

    # 2. Delete from SQLite (associated messages/docs deleted via cascade)
    db.delete(chat)
    db.commit()
    return None

@app.get("/chats/{chat_id}/history", response_model=List[MessageResponse])
def get_chat_history(chat_id: int, db: Session = Depends(get_db)):
    """Returns all messages for a specific chat."""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return chat.messages

@app.post("/chats/{chat_id}/message", response_model=MessageResponse)
def send_message(chat_id: int, message: MessageCreate, db: Session = Depends(get_db)):
    """
    1. Saves user message.
    2. Searches for context using RAG.
    3. Generates response using Ollama.
    4. Saves and returns AI message.
    """
    # Check if chat exists
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # 1. Save User Message
    user_msg = Message(chat_id=chat_id, role="user", content=message.user_message)
    db.add(user_msg)
    db.commit()

    # 2. Get Context from RAG
    results = vsm.search(chat_id, message.user_message)
    context = ""
    sources = []
    
    if results:
        unique_sources = set()
        for res in results:
            text = res.get('text', '')
            source = res.get('source', 'Unknown')
            
            context += f"\nSource: {source}\nContent: {text}\n"
            unique_sources.add(source)
        sources = list(unique_sources)
    
    # 2.5 Get History if requested
    history_context = ""
    if message.use_history:
        db.refresh(user_msg)
        # Get all messages except the one we just saved
        relevant_msgs = db.query(Message).filter(
            Message.chat_id == chat_id, 
            Message.id != user_msg.id
        ).order_by(Message.id).all()
        
        if relevant_msgs:
            selected_msgs = []
            if len(relevant_msgs) == 1:
                selected_msgs = relevant_msgs
            else:
                # 1 most recent
                most_recent = relevant_msgs[-1]
                # A random one from the ones before it
                in_between_pool = relevant_msgs[:-1]
                random_msg = random.choice(in_between_pool)
                first_msg=relevant_msgs[0]
                # Keep them in chronological order
                selected_msgs = [first_msg,random_msg, most_recent,]
            
            history_context = "Relevant  conversation snippets:\n"
            for m in selected_msgs:
                history_context += f"{m.role.capitalize()}: {m.content}\n"
            history_context += "\n"

    # 3. Construct Prompt
    # "System: Answer using this context: {context}. {history} User: {message}"
    prompt = f"System: You are a helpful assistant. Use the provided context to answer the user. Always mention the source filename when using information from a document (e.g., 'According to [filename]...'). If the answer is not in the context, say you don't know.\n\nContext:\n{context}\n\n{history_context}\nUser: {message.user_message}"
    print(history_context)
    print(len(history_context))
    # 4. Call Ollama
    print(f"Generating usage for chat {chat_id} with prompt length {len(prompt)}")
    try:
        # Ensure 'gemma3:1b' is pulled in Ollama: `ollama pull gemma3:1b`
        response = ollama.generate(model=message.model, prompt=prompt)
        ai_text = response['response']
        print(f"Ollama generation complete for chat {chat_id}")
    except Exception as e:
        # Fallback or error handling
        # For now, let's log/raise, but we already committed the user message. 
        print(f"Ollama generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama generation failed: {str(e)}")

    # 5. Save AI Response
    ai_msg = Message(chat_id=chat_id, role="assistant", content=ai_text)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    # 6. Generate TTS Audio
    try:
        audio_filename = f"audio_{ai_msg.id}.wav"
        # Ensure static dir exists
        os.makedirs("static", exist_ok=True)
        audio_path = os.path.join("static", audio_filename)
        
        # Cleanup old audio files (keep last 3)
        try:
            files = [os.path.join("static", f) for f in os.listdir("static") if f.endswith(".wav")]
            files.sort(key=os.path.getctime) # Sort by oldest first
            if len(files) >= 3:
                for f in files[:-2]: # Keep top 2 + the one we are about to make = 3
                    try:
                        os.remove(f)
                        print(f"Deleted old audio: {f}")
                    except Exception as e:
                        print(f"Error removing {f}: {e}")
        except Exception as e:
            print(f"Cleanup failed: {e}")

        # Generate audio
        print(f"Generating TTS for message {ai_msg.id}...")
        generate_audio(ai_text, audio_path)
        print(f"TTS generation complete for message {ai_msg.id}")
        
        # Add URL to response
        ai_msg.audio_url = f"http://127.0.0.1:8000/static/{audio_filename}"
    except Exception as e:
        print(f"TTS generation failed: {e}")
        ai_msg.audio_url = None

    # Attach sources to the response object (dynamic attribute hack for Pydantic model)
    # Only include sources that were actually mentioned in the AI's response
    mentioned_sources = []
    for s in sources:
        name_no_ext = os.path.splitext(s)[0]
        if s in ai_text or name_no_ext in ai_text:
            mentioned_sources.append(s)
            
    ai_msg.sources = mentioned_sources
    return ai_msg


@app.post("/chats/{chat_id}/upload")
async def upload_documents(chat_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    """
    Uploads multiple documents (PDF or TXT), extracts text, and indexes them.
    """
    # Check if chat exists
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    uploaded_results = []
    
    for file in files:
        filename = file.filename
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        
        text = ""
        try:
            if ext == 'pdf':
                # Use pypdf with file-like object
                reader = pypdf.PdfReader(file.file)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
            elif ext == 'txt':
                content = await file.read()
                text = content.decode('utf-8')
            else:
                # Skip unsupported files instead of failing entire batch? 
                # Or fail fast. Let's fail fast for now or collect errors.
                continue 
        except Exception as e:
            print(f"Failed to process file {filename}: {str(e)}")
            continue

        if not text.strip():
            continue

        # Save to SQL
        doc = Document(chat_id=chat_id, filename=filename)
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Index in Chroma
        try:
            vsm.add_document(chat_id, filename, text)
            uploaded_results.append({"filename": filename, "status": "indexed", "document_id": doc.id})
        except Exception as e:
             # Rollback SQL if vector store fails? For now, just log.
             print(f"Error indexing document {filename}: {e}")
             # We already committed to SQLite, maybe we should skip adding to uploaded_results or mark as failed
    
    if not uploaded_results:
        raise HTTPException(status_code=400, detail="No valid documents were processed.")
        
    return uploaded_results

class DocumentResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

@app.get("/chats/{chat_id}/documents", response_model=List[DocumentResponse])
def list_documents(chat_id: int, db: Session = Depends(get_db)):
    """Returns a list of documents for a specific chat."""
    documents = db.query(Document).filter(Document.chat_id == chat_id).all()
    return documents

@app.delete("/chats/{chat_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(chat_id: int, doc_id: int, db: Session = Depends(get_db)):
    """
    Deletes a document from SQL and removes associated vectors.
    """
    doc = db.query(Document).filter(Document.id == doc_id, Document.chat_id == chat_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    filename = doc.filename

    # 1. Delete vectors from ChromaDB
    vsm.delete_document(chat_id, filename)

    db.delete(doc)
    db.commit()
    return None

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    Transcribes uploaded audio file (wav/webm) to text using local Whisper model.
    """
    # Generate a temp filename
    temp_filename = f"temp_{file.filename}"
    
    try:
        # Save the uploaded file locally
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Transcribe using the audio engine
        text = transcribe_audio(temp_filename)
        
        return {"text": text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        
    finally:
        # Cleanup: delete the temp file
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception as e:
                print(f"Error removing temp file {temp_filename}: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
