import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ProfileForm from '../components/ProfileForm';

export default function ProfilePage() {
  const { signOut } = useAuth();

  return (
    <motion.div 
      className="dashboard-page"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">My Profile</h2>
        <button className="btn--danger" style={{ width: 'auto', padding: '8px 16px' }} onClick={signOut}>
          Logout
        </button>
      </div>

      <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* We reuse the existing ProfileForm but force it into editing mode visually */}
        <ProfileForm isEditing={true} onCancel={() => {}} hideCancel={true} />
      </div>
    </motion.div>
  );
}
