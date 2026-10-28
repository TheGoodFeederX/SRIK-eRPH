import React, { useCallback, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { AuthContext, type AuthContextType } from './authContextValue';
import { api, errorMessage } from '../lib/apiClient';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthContextType['user']>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const session = await api.session();
            setUser(session.user);
            setProfile(session.profile);
            setError(null);
        } catch (err) {
            setUser(null);
            setProfile(null);
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const login = async (email: string, password: string) => {
        const session = await api.login(email, password);
        setUser(session.user);
        setProfile(session.profile);
        setError(null);
    };

    const register = async (email: string, password: string, name: string) => {
        const session = await api.register(email, password, name);
        setUser(session.user);
        setProfile(session.profile);
        setError(null);
    };

    const signOut = async () => {
        await api.logout().catch(() => undefined);
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, error, login, register, signOut, refresh }}>
            {children}
        </AuthContext.Provider>
    );
};
