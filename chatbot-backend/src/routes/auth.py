from flask import Blueprint, jsonify, request, session
from src.models.user import db
from src.models.auth import User, UserSession
from datetime import datetime, timedelta
import uuid
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # At least 8 characters, one uppercase, one lowercase, one digit
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    return True, "Password is valid"

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Create new user
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Create session token
        session_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=30)  # 30 days expiry
        
        user_session = UserSession(
            session_token=session_token,
            user_id=user.user_id,
            expires_at=expires_at
        )
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        db.session.add(user_session)
        db.session.commit()
        
        # Store session in Flask session
        session['user_id'] = user.user_id
        session['session_token'] = session_token
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'session_token': session_token
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        session_token = request.headers.get('Authorization') or session.get('session_token')
        
        if session_token:
            # Deactivate session
            user_session = UserSession.query.filter_by(session_token=session_token).first()
            if user_session:
                user_session.is_active = False
                db.session.commit()
        
        # Clear Flask session
        session.clear()
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    try:
        session_token = request.headers.get('Authorization') or session.get('session_token')
        
        if not session_token:
            return jsonify({'error': 'No session token provided'}), 401
        
        # Find active session
        user_session = UserSession.query.filter_by(
            session_token=session_token,
            is_active=True
        ).first()
        
        if not user_session or user_session.expires_at < datetime.utcnow():
            return jsonify({'error': 'Invalid or expired session'}), 401
        
        user = User.query.filter_by(user_id=user_session.user_id).first()
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        return jsonify({
            'user': user.to_dict(),
            'session': user_session.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/check-session', methods=['GET'])
def check_session():
    try:
        session_token = request.headers.get('Authorization') or session.get('session_token')
        
        if not session_token:
            return jsonify({'authenticated': False}), 200
        
        user_session = UserSession.query.filter_by(
            session_token=session_token,
            is_active=True
        ).first()
        
        if not user_session or user_session.expires_at < datetime.utcnow():
            return jsonify({'authenticated': False}), 200
        
        return jsonify({'authenticated': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

