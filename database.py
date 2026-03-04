from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import datetime

# SQLite database configuration
DATABASE_URL = "sqlite:///./chat_app.db"

# Create the engine
# check_same_thread=False is needed only for SQLite. It's not needed for other databases.
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a customized SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for our models
Base = declarative_base()

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships with cascade delete
    # If a chat is deleted, all its messages and documents are also deleted
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="chat", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text) # Using Text for potentially long message content
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship back to Chat
    chat = relationship("Chat", back_populates="messages")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    filename = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to Chat
    chat = relationship("Chat", back_populates="documents")

def init_db():
    """Helper function to create tables"""
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    print("Creating database tables...")
    init_db()
    print("Tables created successfully.")
