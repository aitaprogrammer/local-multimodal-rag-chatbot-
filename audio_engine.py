from faster_whisper import WhisperModel
import os

# Initialize Whisper model
# 'tiny' is selected for speed on CPU
model_size = "tiny"
model = WhisperModel(model_size, device="cpu", compute_type="int8")

def transcribe_audio(file_path: str) -> str:
    """
    Transcribes an audio file and returns the text.
    
    Args:
        file_path (str): Path to the audio file.
        
    Returns:
        str: Transcribed text.
    """
    segments, info = model.transcribe(file_path, beam_size=5)
    
    transcribed_text = []
    for segment in segments:
        transcribed_text.append(segment.text)
        
    return " ".join(transcribed_text).strip()

import pyttsx3

# Initialize TTS engine
# pyttsx3 is a more robust, offline solution compatible with Python 3.12+
# Initialize TTS engine inside the function for thread safety
# pyttsx3 is a more robust, offline solution compatible with Python 3.12+

def generate_audio(text: str, output_path: str):
    """
    Generates audio from text using pyttsx3 and saves it to the output path.
    
    Args:
        text (str): Text to synthesize.
        output_path (str): Path to save the wav file.
    """
    try:
        # Initialize engine inside the function to ensure it runs in the current thread context
        # This prevents COM threading issues on Windows when running in FastAPI/Uvicorn
        engine = pyttsx3.init()
        engine.save_to_file(text, output_path)
        engine.runAndWait()
        # engine.stop() # stop/cleanup if needed, though runAndWait handles the blocking loop
    except Exception as e:
        print(f"Error generating audio: {e}")
