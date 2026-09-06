import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Send, Sparkles, Bot, Loader2, Volume2, Square, PanelRightClose, MessageSquare, CheckCircle } from 'lucide-react';
import { useNarration } from '../hooks/useNarration';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const PAGE_NAMES: Record<string, string> = {
  '/': 'Command Center',
  '/analyze': 'Analyze Area',
  '/explorer': 'Prospectivity Explorer',
  '/verification': 'Field Verification',
  '/production': 'Production Intelligence',
  '/data-health': 'Data Health',
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const { play, stop, isPlaying } = useNarration();

  // Handle narration stop when isPlaying turns false externally
  useEffect(() => {
    if (!isPlaying) setPlayingIdx(null);
  }, [isPlaying]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getCurrentContext = () => {
    const currentPage = PAGE_NAMES[location.pathname] || location.pathname;
    const targetId = searchParams.get('target') || undefined;
    return { currentPage, targetId };
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { currentPage, targetId } = getCurrentContext();

      const response = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          targetId: targetId || null,
          currentPage,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I couldn\'t connect to the AI service. Please check your connection and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const { currentPage, targetId } = getCurrentContext();

  return (
    <>
      {/* Drawer Trigger - Right edge handle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-40 bg-white border border-r-0 border-slate-200 shadow-[-2px_0_8px_rgba(0,0,0,0.05)] rounded-l-xl px-2 py-8 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors group"
          id="chat-widget-trigger"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </div>
          <span className="writing-vertical text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2" style={{ writingMode: 'vertical-rl' }}>AI Intel</span>
        </button>
      )}

      {/* Slide-in Drawer */}
      <div 
        className={`fixed top-[68px] right-0 bottom-0 w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        id="chat-widget-panel"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-[14px] text-slate-800 leading-tight">MINE-INTEL AI</h3>
              <p className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">Your exploration intelligence assistant</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <PanelRightClose className="w-5 h-5" />
          </button>
        </div>

        {/* Context Strip */}
        <div className="bg-emerald-50/50 border-b border-emerald-100 px-5 py-2 flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
          <CheckCircle className="w-3.5 h-3.5" />
          Context Loaded: {targetId ? `Target ${targetId}, ` : ''}{currentPage}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 bg-[#f8fafc] space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h4 className="text-[13px] font-bold text-slate-800 mb-1">How can I help?</h4>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  I can analyze the current region, explain target scoring, or summarize exploration priorities. I rely exclusively on verified application data.
                </p>
              </div>
              
              <div className="space-y-2">
                {[
                  targetId ? `Why is ${targetId} high priority?` : 'Show me the top 5 targets.',
                  'What does the SHAP analysis tell us?',
                  'What should we verify in the field?',
                  'What are the strongest prospectivity areas?'
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(suggestion); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="w-full text-left flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-[10px] hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 group-hover:text-blue-500" />
                    <span className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900 leading-snug">"{suggestion}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed relative ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-r-2xl rounded-bl-2xl shadow-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div>
                    <div className="whitespace-pre-wrap"
                         dangerouslySetInnerHTML={{
                           __html: msg.content
                             .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>')
                             .replace(/\n/g, '<br/>')
                         }}
                    />
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (playingIdx === idx) {
                            stop();
                            setPlayingIdx(null);
                          } else {
                            play(msg.content);
                            setPlayingIdx(idx);
                          }
                        }}
                        className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                        title={playingIdx === idx ? "Stop speaking" : "Listen"}
                      >
                        {playingIdx === idx ? (
                          <><Square className="w-3 h-3" /> Stop</>
                        ) : (
                          <><Volume2 className="w-3 h-3" /> Listen</>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-r-2xl rounded-bl-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Synthesizing intelligence…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={targetId ? `Ask about ${targetId}…` : 'Ask about the exploration region…'}
              className="w-full text-[13px] font-medium pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all shadow-sm"
              disabled={isLoading}
              id="chat-widget-input"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors"
              id="chat-widget-send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Grounded in real app data
          </div>
        </div>
      </div>
    </>
  );
}
