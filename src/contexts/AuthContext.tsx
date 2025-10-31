import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { showConfirm, showSuccess, showError } from '../lib/alerts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  createUser: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  // Crear usuario (para uso interno/admin) con metadata (nombre, apellido, etc.)
  const createUser = async (email: string, password: string, metadata?: Record<string, any>) => {
    const { error } = await (supabase.auth as any).signUp(
      { email, password },
      { data: metadata }
    );
    return { error };
  };

  const signOut = async () => {
    try {
      // Pedir confirmación al usuario antes de cerrar sesión
      const confirmed = await showConfirm('Cerrar sesión', '¿Estás seguro que deseas cerrar sesión?');
      if (!confirmed) return;

      const { error } = await supabase.auth.signOut();
      if (error) {
        showError('Error al cerrar sesión', String(error.message ?? error));
        return;
      }

      showSuccess('Sesión cerrada', 'Has cerrado sesión correctamente');
    } catch (err) {
      showError('Error', String((err as Error).message ?? err));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, createUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
