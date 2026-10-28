import { createContext } from 'react';
import type { Profile } from '../types';

export interface AuthContextType {
    user: { id: string; email: string; name: string } | null;
    profile: Profile | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    signOut: () => Promise<void>;
    refresh: () => Promise<void>;
}

/** One context for the whole app (audit F-01). */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
