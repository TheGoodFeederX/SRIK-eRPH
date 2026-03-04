import React, { useState } from 'react';
import { Edit2, Trash2, Printer, Search, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RPHRecord } from '../types';
import * as XLSX from 'xlsx';
import { generateRPH_PDF, generateBulkRPH_PDF } from '../lib/pdfGenerator';

interface RPHRecordsProps {
    records: RPHRecord[];
    loading?: boolean;
    totalCount: number;
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onDelete: (id: string) => void;
    onEdit: (record: RPHRecord) => void;
}

export const RPHRecords: React.FC<RPHRecordsProps> = ({ 
    records, 
    loading, 
    totalCount,
    page,
    setPage,
    pageSize,
    searchTerm,
    setSearchTerm,
    onDelete, 
    onEdit 
}) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === records.length && records.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(records.map(r => r.id));
        }
    };

    const handleDownloadAll = () => {
        const dataToExport = records.map(rec => ({
            'Tarikh': rec.tarikh,
            'Hari': rec.hari,
            'Kelas': rec.kelas,
            'Masa': rec.masa,
            'Subjek': rec.subjek,
            'Tajuk / Standard Kandungan': rec.content?.tajukStandardKandungan || '',
            'Aktiviti': rec.content?.aktiviti || '',
            'Refleksi': rec.content?.refleksi || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekod eRPH');
        XLSX.writeFile(workbook, `Rekod_eRPH_Halaman_${page + 1}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const isBulkPDF = selectedIds.length > 0;
    const selectedRecords = records.filter(r => selectedIds.includes(r.id));

    const totalPages = Math.ceil(totalCount / pageSize);

    const handleDownloadPDFBulk = async () => {
        if (selectedRecords.length === 0) return;
        setIsGeneratingPDF(true);

        try {
            await generateBulkRPH_PDF(selectedRecords);
            setIsGeneratingPDF(false);
            setSelectedIds([]);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            setIsGeneratingPDF(false);
            alert('Gagal menjana PDF. Sila cuba lagi.');
        }
    };

    const handleSinglePrint = async (record: RPHRecord) => {
        setIsGeneratingPDF(true);
        try {
            await generateRPH_PDF(record);
            setIsGeneratingPDF(false);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            setIsGeneratingPDF(false);
            alert('Gagal menjana PDF. Sila cuba lagi.');
        }
    };

    return (
        <React.Fragment>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ padding: '2rem' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ color: 'var(--primary)' }}>Senarai Rekod Pengajaran</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Jumlah rekod: <strong>{totalCount}</strong>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button
                            className="btn btn-outline"
                            onClick={isBulkPDF ? handleDownloadPDFBulk : handleDownloadAll}
                            disabled={records.length === 0}
                            title={isBulkPDF ? "Muat Turun Pilihan (PDF)" : "Muat Turun Halaman (Excel)"}
                        >
                            <Download size={18} /> {isBulkPDF ? 'Muat Turun PDF' : 'Muat Turun Excel'}
                        </button>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="text"
                                placeholder="Cari subjek, kelas, atau hari..."
                                style={{ paddingLeft: '2.5rem' }}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(0);
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === records.length && records.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>Tarikh / Hari</th>
                                <th>Kelas / Masa</th>
                                <th>Subjek / Tajuk</th>
                                <th className="no-print">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key="loading"
                                    >
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
                                            <p>Memuatkan rekod...</p>
                                        </td>
                                    </motion.tr>
                                ) : records.length > 0 ? (
                                    records.map((rec) => (
                                        <motion.tr
                                            key={rec.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            layout
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(rec.id)}
                                                    onChange={() => toggleSelect(rec.id)}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{rec.tarikh}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rec.hari}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{rec.kelas}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rec.masa}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{rec.subjek}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.content?.tajukStandardKandungan || ''}</div>
                                            </td>
                                            <td className="no-print">
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-outline" style={{ padding: '0.5rem' }} title="Edit" onClick={() => onEdit(rec)}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="btn btn-outline" style={{ padding: '0.5rem', color: '#ef4444' }} title="Padam" onClick={() => {
                                                        if (confirm('Adakah anda pasti mahu memadam rekod ini?')) {
                                                            onDelete(rec.id);
                                                        }
                                                    }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} title="Cetak" onClick={() => handleSinglePrint(rec)}>
                                                        <Printer size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key="empty"
                                    >
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            {searchTerm ? 'Tiada rekod padan dengan carian anda.' : 'Tiada rekod dijumpai. Sila tambah rekod baru.'}
                                        </td>
                                    </motion.tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        marginTop: '2rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border)'
                    }}>
                        <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.5rem' }}
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    className={`btn ${page === i ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.5rem 1rem', minWidth: '40px' }}
                                    onClick={() => setPage(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.5rem' }}
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page === totalPages - 1}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </motion.div >

            {/* Loading Overlay */}
            <AnimatePresence>
                {isGeneratingPDF && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 10000,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Menjana PDF...</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Sila tunggu sebentar.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </React.Fragment >
    );
};
