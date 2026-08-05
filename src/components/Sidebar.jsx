import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, User, HelpCircle, Activity } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <Activity size={24} style={{ marginRight: '8px' }} />
        ArogyaMitra
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"} end>
          <LayoutDashboard size={20} className="icon" />
          Dashboard
        </NavLink>
        
        <NavLink to="/chat" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <MessageCircle size={20} className="icon" />
          AI Chat
        </NavLink>
        
        <NavLink to="/profile" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <User size={20} className="icon" />
          Profile
        </NavLink>
        
        <NavLink to="/help" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
          <HelpCircle size={20} className="icon" />
          Help & Contacts
        </NavLink>
      </nav>
    </aside>
  );
}
