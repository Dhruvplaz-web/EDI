"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Brain, ArrowDownCircle, HeartPulse, Activity } from "lucide-react"

interface Message {
  id: string
  role: "user" | "ai"
  content: string
  timestamp: Date
  sentiment?: "neutral" | "anxious" | "depressed" | "elevated"
}

export function AgenticCbtCompanion() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hi there. I'm Praxis, your cognitive companion. I'm here 24/7. How are you feeling right now?",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMsg])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI CBT response based on keywords
    setTimeout(() => {
      let aiResponse = "I hear you. Can you tell me more about what's making you feel this way?"
      let detectedSentiment: Message["sentiment"] = "neutral"

      const lowerInput = newUserMsg.content.toLowerCase()
      if (lowerInput.includes("anxious") || lowerInput.includes("panic") || lowerInput.includes("worried")) {
        aiResponse = "It sounds like you're experiencing a spike in anxiety. Let's try to ground ourselves. Can you name 3 things you can see around you right now?"
        detectedSentiment = "anxious"
      } else if (lowerInput.includes("sad") || lowerInput.includes("depressed") || lowerInput.includes("hopeless")) {
        aiResponse = "I'm so sorry you're feeling this weight right now. You don't have to carry it alone. Have you noticed any specific triggers today?"
        detectedSentiment = "depressed"
      } else if (lowerInput.includes("angry") || lowerInput.includes("frustrated")) {
        aiResponse = "It's completely valid to feel frustrated. Take a deep breath with me. In for 4 seconds, out for 4 seconds."
        detectedSentiment = "elevated"
      }

      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: aiResponse,
        timestamp: new Date(),
        sentiment: detectedSentiment
      }

      setMessages(prev => [...prev, newAiMsg])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Agentic CBT Companion</h3>
            <p className="text-xs text-slate-500">24/7 Clinical Support AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-600">Online</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
              
              {msg.sentiment && msg.sentiment !== "neutral" && (
                <div className="flex items-center gap-1 mt-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-medium border border-rose-100">
                  <Activity className="w-3 h-3" />
                  Detected: {msg.sentiment}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 max-w-[85%]">
             <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your feelings here..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
