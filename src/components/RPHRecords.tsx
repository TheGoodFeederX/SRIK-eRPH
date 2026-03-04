import React, { useState } from 'react';
import { Edit2, Trash2, Printer, Search, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RPHRecord } from '../types';
import * as XLSX from 'xlsx';
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
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const filteredRecords = records.filter(rec =>
        rec.subjek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.content?.tajukStandardKandungan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            'Tajuk / Standard Kandungan': rec.content?.tajukStandardKandungan || '',
            'Aktiviti': rec.content?.aktiviti || '',
            'Refleksi': rec.content?.refleksi || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekod eRPH');
        XLSX.writeFile(workbook, `Rekod_eRPH_Semua_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const isBulkPDF = selectedIds.length > 0;
    const selectedRecords = records.filter(r => selectedIds.includes(r.id));

    const handleDownloadPDFBulk = async () => {
        if (selectedRecords.length === 0) return;
        setIsGeneratingPDF(true);

        try {
            // Import and verify libraries first
            // @ts-ignore
            const { default: jsPDF } = await import('jspdf');
            // @ts-ignore
            const html2canvas = (await import('html2canvas')).default;

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-10000px';
            iframe.style.top = '0';
            iframe.style.width = '210mm';
            iframe.style.height = 'auto'; // Will expand
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) throw new Error('Cannot access iframe document');

            // Copy all styles from main document to iframe
            const styleSheets = Array.from(document.styleSheets);
            const styleTagsArray = await Promise.all(styleSheets.map(async sheet => {
                try {
                    if (sheet.href) return `<link rel="stylesheet" href="${sheet.href}">`;
                    if (sheet.cssRules) return `<style>${Array.from(sheet.cssRules).map(r => r.cssText).join('\n')}</style>`;
                } catch (e) { return ''; }
                return '';
            }));

            const fontTag = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
            const baseStyles = `<style>
                :root {
                  --primary: #14853f; --secondary: #e31e24; --accent: #fde910;
                  --background: #f8fafc; --surface: #ffffff; --text-main: #1e293b;
                  --text-muted: #64748b; --border: #e2e8f0;
                }
                * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
                body { 
                  font-family: 'Plus Jakarta Sans', sans-serif; 
                  background: white; margin: 0; padding: 0; width: 210mm;
                  overflow-x: hidden;
                }
                .print-record-container { 
                    width: 210mm; 
                    height: 297mm; /* Exact A4 height */
                    display: flex;
                    flex-direction: column;
                    margin: 0 !important; 
                    padding: 2.5rem !important;
                    background: white;
                    page-break-after: always;
                    box-sizing: border-box;
                    position: relative;
                }
                h1, h2, h3, p, strong { color: black !important; }
            </style>`;

            doc.open();
            doc.write(`<html><head>${fontTag}${baseStyles}${styleTagsArray.join('\n')}</head><body><div id="capture-root"></div></body></html>`);
            doc.close();

            // Wait for iframe and fonts
            await new Promise(resolve => {
                const checkFonts = () => {
                    if (iframe.contentWindow?.document.fonts) {
                        iframe.contentWindow.document.fonts.ready.then(resolve);
                    } else {
                        setTimeout(resolve, 1500);
                    }
                };
                if (doc.readyState === 'complete') {
                    checkFonts();
                } else {
                    iframe.onload = checkFonts;
                }
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const captureRoot = doc.getElementById('capture-root')!;
            const sourceList = document.getElementById('bulk-print-area')!;

            for (let i = 0; i < selectedRecords.length; i++) {
                const tempDiv = doc.createElement('div');
                tempDiv.className = 'print-record-container';
                captureRoot.appendChild(tempDiv);

                // Clone HTML from our hidden source
                if (sourceList.children[i]) {
                    tempDiv.innerHTML = sourceList.children[i].innerHTML;
                }

                // Render Canvas
                const canvas = await html2canvas(tempDiv, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    width: 794, // 210mm at 96dpi
                    backgroundColor: '#ffffff',
                    windowWidth: 794
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                if (i > 0) pdf.addPage();

                // Position image at top of page
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

                // Cleanup temp div
                captureRoot.removeChild(tempDiv);
            }

            pdf.save(`eRPH_Pilihan_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.removeChild(iframe);
            setIsGeneratingPDF(false);
            setSelectedIds([]); // Reset selection

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
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
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

            {/* Hidden Print Area for DOM Source */}
            <div id="bulk-print-area" style={{ display: 'none' }}>
                {selectedRecords.map((rec) => (
                    <RPHPrintLayout
                        key={rec.id}
                        record={rec}
                        minHeight="297mm"
                    />
                ))}
            </div>
        </React.Fragment >
    );
};
