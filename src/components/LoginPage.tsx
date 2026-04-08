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
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                    }
                });
                
                if (error) {
                    let errorMessage = error.message;
                    if (error.message.includes('signup is disabled')) {
                        errorMessage = 'Pendaftaran baru telah dinyahaktifkan.';
                    } else if (error.message.includes('User already registered')) {
                        errorMessage = 'E-mel ini sudah didaftarkan.';
                    }
                    throw new Error(errorMessage);
                }
                
                if (data.session && data.user) {
                    setMessage('Akaun berjaya dicipta! Anda telah log masuk.');
                    return;
                }
                
                if (data.user && !data.session) {
                    setMessage('Akaun berjaya dicipta! Sila semak e-mel anda.');
                }
            }
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || 'Ralat berlaku semasa pengesahan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 font-jawi">
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md glass-modern p-10 text-center border-slate-300 shadow-2xl relative"
            >

                <div className="mb-8">
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm inline-flex items-center justify-center mb-6 border border-white">
                        <img src="/logo.png" alt="Logo eRPH" className="w-16 h-16 object-contain" />
                    </div>
                    <h2 id="login-title" className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
                        {isLogin ? 'Selamat Kembali' : 'Daftar Akaun'}
                    </h2>
                    <p className="text-slate-600 font-medium">
                        {isLogin ? 'Log masuk ke sistem eRPH digital anda' : 'Sila isi maklumat untuk mendaftar'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="text-left space-y-5" aria-labelledby="login-title">
                    <div className="input-group">
                        <label htmlFor="email" className="font-bold text-slate-800 mb-1 block">E-mel</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" aria-hidden="true" />
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="anda@email.com"
                                className="pl-12 w-full py-3 bg-white border-slate-300 focus:border-emerald-600 transition-all rounded-xl min-h-[44px]"
                                aria-required="true"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="font-bold text-slate-800 mb-1 block">Kata Laluan</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" aria-hidden="true" />
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pl-12 w-full py-3 bg-white border-slate-300 focus:border-emerald-600 transition-all rounded-xl min-h-[44px]"
                                aria-required="true"
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                role="alert"
                                className="bg-red-50/80 backdrop-blur-sm text-red-700 p-4 rounded-xl text-sm flex items-center gap-3 border border-red-100"
                            >
                                <AlertCircle size={18} />
                                <span className="font-medium">{error}</span>
                            </motion.div>
                        )}
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                role="status"
                                className="bg-emerald-50/80 backdrop-blur-sm text-emerald-700 p-4 rounded-xl text-sm flex items-center gap-3 border border-emerald-100"
                            >
                                <AlertCircle size={18} />
                                <span className="font-medium">{message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-4 text-lg shadow-lg shadow-emerald-900/10 active:scale-[0.98] mt-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={24} aria-label="Memproses..." />
                        ) : isLogin ? (
                            <>
                                <LogIn size={20} aria-hidden="true" /> Log Masuk
                            </>
                        ) : (
                            <>
                                <UserPlus size={20} aria-hidden="true" /> Daftar Akaun
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200">
                    <p className="text-slate-600 text-sm font-medium">
                        {isLogin ? 'Belum mempunyai akaun?' : 'Sudah mempunyai akaun?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 text-emerald-700 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded px-1"
                        >
                            {isLogin ? 'Daftar sekarang' : 'Log masuk'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
