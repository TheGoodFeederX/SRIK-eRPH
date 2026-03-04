import React, { useState } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import type { RPHRecord } from '../types';
import { RPHPrintLayout } from './RPHPrintLayout';

interface PrintPreviewProps {
    record: RPHRecord;
    onClose: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ record, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        try {
            // @ts-ignore
            const { default: jsPDF } = await import('jspdf');
            // @ts-ignore
            const html2canvas = (await import('html2canvas')).default;

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-10000px';
            iframe.style.top = '0';
            iframe.style.width = '210mm';
            iframe.style.height = 'auto';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) throw new Error('Cannot access iframe document');

            // Copy all styles
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
            const sourceInfo = document.getElementById('print-area-content');

            if (sourceInfo) {
                const tempDiv = doc.createElement('div');
                tempDiv.className = 'print-record-container';
                // Fix: Target the inner print-record-container to avoid double nesting/padding
                const innerContainer = sourceInfo.querySelector('.print-record-container');
                if (innerContainer) {
                    tempDiv.innerHTML = innerContainer.innerHTML;
                } else {
                    tempDiv.innerHTML = sourceInfo.innerHTML;
                }
                captureRoot.appendChild(tempDiv);

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

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save(`eRPH_${record.tarikh.replace(/\//g, '-')}_${record.kelas.replace(/ /g, '_')}.pdf`);
            document.body.removeChild(iframe);
            setIsGenerating(false);

        } catch (error) {
            console.error('PDF Generation Error:', error);
            setIsGenerating(false);
            alert('Gagal menjana PDF. Sila cuba lagi.');
        }
    };

    return (
        <div className="print-preview-backdrop" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div className="glass-card print-preview-modal" style={{
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }} className="no-print">
                    <button className="btn btn-outline" onClick={onClose}><X size={18} /> Tutup</button>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {isGenerating && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Menjana PDF...</span>}
                        <button
                            className="btn btn-outline"
                            onClick={handleDownloadPDF}
                            title="Muat Turun (PDF)"
                            disabled={isGenerating}
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            Muat Turun PDF
                        </button>
                        <button className="btn btn-primary" onClick={handlePrint}><Printer size={18} /> Cetak</button>
                    </div>
                </div>

                <div id="print-area" className="print-content">
                    {/* Wrapped in a div we can target for innerHTML cloning */}
                    <div id="print-area-content">
                        <RPHPrintLayout record={record} minHeight="297mm" />
                    </div>
                </div>
            </div>
        </div>
    );
};
