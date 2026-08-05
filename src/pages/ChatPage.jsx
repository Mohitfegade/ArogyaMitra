import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOfflineSchemes } from '../hooks/useOfflineSchemes';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useChatPersistence } from '../hooks/useChatPersistence';
import ChatBubble from '../components/ChatBubble';
import { Wifi, WifiOff, Clock, Mic, Square, Send } from 'lucide-react';

const PENDING_QUEUE_KEY = 'arogyamitra_pending_queue';

const isSchemeQuery = (text) => {
  const q = text.toLowerCase();
  return ['yojana', 'scheme', 'sarkari', 'sarkar', 'government', 'benefit',
    'ayushman', 'ration', 'bima', 'insurance', 'free hospital', 'muft',
    'योजना', 'सरकार', 'सरकारी', 'मुफ्त', 'बीमा'].some(k => q.includes(k));
};

export default function ChatPage() {
  const { profile, user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { searchSchemes, formatOfflineSchemeResponse, isSchemesCached } = useOfflineSchemes();
  const { isSupported: voiceSupported, isListening, startListening, stopListening } = useVoiceInput();
  const { messages, addMessage, isLoaded } = useChatPersistence(user);

  const prefLang = profile?.preferred_language || 'Hindi';
  const langTag = prefLang === 'Hindi' ? 'hi-IN' : prefLang === 'Marathi' ? 'mr-IN' : 'en-IN';

  // ── Online / Offline ──
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── Process pending queue on reconnect ──
  const processPendingQueue = useCallback(async () => {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) return;
    let queue;
    try { queue = JSON.parse(raw); } catch { return; }
    if (!queue.length) return;

    localStorage.removeItem(PENDING_QUEUE_KEY);

    for (const queuedMsg of queue) {
      addMessage({
        role: 'ai',
        content: prefLang === 'Hindi'
          ? `[ONLINE] आप वापस ऑनलाइन हो गए! आपके रुके हुए सवाल का जवाब दे रहा हूं: "${queuedMsg.content}"`
          : `[ONLINE] You're back online! Answering your queued question: "${queuedMsg.content}"`
      });

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [queuedMsg], profile })
        });
        const data = await response.json();
        if (response.ok && data.response) {
          addMessage({ role: 'ai', content: data.response });
        }
      } catch (err) {
        console.error('Failed to process queued message:', err);
      }
    }
  }, [profile, prefLang, addMessage]);

  useEffect(() => {
    if (isOnline) processPendingQueue();
  }, [isOnline, processPendingQueue]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Handlers ──
  const handleVoice = async () => {
    if (isListening) { stopListening(); return; }
    try {
      const text = await startListening(langTag);
      if (text) setInputValue(text);
    } catch (err) {
      console.warn('[Voice]', err.message);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue.trim() };
    addMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    if (!isOnline) {
      if (isSchemeQuery(userMessage.content) && isSchemesCached) {
        const matches = searchSchemes(userMessage.content, prefLang);
        addMessage({ role: 'ai', content: formatOfflineSchemeResponse(matches, prefLang) });
      } else if (isSchemeQuery(userMessage.content) && !isSchemesCached) {
        addMessage({ role: 'ai', content: prefLang === 'Hindi' ? '[OFFLINE] ऑफलाइन मोड: योजनाओं की जानकारी कैश नहीं है।' : '[OFFLINE] Offline: Scheme data not cached.' });
      } else {
        const existingRaw = localStorage.getItem(PENDING_QUEUE_KEY);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify([...existing, userMessage]));
        addMessage({ 
          role: 'ai', 
          content: prefLang === 'Hindi' 
            ? '[QUEUED] आप अभी ऑफलाइन हैं। आपका सवाल सुरक्षित है — जैसे ही नेट आएगा, मैं जवाब दूंगा।' 
            : '[QUEUED] You\'re offline right now. Your question is queued.' 
        });
      }
      setIsLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], profile }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to connect');

      addMessage({ role: 'ai', content: data.response });

    } catch (error) {
      console.error('Error:', error);
      const msg = error.name === 'AbortError' 
        ? 'Request timed out. Please try again.' 
        : `Sorry, I am having trouble connecting. (${error.message || ''})`;
      addMessage({ role: 'ai', content: msg });
    } finally {
      setIsLoading(false);
      // Focus input again on desktop
      if (window.innerWidth > 768) inputRef.current?.focus();
    }
  };

  const handleSuggestion = (text) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {!isLoaded ? (
          <div className="loading-screen">
            <div className="spinner"></div>
            <p>Loading chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <motion.div 
            className="welcome-banner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2>How can I help you today?</h2>
            <p className="disclaimer">I am an AI assistant. For serious medical conditions, please visit a doctor.</p>
            
            <div className="suggestions-container">
              <button className="suggestion-chip" onClick={() => handleSuggestion('मुझे बुखार है, क्या करूं?')}>
                मुझे बुखार है, क्या करूं?
              </button>
              <button className="suggestion-chip" onClick={() => handleSuggestion('What is Ayushman Bharat?')}>
                What is Ayushman Bharat?
              </button>
              <button className="suggestion-chip" onClick={() => handleSuggestion('Pregnancy diet tips')}>
                Pregnancy diet tips
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="messages-list">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <ChatBubble key={index} msg={msg} />
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                className="message-wrapper ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleSend} className="chat-form" style={{ flex: 1, display: 'flex', gap: '8px' }}>
          {voiceSupported && (
            <button
              type="button"
              className={`mic-btn-circle ${isListening ? 'listening' : ''}`}
              onClick={handleVoice}
              title="Voice Input"
            >
              {isListening ? <Square size={20} /> : <Mic size={20} />}
            </button>
          )}
          
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? '🎤 Listening...' : isOnline ? 'Type a question...' : 'Offline mode...'}
              className="chat-input"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="send-btn-circle" 
            disabled={isLoading || !inputValue.trim()}
          >
            <Send size={18} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>
    </div>
  );
}
