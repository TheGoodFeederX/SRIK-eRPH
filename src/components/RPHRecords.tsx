import React, { useState } from 'react';
import { Edit2, Trash2, Search, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RPHRecord } from '../types';
import * as XLSX from 'xlsx';

interface RPHRecordsProps {
    records: RPHRecord[];
    loading?: boolean;
    onDelete: (id: string) => void;
    onEdit: (record: RPHRecord) => void;
}

export const RPHRecords: React.FC<RPHRecordsProps> = ({ records, loading, onDelete, onEdit }) => {
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

    return (
        <React.Fragment>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }} className="records-header">
                    <h2 style={{ color: 'var(--primary)', margin: 0 }}>Senarai Rekod</h2>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: '100%', justifyContent: 'space-between' }} className="records-actions">
                        <button
                            className="btn btn-outline"
                            onClick={handleDownloadAll}
                            disabled={filteredRecords.length === 0}
                            title="Muat Turun Semua (Excel)"
                            style={{ flexShrink: 0 }}
                        >
                            <Download size={18} /> <span className="btn-text">Excel</span>
                        </button>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="text"
                                placeholder="Cari..."
                                style={{ paddingLeft: '2.5rem' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <style>{`
                        @media (min-width: 768px) {
                            .records-actions { width: auto !important; }
                            .records-header h2 { font-size: 1.5rem; }
                            .btn-text { display: inline !important; }
                            .records-actions input { width: 300px !important; }
                        }
                        @media (max-width: 767px) {
                            .btn-text { display: none; }
                            .records-actions .btn { padding: 0.75rem !important; width: 42px; justify-content: center; }
                        }
                    `}</style>
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

            {/* PDF Functionality Removed */}
        </React.Fragment >
    );
};
