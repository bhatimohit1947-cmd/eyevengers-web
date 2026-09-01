"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, User, Sparkles, Bot } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export default function AIStylistPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: "Hello! I'm your Vision AI Stylist. I can recommend the perfect frames for your face shape, explain lens types, or answer any questions about our eyewear. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Setup Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-IN'; // Allows Hinglish/English

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev ? `${prev} ${transcript}` : transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
          message: userMessage.content
        })
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      const data = await response.json();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.reply
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm sorry, I couldn't process that right now. Please try again later."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-brand-gold relative shadow-md">
            <Sparkles size={20} />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Vision AI Stylist</h1>
            <p className="text-xs text-green-600 font-medium">Online • Powered by AI</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-brand-navy text-brand-gold'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className={`px-4 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-brand-navy text-white rounded-tr-sm' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
              }`}>
                {/* Very basic markdown rendering for bold text */}
                <div dangerouslySetInnerHTML={{ 
                  __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') 
                }} />
              </div>

            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-brand-navy text-brand-gold flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white border border-gray-100 rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-3 sticky bottom-[64px] md:bottom-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={toggleListen}
            className={`p-3 rounded-full transition-colors flex-shrink-0 shadow-sm ${
              isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask for recommendations..."}
            className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-brand-navy focus:ring-1 focus:ring-brand-navy rounded-full px-5 py-3 text-[15px] outline-none transition-all shadow-inner"
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 rounded-full bg-brand-navy text-white hover:bg-[#002b4d] transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
