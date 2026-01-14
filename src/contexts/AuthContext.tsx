import React, { createContext, useContext, useState } from 'react';
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

// Demo users - no database needed
const DEMO_USERS = [
  { id: '1', email: 'admin@gmail.com', password: 'admin123', name: 'Admin User', role: 'admin' as UserRole },
  { id: '2', email: 'receptionist@gmail.com', password: 'rec123', name: 'Receptionist User', role: 'receptionist' as UserRole },
  { id: '3', email: 'customer@gmail.com', password: 'customer123', name: 'Customer User', role: 'customer' as UserRole },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
    
    if (demoUser) {
      const { password: _, ...userWithoutPassword } = demoUser;
      setUser(userWithoutPassword);
      setLoading(false);
      return { error: null };
    } else {
      setLoading(false);
      return { error: new Error('Invalid credentials') };
    }
  };

  const signOut = async () => {
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
