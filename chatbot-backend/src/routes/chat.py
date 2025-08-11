from flask import Blueprint, jsonify, request
import google.generativeai as genai
import os
import PyPDF2
from io import BytesIO
from dotenv import load_dotenv; load_dotenv()
key = os.getenv("GEMINI_API_KEY")
if not key:
    raise RuntimeError("GEMINI_API_KEY not set")
genai.configure(api_key=key)


chat_bp = Blueprint('chat', __name__)

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=(
        "You are a professional chatbot. Always answer in clean Markdown with:\n"
        "- short title line\n- bullet points\n- bold keywords\n"
        "- tables when comparing items\n- code blocks for code."
    ))

# Store PDF content in memory (in production, use a proper database)
pdf_content = ""

@chat_bp.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Create context with PDF content if available
        context = ""
        if pdf_content:
            context = f"Based on the uploaded PDF document content:\n{pdf_content}\n\nUser question: {user_message}"
        else:
            context = user_message
        
        # Generate response using Gemini
        response = model.generate_content(context)
        
        return jsonify({
            'response': response.text,
            'has_pdf_context': bool(pdf_content)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    global pdf_content
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Read PDF content
        pdf_reader = PyPDF2.PdfReader(BytesIO(file.read()))
        text_content = ""
        
        for page in pdf_reader.pages:
            text_content += page.extract_text() + "\n"
        
        pdf_content = text_content
        
        return jsonify({
            'message': 'PDF uploaded successfully',
            'pages': len(pdf_reader.pages),
            'preview': text_content[:200] + "..." if len(text_content) > 200 else text_content
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/clear-pdf', methods=['POST'])
def clear_pdf():
    global pdf_content
    pdf_content = ""
    return jsonify({'message': 'PDF content cleared'})

