import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { type ReferensiRPH } from '../types';
import {
    Plus, Search, Edit2, Trash2, X, Save, AlertCircle,
    ChevronLeft, ChevronRight, Loader2, CheckCircle2,
    Database, Inbox, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error';
}

export const DSKPManager: React.FC = () => {
    const [records, setRecords] = useState<ReferensiRPH[]>([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Filter states
    const [filterSubjek, setFilterSubjek] = useState('');
    const [filterTahun, setFilterTahun] = useState('');
    const [filterSK, setFilterSK] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<ReferensiRPH | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        subjek: '',
        tahun: '' as string | number,
        sk: ''
    });
    const [isAddingNewSubjek, setIsAddingNewSubjek] = useState(false);
    const [isAddingNewTahun, setIsAddingNewTahun] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<ReferensiRPH | null>(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterSubjek, filterTahun, filterSK, itemsPerPage]);

    // Unique lists for dropdowns
    const uniqueSubjects = useMemo(() => {
        const subjects = records.map(r => r.subjek).filter(Boolean);
        return Array.from(new Set(subjects)).sort();
    }, [records]);

    const uniqueYears = useMemo(() => {
        const years = records.map(r => r.tahun).filter(t => t !== null && t !== undefined);
        return Array.from(new Set(years)).sort((a, b) => Number(a) - Number(b));
    }, [records]);

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('referensi_rph')
                .select('*')
                .order('subjek', { ascending: true })
                .order('tahun', { ascending: true })
                .order('sk', { ascending: true });

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            console.error('Error fetching records:', error);
            addToast('Gagal memuat turun rekod DSKP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('referensi_rph')
                .insert([{
                    subjek: formData.subjek,
                    tahun: formData.tahun ? parseInt(formData.tahun.toString()) : null,
                    sk: formData.sk
                }]);

            if (error) throw error;

            await fetchRecords();
            setIsAddModalOpen(false);
            setFormData({ subjek: '', tahun: '', sk: '' });
            setIsAddingNewSubjek(false);
            setIsAddingNewTahun(false);
            addToast('Rekod berjaya ditambah!', 'success');
        } catch (error) {
            console.error('Error adding record:', error);
            addToast('Gagal menambah rekod.', 'error');
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentRecord) return;

        try {
            const { error } = await supabase
                .from('referensi_rph')
                .update({
                    subjek: formData.subjek,
                    tahun: formData.tahun ? parseInt(formData.tahun.toString()) : null,
                    sk: formData.sk
                })
                .eq('id', currentRecord.id);

            if (error) throw error;

            await fetchRecords();
            setIsEditModalOpen(false);
            setCurrentRecord(null);
            setFormData({ subjek: '', tahun: '', sk: '' });
            setIsAddingNewSubjek(false);
            setIsAddingNewTahun(false);
            addToast('Rekod berjaya dikemaskini!', 'success');
        } catch (error) {
            console.error('Error updating record:', error);
            addToast('Gagal mengemaskini rekod.', 'error');
        }
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;

        try {
            const { error } = await supabase
                .from('referensi_rph')
                .delete()
                .eq('id', recordToDelete.id);

            if (error) throw error;

            await fetchRecords();
            setRecordToDelete(null);
            addToast('Rekod berjaya dipadam!', 'success');
        } catch (error) {
            console.error('Error deleting record:', error);
            addToast('Gagal memadam rekod.', 'error');
        }
    };

    const openEditModal = (record: ReferensiRPH) => {
        setCurrentRecord(record);
        setFormData({
            subjek: record.subjek,
            tahun: record.tahun || '',
            sk: record.sk
        });
        setIsAddingNewSubjek(false);
        setIsAddingNewTahun(false);
        setIsEditModalOpen(true);
    };

    // Filter Logic
    const filteredRecords = records.filter(r => {
        const matchSubjek = r.subjek.toLowerCase().includes(filterSubjek.toLowerCase());
        const matchTahun = filterTahun === '' || (r.tahun && r.tahun.toString() === filterTahun);
        const matchSK = r.sk.toLowerCase().includes(filterSK.toLowerCase());
        return matchSubjek && matchTahun && matchSK;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '1.25rem' }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: 'var(--primary)',
                            marginBottom: '0.5rem',
                            letterSpacing: '-0.025em'
                        }}>
                            Pengurusan DSKP
                        </h2>
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '1.05rem',
                            fontWeight: 500
                        }}>
                            Urus Subjek dan Standard Kandungan
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ subjek: '', tahun: '', sk: '' });
                            setIsAddingNewSubjek(false);
                            setIsAddingNewTahun(false);
                            setIsAddModalOpen(true);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.625rem',
                            padding: '0.875rem 1.75rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(20, 133, 63, 0.2)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 133, 63, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 133, 63, 0.2)';
                        }}
                    >
                        <Plus size={20} /> Tambah Rekod
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2.5rem',
                    backgroundColor: '#f8fafc',
                    padding: '1.75rem',
                    borderRadius: '1rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#64748b',
                            marginBottom: '0.625rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Subjek
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Search style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8'
                            }} size={18} />
                            <input
                                type="text"
                                placeholder="Cari subjek..."
                                style={{
                                    width: '100%',
                                    paddingLeft: '3rem',
                                    paddingRight: '1rem',
                                    paddingTop: '0.75rem',
                                    paddingBottom: '0.75rem',
                                    borderRadius: '0.75rem',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '0.95rem',
                                    backgroundColor: 'white',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                                value={filterSubjek}
                                onChange={(e) => setFilterSubjek(e.target.value)}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 133, 63, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#64748b',
                            marginBottom: '0.625rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Tahun
                        </label>
                        <select
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                border: '1.5px solid #e2e8f0',
                                fontSize: '0.95rem',
                                backgroundColor: 'white',
                                transition: 'all 0.2s ease',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                            value={filterTahun}
                            onChange={(e) => setFilterTahun(e.target.value)}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 133, 63, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <option value="">Semua Tahun</option>
                            {[1, 2, 3, 4, 5, 6].map(t => (
                                <option key={t} value={t}>Tahun {t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#64748b',
                            marginBottom: '0.625rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Standard Kandungan
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Filter style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8'
                            }} size={18} />
                            <input
                                type="text"
                                placeholder="Cari SK..."
                                style={{
                                    width: '100%',
                                    paddingLeft: '3rem',
                                    paddingRight: '1rem',
                                    paddingTop: '0.75rem',
                                    paddingBottom: '0.75rem',
                                    borderRadius: '0.75rem',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '0.95rem',
                                    backgroundColor: 'white',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                                value={filterSK}
                                onChange={(e) => setFilterSK(e.target.value)}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 133, 63, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{
                    borderRadius: '1rem',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    minHeight: '500px',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{
                                backgroundColor: '#f8fafc',
                                borderBottom: '2px solid #e2e8f0'
                            }}>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '1.125rem 1.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    width: '18%'
                                }}>
                                    Subjek
                                </th>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '1.125rem 1.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    width: '12%'
                                }}>
                                    Tahun
                                </th>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '1.125rem 1.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    width: '52%'
                                }}>
                                    Tajuk / Standard Kandungan
                                </th>
                                <th style={{
                                    textAlign: 'right',
                                    padding: '1.125rem 1.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    width: '18%'
                                }}>
                                    Tindakan
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} style={{
                                            textAlign: 'center',
                                            padding: '4rem 1.5rem',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Loader2 size={40} className="animate-spin" style={{
                                                    color: 'var(--primary)',
                                                    marginBottom: '1rem'
                                                }} />
                                                <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>
                                                    Memuatkan data...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{
                                            textAlign: 'center',
                                            padding: '4rem 1.5rem',
                                            color: 'var(--text-muted)',
                                            fontSize: '1.05rem',
                                            fontWeight: 500
                                        }}>
                                            <div className="flex flex-col items-center gap-4">
                                                <Inbox size={48} strokeWidth={1} />
                                                <span>Tiada rekod ditemui.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRecords.map((record) => (
                                        <motion.tr
                                            key={record.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            style={{
                                                borderBottom: '1px solid #f1f5f9',
                                                transition: 'background-color 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <td style={{
                                                padding: '1.25rem 1.5rem',
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: '#0f172a'
                                            }}>
                                                {record.subjek}
                                            </td>
                                            <td style={{
                                                padding: '1.25rem 1.5rem',
                                                fontSize: '0.9rem',
                                                color: '#64748b',
                                                fontWeight: 500
                                            }}>
                                                {record.tahun ? `Tahun ${record.tahun}` : '-'}
                                            </td>
                                            <td style={{
                                                padding: '1.25rem 1.5rem',
                                                fontSize: '0.9rem',
                                                color: '#475569',
                                                lineHeight: '1.7',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {record.sk}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
                                                    <button
                                                        onClick={() => openEditModal(record)}
                                                        style={{
                                                            padding: '0.625rem',
                                                            backgroundColor: 'white',
                                                            border: '1.5px solid #dbeafe',
                                                            borderRadius: '0.625rem',
                                                            color: '#2563eb',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                        title="Edit"
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#eff6ff';
                                                            e.currentTarget.style.borderColor = '#2563eb';
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'white';
                                                            e.currentTarget.style.borderColor = '#dbeafe';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        <Edit2 size={17} />
                                                    </button>
                                                    <button
                                                        onClick={() => setRecordToDelete(record)}
                                                        style={{
                                                            padding: '0.625rem',
                                                            backgroundColor: 'white',
                                                            border: '1.5px solid #fee2e2',
                                                            borderRadius: '0.625rem',
                                                            color: '#dc2626',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                        title="Padam"
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#fef2f2';
                                                            e.currentTarget.style.borderColor = '#dc2626';
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'white';
                                                            e.currentTarget.style.borderColor = '#fee2e2';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {!loading && filteredRecords.length > 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1.5rem',
                        marginTop: '2rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid #e2e8f0',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.95rem',
                            color: '#64748b',
                            fontWeight: 500
                        }}>
                            <span>Papar</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                style={{
                                    border: '1.5px solid #e2e8f0',
                                    borderRadius: '0.625rem',
                                    padding: '0.5rem 0.75rem',
                                    outline: 'none',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    color: '#475569',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span>dari <strong style={{ color: '#0f172a' }}>{filteredRecords.length}</strong> rekod</span>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '0.625rem',
                                    borderRadius: '0.625rem',
                                    border: '1.5px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#475569'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentPage !== 1) {
                                        e.currentTarget.style.backgroundColor = '#f8fafc';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{
                                fontWeight: 600,
                                color: '#0f172a',
                                fontSize: '0.95rem',
                                padding: '0 0.5rem'
                            }}>
                                Halaman {currentPage} / {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                style={{
                                    padding: '0.625rem',
                                    borderRadius: '0.625rem',
                                    border: '1.5px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                                    opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#475569'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentPage !== totalPages && totalPages !== 0) {
                                        e.currentTarget.style.backgroundColor = '#f8fafc';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit */}
            <AnimatePresence>
                {(isAddModalOpen || isEditModalOpen) && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '600px', margin: '1rem', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--primary)' }}>
                                    {isAddModalOpen ? 'Tambah DSKP Baru' : 'Kemaskini DSKP'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setIsEditModalOpen(false);
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={isAddModalOpen ? handleAdd : handleEdit} style={{ padding: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label>Subjek</label>
                                        {!isAddingNewSubjek ? (
                                            <select
                                                required
                                                value={formData.subjek}
                                                onChange={(e) => {
                                                    if (e.target.value === 'ADD_NEW') {
                                                        setIsAddingNewSubjek(true);
                                                        setFormData({ ...formData, subjek: '' });
                                                    } else {
                                                        setFormData({ ...formData, subjek: e.target.value });
                                                    }
                                                }}
                                            >
                                                <option value="" disabled>Pilih Subjek</option>
                                                {uniqueSubjects.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                                <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Tambah Subjek Baru</option>
                                            </select>
                                        ) : (
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    value={formData.subjek}
                                                    onChange={e => setFormData({ ...formData, subjek: e.target.value })}
                                                    placeholder="Nama Subjek Baru"
                                                    style={{ paddingRight: '2rem' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingNewSubjek(false)}
                                                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    title="Kembali ke senarai"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label>Tahun / Kelas</label>
                                        {!isAddingNewTahun ? (
                                            <select
                                                required
                                                value={formData.tahun}
                                                onChange={(e) => {
                                                    if (e.target.value === 'ADD_NEW') {
                                                        setIsAddingNewTahun(true);
                                                        setFormData({ ...formData, tahun: '' });
                                                    } else {
                                                        setFormData({ ...formData, tahun: e.target.value });
                                                    }
                                                }}
                                            >
                                                <option value="" disabled>Pilih Tahun</option>
                                                {uniqueYears.map(t => (
                                                    <option key={String(t)} value={String(t)}>Tahun {t}</option>
                                                ))}
                                                <option value="ADD_NEW" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Tambah Tahun Baru</option>
                                            </select>
                                        ) : (
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="6"
                                                    required
                                                    autoFocus
                                                    value={formData.tahun}
                                                    onChange={e => setFormData({ ...formData, tahun: e.target.value })}
                                                    placeholder="1 - 6"
                                                    style={{ paddingRight: '2rem' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingNewTahun(false)}
                                                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    title="Kembali ke senarai"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Standard Kandungan (SK)</label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={formData.sk}
                                        onChange={e => setFormData({ ...formData, sk: e.target.value })}
                                        placeholder="Masukkan butiran SK..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            setIsEditModalOpen(false);
                                        }}
                                    >
                                        Batal
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <Save size={18} /> Simpan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirm Delete */}
            <AnimatePresence>
                {recordToDelete && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1100,
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '400px', margin: '1rem', textAlign: 'center', padding: '2rem' }}
                        >
                            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
                            <h3 style={{ marginBottom: '0.5rem' }}>Padam Rekod?</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                Adakah anda pasti mahu memadam rekod untuk <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>"{recordToDelete.subjek}"</span>?
                            </p>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="btn btn-outline"
                                    style={{ flex: 1 }}
                                    onClick={() => setRecordToDelete(null)}
                                >
                                    Batal
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, backgroundColor: '#ef4444' }}
                                    onClick={handleDelete}
                                >
                                    Padam
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toasts */}
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            style={{
                                padding: '1rem 1.5rem',
                                borderRadius: '0.75rem',
                                backgroundColor: toast.type === 'success' ? '#065f46' : '#991b1b',
                                color: 'white',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}
                        >
                            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {toast.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
