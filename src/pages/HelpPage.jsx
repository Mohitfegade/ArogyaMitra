import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Ambulance, Hospital, CarFront, FileText } from 'lucide-react';

export default function HelpPage() {
  return (
    <motion.div 
      className="dashboard-page"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">Help & Contacts</h2>
      </div>

      <div className="dashboard-grid">
        <div className="info-card">
          <h3 className="section-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--red-600)" /> Emergency Numbers
          </h3>
          
          <div className="recent-chat-list">
            <a href="tel:108" className="action-card action-card--danger" style={{ textDecoration: 'none', flexDirection: 'row', alignItems: 'center' }}>
              <div className="action-card__icon"><Ambulance size={20} /></div>
              <div className="action-card__content">
                <div className="action-card__title">National Ambulance</div>
                <div className="action-card__desc">Dial 108</div>
              </div>
            </a>
            
            <a href="tel:104" className="action-card action-card--primary" style={{ textDecoration: 'none', flexDirection: 'row', alignItems: 'center' }}>
              <div className="action-card__icon"><Hospital size={20} /></div>
              <div className="action-card__content">
                <div className="action-card__title">Health Helpline</div>
                <div className="action-card__desc">Dial 104</div>
              </div>
            </a>
            
            <a href="tel:112" className="action-card action-card--secondary" style={{ textDecoration: 'none', flexDirection: 'row', alignItems: 'center' }}>
              <div className="action-card__icon"><CarFront size={20} /></div>
              <div className="action-card__content">
                <div className="action-card__title">All Emergencies</div>
                <div className="action-card__desc">Dial 112</div>
              </div>
            </a>
          </div>
        </div>

        <div className="info-card">
          <h3 className="section-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--gray-600)" /> About ArogyaMitra
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: '1.6' }}>
            ArogyaMitra is an AI-powered rural health assistant designed to provide fast, safe, and reliable health guidance and government scheme information.
            <br/><br/>
            <strong>Disclaimer:</strong> This app uses Artificial Intelligence. It cannot diagnose conditions or prescribe medications. Always consult a qualified medical professional for serious health concerns.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
