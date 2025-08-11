# AI Chatbot Application

A professional chatbot application with PDF document upload and voice input capabilities, built for Netscience Technologies internship assignment.

## Features

### Core Features (Must-Have)
- ✅ **AI Chatbot with API Integration**: Uses Google Gemini API for intelligent responses
- ✅ **PDF Document Upload**: Upload PDF files and ask questions about their content
- ✅ **Voice Input**: Optional voice-to-text input using Web Speech API
- ✅ **Deployment Ready**: Configured for deployment on Vercel, Render, or similar platforms

### Technical Features
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Chat**: Instant messaging interface with typing indicators
- **Context-Aware**: Maintains PDF document context for relevant responses
- **Error Handling**: Graceful error handling and user feedback
- **Professional UI**: Clean, modern interface with shadcn/ui components

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **AI API**: Google Gemini Pro
- **PDF Processing**: PyPDF2
- **CORS**: Flask-CORS for cross-origin requests

### Frontend
- **Framework**: React 18 with Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **Icons**: Lucide React
- **Voice Input**: Web Speech API

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Google Gemini API key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd chatbot-backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your Gemini API key
   ```

5. **Run the backend server**:
   ```bash
   python src/main.py
   ```

### Frontend Setup (Development)

1. **Navigate to frontend directory**:
   ```bash
   cd chatbot-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

### Full-Stack Deployment

For production deployment, the frontend is built and served by the Flask backend:

1. **Build the frontend**:
   ```bash
   cd chatbot-frontend
   npm run build
   ```

2. **Copy build files to Flask static directory**:
   ```bash
   cp -r dist/* ../chatbot-backend/src/static/
   ```

3. **Run the Flask server**:
   ```bash
   cd ../chatbot-backend
   source venv/bin/activate
   GEMINI_API_KEY=your_api_key python src/main.py
   ```

## API Endpoints

### Chat API
- **POST** `/api/chat`
  - Send a message to the chatbot
  - Body: `{"message": "Your question here"}`
  - Response: `{"response": "AI response", "has_pdf_context": boolean}`

### PDF Upload API
- **POST** `/api/upload-pdf`
  - Upload a PDF document
  - Body: FormData with 'file' field
  - Response: `{"message": "Success", "pages": number, "preview": "text"}`

### PDF Management API
- **POST** `/api/clear-pdf`
  - Clear the uploaded PDF context
  - Response: `{"message": "PDF content cleared"}`

## Usage Guide

### Basic Chat
1. Open the application in your browser
2. Type your message in the input field
3. Click "Send" or press Enter
4. View the AI response in the chat area

### PDF Document Chat
1. Click "Upload PDF" button
2. Select a PDF file from your device
3. Wait for upload confirmation
4. Ask questions about the document content
5. The AI will respond based on the PDF context

### Voice Input
1. Click the microphone icon in the input field
2. Speak your message when prompted
3. The speech will be converted to text automatically
4. Send the message as usual

## Deployment

### Environment Variables
Set the following environment variables for deployment:

```bash
GEMINI_API_KEY=your_gemini_api_key
FLASK_ENV=production
SECRET_KEY=your_secure_secret_key
```

### Platform-Specific Instructions

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Set environment variables in Vercel dashboard

#### Render
1. Connect your GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python src/main.py`
4. Add environment variables in Render dashboard

#### Heroku
1. Create `Procfile`: `web: python src/main.py`
2. Deploy using Heroku CLI or GitHub integration
3. Set environment variables using Heroku CLI or dashboard

## Project Structure

```
chatbot-backend/
├── src/
│   ├── routes/
│   │   ├── chat.py          # Chat and PDF API endpoints
│   │   └── user.py          # User management (template)
│   ├── models/
│   │   └── user.py          # Database models (template)
│   ├── static/              # Frontend build files
│   ├── database/
│   │   └── app.db          # SQLite database
│   └── main.py             # Flask application entry point
├── venv/                   # Python virtual environment
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
└── README.md              # This file

chatbot-frontend/
├── src/
│   ├── components/
│   │   └── ui/            # shadcn/ui components
│   ├── assets/            # Static assets
│   ├── App.jsx            # Main React component
│   ├── App.css            # Application styles
│   └── main.jsx           # React entry point
├── dist/                  # Build output
├── package.json           # Node.js dependencies
└── vite.config.js         # Vite configuration
```

## Security Considerations

- API keys are stored in environment variables
- CORS is configured for cross-origin requests
- File uploads are restricted to PDF format only
- Input validation and error handling implemented

## Performance Optimizations

- Frontend build optimization with Vite
- Efficient PDF text extraction
- Responsive design for mobile devices
- Loading states and user feedback

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure GEMINI_API_KEY is set correctly
2. **CORS Issues**: Verify Flask-CORS is installed and configured
3. **PDF Upload Fails**: Check file format and size limits
4. **Voice Input Not Working**: Ensure HTTPS or localhost for Web Speech API

### Development Tips

- Use browser developer tools to debug frontend issues
- Check Flask console logs for backend errors
- Test API endpoints using tools like Postman
- Verify environment variables are loaded correctly

## Contributing

This project was developed as part of an internship assignment for Netscience Technologies. For questions or improvements, please contact the development team.

## License

This project is developed for educational and assessment purposes as part of the Netscience Technologies internship selection process.

---

**Developed by**: [Your Name]  
**Company**: Netscience Technologies Private Limited  
**Date**: August 2025

