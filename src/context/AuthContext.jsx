import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (login, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is the error code for "Row not found" which is expected for new users
        console.error('Error fetching profile:', error);
      }
      
      setProfile(data || null);
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setProfileLoading(false);
      setLoading(false);
    }
  };

  const signInWithOtp = async (phone) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    if (error) throw error;
    return data;
  };

  const verifyOtp = async (phone, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error("No user logged in");
    
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates, created_at: new Date() })
      .select()
      .single();

    if (error) {
      setProfileLoading(false);
      throw error;
    }
    
    setProfile(data);
    setProfileLoading(false);
    return data;
  };

  const value = {
    session,
    user,
    profile,
    loading,
    profileLoading,
    signInWithOtp,
    verifyOtp,
    signOut,
    updateProfile,
    fetchProfile // Exposing in case we need to manually refresh
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
