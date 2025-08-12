
import os
import sys
from datetime import timedelta

# Ensure package imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv; load_dotenv()

from src.models.user import db
from src.routes.user import user_bp
from src.routes.chat import chat_bp
from src.routes.auth import auth_bp

# --- App ---
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# --- SQLite path ---
BASE_DIR = os.path.dirname(__file__)
DB_DIR = os.path.join(BASE_DIR, 'database')
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, 'app.db')

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + DB_PATH.replace('\\', '/')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CORS
CORS(app, supports_credentials=True)

# DB init
db.init_app(app)

# Blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Create tables
with app.app_context():
    db.create_all()

# Health
@app.get('/api/health')
def health():
    return jsonify({'status': 'ok'})

# Serve built frontend (if copied into src/static)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != '' and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    index_path = os.path.join(static_folder_path, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_folder_path, 'index.html')
    return "index.html not found", 404

# Global error handler (easier debugging in UI)
@app.errorhandler(Exception)
def on_error(err):
    app.logger.exception(err)
    return jsonify({'error': str(err)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
