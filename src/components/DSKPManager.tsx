import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { type ReferensiRPH } from '../types';
import { Plus, Search, Edit2, Trash2, X, Save, AlertCircle, ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DSKPManager: React.FC = () => {
    const [records, setRecords] = useState<ReferensiRPH[]>([]);
    const [loading, setLoading] = useState(true);

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
        tahun: '' as string | number, // Use string for input, convert to number for DB
        sk: ''
    });
    const [currentRecord, setCurrentRecord] = useState<ReferensiRPH | null>(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterSubjek, filterTahun, filterSK, itemsPerPage]);

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
            alert('Gagal memuat turun rekod DSKP.');
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

            fetchRecords();
            setIsAddModalOpen(false);
            setFormData({ subjek: '', tahun: '', sk: '' });
        } catch (error) {
            console.error('Error adding record:', error);
            alert('Gagal menambah rekod.');
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

            fetchRecords();
            setIsEditModalOpen(false);
            setCurrentRecord(null);
            setFormData({ subjek: '', tahun: '', sk: '' });
        } catch (error) {
            console.error('Error updating record:', error);
            alert('Gagal mengemaskini rekod.');
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

            fetchRecords();
            setRecordToDelete(null);
        } catch (error) {
            console.error('Error deleting record:', error);
            alert('Gagal memadam rekod.');
        }
    };

    const openEditModal = (record: ReferensiRPH) => {
        setCurrentRecord(record);
        setFormData({
            subjek: record.subjek,
            tahun: record.tahun || '',
            sk: record.sk
        });
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
            className="space-y-6"
        >
            <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--primary)]">Pengurusan DSKP</h2>
                        <p className="text-[var(--text-muted)]">Urus Subjek dan Standard Kandungan</p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ subjek: '', tahun: '', sk: '' });
                            setIsAddModalOpen(true);
                        }}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> Tambah Rekod
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-[var(--background)] p-4 rounded-xl border border-gray-100/50 shadow-sm">
                    <div className="relative">
                        <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block uppercase tracking-wide">Subjek</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari subjek..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm bg-white"
                                value={filterSubjek}
                                onChange={(e) => setFilterSubjek(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block uppercase tracking-wide">Tahun</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm bg-white appearance-none"
                            value={filterTahun}
                            onChange={(e) => setFilterTahun(e.target.value)}
                        >
                            <option value="">Semua Tahun</option>
                            {[1, 2, 3, 4, 5, 6].map(t => (
                                <option key={t} value={t}>Tahun {t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block uppercase tracking-wide">Standard Kandungan</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari SK..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-sm bg-white"
                                value={filterSK}
                                onChange={(e) => setFilterSK(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="table-container min-h-[400px]">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Subjek</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)] w-24">Tahun</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Tajuk / Standard Kandungan</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)] w-32">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12 text-[var(--text-muted)]">
                                            <div className="flex flex-col items-center justify-center">
                                                <Loader2 size={32} className="animate-spin text-[var(--primary)] mb-2" />
                                                Memuatkan data...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12 text-[var(--text-muted)]">
                                            Tiada rekod ditemui.
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
                                            className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.subjek}</td>
                                            <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                                                {record.tahun ? `Tahun ${record.tahun}` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{record.sk}</td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(record)}
                                                        className="btn btn-outline p-2 hover:bg-blue-50 text-blue-600 border-blue-200"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setRecordToDelete(record)}
                                                        className="btn btn-outline p-2 hover:bg-red-50 text-red-600 border-red-200"
                                                        title="Padam"
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

                {/* Pagination Controls */}
                {!loading && filteredRecords.length > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-100 text-sm text-[var(--text-muted)]">
                        <div className="flex items-center gap-2">
                            <span>Papar</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] bg-white"
                            >
                                <option value={10}>10</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span>dari {filteredRecords.length} rekod</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="font-medium text-gray-700">
                                Halaman {currentPage} / {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-900">Tambah Rekod DSKP</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAdd} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subjek</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all"
                                        value={formData.subjek}
                                        onChange={e => setFormData({ ...formData, subjek: e.target.value })}
                                        placeholder="Contoh: Bahasa Melayu"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tahun (1-6)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="6"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all"
                                        value={formData.tahun}
                                        onChange={e => setFormData({ ...formData, tahun: e.target.value })}
                                        placeholder="Kosongkan jika tidak berkaitan"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tajuk / Standard Kandungan</label>
                                    <textarea
                                        required
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all"
                                        value={formData.sk}
                                        onChange={e => setFormData({ ...formData, sk: e.target.value })}
                                        placeholder="Masukkan butiran SK..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="btn btn-outline"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary flex items-center gap-2"
                                    >
                                        <Save size={18} /> Simpan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-900">Kemaskini Rekod DSKP</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleEdit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subjek</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all"
                                        value={formData.subjek}
                                        onChange={e => setFormData({ ...formData, subjek: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tahun (1-6)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="6"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all"
                                        value={formData.tahun}
                                        onChange={e => setFormData({ ...formData, tahun: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tajuk / Standard Kandungan</label>
                                    <textarea
                                        required
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all"
                                        value={formData.sk}
                                        onChange={e => setFormData({ ...formData, sk: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="btn btn-outline"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary flex items-center gap-2"
                                    >
                                        <Save size={18} /> Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Alert */}
            <AnimatePresence>
                {recordToDelete && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 border border-gray-100"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Padam Rekod?</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Adakah anda pasti mahu memadam rekod ini? Tindakan ini tidak boleh dibatalkan.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-sm">
                                <p className="mb-1"><strong className="text-gray-700">Subjek:</strong> {recordToDelete.subjek}</p>
                                <p><strong className="text-gray-700">SK:</strong> {recordToDelete.sk.substring(0, 100)}{recordToDelete.sk.length > 100 ? '...' : ''}</p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setRecordToDelete(null)}
                                    className="btn btn-outline"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn bg-red-600 hover:bg-red-700 text-white border-transparent"
                                >
                                    Ya, Padam
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
