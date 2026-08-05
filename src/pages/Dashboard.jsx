import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useChatPersistence } from '../hooks/useChatPersistence';
import { MessageSquare, Landmark, Phone, ArrowRight, User, Bot } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  // Only grab the last message for the preview
  const { messages } = useChatPersistence(user);
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <motion.div 
      className="dashboard-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="dashboard-grid">
        
        {/* Welcome Card */}
        <motion.div className="welcome-card" variants={itemVariants}>
          <h2>Namaste, {profile?.full_name?.split(' ')[0] || 'Friend'}</h2>
          <p>{profile?.state || 'India'} &middot; {profile?.category || 'General'}</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="quick-actions" variants={itemVariants}>
          <button 
            className="action-card action-card--primary" 
            onClick={() => navigate('/chat')}
          >
            <div className="action-card__icon"><MessageSquare size={20} /></div>
            <div className="action-card__content">
              <div className="action-card__title">Chat with AI</div>
              <div className="action-card__desc">Ask health questions</div>
            </div>
          </button>

          <button 
            className="action-card action-card--secondary"
            onClick={() => navigate('/help')}
          >
            <div className="action-card__icon"><Landmark size={20} /></div>
            <div className="action-card__content">
              <div className="action-card__title">Find Schemes</div>
              <div className="action-card__desc">Government benefits</div>
            </div>
          </button>
        </motion.div>

        {/* Recent Chat Preview */}
        <motion.div className="info-card" variants={itemVariants}>
          <div className="section-header">
            <h3 className="section-title">Recent Conversation</h3>
            {messages.length > 0 && (
              <button className="btn--ghost" onClick={() => navigate('/chat')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                View all <ArrowRight size={14} />
              </button>
            )}
          </div>
          
          {lastMessage ? (
            <div className="recent-chat-list" onClick={() => navigate('/chat')} style={{cursor: 'pointer'}}>
              <div className="recent-chat-item">
                <div className="recent-chat-item__icon">
                  {lastMessage.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className="recent-chat-item__text">
                  {lastMessage.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              No conversations yet. Tap "Chat with AI" to start.
            </div>
          )}
        </motion.div>

        {/* Emergency Info */}
        <motion.div className="quick-actions" variants={itemVariants}>
          <button 
            className="action-card action-card--danger"
            style={{ gridColumn: 'span 2', flexDirection: 'row', alignItems: 'center' }}
            onClick={() => window.open('tel:108')}
          >
            <div className="action-card__icon"><Phone size={20} /></div>
            <div className="action-card__content">
              <div className="action-card__title">Ambulance: 108</div>
              <div className="action-card__desc">Tap to call national emergency</div>
            </div>
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}
