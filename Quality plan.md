# Software Engineering & Quality Assurance Plan
**Project Name:** LocalRAG-Voice (Offline Multimodal RAG Assistant)  
**Organization:** UMTI Tech Solutions  
**Document Version:** 1.0  
**Date:** March 2026  

---

## 1.0 Data Persistence Layer (SQLite & SQLAlchemy)
**Description:** This module manages the relational data schemas required for session tracking, message logging, and document metadata storage.

### 1.1 Components
* **Database Configuration:** Connection pooling and session management via `database.py`.
* **ORM Models:** Definitions for `Chat`, `Message`, and `Document` entities.
* **Data Integrity:** Implementation of cascade deletion constraints.

### 1.2 Quality Assurance Test Cases
* **TC-DB-01: Initialization & Schema Generation**
    * **Action:** Execute the backend application startup routine.
    * **Expected Result:** A persistent `chat_history.db` file is generated in the root directory. Verification via SQLite viewer confirms the creation of all required tables and foreign key constraints.
* **TC-DB-02: Cascade Deletion Verification**
    * **Action:** Delete a `Chat` record that has associated `Message` and `Document` records.
    * **Expected Result:** All child records (`Message`, `Document`) linked to the parent `Chat` ID are automatically removed from the database.

---

## 2.0 Retrieval-Augmented Generation (RAG) Engine
**Description:** Responsible for the ingestion, processing, and vectorization of textual data, ensuring strict contextual isolation between user sessions.



### 2.1 Components
* **Vector Database:** `chromadb.PersistentClient` initialization.
* **Embedding Model:** Integration with `sentence-transformers`.
* **ETL Pipeline:** Text extraction utilities for `.pdf` and `.txt` files, followed by chunking algorithms.

### 2.2 Quality Assurance Test Cases
* **TC-RAG-01: Document Parsing Accuracy**
    * **Action:** Input a standard multi-page PDF document into the parsing utility.
    * **Expected Result:** The function returns a continuous, cleanly formatted string representing the document's textual content without encoding errors.
* **TC-RAG-02: Vector Space Isolation**
    * **Action:** Ingest Document A into Chat Session 1. Ingest Document B into Chat Session 2. Execute a semantic search querying data from Document A while passing `chat_id=2`.
    * **Expected Result:** The search returns zero relevant chunks, confirming that vector filtering successfully isolates context by session ID.

---

## 3.0 API Gateway (FastAPI)
**Description:** The RESTful interface connecting the client application to the underlying database, RAG engine, and LLM services.

### 3.1 Components
* **Session Endpoints:** `POST /chats`, `GET /chats`, `DELETE /chats/{id}`.
* **Ingestion Endpoints:** `POST /chats/{id}/upload`.
* **Inference Endpoints:** `POST /chats/{id}/message`.

### 3.2 Quality Assurance Test Cases
* **TC-API-01: Session Lifecycle Management**
    * **Action:** Send a `POST` request to `/chats`, followed by a `GET` request to `/chats`.
    * **Expected Result:** The API successfully creates a new session returning a 201 status code, and the subsequent GET request includes the newly created session in its payload.
* **TC-API-02: Document Upload Handling**
    * **Action:** Transmit a `.txt` file payload via `POST /chats/{id}/upload`.
    * **Expected Result:** The API returns a 200 OK status containing the number of text chunks successfully embedded and indexed.

---

## 4.0 LLM Integration & Source Attribution
**Description:** Manages the communication with the local inference engine (Ollama) and ensures responses are grounded and cited.

### 4.1 Components
* **Metadata Extraction:** RAG engine modifications to return source filenames.
* **Prompt Engineering:** System instructions mandating source citations.
* **Response Formatting:** API models structured to return citation arrays.

### 4.2 Quality Assurance Test Cases
* **TC-LLM-01: Citation Accuracy Verification**
    * **Action:** Upload a specific reference document (e.g., `policy.pdf`). Submit a prompt requiring information exclusive to that document.
    * **Expected Result:** The generated text accurately reflects the source material, and the JSON response payload includes `sources: ["policy.pdf"]`.

---

## 5.0 Audio Processing Services
**Description:** Provides voice-to-text and text-to-voice capabilities using localized machine learning models.

### 5.1 Components
* **ASR Engine:** Integration with `faster-whisper` for speech recognition.
* **TTS Engine:** Integration with Coqui TTS for speech synthesis.
* **Resource Management:** Automated cleanup tasks for temporary audio files.

### 5.2 Quality Assurance Test Cases
* **TC-AUD-01: Speech-to-Text Accuracy**
    * **Action:** Submit a clear, 5-second `.wav` audio recording to `POST /transcribe`.
    * **Expected Result:** The API returns a 200 OK status with a JSON payload containing the accurate text transcription.
* **TC-AUD-02: Text-to-Speech Generation**
    * **Action:** Submit a standard text payload to the message inference endpoint.
    * **Expected Result:** Alongside the text response, the API returns a valid `audio_url`. Accessing the URL serves a `.wav` file containing the synthesized speech.

---

## 6.0 Client Interface (React/Vite)
**Description:** The frontend application providing the user interface for chat management, document uploading, and messaging.

### 6.1 Components
* **Navigation:** Sidebar component for session management.
* **Chat View:** Main interface supporting Markdown rendering.
* **Citation UI:** Dynamic badge rendering for document sources.

### 6.2 Quality Assurance Test Cases
* **TC-UI-01: Optimistic UI Updates**
    * **Action:** Click the "New Chat" initialization button.
    * **Expected Result:** The UI immediately displays the new chat in the sidebar without requiring a full page refresh.
* **TC-UI-02: Markdown Rendering Verification**
    * **Action:** Prompt the AI to generate a block of Python code.
    * **Expected Result:** The UI renders the response within a formatted syntax-highlighted code block, not as raw plaintext.

---

## 7.0 Frontend Audio Integration
**Description:** Browser-level integration for capturing microphone input and handling audio playback.

### 7.1 Components
* **Capture Interface:** `AudioRecorder` component utilizing the `MediaRecorder` API.
* **Playback Interface:** HTML5 audio integration within message components.

### 7.2 Quality Assurance Test Cases
* **TC-FWA-01: Microphone Capture Flow**
    * **Action:** Grant browser microphone permissions, record a vocal prompt via the UI, and stop recording.
    * **Expected Result:** The UI displays a loading indicator, transmits the blob to the backend, and subsequently populates the chat input field with the transcribed text.

---