import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Plus, Menu, X, FileText } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m Civic Assist. How can I help you with civic information today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('https://civic-assist-backend-production.up.railway.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // FIXED: Ensuring we send exactly what your main.py expects
        body: JSON.stringify({
          message: inputValue, 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // FIXED: Backend sends "answer", but frontend looked for "response"
      const actualContent = data.answer || data.response || "No answer received.";

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: actualContent,
        sources: data.sources || [], // Handles simple list of strings
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please make sure the backend is running at http://localhost:8000',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-zinc-800">
          <button className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg transition-colors">
            <Plus size={20} />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            History
          </div>
          <div className="text-sm text-zinc-500 px-3 italic">
             No previous chats
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 text-center">
            Civic Assist v1.0
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Civic Assist
            </h1>
          </div>
          <div className="text-sm text-zinc-500">
            AI-Powered Civic Information
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                  }`}>
                    {message.type === 'user' ? 'U' : 'CA'}
                  </div>

                  {/* Message Content */}
                  <div className="flex flex-col gap-2">
                    <div className={`px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    {/* FIXED SOURCES SECTION */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="text-xs text-zinc-500 space-y-1 px-2 mt-1">
                        <div className="font-semibold text-zinc-400 flex items-center gap-2">
                          <FileText size={12} /> Sources:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source, idx) => (
                            <span key={idx} className="bg-zinc-800 px-2 py-1 rounded text-zinc-400 border border-zinc-700">
                              {/* Handle both string list and object list formats */}
                              {typeof source === 'string' ? source : source.source || "Unknown Source"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`text-xs text-zinc-600 px-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-3xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    CA
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-zinc-800 rounded-tl-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-zinc-900 border-t border-zinc-800 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-800 rounded-2xl border border-zinc-700 focus-within:border-blue-500 transition-colors">
              <div className="flex items-end gap-3 p-3">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about civic information..."
                  rows="1"
                  className="flex-1 bg-transparent text-white placeholder-zinc-500 resize-none outline-none max-h-32 overflow-y-auto"
                  style={{ minHeight: '24px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="flex-shrink-0 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            <div className="text-xs text-zinc-600 text-center mt-3">
              Civic Assist can make mistakes. Please verify important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}