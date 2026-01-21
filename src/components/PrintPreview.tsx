import { X, Printer, Download } from 'lucide-react';
import type { RPHRecord } from '../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { RPHPrintLayout } from './RPHPrintLayout';

interface PrintPreviewProps {
    record: RPHRecord;
    onClose: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ record, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('print-area');
        if (!element) return;

        const opt = {
            margin: 0,
            filename: `eRPH_${record.tarikh}_${record.kelas.replace(/ /g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        } as any;

        html2pdf().set(opt).from(element).save();
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
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-outline" onClick={handleDownloadPDF} title="Muat Turun (PDF)">
                            <Download size={18} /> Muat Turun PDF
                        </button>
                        <button className="btn btn-primary" onClick={handlePrint}><Printer size={18} /> Cetak</button>
                    </div>
                </div>

                <div id="print-area" className="print-content">
                    <RPHPrintLayout record={record} minHeight="10in" />
                </div>
            </div>
        </div>
    );
};
