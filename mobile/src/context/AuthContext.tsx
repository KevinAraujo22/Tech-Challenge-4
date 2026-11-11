import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { ApiError, authApi, setAuthToken, setUnauthorizedHandler } from '@/services/api';
import { storage } from '@/services/storage';
import type { SignUpInput, User } from '@/types';

const TOKEN_KEY = 'blog-escola-token';
const USER_KEY = 'blog-escola-user';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean; // true enquanto a sessão salva é restaurada
  isTeacher: boolean;
  isAdmin: boolean; // professor administrador: gerencia outros professores
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = async () => {
    setAuthToken(null);
    setUser(null);
    await Promise.all([storage.remove(TOKEN_KEY), storage.remove(USER_KEY)]);
  };

  // Restaura a sessão salva e confirma com a API que o token ainda vale.
  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());

    (async () => {
      try {
        const [token, savedUser] = await Promise.all([storage.get(TOKEN_KEY), storage.get(USER_KEY)]);
        if (!token || !savedUser) return;
        setAuthToken(token);
        setUser(JSON.parse(savedUser));
        const { user: fresh } = await authApi.me();
        setUser(fresh);
      } catch (err) {
        // Sem rede mantemos a sessão salva; token inválido já faz signOut.
        if (!(err instanceof ApiError) || err.status !== 0) await signOut();
      } finally {
        setIsLoading(false);
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, []);

  const startSession = async (token: string, loggedUser: User) => {
    setAuthToken(token);
    await Promise.all([storage.set(TOKEN_KEY, token), storage.set(USER_KEY, JSON.stringify(loggedUser))]);
    setUser(loggedUser);
  };

  const signIn = async (email: string, password: string) => {
    const { token, user: loggedUser } = await authApi.login(email.trim(), password);
    await startSession(token, loggedUser);
  };

  // Cria a conta e já entra no app com ela.
  const signUp = async (input: SignUpInput) => {
    const { token, user: newUser } = await authApi.register(input);
    await startSession(token, newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isTeacher: user?.role === 'teacher',
        isAdmin: user?.role === 'teacher' && user.isAdmin === true,
        signIn,
        signUp,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
