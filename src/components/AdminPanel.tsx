import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, Users, XCircle } from 'lucide-react';
import type { Profile } from '../types';
import { api, errorMessage } from '../lib/apiClient';

const STATUS_LABEL: Record<Profile['status'], string> = {
    pending: 'Menunggu kelulusan',
    active: 'Aktif',
    disabled: 'Dinyahaktifkan',
};

export const AdminPanel: React.FC = () => {
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            const result = await api.members();
            setMembers(result.members);
            setError(null);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const update = async (member: Profile, patch: { role?: Profile['role']; status?: Profile['status'] }) => {
        setBusyId(member.id);
        try {
            const result = await api.setMembership(member.id, patch);
            setMembers((prev) => prev.map((item) => (item.id === result.profile.id ? result.profile : item)));
            setError(null);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Users size={24} style={{ color: 'var(--primary)' }} />
                <h2 style={{ color: 'var(--primary)', margin: 0 }}>Pengurusan Pengguna</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Luluskan akaun guru dan tetapkan peranan. Hanya akaun <strong>Aktif</strong> boleh mengakses data sekolah.
            </p>

            {error && (
                <div role="alert" style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>E-mel</th>
                                <th>Status</th>
                                <th>Peranan</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member) => (
                                <tr key={member.id}>
                                    <td style={{ fontWeight: 600 }}>{member.name}</td>
                                    <td>{member.email}</td>
                                    <td>{STATUS_LABEL[member.status]}</td>
                                    <td>
                                        <span className={`tag-primary ${member.role === 'admin' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>
                                            {member.role === 'admin' ? 'Pentadbir' : 'Guru'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {member.status !== 'active' ? (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.5rem 0.75rem' }}
                                                    disabled={busyId === member.id}
                                                    onClick={() => void update(member, { status: 'active' })}
                                                >
                                                    <CheckCircle2 size={16} /> Luluskan
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.5rem 0.75rem', color: '#b91c1c' }}
                                                    disabled={busyId === member.id}
                                                    onClick={() => void update(member, { status: 'disabled' })}
                                                >
                                                    <XCircle size={16} /> Nyahaktif
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '0.5rem 0.75rem' }}
                                                disabled={busyId === member.id}
                                                onClick={() =>
                                                    void update(member, { role: member.role === 'admin' ? 'teacher' : 'admin' })
                                                }
                                            >
                                                <ShieldCheck size={16} /> {member.role === 'admin' ? 'Jadikan Guru' : 'Jadikan Pentadbir'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
