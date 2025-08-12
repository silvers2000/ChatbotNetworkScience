import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { 
  Mic, 
  MicOff, 
  Send, 
  Upload, 
  X, 
  FileText, 
  Bot, 
  User, 
  Plus, 
  MessageSquare,
  Trash2,
  History,
  Menu,
  ChevronLeft,
  LogOut,
  Settings
} from 'lucide-react'
import AuthModal from './components/AuthModal.jsx'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [chatSessions, setChatSessions] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

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
      
      recognitionInstance.onerror = () => {
        setIsListening(false)
      }
      
      recognitionInstance.onend = () => {
        setIsListening(false)
      }
      
      setRecognition(recognitionInstance)
    }
  }, [])

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  // Load chat sessions when user is authenticated
  useEffect(() => {
    if (user) {
      loadChatSessions()
    }
  }, [user])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkExistingSession = async () => {
    const sessionToken = localStorage.getItem('session_token')
    const userData = localStorage.getItem('user')
    
    if (sessionToken && userData) {
      try {
        const response = await fetch('/api/auth/check-session', {
          headers: {
            'Authorization': sessionToken
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated) {
            setUser(JSON.parse(userData))
          } else {
            localStorage.removeItem('session_token')
            localStorage.removeItem('user')
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
        localStorage.removeItem('session_token')
        localStorage.removeItem('user')
      }
    }
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setShowAuthModal(false)
  }

  const handleLogout = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token')
      if (sessionToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': sessionToken
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('session_token')
      localStorage.removeItem('user')
      setUser(null)
      setMessages([])
      setCurrentSessionId(null)
      setChatSessions([])
    }
  }

  const loadChatSessions = async () => {
    try {
      const headers = {}
      const sessionToken = localStorage.getItem('session_token')
      if (sessionToken) headers['Authorization'] = sessionToken
      const response = await fetch('/api/chat/sessions', { headers })
      if (response.ok) {
        const sessions = await response.json()
        setChatSessions(sessions)
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error)
    }
  }

  const loadChatSession = async (sessionId) => {
    try {
      const headers = {}
      const sessionToken = localStorage.getItem('session_token')
      if (sessionToken) headers['Authorization'] = sessionToken
      const response = await fetch(`/api/chat/sessions/${sessionId}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages.map(msg => ({
          type: msg.type,
          content: msg.content,
          hasPdfContext: msg.has_pdf_context,
          timestamp: msg.timestamp
        })))
        setCurrentSessionId(sessionId)
        // Reset any previously uploaded file indicator when switching sessions
        setUploadedFile(null)
      }
    } catch (error) {
      console.error('Failed to load chat session:', error)
    }
  }

  const createNewSession = async () => {
    try {
      const headers = {}
      const sessionToken = localStorage.getItem('session_token')
      if (sessionToken) headers['Authorization'] = sessionToken
      const response = await fetch('/api/chat/new-session', { method: 'POST', headers })
      if (response.ok) {
        const data = await response.json()
        setCurrentSessionId(data.session_id)
        setMessages([])
        // New session should start without any PDF context on the client side
        setUploadedFile(null)
        loadChatSessions()
      }
    } catch (error) {
      console.error('Failed to create new session:', error)
    }
  }

  const deleteChatSession = async (sessionId, event) => {
    event.stopPropagation()
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' })
      if (response.ok) {
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null)
          setMessages([])
        }
        loadChatSessions()
      }
    } catch (error) {
      console.error('Failed to delete chat session:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = { type: 'user', content: inputMessage }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const sessionIdForMessage = currentSessionId || (uploadedFile && uploadedFile.sessionId) || null
      const headers = { 'Content-Type': 'application/json' }
      const authToken = localStorage.getItem('session_token')
      if (authToken) headers['Authorization'] = authToken
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message: inputMessage,
          session_id: sessionIdForMessage 
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        const botMessage = { 
          type: 'bot', 
          content: data.response,
          hasPdfContext: data.has_pdf_context 
        }
        setMessages(prev => [...prev, botMessage])
        
        if (!currentSessionId) {
          setCurrentSessionId(data.session_id)
        }
        
        if (user) {
          loadChatSessions()
        }
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

    // Accept PDF, CSV, XLSX, PPT, PPTX
    const allowed = [
      'application/pdf',
      'text/csv',
      // Excel MIME types
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      // PowerPoint MIME types
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ]
    const nameLower = file.name.toLowerCase()
    const allowedByExt = [ '.pdf', '.csv', '.xlsx', '.ppt', '.pptx' ].some(ext => nameLower.endsWith(ext))
    if (!allowedByExt && !allowed.includes(file.type)) {
      alert('Please upload only PDF, CSV, XLSX, PPT, or PPTX files')
      return
    }

    // Ensure a session exists before uploading so the document is scoped correctly
    let sessionIdToUse = currentSessionId
    if (!sessionIdToUse) {
      try {
        const resp = await fetch('/api/chat/new-session', { method: 'POST' })
        if (resp.ok) {
          const data = await resp.json()
          sessionIdToUse = data.session_id
          setCurrentSessionId(sessionIdToUse)
        }
      } catch (e) {
        console.error('Failed to create session for upload:', e)
      }
    }

    const formData = new FormData()
    formData.append('file', file)
    if (sessionIdToUse) formData.append('session_id', sessionIdToUse)

    try {
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (response.ok) {
        const effectiveSessionId = data.session_id || sessionIdToUse || currentSessionId
        setUploadedFile({
          name: file.name,
          preview: data.preview,
          sessionId: effectiveSessionId,
          meta: { kind: data.kind, pages: data.pages, slides: data.slides, rows: data.rows, columns: data.columns }
        })
        if (effectiveSessionId) {
          setCurrentSessionId(effectiveSessionId)
        }
        
        const detail = data.kind === 'pdf' && data.pages ? `${data.pages} pages` :
                       data.kind === 'pptx' && data.slides ? `${data.slides} slides` :
                       (data.rows !== undefined && data.columns !== undefined) ? `${data.rows} rows, ${data.columns} columns` : ''
        const uploadMessage = { 
          type: 'system', 
          content: `Document "${file.name}" uploaded successfully! ${detail ? '(' + detail + ')' : ''} You can now ask questions about the document.` 
        }
        setMessages(prev => [...prev, uploadMessage])
      } else {
        throw new Error(data.error || 'Failed to upload PDF')
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`)
    }
  }

  const clearPdf = async () => {
    try {
      await fetch('/api/clear-pdf', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId })
      })
      setUploadedFile(null)
      
      const clearMessage = { 
        type: 'system', 
        content: 'PDF document cleared. You can now chat normally or upload a new document.' 
      }
      setMessages(prev => [...prev, clearMessage])
    } catch (error) {
      console.error('Failed to clear PDF:', error)
    }
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <History className="h-5 w-5" />
              Chat History
            </h2>
            <Button
              onClick={() => setSidebarOpen(false)}
              variant="ghost"
              size="sm"
              className="lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          {user ? (
            <div className="space-y-3">
              <Button
                onClick={createNewSession}
                className="w-full flex items-center gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => setShowAuthModal(true)}
                className="w-full"
              >
                Login / Sign Up
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Sign in to save your chat history
              </p>
            </div>
          )}
        </div>
        
        <ScrollArea className="flex-1 p-2">
          {user && chatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => loadChatSession(session.session_id)}
              className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors group ${
                currentSessionId === session.session_id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {session.title || 'New Chat'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {session.message_count} messages • {formatTimestamp(session.updated_at)}
                  </p>
                </div>
                <Button
                  onClick={(e) => deleteChatSession(session.session_id, e)}
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {user && chatSessions.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No chat history yet</p>
              <p className="text-xs">Start a conversation to see it here</p>
            </div>
          )}
          
          {!user && (
            <div className="text-center text-gray-500 py-8">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Sign in to view</p>
              <p className="text-xs">your chat history</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  onClick={() => setSidebarOpen(true)}
                  variant="ghost"
                  size="sm"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-800">AI Chatbot</h1>
              </div>
            </div>
            
            {/* Document Upload Section */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xlsx,.ppt,.pptx"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploadedFile && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {uploadedFile.name}
                  </Badge>
                  <Button
                    onClick={clearPdf}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 max-w-md">
                  <Bot className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Welcome to AI Chatbot</h3>
                  <p className="text-sm mb-4">
                     Start a conversation, upload a document (PDF/Excel/PPT/CSV), or use voice input to begin chatting with our AI assistant.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs">
                    <Badge variant="outline">PDF Analysis</Badge>
                    <Badge variant="outline">Voice Input</Badge>
                    <Badge variant="outline">Chat History</Badge>
                    <Badge variant="outline">User Accounts</Badge>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'system'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {message.type === 'user' ? (
                        <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      ) : message.type === 'bot' ? (
                        <Bot className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
                      ) : null}
                      <div className="flex-1">
                        {/* Render bot/system messages as Markdown; keep user messages as plain text */}
                        {message.type === 'bot' || message.type === 'system' ? (
                          <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-p:my-2 prose-li:my-1 prose-pre:bg-gray-900 prose-pre:text-gray-100">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        )}
                        {message.hasPdfContext && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Based on document
                          </Badge>
                        )}
                        {message.timestamp && (
                          <p className="text-xs opacity-70 mt-1">
                            {formatTimestamp(message.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border border-gray-200 shadow-sm max-w-xs lg:max-w-2xl px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div ref={messagesEndRef} />
          </ScrollArea>
        </div>

        {/* Input Section */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  disabled={isLoading}
                  className="pr-12 py-3 text-sm"
                />
                <Button
                  onClick={toggleVoiceInput}
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${
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
                className="px-6 py-3 flex items-center gap-2"
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
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
          <div className="text-center text-xs text-gray-500">
            Developed by Rijul | Network Science Assignment
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default App

