import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { type ReferensiRPH } from '../types';
import {
    Plus, Search, Edit2, Trash2, X, Save, AlertCircle,
    ChevronLeft, ChevronRight, Loader2, CheckCircle2,
    Database, Inbox
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
            className="glass-card"
            style={{ padding: '2rem' }}
        >
            {/* Header Section */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ color: 'var(--primary)', margin: 0 }}>Pengurusan DSKP</h2>
                <button
                    onClick={() => {
                        setFormData({ subjek: '', tahun: '', sk: '' });
                        setIsAddingNewSubjek(false);
                        setIsAddingNewTahun(false);
                        setIsAddModalOpen(true);
                    }}
                    className="btn btn-primary"
                >
                    <Plus size={18} /> Rekod Baru
                </button>
            </header>

            {/* Filter Section */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Cari subjek..."
                        style={{ paddingLeft: '2.5rem' }}
                        value={filterSubjek}
                        onChange={(e) => setFilterSubjek(e.target.value)}
                    />
                </div>

                <div style={{ position: 'relative', width: '180px' }}>
                    <select
                        value={filterTahun}
                        onChange={(e) => setFilterTahun(e.target.value)}
                        style={{ paddingRight: '2.5rem' }}
                    >
                        <option value="">Semua Tahun</option>
                        {uniqueYears.map(t => (
                            <option key={String(t)} value={String(t)}>Tahun {t}</option>
                        ))}
                    </select>
                </div>

                <div style={{ position: 'relative', flex: '1.5', minWidth: '250px' }}>
                    <Database style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Cari isi kandungan..."
                        style={{ paddingLeft: '2.5rem' }}
                        value={filterSK}
                        onChange={(e) => setFilterSK(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Section */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '150px' }}>Subjek</th>
                            <th style={{ width: '100px' }}>Tahun</th>
                            <th>Standard Kandungan</th>
                            <th className="no-print" style={{ width: '140px' }}>Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
                                        <p>Memuatkan data...</p>
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <Inbox size={48} strokeWidth={1} />
                                            <span style={{ fontWeight: 600 }}>Tiada rekod dijumpai</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record) => (
                                    <motion.tr
                                        key={record.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        layout
                                    >
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.85rem' }}>
                                                {record.subjek}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>
                                                {record.tahun ? `Tahun ${record.tahun}` : 'Umum'}
                                            </div>
                                        </td>
                                        <td>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                                                {record.sk}
                                            </p>
                                        </td>
                                        <td className="no-print">
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.5rem' }}
                                                    title="Kemaskini"
                                                    onClick={() => openEditModal(record)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.5rem', color: '#ef4444' }}
                                                    title="Padam"
                                                    onClick={() => setRecordToDelete(record)}
                                                >
                                                    <Trash2 size={16} />
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

            {/* Pagination */}
            {!loading && filteredRecords.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Papar:</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[10, 50, 100].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setItemsPerPage(val)}
                                    className={`btn ${itemsPerPage === val ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="btn btn-outline"
                            style={{ padding: '0.5rem' }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {currentPage} <span style={{ color: 'var(--border)', margin: '0 0.5rem' }}>|</span> {totalPages || 1}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="btn btn-outline"
                            style={{ padding: '0.5rem' }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

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
