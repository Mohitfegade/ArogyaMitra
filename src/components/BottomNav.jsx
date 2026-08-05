import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, User, HelpCircle } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({isActive}) => isActive ? "bottom-nav__item active" : "bottom-nav__item"} end>
        <LayoutDashboard size={20} className="bottom-nav__icon" />
        <span>Home</span>
      </NavLink>
      <NavLink to="/chat" className={({isActive}) => isActive ? "bottom-nav__item active" : "bottom-nav__item"}>
        <MessageCircle size={20} className="bottom-nav__icon" />
        <span>Chat</span>
      </NavLink>
      <NavLink to="/profile" className={({isActive}) => isActive ? "bottom-nav__item active" : "bottom-nav__item"}>
        <User size={20} className="bottom-nav__icon" />
        <span>Profile</span>
      </NavLink>
      <NavLink to="/help" className={({isActive}) => isActive ? "bottom-nav__item active" : "bottom-nav__item"}>
        <HelpCircle size={20} className="bottom-nav__icon" />
        <span>Help</span>
      </NavLink>
    </nav>
  );
}
