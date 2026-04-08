import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, CheckCircle } from 'lucide-react';

interface PDFReadyModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string | null;
    fileName: string;
}

export const PDFReadyModal: React.FC<PDFReadyModalProps> = ({ isOpen, onClose, pdfUrl, fileName }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const downloadButtonRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Focus download button when modal opens
            setTimeout(() => {
                downloadButtonRef.current?.focus();
            }, 100);

            // Simple focus trap
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Tab') {
                    const focusableElements = modalRef.current?.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (!focusableElements) return;

                    const firstElement = focusableElements[0] as HTMLElement;
                    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                } else if (e.key === 'Escape') {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div 
                className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-sm glass-modern p-8 text-center overflow-hidden border-white/20"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }}
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                    
                    <button 
                        onClick={onClose}
                        aria-label="Tutup"
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white/50 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full text-emerald-600">
                        <CheckCircle size={40} strokeWidth={1.5} />
                    </div>

                    <h3 id="modal-title" className="text-2xl font-black text-slate-800 mb-2">PDF Sedia!</h3>
                    <p className="text-slate-600 mb-8 font-medium">
                        Fail eRPH anda telah berjaya dijana dan sedia untuk dimuat turun.
                    </p>

                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 mb-8 flex items-center gap-3 text-left border border-white/40 shadow-sm">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                            <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Fail</p>
                            <p className="text-sm font-semibold text-slate-700 truncate">{fileName}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <a
                            ref={downloadButtonRef}
                            href={pdfUrl || '#'}
                            download={fileName}
                            onClick={() => {
                                // Close modal after a small delay to allow download to start
                                setTimeout(onClose, 1000);
                            }}
                            className="btn btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] min-h-[44px]"
                        >
                            <Download size={20} /> Muat Turun Sekarang
                        </a>
                        <button
                            onClick={onClose}
                            className="btn btn-outline w-full py-3 bg-white min-h-[44px]"
                        >
                            Tutup
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
