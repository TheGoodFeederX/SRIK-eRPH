import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RefreshCw, ChevronDown, X, ArrowLeft } from 'lucide-react';
import type { RPHRecord } from '../types';
import { supabase } from '../lib/supabaseClient';

interface RPHFormProps {
    onSubmit: (record: Omit<RPHRecord, 'id'>) => void;
    onCancel?: () => void;
    initialData?: RPHRecord;
}

const HARI_OPTIONS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

// Time slot options for Masa field
const MASA_OPTIONS = [
    '07.30-08.05',
    '08.05-08.40',
    '08.40-09.15',
    '09.15-09.50',
    '10.25-11.00',
    '11.00-11.35',
    '11.35-12.10',
    '12.10-12.45',
    '12.45-13.20',
    '14.00-14.30'
];

// Mapping Tahun to specific Kelas
const KELAS_MAP: Record<number, string[]> = {
    1: ['1 Al-Junaidi', '1 Al-Busiri'],
    2: ['2 Al-Junaidi', '2 Al-Busiri'],
    3: ['3 Al-Junaidi', '3 Al-Busiri'],
    4: ['4 Al-Junaidi', '4 Al-Busiri'],
    5: ['5 Al-Junaidi', '5 Al-Busiri'],
    6: ['6 Naim']
};

const getMalayDay = (dateString: string) => {
    const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    if (!dateString) return '';
    const date = new Date(dateString);
    return days[date.getDay()];
};

export const RPHForm: React.FC<RPHFormProps> = ({ onSubmit, onCancel, initialData }) => {
    const initialDate = initialData?.tarikh || new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState<Omit<RPHRecord, 'id'>>({
        tarikh: initialDate,
        hari: initialData?.hari || getMalayDay(initialDate),
        kelas: initialData?.kelas || '',
        masa: initialData?.masa || '',
        subjek: initialData?.subjek || '',
        tajukStandardKandungan: initialData?.tajukStandardKandungan || '',
        objektif: initialData?.objektif || '',
        aktiviti: initialData?.aktiviti || '',
        refleksi: initialData?.refleksi || '',
    });

    const [subjects, setSubjects] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | ''>(() => {
        if (initialData?.kelas) {
            const match = initialData.kelas.match(/^(\d+)/);
            return match ? parseInt(match[1]) : '';
        }
        return '';
    });
    const [availableSK, setAvailableSK] = useState<string[]>([]);
    // Track selected masa values for checkbox dropdown
    const [selectedMasa, setSelectedMasa] = useState<string[]>(() => {
        if (initialData?.masa) {
            return initialData.masa.split(',').map(m => m.trim()).filter(m => m);
        }
        return [];
    });
    const [isMasaDropdownOpen, setIsMasaDropdownOpen] = useState(false);
    const masaDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch initial data for Subjects and Years
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: subjekData } = await supabase.rpc('get_unique_subjects');
            if (subjekData) setSubjects(subjekData.map((d: any) => d.subjek));

            const { data: tahunData } = await supabase.rpc('get_unique_years');
            if (tahunData) setYears(tahunData.map((d: any) => d.tahun));
        };
        fetchInitialData();
    }, []);

    // Fetch SK based on subject and year
    useEffect(() => {
        const fetchSK = async () => {
            if (!formData.subjek || selectedYear === '') {
                setAvailableSK([]);
                return;
            }

            const { data } = await supabase
                .from('referensi_rph')
                .select('sk')
                .eq('subjek', formData.subjek)
                .eq('tahun', selectedYear)
                .order('sk', { ascending: true });

            if (data) {
                setAvailableSK([...new Set(data.map(d => d.sk))].sort());
            }
        };

        fetchSK();
    }, [formData.subjek, selectedYear]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'tarikh') {
            setFormData(prev => ({ ...prev, tarikh: value, hari: getMalayDay(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleMasaToggle = (masa: string) => {
        setSelectedMasa(prev => {
            const newSelection = prev.includes(masa)
                ? prev.filter(m => m !== masa)
                : [...prev, masa];
            // Store multiple selections as comma-separated string
            setFormData(formPrev => ({ ...formPrev, masa: newSelection.join(', ') }));
            return newSelection;
        });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (masaDropdownRef.current && !masaDropdownRef.current.contains(event.target as Node)) {
                setIsMasaDropdownOpen(false);
            }
        };

        if (isMasaDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMasaDropdownOpen]);

    // PDF Functionality Removed
    const handleSubmit = (e: React.FormEvent) => {

        e.preventDefault();
        onSubmit(formData);
        if (!initialData) {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                tarikh: today,
                hari: getMalayDay(today),
                kelas: '',
                masa: '',
                subjek: '',
                tajukStandardKandungan: '',
                objektif: '',
                aktiviti: '',
                refleksi: '',
            });
            setSelectedMasa([]);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
        >
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={24} /> {initialData ? 'Kemaskini Rekod' : 'Rekod Pengajaran Harian Baru'}
            </h2>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div className="input-group">
                        <label htmlFor="tarikh">Tarikh</label>
                        <input type="date" id="tarikh" name="tarikh" value={formData.tarikh} onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label htmlFor="hari">Hari</label>
                        <select id="hari" name="hari" value={formData.hari} onChange={handleChange} required>
                            {HARI_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="tahun">Tahun</label>
                        <select
                            id="tahun"
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(Number(e.target.value));
                                setFormData(prev => ({ ...prev, kelas: '' }));
                            }}
                            required
                        >
                            <option value="">Pilih Tahun</option>
                            {years.map(y => <option key={y} value={y}>Tahun {y}</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="kelas">Kelas</label>
                        <select id="kelas" name="kelas" value={formData.kelas} onChange={handleChange} required disabled={!selectedYear}>
                            <option value="">Pilih Kelas</option>
                            {selectedYear && KELAS_MAP[selectedYear as number]?.map(k => (
                                <option key={k} value={k}>{k}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group" style={{ position: 'relative' }}>
                        <label htmlFor="masa">Masa</label>
                        <div ref={masaDropdownRef} style={{ position: 'relative', width: '100%' }}>
                            <div
                                onClick={() => setIsMasaDropdownOpen(!isMasaDropdownOpen)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    minHeight: '42px',
                                    fontSize: '1rem',
                                    color: selectedMasa.length > 0 ? 'var(--text-main)' : 'var(--text-muted)'
                                }}
                            >
                                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {selectedMasa.length > 0 ? (
                                        selectedMasa.map(masa => (
                                            <span
                                                key={masa}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: 'var(--primary)',
                                                    color: 'white',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMasaToggle(masa);
                                                }}
                                            >
                                                {masa}
                                                <X size={14} />
                                            </span>
                                        ))
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>Pilih masa</span>
                                    )}
                                </div>
                                <ChevronDown
                                    size={20}
                                    style={{
                                        color: 'var(--text-muted)',
                                        transform: isMasaDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s'
                                    }}
                                />
                            </div>

                            <AnimatePresence>
                                {isMasaDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '0.5rem',
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                            zIndex: 1000,
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            padding: '0.5rem'
                                        }}
                                    >
                                        {MASA_OPTIONS.map(masa => {
                                            const isChecked = selectedMasa.includes(masa);
                                            return (
                                                <div
                                                    key={masa}
                                                    onClick={() => handleMasaToggle(masa)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '0.75rem',
                                                        cursor: 'pointer',
                                                        borderRadius: '0.375rem',
                                                        transition: 'background-color 0.2s',
                                                        backgroundColor: isChecked ? '#f0f9ff' : 'transparent'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isChecked) {
                                                            e.currentTarget.style.backgroundColor = '#f8fafc';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isChecked) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            border: `2px solid ${isChecked ? 'var(--primary)' : '#cbd5e1'}`,
                                                            borderRadius: '0.25rem',
                                                            backgroundColor: isChecked ? 'var(--primary)' : 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {isChecked && (
                                                            <motion.svg
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 14 14"
                                                                fill="none"
                                                            >
                                                                <path
                                                                    d="M11.6667 3.5L5.25 9.91667L2.33334 7"
                                                                    stroke="white"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </motion.svg>
                                                        )}
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.875rem',
                                                        color: 'var(--text-main)',
                                                        userSelect: 'none'
                                                    }}>
                                                        {masa}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {selectedMasa.length === 0 && (
                            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem' }}>
                                Sila pilih sekurang-kurangnya satu masa
                            </p>
                        )}
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="subjek">Subjek</label>
                    <select id="subjek" name="subjek" value={formData.subjek} onChange={handleChange} required>
                        <option value="">Pilih Subjek</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="input-group">
                    <label htmlFor="tajukStandardKandungan" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Tajuk / Standard Kandungan
                    </label>
                    <select
                        id="tajukStandardKandungan"
                        name="tajukStandardKandungan"
                        value={formData.tajukStandardKandungan}
                        onChange={handleChange}
                        required
                        disabled={!formData.subjek || selectedYear === ''}
                    >
                        <option value="">Pilih Tajuk / SK</option>
                        {availableSK.map(sk => <option key={sk} value={sk}>{sk}</option>)}
                    </select>
                    {availableSK.length === 0 && formData.subjek && selectedYear !== '' && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>Tiada data SK ditemui untuk Subjek & Tahun ini.</p>
                    )}
                </div>

                <div className="input-group">
                    <label htmlFor="objektif">Objektif</label>
                    <textarea id="objektif" name="objektif" value={formData.objektif} onChange={handleChange} rows={3} required />
                </div>

                <div className="input-group">
                    <label htmlFor="aktiviti">Aktiviti</label>
                    <textarea id="aktiviti" name="aktiviti" value={formData.aktiviti} onChange={handleChange} rows={4} required />
                </div>

                <div className="input-group">
                    <label htmlFor="refleksi">Refleksi (Opsional)</label>
                    <textarea id="refleksi" name="refleksi" value={formData.refleksi} onChange={handleChange} rows={2} />
                </div>

                <div className="form-actions" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    marginTop: '1.5rem'
                }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        {initialData ? 'Kemaskini' : 'Simpan'}
                    </button>
                    {onCancel && (
                        <button type="button" className="btn btn-outline" onClick={onCancel} style={{ width: '100%', justifyContent: 'center' }}>
                            <ArrowLeft size={18} /> Kembali
                        </button>
                    )}
                    {!initialData && (
                        <button type="button" className="btn btn-outline" onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setFormData({
                                tarikh: today,
                                hari: getMalayDay(today),
                                kelas: '',
                                masa: '',
                                subjek: '',
                                tajukStandardKandungan: '',
                                objektif: '',
                                aktiviti: '',
                                refleksi: '',
                            });
                            setSelectedMasa([]);
                        }} style={{ width: '100%', justifyContent: 'center' }}>
                            <RefreshCw size={18} /> Semula
                        </button>
                    )}

                    <style>{`
                        @media (min-width: 768px) {
                            .form-actions {
                                display: flex !important;
                                grid-template-columns: none !important;
                                gap: 1rem !important;
                            }
                            .form-actions .btn {
                                width: auto !important;
                            }
                        }
                    `}</style>
                </div>
            </form>

            {/* PDF Functionality Removed */}
        </motion.div>
    );
};
