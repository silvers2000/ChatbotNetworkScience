from datetime import datetime
import json
import uuid
from src.models.user import db

class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), unique=True, nullable=False,
                           default=lambda: str(uuid.uuid4()))   # ✅ default
    # Optional owner of this chat session. Null means anonymous/unauthenticated
    user_id = db.Column(db.String(100), nullable=True)
    title = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False)
    
    # Relationship with messages
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'message_count': len(self.messages)
        }

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('chat_sessions.session_id'), nullable=False)
    message_type = db.Column(db.String(20), nullable=False)  # 'user', 'bot', 'system'
    content = db.Column(db.Text, nullable=False)
    has_pdf_context = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'type': self.message_type,
            'content': self.content,
            'has_pdf_context': self.has_pdf_context,
            'timestamp': self.timestamp.isoformat()
        }

