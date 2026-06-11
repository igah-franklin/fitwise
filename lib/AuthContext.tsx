import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from './api';

export type UserProfile = {
  _id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (token: string, user: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const res = await api.get('/auth/me');
          setUser(res.data);
        }
      } catch (error) {
        console.log('Failed to restore token or fetch user profile', error);
        await SecureStore.deleteItemAsync('token');
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const signIn = async (token: string, userProfile: UserProfile) => {
    await SecureStore.setItemAsync('token', token);
    setUser(userProfile);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
