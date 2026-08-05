import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toE164India, isValidIndianMobile, DEMO_OTP } from '../utils/phone';

const AuthContext = createContext();

const SESSION_KEY = 'arogyamitra_demo_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Restore the demo session (phone + demo user id) saved on this device.
  useEffect(() => {
    let active = true;

    const restore = async () => {
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      } catch {
        saved = null;
      }

      if (saved?.id && saved?.phone) {
        if (!active) return;
        setUser(saved);
        await fetchProfile(saved.id);
      }

      if (active) setLoading(false);
    };

    restore();
    return () => {
      active = false;
    };
  }, []);

  const fetchProfile = async (userId) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('demo_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
        return null;
      }

      // A profile only counts as complete once the user has given their name.
      const complete = data?.full_name ? data : null;
      setProfile(complete);
      return complete;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // Step 1: "send" the OTP. No SMS provider is required in demo mode, so the
  // code is fixed and shown on screen instead of being texted.
  const signInWithOtp = async (phone) => {
    if (!isValidIndianMobile(phone)) {
      throw new Error('Enter a valid 10-digit Indian mobile number.');
    }
    return { demoOtp: DEMO_OTP };
  };

  // Step 2: verify the code, then find or create the demo account for this phone.
  const verifyOtp = async (phone, token) => {
    const normalizedPhone = toE164India(phone);

    if ((token || '').trim() !== DEMO_OTP) {
      throw new Error('That code is not correct. Please try again.');
    }

    const { data: existing, error: lookupError } = await supabase
      .from('demo_users')
      .select('id, phone')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (lookupError) throw lookupError;

    let account = existing;

    if (!account) {
      const { data: created, error: createError } = await supabase
        .from('demo_users')
        .insert({ phone: normalizedPhone })
        .select('id, phone')
        .single();

      if (createError) throw createError;
      account = created;

      await supabase
        .from('demo_profiles')
        .upsert({ id: account.id, phone: normalizedPhone });
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    setUser(account);
    await fetchProfile(account.id);

    return { user: account };
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in');

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('demo_profiles')
        .upsert({
          id: user.id,
          phone: user.phone,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } finally {
      setProfileLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    signInWithOtp,
    verifyOtp,
    signOut,
    updateProfile,
    fetchProfile, // Exposing in case we need to manually refresh
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
