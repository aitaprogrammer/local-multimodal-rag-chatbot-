# Comprehensive Code Documentation

## Project Overview
This project is a **local Retrieval-Augmented Generation (RAG) Chatbot** application. It allows users to:
1.  Create multiple chat sessions.
2.  Upload documents (PDF, TXT) to specific chat sessions.
3.  Ask questions about the uploaded documents.
4.  **Select LLM Model**: Choose between different local models (e.g., Gemma 3, Qwen 2.5) for generation.
5.  **View Citations**: See exactly which documents were used to generate an answer.
6.  **Voice Interaction**: Speak to the bot and hear responses via TTS.

The application is built with a **FastAPI** backend and a **React (Vite)** frontend.

---

## Backend Documentation

### 1. `main.py`
The entry point of the FastAPI application. It defines the API endpoints and orchestrates the interaction between the database, the vector store, the LLM, and the audio engine.

#### **App Initialization**
-   **Startup Cleanup**: Automatically deletes old audio files (`.wav`) and temporary files from the `static/` directory on server start to maintain hygiene.
-   Initializes the FastAPI app with CORS middleware.
-   Creates SQL database tables.
-   Initializes `VectorStoreManager`.

#### **Key Endpoints**

*   **`POST /chats/{chat_id}/message`**: Handles user messages and generates AI responses.
    *   **Input**: `user_message` (str), `use_history` (bool), `model` (str).
    *   **Process**:
        1.  Saves the user's message to SQLite.
        2.  **RAG Search**: Calls `vsm.search` to retrieve relevant chunks *and their source filenames*.
        3.  **Context Formatting**: Constructs the context string with explicit "Source: [filename]" labels.
        4.  **Prompt Construction**: 
            *   System Prompt instructs the AI to cite sources.
            *   Combines Context, History, and User Message.
        5.  **LLM Generation**: dynamic calls to `ollama.generate` using the **selected model** (e.g., `qwen3:4b` or `gemma3:1b`).
        6.  **Audio Generation & Cleanup**:
            *   **Garbage Collection**: Aggressively keeps only the **3 most recent** audio files to save space.
            *   Generates TTS audio for the response.
        7.  **Response**: Returns the AI message, including `audio_url` and a list of `sources` used.

*   **`POST /chats`**: Creates a new chat session.
*   **`GET /chats`**: Lists all available chat sessions.
*   **`PATCH /chats/{chat_id}`**: Updates a chat's title.
*   **`DELETE /chats/{chat_id}`**: Deletes a chat session (SQL + Vector Store).
*   **`POST /transcribe`**: Transcribes uploaded audio.
*   **`POST /chats/{chat_id}/upload`**: Uploads and indexes multiple documents.

---

### 2. `rag_engine.py`
Handles the interface with **ChromaDB**.

*   **`add_document(chat_id, filename, text)`**:
    *   Chunks text and generates embeddings.
    *   Stores metadata: `{"chat_id": chat_id, "filename": filename}`.

*   **`search(chat_id, query, k=3)`**:
    *   Retrieves top-k similar chunks.
    *   **New Feature**: Parses the results to extract `source` (filename) from metadata.
    *   Returns a structured list: `[{'text': '...', 'source': 'doc.pdf'}, ...]`.

---

### 3. `audio_engine.py`
Handles Text-to-Speech (TTS) functionality.
*   **`generate_audio(text, output_path)`**: Uses `pyttsx3` to generate offline speech from text.

---

### 4. `database.py`
Defines SQLAlchemy models: `Chat`, `Message`, `Document`.
*   `Message` now implicitly supports returning `sources` via Pydantic response models, though they are currently transient in the API response.

---

## Frontend Documentation (React + Vite)

### 1. Store (`store/chatStore.js`)
Manages global application state using **Zustand**.

*   **New State**:
    *   `showCitations` (bool): Toggle to show/hide source chips in the chat UI.
    *   `selectedModel` (str): Stores the currently selected LLM (default: `gemma3:1b`).
*   **Updated Actions**:
    *   `toggleCitations()`: Switches the citation visibility.
    *   `setModel(modelId)`: Updates the selected model.
    *   `sendUserMessage(text)`: Now retrieves `selectedModel` from state and passes it to the API.

### 2. Components

*   **`App.jsx`**: Layout container.

*   **`Sidebar.jsx`** (Left Panel):
    *   **Logo**: Added an aesthetic "RAG Chatbot" logo at the bottom left with a gradient icon.
    *   Chat management (New, Rename, Delete, List).

*   **`ChatArea.jsx`** (Main Chat):
    *   **Model Selector**: A floating, glassmorphism-style dropdown in the top-right corner to switch between models (e.g., Qwen 3, Gemma 3).
    *   **Source Citations**: Rendered as interactive chips at the bottom of assistant messages.
        *   Only visible if `showCitations` is ON and sources exist for that message.
        *   Clicking a source chip shows an alert with the full filename.
    *   **Audio Playback**: Integrated controls for playing TTS responses.

*   **`InputArea.jsx`** (Bottom Input):
    *   Handles text input and voice mode toggling.

*   **`DocumentSidebar.jsx`** (Right Panel):
    *   **Citations Toggle**: Added a toggle button to enable/disable the display of source citations in the chat area.
    *   Document management (Upload, List, Delete).
    *   Conversational Memory toggle.

### 3. API Layer (`lib/api.js`)
*   **`sendMessage`**: Updated signature to accept `model` parameter: `sendMessage(id, text, useHistory, model)`.

---

## styling
*   **Tailwind CSS**: Used for all styling (Dark mode, gradients, glassmorphism).
*   **Lucide React**: Used for consistent, clean iconography (`Quote`, `Sparkles`, `Bot`, `User`, etc.).
*   **Framer Motion**: Used for smooth animations (message entry, dropdowns, sidebar transitions).
