import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Activity, Wifi, WifiOff } from 'lucide-react';

// Components
import Login from './components/Login';
import ProfileForm from './components/ProfileForm';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';

import './index.css';

// ─── Route Guards ────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If trying to access onboarding but profile exists, redirect to home
  if (profile && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ─── Main App Shell ──────────────────────────────────────────────────────
function AppRoutes() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showNav = user && profile && location.pathname !== '/login' && location.pathname !== '/onboarding';

  return (
    <div className="app-shell">
      {showNav && <Sidebar />}
      
      {showNav && (
        <header className="app-header">
          <div className="app-header__logo">
            <Activity size={24} />
            ArogyaMitra
          </div>
          <div className="app-header__actions">
            <span className={`connectivity-badge ${isOnline ? 'online' : 'offline'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isOnline ? <><Wifi size={14} /> Online</> : <><WifiOff size={14} /> Offline</>}
            </span>
          </div>
        </header>
      )}

      {showNav && !isOnline && (
        <div className="offline-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <WifiOff size={16} /> You are offline. Scheme info works from cache. Health questions will queue until you reconnect.
        </div>
      )}

      <main className={showNav ? 'page-content' : 'page-content auth-page'}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public / Unauthenticated */}
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            
            {/* Authenticated but no profile */}
            <Route path="/onboarding" element={
              <RequireAuth>
                <div className="auth-card">
                  <ProfileForm isEditing={false} />
                </div>
              </RequireAuth>
            } />

            {/* Authenticated Apps */}
            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/help" element={<RequireAuth><HelpPage /></RequireAuth>} />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
