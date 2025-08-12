import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Mic, MicOff, Send, Upload, X, FileText, Bot, User } from 'lucide-react'
import './App.css'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  // NEW: active PDF session id (sent only when present)
  const [pdfId, setPdfId] = useState(null)

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }
      recognitionInstance.onerror = () => setIsListening(false)
      recognitionInstance.onend = () => setIsListening(false)
      setRecognition(recognitionInstance)
    }
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = { type: 'user', content: inputMessage }
    setMessages(prev => [...prev, userMessage])
    const outgoing = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      const body = { message: outgoing }
      if (pdfId) body.pdf_id = pdfId   // <-- attach pdf_id only if present

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (response.ok) {
        const botMessage = { 
          type: 'bot', 
          content: data.reply,              // <-- backend returns { reply, hasPdfContext }
          hasPdfContext: data.hasPdfContext //     not response / has_pdf_context
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      const errorMessage = { 
        type: 'bot', 
        content: `Sorry, I encountered an error: ${error.message}` 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF files')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      // Save pdf_id from backend so subsequent chats can reference this PDF
      setPdfId(data.pdf_id || null)

      if (response.ok) {
        setUploadedFile({
          name: file.name,
          pages: data.pages,
          preview: data.preview
        })
        const uploadMessage = { 
          type: 'system', 
          content: `PDF "${file.name}" uploaded successfully! (${data.pages} pages). You can now ask questions about the document.` 
        }
        setMessages(prev => [...prev, uploadMessage])
      } else {
        throw new Error(data.error || 'Failed to upload PDF')
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      // reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearPdf = async () => {
    try {
      // Optional: tell backend to clear if it stores per-id (harmless if not found)
      await fetch('/api/clear-pdf', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_id: pdfId })
      })
    } catch (_) {}
    // Always clear client-side state
    setPdfId(null)
    setUploadedFile(null)
    const clearMessage = { 
      type: 'system', 
      content: 'PDF context cleared. You can now chat normally or upload a new document.' 
    }
    setMessages(prev => [...prev, clearMessage])
  }

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser')
      return
    }
    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <Bot className="h-8 w-8 text-blue-600" />
              AI Chatbot
            </CardTitle>
            <p className="text-gray-600">Chat with AI and upload PDF documents for context-aware conversations</p>
          </CardHeader>
        </Card>

        {/* PDF Upload Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadedFile && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {uploadedFile.name} ({uploadedFile.pages} pages)
                    </Badge>
                    <Button
                      onClick={clearPdf}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="Clear current PDF context"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Start a conversation or upload a PDF document to begin!</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl md:max-w-3xl px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'system'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : message.type === 'bot' ? (
                        <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : null}
                      <div className="flex-1">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="markdown text-sm md:text-base"
                        >
                          {message.content}
                        </ReactMarkdown>

                        {message.hasPdfContext && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Based on PDF
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  disabled={isLoading}
                  className="pr-12"
                />
                <Button
                  onClick={toggleVoiceInput}
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 ${
                    isListening ? 'text-red-500' : 'text-gray-400'
                  }`}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
            {isListening && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <Mic className="h-3 w-3" />
                Listening... Speak now
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Powered by Gemini AI • Netscience Technologies</p>
        </div>
      </div>
    </div>
  )
}

export default App
