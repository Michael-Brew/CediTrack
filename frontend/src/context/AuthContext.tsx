import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    // Check saved session or demo user in localStorage
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
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          localStorage.setItem('ceditrack_auth_token', session.access_token);
          const u: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          };
          setUser(u);
          localStorage.setItem('ceditrack_user_obj', JSON.stringify(u));
        } else if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          loginDemo();
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        } else if (!isDemoMode) {
          setUser(null);
          localStorage.removeItem('ceditrack_auth_token');
          localStorage.removeItem('ceditrack_user_obj');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Default to demo session for instant local access
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

  const signup = async (email: string, pass: string, name: string) => {
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
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { name },
      },
    });
    if (error) throw error;

    if (data.session) {
      localStorage.setItem('ceditrack_auth_token', data.session.access_token);
      const u: User = {
        id: data.session.user.id,
        email: data.session.user.email || '',
        name,
      };
      setUser(u);
      localStorage.setItem('ceditrack_user_obj', JSON.stringify(u));
      setIsDemoMode(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('ceditrack_auth_token');
    localStorage.removeItem('ceditrack_user_obj');
    localStorage.removeItem('ceditrack_user_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        login,
        signup,
        loginDemo,
        logout,
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
