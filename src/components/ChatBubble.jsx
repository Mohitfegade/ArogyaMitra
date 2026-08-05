import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy } from 'lucide-react';

export default function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
  };

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'ai'}`}>
      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
        {isUser ? (
          msg.content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        )}
        
        {!isUser && (
          <div className="message-footer">
            <span>ArogyaMitra AI</span>
            <button 
              className="copy-btn" 
              onClick={handleCopy}
              title="Copy text"
              aria-label="Copy text"
            >
              <Copy size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
