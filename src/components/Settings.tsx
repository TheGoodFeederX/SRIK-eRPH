import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [nameLoading, setNameLoading] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Username/Name change state
    const [username, setUsername] = useState(
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        ''
    );
    const [nameError, setNameError] = useState<string | null>(null);
    const [nameSuccess, setNameSuccess] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (!newPassword || !confirmPassword || !currentPassword) {
            setPasswordError('Sila isi semua medan kata laluan.');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Kata laluan baru mestilah sekurang-kurangnya 6 aksara.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Kata laluan baru dan pengesahan tidak sepadan.');
            return;
        }

        if (newPassword === currentPassword) {
            setPasswordError('Kata laluan baru mestilah berbeza daripada kata laluan semasa.');
            return;
        }

        setPasswordLoading(true);

        try {
            // Update password using Supabase
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error('Password update error', error);
                setPasswordError(error.message || 'Gagal menukar kata laluan. Sila cuba lagi.');
                return;
            }

            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setPasswordSuccess(false);
            }, 3000);
        } catch (err: any) {
            console.error('Password change error', err);
            setPasswordError(err.message || 'Ralat berlaku semasa menukar kata laluan.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleUsernameChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setNameError(null);
        setNameSuccess(false);

        if (!username.trim()) {
            setNameError('Nama tidak boleh kosong.');
            return;
        }

        setNameLoading(true);

        try {
            // Update user metadata with the new name
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: username.trim(),
                    name: username.trim()
                }
            });

            if (error) {
                console.error('Name update error', error);
                setNameError(error.message || 'Gagal menukar nama. Sila cuba lagi.');
                return;
            }

            setNameSuccess(true);

            // Reload the page to refresh user data in AuthContext
            // The auth state change should handle this, but we'll reload to be sure
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err: any) {
            console.error('Name change error', err);
            setNameError(err.message || 'Ralat berlaku semasa menukar nama.');
        } finally {
            setNameLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Tetapan Akaun
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Urus kata laluan dan maklumat profil anda
                </p>
            </motion.div>

            {/* Change Username/Name Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: 'var(--shadow)',
                    marginBottom: '1.5rem'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <User size={20} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Tukar Nama
                    </h3>
                </div>

                <form onSubmit={handleUsernameChange}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            Nama
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nama anda"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s'
                            }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Nama ini akan dipaparkan di halaman utama
                        </p>
                    </div>

                    <AnimatePresence>
                        {nameError && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginBottom: '1rem' }}
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
                                    {nameError}
                                </div>
                            </motion.div>
                        )}
                        {nameSuccess && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginBottom: '1rem' }}
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
                                    <CheckCircle size={16} />
                                    Nama berjaya dikemaskini!
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={nameLoading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: nameLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'transform 0.1s, opacity 0.2s',
                            opacity: nameLoading ? 0.7 : 1
                        }}
                    >
                        {nameLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save size={20} /> Simpan Nama
                            </>
                        )}
                    </button>
                </form>
            </motion.div>

            {/* Change Password Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: 'var(--shadow)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Lock size={20} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Tukar Kata Laluan
                    </h3>
                </div>

                <form onSubmit={handlePasswordChange}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            Kata Laluan Semasa
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            Kata Laluan Baru
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s'
                            }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Minimum 6 aksara
                        </p>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            Sahkan Kata Laluan Baru
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>

                    <AnimatePresence>
                        {passwordError && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginBottom: '1rem' }}
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
                                    {passwordError}
                                </div>
                            </motion.div>
                        )}
                        {passwordSuccess && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginBottom: '1rem' }}
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
                                    <CheckCircle size={16} />
                                    Kata laluan berjaya ditukar!
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={passwordLoading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: passwordLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'transform 0.1s, opacity 0.2s',
                            opacity: passwordLoading ? 0.7 : 1
                        }}
                    >
                        {passwordLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Menukar...
                            </>
                        ) : (
                            <>
                                <Lock size={20} /> Tukar Kata Laluan
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
