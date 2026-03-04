
# 🎙️ Local RAG MultiModal Chatbot

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![Ollama](https://img.shields.io/badge/AI-Ollama%20(Gemma)-orange)
![Docker](https://img.shields.io/badge/Deployment-Docker-blue)

this is a fully local, privacy-focused voice assistant that lets you chat with your documents. It uses Retrieval-Augmented Generation (RAG) to answer questions based on your own files, without sending data to the cloud.



## 🚀 Features

* **100% Offline**: Runs locally using Ollama (LLM), Whisper (ASR), and Coqui (TTS).
* **Multimodal**: Talk to your AI and hear it speak back.
* **RAG Powered**: Upload PDFs or TXT files to give the AI context.
* **Chat Management**: Create multiple isolated chat sessions (Project A docs won't leak into Project B).
* **Source Citations**: The AI tells you exactly which file it used to answer.
* **Modern UI**: A beautiful, dark-mode React interface with Tailwind CSS.

## 🛠️ Tech Stack

* **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Axios.
* **Backend**: Python FastAPI, SQLAlchemy.
* **AI Engine**:
    * **LLM**: Ollama (Gemma 1B / qwen3  4b )
    * **Vector DB**: ChromaDB
    * **Embeddings**: SentenceTransformers (`all-MiniLM-L6-v2`)
    * **Audio**: Faster-Whisper (STT) + Coqui TTS.
* **Infrastructure**: Docker & Docker Compose.

---

## ⚡ Quick Start (Recommended)

**Prerequisites:**
1.  [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
2.  [Ollama](https://ollama.com/) installed and running (`ollama serve`).
3.  Pull the model: `ollama pull gemma:2b`

**Steps:**

1.  **Clone the repository**
    ```bash
    git clone https://github.com/aitaprogrammer/Local-MultiModal-RAG-chatbot-.git
    cd Local-MultiModal-RAG-chatbot-
    ```

2.  **Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```



---

## 🔧 Manual Setup (No Docker)

If you prefer running it manually, you need Python 3.10+ and Node.js 18+.

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies (requires FFmpeg installed on system)
pip install -r requirements.txt

# Run Server
uvicorn main:app --reload
