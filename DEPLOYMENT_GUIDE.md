# Quick Deployment Guide

## For Interviewers - Quick Setup Instructions

### Prerequisites
- Python 3.11+
- Google Gemini API Key (Get from: https://makersuite.google.com/app/apikey)

### Quick Start (5 minutes)

1. **Extract the zip file**:
   ```bash
   unzip chatbot-assignment-submission.zip
   cd chatbot-backend
   ```

2. **Set up Python environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set your Gemini API key**:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   # On Windows: set GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the application**:
   ```bash
   python src/main.py
   ```

5. **Open in browser**: http://localhost:5000

### Features to Test

✅ **Basic Chat**: Type any question and get AI responses  
✅ **PDF Upload**: Upload a PDF and ask questions about its content  
✅ **Voice Input**: Click the microphone icon and speak (requires HTTPS or localhost)  
✅ **Responsive Design**: Test on mobile and desktop  

### Production Deployment

The application is ready for deployment on:
- **Vercel**: `vercel --prod`
- **Render**: Connect GitHub repo, set environment variables
- **Heroku**: Add Procfile and deploy

### Environment Variables for Production
```
GEMINI_API_KEY=your_gemini_api_key
FLASK_ENV=production
SECRET_KEY=your_secure_secret_key
```

### Architecture Overview
- **Backend**: Flask + Gemini API + PyPDF2
- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Deployment**: Single Flask app serving both API and frontend

### Contact
For any questions about the implementation, please reach out to the candidate.

---
**Assignment completed for Netscience Technologies**  
**Deadline**: Monday, 11th August 2025 - 11:59 PM IST

