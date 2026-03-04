<div align="center">

# 🎙️ Local RAG Chatbot

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Ollama](https://img.shields.io/badge/AI-Ollama-FFFFFF?style=for-the-badge&logo=ollama&logoColor=black)

**A fully local, privacy-focused voice assistant that lets you chat with your documents.** <br>
*It uses Retrieval-Augmented Generation (RAG) to answer questions based on your own files, without sending a single byte of data to the cloud.*


https://github.com/user-attachments/assets/593f9888-5784-43f4-b8c9-7293ae22fe83


</div>

---

## 🚀 Features

* 🚫☁️ **100% Offline**: Runs locally using Ollama (LLM), Whisper (ASR), and Coqui (TTS).
* 🗣️🎧 **Multimodal**: Talk to your AI and hear it speak back naturally.
* 📚🧠 **RAG Powered**: Upload PDFs or TXT files to give the AI context and custom knowledge.
* 🗂️🗃️ **Chat Management**: Create multiple isolated chat sessions (Project A docs won't leak into Project B).
* 🎯🔗 **Source Citations**: The AI tells you exactly which file it used to answer your question.
* 🎨🌙 **Modern UI**: A beautiful, dark-mode React interface with Tailwind CSS and sleek animations.

## 🛠️ Tech Stack

### 💻 Frontend
* **Framework**: React (Vite) ⚛️
* **Styling**: Tailwind CSS 🌊
* **Animations**: Framer Motion 🎬
* **Requests**: Axios 📡

### ⚙️ Backend
* **Framework**: Python FastAPI ⚡
* **Database**: SQLAlchemy 🗄️

### 🤖 AI Engine
* **LLM**: Ollama (Gemma 1B / Qwen3 4B) 🦙
* **Vector DB**: ChromaDB 📊
* **Embeddings**: SentenceTransformers (`all-MiniLM-L6-v2`) 🧬
* **Audio**: Faster-Whisper (STT) 🎤 + Coqui TTS 🔊

---

## 🔧 Setup & Installation

**Prerequisites:** Ensure you have **Python 3.10+** and **Node.js 18+** installed on your system.

### Backend Setup

Open your terminal and run the following commands to configure the Python environment and launch the FastAPI server:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment (Windows)
cd venv/Scripts
activate.bat
cd .. 
cd ..

# Install dependencies
pip install -r requirements.txt

# Run the local backend server
python main.py
```

### Frontend Setup

Open a new terminal for setting up frontend server:

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Launch the development server
npm run dev
```

