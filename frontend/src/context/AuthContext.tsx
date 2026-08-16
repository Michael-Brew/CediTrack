import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SignUpResult {
  user: User | null;
  session: any | null;
  needsConfirmation: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  urlError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<SignUpResult>;
  resendConfirmation: (email: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => Promise<void>;
  clearUrlError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check for errors in URL hash or query params from Supabase redirect (e.g. expired link)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;

      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const errorDesc = params.get('error_description');
        const errorCode = params.get('error_code');
        if (errorDesc) {
          setUrlError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
          // Clean hash from URL for a clean address bar
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (search) {
        const params = new URLSearchParams(search);
        const errorDesc = params.get('error_description');
        if (errorDesc) {
          setUrlError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    }

    // 2. Check saved session or demo user in localStorage
    const savedToken = localStorage.getItem('ceditrack_auth_token');
    const savedUser = localStorage.getItem('ceditrack_user_obj');

    if (savedToken === 'demo-token' || (!isSupabaseConfigured && savedUser)) {
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsDemoMode(true);
        } catch {
          // fallback
        }
      } else {
        loginDemo();
      }
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error fetching Supabase session:', error);
        }
        if (session) {
          localStorage.setItem('ceditrack_auth_token', session.access_token);
          const u: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          };
          setUser(u);
          localStorage.setItem('ceditrack_user_obj', JSON.stringify(u));
          setIsDemoMode(false);
        } else if (savedUser && savedToken !== 'demo-token') {
          // Check if previously logged in user
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            loginDemo();
          }
        } else {
          loginDemo();
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          localStorage.setItem('ceditrack_auth_token', session.access_token);
          const u: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          };
          setUser(u);
          localStorage.setItem('ceditrack_user_obj', JSON.stringify(u));
          setIsDemoMode(false);
          setUrlError(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsDemoMode(false);
          localStorage.removeItem('ceditrack_auth_token');
          localStorage.removeItem('ceditrack_user_obj');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        loginDemo();
      }
      setLoading(false);
    }
  }, []);

  const loginDemo = () => {
    const demoUser: User = {
      id: 'demo-ghana-user-001',
      email: 'kwame@ceditrack.gh',
      name: 'Kwame Mensah',
    };
    setUser(demoUser);
    setIsDemoMode(true);
    localStorage.setItem('ceditrack_auth_token', 'demo-token');
    localStorage.setItem('ceditrack_user_obj', JSON.stringify(demoUser));
    localStorage.removeItem('ceditrack_user_id');
  };

  const login = async (email: string, pass: string) => {
    setUrlError(null);
    if (!isSupabaseConfigured) {
      const demoUser: User = {
        id: `user-${email.split('@')[0]}`,
        email: email,
        name: email.split('@')[0],
      };
      setUser(demoUser);
      setIsDemoMode(true);
      localStorage.setItem('ceditrack_auth_token', 'demo-token');
      localStorage.setItem('ceditrack_user_obj', JSON.stringify(demoUser));
      localStorage.setItem('ceditrack_user_id', demoUser.id);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;

    if (data.session) {
      localStorage.setItem('ceditrack_auth_token', data.session.access_token);
      const u: User = {
        id: data.session.user.id,
        email: data.session.user.email || '',
        name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'User',
      };
      setUser(u);
      localStorage.setItem('ceditrack_user_obj', JSON.stringify(u));
      setIsDemoMode(false);
    }
  };

  const signup = async (email: string, pass: string, name: string): Promise<SignUpResult> => {
    setUrlError(null);
    if (!isSupabaseConfigured) {
      const demoUser: User = {
        id: `user-${email.split('@')[0]}`,
        email: email,
        name: name || email.split('@')[0],
      };
      setUser(demoUser);
      setIsDemoMode(true);
      localStorage.setItem('ceditrack_auth_token', 'demo-token');
      localStorage.setItem('ceditrack_user_obj', JSON.stringify(demoUser));
      localStorage.setItem('ceditrack_user_id', demoUser.id);
      return { user: demoUser, session: null, needsConfirmation: false };
    }

    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { name },
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) throw error;

    if (data.session) {
      localStorage.setItem('ceditrack_auth_token', data.session.access_token);
      const u: User = {
        id: data.session.user.id,
        email: data.session.user.email || '',
        name: name || data.session.user.email?.split('@')[0] || 'User',
      };
      setUser(u);
      localStorage.setItem('ceditrack_user_obj', JSON.stringify(u));
      setIsDemoMode(false);
      return { user: u, session: data.session, needsConfirmation: false };
    }

    // Email confirmation required by Supabase
    const needsConfirmation = !data.session && !!data.user;
    return {
      user: data.user ? { id: data.user.id, email: data.user.email || email, name: name || 'User' } : null,
      session: null,
      needsConfirmation,
    };
  };

  const resendConfirmation = async (email: string) => {
    if (!isSupabaseConfigured) return;
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out:', err);
      }
    }
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('ceditrack_auth_token');
    localStorage.removeItem('ceditrack_user_obj');
    localStorage.removeItem('ceditrack_user_id');
  };

  const clearUrlError = () => setUrlError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        urlError,
        login,
        signup,
        resendConfirmation,
        loginDemo,
        logout,
        clearUrlError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
