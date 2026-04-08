import React, { useState } from 'react';
import { Edit2, Trash2, Printer, Search, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RPHRecord } from '../types';
import * as XLSX from 'xlsx';
import { generateRPH_PDF, generateBulkRPH_PDF } from '../lib/pdfGenerator';
import { PDFReadyModal } from './PDFReadyModal';

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

const RPHCard: React.FC<{
    record: RPHRecord;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onEdit: (record: RPHRecord) => void;
    onDelete: (id: string) => void;
    onPrint: (record: RPHRecord) => void;
}> = ({ record, isSelected, onToggleSelect, onEdit, onDelete, onPrint }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-modern p-4 mb-4"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(record.id)}
                        className="w-5 h-5"
                    />
                    <div>
                        <div className="font-bold text-lg font-jawi" style={{ color: 'var(--primary)' }}>{record.subjek}</div>
                        <div className="text-sm text-slate-500">{record.kelas}</div>
                    </div>
                </div>
                <div className={`tag-primary ${record.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                    {record.status === 'published' ? 'Diterbitkan' : 'Draf'}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                    <div className="text-slate-400 font-medium">Tarikh / Hari</div>
                    <div className="font-semibold">{record.tarikh} ({record.hari})</div>
                </div>
                <div>
                    <div className="text-slate-400 font-medium">Masa</div>
                    <div className="font-semibold">{record.masa}</div>
                </div>
            </div>

            <div className="mb-4">
                <div className="text-slate-400 text-xs font-medium mb-1">Tajuk / Standard Kandungan</div>
                <div className="text-sm line-clamp-2 font-jawi" style={{ maxHeight: '3em', overflow: 'hidden' }}>
                    {record.content?.tajukStandardKandungan || 'Tiada tajuk'}
                </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button 
                    className="btn btn-outline flex-1" 
                    style={{ padding: '0.5rem', minHeight: '44px' }} 
                    onClick={() => onEdit(record)}
                >
                    <Edit2 size={18} />
                </button>
                <button 
                    className="btn btn-outline flex-1" 
                    style={{ padding: '0.5rem', minHeight: '44px', color: '#ef4444' }} 
                    onClick={() => {
                        if (confirm('Adakah anda pasti mahu memadam rekod ini?')) {
                            onDelete(record.id);
                        }
                    }}
                >
                    <Trash2 size={18} />
                </button>
                <button 
                    className="btn btn-primary flex-1" 
                    style={{ padding: '0.5rem', minHeight: '44px' }} 
                    onClick={() => onPrint(record)}
                >
                    <Printer size={18} />
                </button>
            </div>
        </motion.div>
    );
};

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
    const [pdfModalData, setPdfModalData] = useState<{ isOpen: boolean; url: string | null; fileName: string }>({
        isOpen: false,
        url: null,
        fileName: ''
    });

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
            const blob = await generateBulkRPH_PDF(selectedRecords);
            const url = URL.createObjectURL(blob);
            const fileName = `eRPH_Bulk_${new Date().toISOString().split('T')[0]}.pdf`;
            
            setIsGeneratingPDF(false);
            setPdfModalData({ isOpen: true, url, fileName });
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
            const blob = await generateRPH_PDF(record);
            const url = URL.createObjectURL(blob);
            const fileName = `eRPH_${record.tarikh}_${record.kelas.replace(/ /g, '_')}.pdf`;

            setIsGeneratingPDF(false);
            setPdfModalData({ isOpen: true, url, fileName });
        } catch (error) {
            console.error('PDF Generation Error:', error);
            setIsGeneratingPDF(false);
            alert('Gagal menjana PDF. Sila cuba lagi.');
        }
    };

    return (
        <React.Fragment>
            <PDFReadyModal
                isOpen={pdfModalData.isOpen}
                onClose={() => {
                    if (pdfModalData.url) URL.revokeObjectURL(pdfModalData.url);
                    setPdfModalData({ ...pdfModalData, isOpen: false, url: null });
                }}
                pdfUrl={pdfModalData.url}
                fileName={pdfModalData.fileName}
            />
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

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <button
                            className="btn btn-outline w-full md:w-auto"
                            style={{ height: '48px' }}
                            onClick={isBulkPDF ? handleDownloadPDFBulk : handleDownloadAll}
                            disabled={records.length === 0}
                            title={isBulkPDF ? "Muat Turun Pilihan (PDF)" : "Muat Turun Halaman (Excel)"}
                        >
                            <Download size={20} /> {isBulkPDF ? 'Muat Turun PDF' : 'Muat Turun Excel'}
                        </button>
                        <div className="relative w-full md:w-[300px]">
                            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                            <input
                                type="text"
                                placeholder="Cari rekod..."
                                style={{ paddingLeft: '2.5rem', height: '48px' }}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(0);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Mobile View: Card List */}
                <div className="mobile-only">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div key="loading-mobile" className="py-10 text-center text-slate-400">
                                <Loader2 size={40} className="animate-spin mx-auto mb-2 color-primary" style={{ color: 'var(--primary)' }} />
                                <p>Memuatkan rekod...</p>
                            </div>
                        ) : records.length > 0 ? (
                            <div className="flex flex-col">
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <div className="text-sm font-medium text-slate-500">
                                        Pilih Semua
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === records.length && records.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-5 h-5"
                                    />
                                </div>
                                {records.map((rec) => (
                                    <RPHCard
                                        key={rec.id}
                                        record={rec}
                                        isSelected={selectedIds.includes(rec.id)}
                                        onToggleSelect={toggleSelect}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onPrint={handleSinglePrint}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div key="empty-mobile" className="py-10 text-center text-slate-400">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold text-slate-700">Tiada Rekod Dijumpai</h3>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop View: Table */}
                <div className="table-container desktop-only">
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
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="bg-slate-50 p-6 rounded-full mb-4">
                                                    <Search size={48} strokeWidth={1.5} />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-700 mb-2">
                                                    {searchTerm ? 'Tiada Rekod Dijumpai' : 'Tiada Rekod Lagi'}
                                                </h3>
                                                <p className="max-w-xs mx-auto">
                                                    {searchTerm 
                                                        ? `Carian "${searchTerm}" tidak memulangkan sebarang keputusan.` 
                                                        : 'Anda belum mencipta sebarang rekod eRPH. Mulakan dengan menekan butang "Rekod Baru".'}
                                                </p>
                                            </div>
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
