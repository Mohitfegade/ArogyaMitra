import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const CACHE_KEY = 'arogyamitra_chat_history';

/**
 * Custom hook for chat state that:
 * 1. Loads instantly from localStorage (fixes blank screen on tab switch)
 * 2. Syncs with Supabase in the background
 * 3. Auto-saves every new message to both localStorage & Supabase
 */
export function useChatPersistence(user) {
  const [messages, setMessages] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial Load: LocalStorage -> Supabase Sync
  useEffect(() => {
    if (!user) return;

    // Fast path: load from local cache instantly
    const cached = localStorage.getItem(`${CACHE_KEY}_${user.id}`);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
        setIsLoaded(true);
      } catch (e) {
        console.warn('Failed to parse cached chat', e);
      }
    }

    // Background path: fetch truth from Supabase
    const fetchFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Supabase fetch error:', error.message);
          if (!isLoaded) setIsLoaded(true);
          return;
        }

        if (data) {
          const formatted = data.reverse().map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          
          setMessages(formatted);
          localStorage.setItem(`${CACHE_KEY}_${user.id}`, JSON.stringify(formatted));
          if (!isLoaded) setIsLoaded(true);
        }
      } catch (err) {
        console.error('Network or unexpected error fetching messages:', err);
        if (!isLoaded) setIsLoaded(true);
      }
    };

    fetchFromSupabase();
  }, [user, isLoaded]);

  // 2. Add message helper
  const addMessage = useCallback((messageObj) => {
    setMessages(prev => {
      const newMessages = [...prev, messageObj];
      if (user) {
        // Optimistically cache locally
        localStorage.setItem(`${CACHE_KEY}_${user.id}`, JSON.stringify(newMessages));
      }
      return newMessages;
    });

    // Fire and forget to Supabase with proper error handling
    if (user && messageObj.content) {
      const saveToDb = async () => {
        try {
          const { error } = await supabase.from('chat_messages').insert({
            user_id: user.id,
            role: messageObj.role,
            content: messageObj.content
          });
          
          if (error) {
            console.error('Supabase insert error:', error.message);
          }
        } catch (err) {
          console.error('Network or unexpected error saving message:', err);
        }
      };
      
      saveToDb();
    }
  }, [user]);

  // 3. Update last message (useful for streaming or typing states)
  const updateLastMessage = useCallback((content) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1].content = content;
        if (user) {
          localStorage.setItem(`${CACHE_KEY}_${user.id}`, JSON.stringify(newMessages));
        }
      }
      return newMessages;
    });
  }, [user]);

  return {
    messages,
    isLoaded,
    addMessage,
    updateLastMessage,
    setMessages // fallback if needed
  };
}
