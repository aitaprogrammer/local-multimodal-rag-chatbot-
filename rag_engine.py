import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import uuid
import os
import pypdf


def parse_document(file_path):
    """
    Parses a document file (.txt or .pdf) and returns the extracted text.
    """
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    
    try:
        if ext == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        elif ext == '.pdf':
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        else:
             print(f"Unsupported file type: {ext}")
             return None

        # Basic sanitization
        text = text.replace('\x00', '') # Remove null bytes
        return text.strip()

    except Exception as e:
        print(f"Error parsing document {file_path}: {e}")
        return None

class VectorStoreManager:
    def __init__(self, collection_name="local_rag"):
        # Initialize Persistent Client
        self.client = chromadb.PersistentClient(path="./chroma_db")
        
        # Initialize Embedding Model
        self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        
        # Get or Create Collection
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def _chunk_text(self, text, chunk_size=500, overlap=50):
        """Simple chunking helper"""
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = start + chunk_size
            chunks.append(text[start:end])
            # Move forward by chunk_size - overlap
            start += (chunk_size - overlap)
            
        return chunks

    def add_document(self, chat_id, filename, text):
        """
        Chunks text, embeds it, and stores in ChromaDB with metadata.
        """
        chunks = self._chunk_text(text)
        
        if not chunks:
            return

        # Generate embeddings for all chunks at once for efficiency
        embeddings = self.embedding_model.encode(chunks).tolist()
        
        ids = [str(uuid.uuid4()) for _ in range(len(chunks))]
        # Crucial: Add {'chat_id': chat_id} to metadata for filtering
        metadatas = [{"chat_id": chat_id, "filename": filename} for _ in range(len(chunks))]
        
        self.collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Added {len(chunks)} chunks for filename {filename} in chat_id {chat_id}")

    def search(self, chat_id, query, k=3):
        """
        Searches for relevant chunks within a specific chat context.
        Returns a list of dicts: [{'text': chunk, 'source': filename}, ...]
        """
        query_embedding = self.embedding_model.encode([query]).tolist()
        
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=k,
            where={"chat_id": chat_id} # Critical filtering
        )
        
        parsed_results = []
        if results and results['documents']:
            docs = results['documents'][0]
            metas = results['metadatas'][0]
            
            for i, doc in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                source = meta.get('filename', 'Unknown Source')
                parsed_results.append({
                    'text': doc,
                    'source': source
                })
                
        return parsed_results

    def delete_chat(self, chat_id):
        """
        Deletes all vectors associated with a chat_id.
        """
        try:
            self.collection.delete(
                where={"chat_id": chat_id}
            )
            print(f"Deleted vectors for chat_id {chat_id}")
        except Exception as e:
            print(f"Error deleting chat {chat_id}: {e}")

    def delete_document(self, chat_id, filename):
        """
        Deletes all vectors associated with a chat_id and filename.
        """
        try:
            self.collection.delete(
                where={"$and": [{"chat_id": chat_id}, {"filename": filename}]}
            )
            print(f"Deleted vectors for chat_id {chat_id} and filename {filename}")
        except Exception as e:
            print(f"Error deleting document {filename} in chat {chat_id}: {e}")


if __name__ == "__main__":
    # verification code
    print("Initializing VectorStoreManager...")
    vsm = VectorStoreManager()
    print("VectorStoreManager initialized.")
