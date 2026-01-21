import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, hasSupabaseCredentials } from '../lib/supabaseClient';

// Infer Session type from Supabase client
type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

interface AuthContextType {
    session: Session;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    hasCredentials: boolean;
    connectionStatus: 'checking' | 'connected' | 'error' | null;
    connectionError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | null>('checking');
    const [connectionError, setConnectionError] = useState<string | null>(null);

    useEffect(() => {
        console.log('AuthContext: Initializing...');
        
        // Test Supabase connection
        const testConnection = async () => {
            if (!hasSupabaseCredentials) {
                setConnectionStatus('error');
                setConnectionError('Supabase credentials missing');
                setLoading(false);
                return;
            }

            try {
                setConnectionStatus('checking');
                // Test connection by getting session - this will fail if credentials are wrong
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError && sessionError.message.includes('Invalid API key')) {
                    throw new Error('Invalid Supabase API key. Please check VITE_SUPABASE_ANON_KEY in .env');
                }
                
                if (sessionError && sessionError.message.includes('Invalid')) {
                    throw new Error('Invalid Supabase URL or API key. Please check your .env file');
                }

                // Test actual Supabase API by making a simple health check
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const healthCheckUrl = `${supabaseUrl}/rest/v1/?apikey=${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
                
                try {
                    const response = await fetch(healthCheckUrl, { method: 'HEAD' });
                    if (!response.ok && response.status !== 401) {
                        throw new Error(`Supabase API returned status ${response.status}`);
                    }
                } catch (fetchError: any) {
                    // If it's a network error, the URL might be wrong
                    if (fetchError.message.includes('fetch') || fetchError.message.includes('network')) {
                        throw new Error('Cannot connect to Supabase. Please check VITE_SUPABASE_URL in .env');
                    }
                    // Otherwise, it might be auth related which is expected
                }

                setConnectionStatus('connected');
                setConnectionError(null);
                console.log('AuthContext: Connection test successful');
                
                // Set initial session
                console.log('AuthContext: Initial session retrieved', !!sessionData.session);
                setSession(sessionData.session);
                setUser(sessionData.session?.user ?? null);
                setLoading(false);
            } catch (error: any) {
                console.error('AuthContext: Connection test failed', error);
                setConnectionStatus('error');
                setConnectionError(error.message || 'Failed to connect to Supabase');
                setLoading(false);
            }
        };

        testConnection();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('AuthContext: Auth state changed', event, !!session);
            
            // If we get an auth state change event, connection is working
            setConnectionStatus((prevStatus) => {
                if (prevStatus === 'checking' || prevStatus === 'error') {
                    return 'connected';
                }
                return prevStatus;
            });
            setConnectionError(null);
            
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        loading,
        signOut,
        hasCredentials: hasSupabaseCredentials,
        connectionStatus,
        connectionError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
