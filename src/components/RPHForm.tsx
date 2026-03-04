import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ChevronDown, X, Printer, ArrowLeft, AlertCircle } from 'lucide-react';
import type { RPHRecord } from '../types';
import { supabase } from '../lib/supabaseClient';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { RPHPrintLayout } from './RPHPrintLayout';

interface RPHFormProps {
    onSubmit: (record: Omit<RPHRecord, 'id'>) => Promise<void>;
    onCancel?: () => void;
    initialData?: RPHRecord;
}

const HARI_OPTIONS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

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
    
    // Flatten initialData for the form state
    const [formData, setFormData] = useState({
        tarikh: initialDate,
        hari: initialData?.hari || getMalayDay(initialDate),
        kelas: initialData?.kelas || '',
        masa: initialData?.masa || '',
        subjek: initialData?.subjek || '',
        bidang: initialData?.content?.bidang || '',
        tajukStandardKandungan: initialData?.content?.tajukStandardKandungan || '',
        objektif: initialData?.content?.objektif || '',
        aktiviti: initialData?.content?.aktiviti || '',
        refleksi: initialData?.content?.refleksi || '',
        sp: initialData?.content?.sp || [] as string[],
        spi: initialData?.content?.spi || [] as Array<{ tp: number; desc: string }>,
    });

    const [subjects, setSubjects] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | ''>('');
    
    // DSKP Hierarchical data
    const [availableBidang, setAvailableBidang] = useState<string[]>([]);
    const [availableSK, setAvailableSK] = useState<string[]>([]);
    const [availableSP, setAvailableSP] = useState<string[]>([]);
    const [availableSPI, setAvailableSPI] = useState<Array<{ tp: number; desc: string }>>([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMasaDropdownOpen, setIsMasaDropdownOpen] = useState(false);
    const masaDropdownRef = useRef<HTMLDivElement>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);

    // Initial data fetch
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const { data: subjekData } = await supabase.rpc('get_unique_subjects');
                if (subjekData) setSubjects(subjekData.map((d: any) => d.subjek));

                const { data: tahunData } = await supabase.rpc('get_unique_years');
                if (tahunData) setYears(tahunData.map((d: any) => d.tahun));
            } catch (err) {
                console.error('Error fetching metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    // Fetch Bidang when subjek or year changes
    useEffect(() => {
        const fetchBidang = async () => {
            if (!formData.subjek || selectedYear === '') {
                setAvailableBidang([]);
                return;
            }

            const { data } = await supabase
                .from('referensi_rph')
                .select('bidang')
                .eq('subjek', formData.subjek)
                .eq('tahun', selectedYear);

            if (data) {
                const uniqueBidang = [...new Set(data.map(d => d.bidang || ''))].filter(Boolean).sort();
                setAvailableBidang(uniqueBidang);
            }
        };
        fetchBidang();
    }, [formData.subjek, selectedYear]);

    // Fetch SK when bidang changes
    useEffect(() => {
        const fetchSK = async () => {
            if (!formData.subjek || selectedYear === '' || !formData.bidang) {
                setAvailableSK([]);
                return;
            }

            const { data } = await supabase
                .from('referensi_rph')
                .select('sk')
                .eq('subjek', formData.subjek)
                .eq('tahun', selectedYear)
                .eq('bidang', formData.bidang);

            if (data) {
                setAvailableSK([...new Set(data.map(d => d.sk))].sort());
            }
        };
        fetchSK();
    }, [formData.subjek, selectedYear, formData.bidang]);

    // Fetch SP & SPI when SK changes
    useEffect(() => {
        const fetchSP_SPI = async () => {
            if (!formData.subjek || selectedYear === '' || !formData.bidang || !formData.tajukStandardKandungan) {
                setAvailableSP([]);
                setAvailableSPI([]);
                return;
            }

            const { data } = await supabase
                .from('referensi_rph')
                .select('sp, spi')
                .eq('subjek', formData.subjek)
                .eq('tahun', selectedYear)
                .eq('bidang', formData.bidang)
                .eq('sk', formData.tajukStandardKandungan)
                .single();

            if (data) {
                setAvailableSP(data.sp || []);
                setAvailableSPI(data.spi || []);
            }
        };
        fetchSP_SPI();
    }, [formData.subjek, selectedYear, formData.bidang, formData.tajukStandardKandungan]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'tarikh') {
            setFormData(prev => ({ ...prev, tarikh: value, hari: getMalayDay(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setError(null);
    };

    const handleMultiSelect = (name: 'sp' | 'spi', value: any) => {
        setFormData(prev => {
            const current = prev[name] as any[];
            const exists = current.find(item => 
                name === 'spi' ? (item.tp === value.tp && item.desc === value.desc) : item === value
            );
            
            const next = exists 
                ? current.filter(item => name === 'spi' ? (item.tp !== value.tp || item.desc !== value.desc) : item !== value)
                : [...current, value];
            
            return { ...prev, [name]: next };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const recordToSubmit: Omit<RPHRecord, 'id'> = {
                tarikh: formData.tarikh,
                hari: formData.hari,
                kelas: formData.kelas,
                masa: formData.masa,
                subjek: formData.subjek,
                user_id: initialData?.user_id || '',
                content: {
                    bidang: formData.bidang,
                    tajukStandardKandungan: formData.tajukStandardKandungan,
                    objektif: formData.objektif,
                    aktiviti: formData.aktiviti,
                    refleksi: formData.refleksi,
                    sp: formData.sp,
                    spi: formData.spi,
                }
            };

            await onSubmit(recordToSubmit);
            
            if (!initialData) {
                // Reset form
                const today = new Date().toISOString().split('T')[0];
                setFormData({
                    tarikh: today,
                    hari: getMalayDay(today),
                    kelas: '',
                    masa: '',
                    subjek: '',
                    bidang: '',
                    tajukStandardKandungan: '',
                    objektif: '',
                    aktiviti: '',
                    refleksi: '',
                    sp: [],
                    spi: [],
                });
                setSelectedYear('');
            }
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan rekod. Sila cuba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleMasaToggle = (masa: string) => {
        const currentMasa = formData.masa.split(',').map(m => m.trim()).filter(Boolean);
        const newMasa = currentMasa.includes(masa)
            ? currentMasa.filter(m => m !== masa)
            : [...currentMasa, masa];
        setFormData(prev => ({ ...prev, masa: newMasa.join(', ') }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: '2rem' }}
        >
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={24} /> {initialData ? 'Kemaskini Rekod' : 'Rekod Pengajaran Harian Baru'}
            </h2>

            {error && (
                <div style={{ 
                    backgroundColor: '#fee2e2', 
                    border: '1px solid #ef4444', 
                    color: '#b91c1c', 
                    padding: '1rem', 
                    borderRadius: '0.5rem', 
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

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
                                setFormData(prev => ({ ...prev, kelas: '', bidang: '', tajukStandardKandungan: '', sp: [], spi: [] }));
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
                                className="custom-select-trigger"
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
                                    minHeight: '42px'
                                }}
                            >
                                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {formData.masa ? (
                                        formData.masa.split(', ').map(m => (
                                            <span key={m} className="tag-primary">{m} <X size={12} onClick={(e) => { e.stopPropagation(); handleMasaToggle(m); }} /></span>
                                        ))
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>Pilih masa</span>
                                    )}
                                </div>
                                <ChevronDown size={20} />
                            </div>

                            <AnimatePresence>
                                {isMasaDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="dropdown-menu"
                                    >
                                        {MASA_OPTIONS.map(masa => {
                                            const isChecked = formData.masa.includes(masa);
                                            return (
                                                <div key={masa} onClick={() => handleMasaToggle(masa)} className={`dropdown-item ${isChecked ? 'selected' : ''}`}>
                                                    <div className={`checkbox ${isChecked ? 'checked' : ''}`} />
                                                    <span>{masa}</span>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="subjek">Subjek</label>
                    <select id="subjek" name="subjek" value={formData.subjek} onChange={handleChange} required>
                        <option value="">Pilih Subjek</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* DSKP Hierarchy Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <div className="input-group">
                        <label htmlFor="bidang">Bidang</label>
                        <select 
                            id="bidang" 
                            name="bidang" 
                            value={formData.bidang} 
                            onChange={handleChange} 
                            disabled={!formData.subjek || selectedYear === ''}
                            required
                        >
                            <option value="">Pilih Bidang</option>
                            {availableBidang.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="tajukStandardKandungan">Standard Kandungan (SK)</label>
                        <select
                            id="tajukStandardKandungan"
                            name="tajukStandardKandungan"
                            value={formData.tajukStandardKandungan}
                            onChange={handleChange}
                            required
                            disabled={!formData.bidang}
                        >
                            <option value="">Pilih SK</option>
                            {availableSK.map(sk => <option key={sk} value={sk}>{sk}</option>)}
                        </select>
                    </div>
                </div>

                <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label>Standard Pembelajaran (SP)</label>
                    <div className="multi-select-container">
                        {availableSP.length > 0 ? (
                            availableSP.map(sp => {
                                const isSelected = formData.sp.includes(sp);
                                return (
                                    <div 
                                        key={sp} 
                                        className={`multi-select-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleMultiSelect('sp', sp)}
                                    >
                                        <div className={`checkbox ${isSelected ? 'checked' : ''}`} />
                                        <span style={{ fontSize: '0.9rem' }}>{sp}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>Pilih SK terlebih dahulu.</p>
                        )}
                    </div>
                </div>

                <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label>Standard Prestasi (SPI)</label>
                    <div className="multi-select-container">
                        {availableSPI.length > 0 ? (
                            availableSPI.map((spi, idx) => {
                                const isSelected = formData.spi.some(item => item.tp === spi.tp && item.desc === spi.desc);
                                return (
                                    <div 
                                        key={`${spi.tp}-${idx}`} 
                                        className={`multi-select-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleMultiSelect('spi', spi)}
                                    >
                                        <div className={`checkbox ${isSelected ? 'checked' : ''}`} />
                                        <span style={{ fontSize: '0.9rem' }}><strong>TP{spi.tp}:</strong> {spi.desc}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>Pilih SK terlebih dahulu.</p>
                        )}
                    </div>
                </div>

                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                    <label htmlFor="objektif">Objektif</label>
                    <textarea id="objektif" name="objektif" value={formData.objektif} onChange={handleChange} rows={3} required className="font-jawi" />
                </div>

                <div className="input-group">
                    <label htmlFor="aktiviti">Aktiviti</label>
                    <textarea id="aktiviti" name="aktiviti" value={formData.aktiviti} onChange={handleChange} rows={4} required className="font-jawi" />
                </div>

                <div className="input-group">
                    <label htmlFor="refleksi">Refleksi (Opsional)</label>
                    <textarea id="refleksi" name="refleksi" value={formData.refleksi} onChange={handleChange} rows={2} className="font-jawi" />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Menyimpan...' : (initialData ? 'Kemaskini' : 'Simpan Rekod')}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowPrintModal(true)} title="Pratonton & Muat Turun">
                        <Printer size={18} /> Pratonton
                    </button>
                    {onCancel && (
                        <button type="button" className="btn btn-outline" onClick={onCancel}>
                            <ArrowLeft size={18} /> Kembali
                        </button>
                    )}
                </div>
            </form>

            {/* Print Preview Modal */}
            {showPrintModal && (
                <div className="print-preview-backdrop" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{
                        backgroundColor: 'white', width: '100%', maxWidth: '800px',
                        maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <button className="btn btn-outline" onClick={() => setShowPrintModal(false)}><X size={18} /> Tutup</button>
                            <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Cetak</button>
                        </div>
                        <RPHPrintLayout record={{ 
                            ...formData, 
                            id: 'temp', 
                            user_id: initialData?.user_id || '',
                            content: { 
                                bidang: formData.bidang,
                                tajukStandardKandungan: formData.tajukStandardKandungan,
                                objektif: formData.objektif,
                                aktiviti: formData.aktiviti,
                                refleksi: formData.refleksi,
                                sp: formData.sp,
                                spi: formData.spi
                            } 
                        }} />
                    </div>
                </div>
            )}
        </motion.div>
    );
};
