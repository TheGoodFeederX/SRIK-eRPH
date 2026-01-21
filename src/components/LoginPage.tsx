import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                console.log('LoginPage: Attempting sign in...', { email });
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) {
                    console.error('LoginPage: Sign in error', error);
                    throw error;
                }
                console.log('LoginPage: Sign in successful', { user: data.user?.id });
            } else {
                console.log('LoginPage: Attempting sign up...', { email });
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                        // Auto-confirm if email confirmation is disabled in Supabase settings
                        // This helps in development/testing environments
                    }
                });
                
                if (error) {
                    console.error('LoginPage: Sign up error', error);
                    // Provide more helpful error messages
                    let errorMessage = error.message;
                    
                    if (error.message.includes('signup is disabled') || error.message.includes('Signup disabled')) {
                        errorMessage = 'Pendaftaran baru telah dinyahaktifkan. Sila hubungi pentadbir.';
                    } else if (error.message.includes('User already registered')) {
                        errorMessage = 'E-mel ini sudah didaftarkan. Sila log masuk atau gunakan e-mel lain.';
                    } else if (error.message.includes('Invalid email')) {
                        errorMessage = 'Format e-mel tidak sah. Sila masukkan e-mel yang betul.';
                    } else if (error.message.includes('Password')) {
                        errorMessage = 'Kata laluan tidak memenuhi keperluan. Sila cuba kata laluan yang lebih kuat.';
                    } else if (error.message.includes('email')) {
                        errorMessage = `Ralat dengan e-mel: ${error.message}`;
                    }
                    
                    throw new Error(errorMessage);
                }
                
                console.log('LoginPage: Sign up response', { 
                    user: data.user?.id, 
                    session: !!data.session,
                    requiresConfirmation: !data.session && data.user 
                });
                
                // If user is created and session exists, they're automatically logged in
                // This happens when email confirmation is disabled in Supabase
                if (data.session && data.user) {
                    setMessage('Akaun berjaya dicipta! Anda telah log masuk secara automatik.');
                    // The auth state change will handle navigation
                    return;
                }
                
                // If user is created but needs email confirmation
                if (data.user && !data.session) {
                    setMessage('Akaun berjaya dicipta! Sila semak e-mel anda untuk pautan pengesahan.');
                } else {
                    setMessage('Akaun berjaya dicipta!');
                }
            }
        } catch (err: any) {
            console.error('LoginPage: Authentication error', err);
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="auth-card"
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'white',
                    padding: '2.5rem',
                    borderRadius: '1.5rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    textAlign: 'center'
                }}
            >
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '1rem',
                        borderRadius: '1.25rem',
                        boxShadow: 'var(--shadow)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        {isLogin ? 'Selamat Kembali' : 'Daftar Akaun'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isLogin ? 'Log masuk ke sistem eRPH anda' : 'Sila isi maklumat untuk mendaftar'}
                    </p>
                </div>

                <form onSubmit={handleAuth} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            E-mel
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="anda@email.com"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    outline: 'none',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            Kata Laluan
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    outline: 'none',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s'
                                }}
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginBottom: '1.25rem' }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem'
                                }}>
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            </motion.div>
                        )}
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginBottom: '1.25rem' }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem'
                                }}>
                                    <AlertCircle size={16} />
                                    {message}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'transform 0.1s, opacity 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : isLogin ? (
                            <>
                                <LogIn size={20} /> Log Masuk
                            </>
                        ) : (
                            <>
                                <UserPlus size={20} /> Daftar Akaun
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {isLogin ? 'Belum mempunyai akaun?' : 'Sudah mempunyai akaun?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                marginLeft: '0.5rem',
                                color: 'var(--primary)',
                                fontWeight: 600,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            {isLogin ? 'Daftar sekarang' : 'Log masuk'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
