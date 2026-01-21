import React, { useState } from 'react';
import { Edit2, Trash2, Printer, Search, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RPHRecord } from '../types';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { RPHPrintLayout } from './RPHPrintLayout';

interface RPHRecordsProps {
    records: RPHRecord[];
    loading?: boolean;
    onDelete: (id: string) => void;
    onEdit: (record: RPHRecord) => void;
    onPrint: (record: RPHRecord) => void;
}

export const RPHRecords: React.FC<RPHRecordsProps> = ({ records, loading, onDelete, onEdit, onPrint }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const filteredRecords = records.filter(rec =>
        rec.subjek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.tajukStandardKandungan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.kelas.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredRecords.map(r => r.id));
        }
    };

    const handleDownloadAll = () => {
        const dataToExport = filteredRecords.map(rec => ({
            'Tarikh': rec.tarikh,
            'Hari': rec.hari,
            'Kelas': rec.kelas,
            'Masa': rec.masa,
            'Subjek': rec.subjek,
            'Tajuk / Standard Kandungan': rec.tajukStandardKandungan,
            'Aktiviti': rec.aktiviti,
            'Refleksi': rec.refleksi
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekod eRPH');
        XLSX.writeFile(workbook, `Rekod_eRPH_Semua_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const isBulkPDF = selectedIds.length > 0;
    const selectedRecords = records.filter(r => selectedIds.includes(r.id));

    const handleDownloadPDFBulk = () => {
        const element = document.getElementById('bulk-print-area');
        if (!element || selectedRecords.length === 0) {
            console.error('Cannot generate PDF: element not found or no records selected');
            return;
        }

        console.log('Generating PDF for', selectedRecords.length, 'records');

        // Store original styles
        const originalStyles = {
            position: element.style.position,
            left: element.style.left,
            top: element.style.top,
            width: element.style.width,
            maxWidth: element.style.maxWidth,
            visibility: element.style.visibility,
            opacity: element.style.opacity,
            zIndex: element.style.zIndex,
            pointerEvents: element.style.pointerEvents,
            transform: element.style.transform,
            display: element.style.display
        };

        // Make element visible and properly positioned for html2canvas
        // Position it on-screen but behind everything (z-index: -1) for rendering
        element.style.position = 'fixed';
        element.style.left = '0px';
        element.style.top = '0px';
        element.style.width = '210mm'; // A4 width
        element.style.maxWidth = '210mm';
        element.style.minHeight = '100vh'; // Ensure it has height
        element.style.visibility = 'visible';
        element.style.opacity = '1';
        element.style.zIndex = '-1'; // Behind everything but still rendered
        element.style.pointerEvents = 'none';
        element.style.display = 'block';
        element.style.transform = ''; // Remove any transform
        element.style.background = 'white'; // Ensure background

        // Force reflow and wait for rendering
        void element.offsetHeight; // Force reflow

        // Verify element has content
        console.log('Element content height:', element.scrollHeight, 'px');
        console.log('Element children:', element.children.length);

        setTimeout(() => {
            // Double check element is still visible
            const rect = element.getBoundingClientRect();
            console.log('Element bounds:', rect.width, 'x', rect.height);

            if (rect.height === 0) {
                console.error('Element has zero height, cannot generate PDF');
                // Restore styles before returning
                element.style.position = originalStyles.position || '';
                element.style.left = originalStyles.left || '';
                element.style.top = originalStyles.top || '';
                element.style.width = originalStyles.width || '';
                element.style.maxWidth = originalStyles.maxWidth || '';
                element.style.visibility = originalStyles.visibility || '';
                element.style.opacity = originalStyles.opacity || '';
                element.style.zIndex = originalStyles.zIndex || '';
                element.style.pointerEvents = originalStyles.pointerEvents || '';
                element.style.transform = originalStyles.transform || '';
                element.style.display = originalStyles.display || '';
                element.style.minHeight = '';
                element.style.background = '';
                return;
            }

            const opt = {
                margin: [0.25, 0.25, 0.25, 0.25],
                filename: `eRPH_Pilihan_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    windowWidth: 800,
                    windowHeight: element.scrollHeight,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    removeContainer: false,
                    x: 0,
                    y: 0,
                    scrollX: 0,
                    scrollY: 0
                },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'], before: '.print-record-container' }
            } as any;

            html2pdf().set(opt).from(element).save().then(() => {
                // Restore original styles after PDF generation
                element.style.position = originalStyles.position || '';
                element.style.left = originalStyles.left || '';
                element.style.top = originalStyles.top || '';
                element.style.width = originalStyles.width || '';
                element.style.maxWidth = originalStyles.maxWidth || '';
                element.style.visibility = originalStyles.visibility || '';
                element.style.opacity = originalStyles.opacity || '';
                element.style.zIndex = originalStyles.zIndex || '';
                element.style.pointerEvents = originalStyles.pointerEvents || '';
                element.style.transform = originalStyles.transform || '';
                element.style.display = originalStyles.display || '';
                element.style.minHeight = '';
                element.style.background = '';
            }).catch((error: any) => {
                console.error('PDF generation error:', error);
                // Restore styles even on error
                element.style.position = originalStyles.position || '';
                element.style.left = originalStyles.left || '';
                element.style.top = originalStyles.top || '';
                element.style.width = originalStyles.width || '';
                element.style.maxWidth = originalStyles.maxWidth || '';
                element.style.visibility = originalStyles.visibility || '';
                element.style.opacity = originalStyles.opacity || '';
                element.style.zIndex = originalStyles.zIndex || '';
                element.style.pointerEvents = originalStyles.pointerEvents || '';
                element.style.transform = originalStyles.transform || '';
                element.style.display = originalStyles.display || '';
                element.style.minHeight = '';
                element.style.background = '';
            });
        }, 300); // Give more time for rendering
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
                    <h2 style={{ color: 'var(--primary)' }}>Senarai Rekod Pengajaran</h2>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button
                            className="btn btn-outline"
                            onClick={isBulkPDF ? handleDownloadPDFBulk : handleDownloadAll}
                            disabled={filteredRecords.length === 0}
                            title={isBulkPDF ? "Muat Turun Pilihan (PDF)" : "Muat Turun Semua (Excel)"}
                        >
                            <Download size={18} /> {isBulkPDF ? 'Muat Turun PDF' : 'Muat Turun Excel'}
                        </button>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="text"
                                placeholder="Cari subjek, tajuk atau kelas..."
                                style={{ paddingLeft: '2.5rem' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                        checked={selectedIds.length === filteredRecords.length && filteredRecords.length > 0}
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
                            <AnimatePresence>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
                                            <p>Memuatkan rekod...</p>
                                        </td>
                                    </tr>
                                ) : filteredRecords.length > 0 ? (
                                    filteredRecords.map((rec) => (
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
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.tajukStandardKandungan}</div>
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
                                                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} title="Cetak" onClick={() => onPrint(rec)}>
                                                        <Printer size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            {searchTerm ? 'Tiada rekod padan dengan carian anda.' : 'Tiada rekod dijumpai. Sila tambah rekod baru.'}
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div >
            <div id="bulk-print-area" style={{
                position: 'absolute',
                left: '100vw',
                top: '0px',
                width: '210mm', // A4 width
                background: 'white',
                visibility: 'hidden',
                opacity: 0,
                zIndex: -1,
                pointerEvents: 'none',
                display: 'block'
            }}>
                {selectedRecords.map((rec, index) => (
                    <RPHPrintLayout
                        key={rec.id}
                        record={rec}
                        showPageBreak={index < selectedRecords.length - 1}
                        minHeight="9in"
                    />
                ))}
            </div>
        </React.Fragment >
    );
};
