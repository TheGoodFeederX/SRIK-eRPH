import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// Infer Session type from Supabase client
export type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

export interface AuthContextType {
    session: Session;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    hasCredentials: boolean;
    connectionStatus: 'checking' | 'connected' | 'error' | null;
    connectionError: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
