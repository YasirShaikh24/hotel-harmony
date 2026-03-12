import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/hotel';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isReceptionist: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check:', { session: !!session, error });
      if (session?.user) {
        console.log('Found existing session for:', session.user.email);
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        console.log('No existing session found');
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, { session: !!session });
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', userId)
        .single();

      setUser({
        id: userId,
        email: email,
        name: profileData?.name || email.split('@')[0],
        role: (roleData?.role as UserRole) || 'customer',
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser({
        id: userId,
        email: email,
        name: email.split('@')[0],
        role: 'customer',
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    // quick offline check before attempting network call
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      return { error: new Error('No internet connection. Please check your network and try again.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // normalize network/fetch failures to a friendlier message
        let message = error.message || 'Login failed';
        if (/fetch/i.test(message)) {
          message = 'Network error: could not reach authentication server.';
        }
        setLoading(false);
        return { error: new Error(message) };
      }

      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email || '');
      }

      setLoading(false);
      return { error: null };
    } catch (err) {
      setLoading(false);
      const message = (err as Error).message.includes('fetch')
        ? 'Network error: please check your connection.'
        : (err as Error).message;
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: user?.role === 'admin',
    isReceptionist: user?.role === 'receptionist',
    isCustomer: user?.role === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
