import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ChevronDown, X, Printer, ArrowLeft, AlertCircle, Download, Loader2 } from 'lucide-react';
import type { RPHRecord } from '../types';
import { supabase } from '../lib/supabaseClient';
import { RPHPrintLayout } from './RPHPrintLayout';
import { generateRPH_PDF } from '../lib/pdfGenerator';
import { PDFReadyModal } from './PDFReadyModal';
import { WizardStepper } from './WizardStepper';

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

const DRAFT_KEY = 'erph_form_draft';

export const RPHForm: React.FC<RPHFormProps> = ({ onSubmit, onCancel, initialData }) => {
    const initialDate = initialData?.tarikh || new Date().toISOString().split('T')[0];
    
    // Form steps: 1: Maklumat Asas, 2: DSKP & Standard, 3: Kandungan PdPC, 4: Semakan
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

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
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [pdfModalData, setPdfModalData] = useState<{ isOpen: boolean; url: string | null; fileName: string }>({
        isOpen: false,
        url: null,
        fileName: ''
    });

    const firstFieldRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

    // Initial data fetch
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const { data: subjekData } = await supabase.rpc('get_unique_subjects');
                if (subjekData) setSubjects((subjekData as Array<{ subjek: string }>).map((d) => d.subjek));

                const { data: tahunData } = await supabase.rpc('get_unique_years');
                if (tahunData) setYears((tahunData as Array<{ tahun: number }>).map((d) => d.tahun));
            } catch (err) {
                console.error('Error fetching metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    // Load draft on mount
    useEffect(() => {
        if (!initialData) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setFormData(prev => ({ ...prev, ...parsed.formData }));
                    setSelectedYear(parsed.selectedYear);
                    setCurrentStep(parsed.currentStep || 1);
                } catch (e) {
                    console.error('Failed to parse draft', e);
                }
            }
        }
    }, [initialData]);

    // Save draft on change
    useEffect(() => {
        if (!initialData) {
            const draft = { formData, selectedYear, currentStep };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        }
    }, [formData, selectedYear, currentStep, initialData]);

    // Focus management on step change
    useEffect(() => {
        if (firstFieldRef.current) {
            firstFieldRef.current.focus();
        }
    }, [currentStep]);

    // Validation for each step
    const validateStep = (step: number) => {
        switch (step) {
            case 1:
                if (!formData.tarikh || !formData.hari || !selectedYear || !formData.kelas || !formData.masa || !formData.subjek) {
                    setError('Sila lengkapkan semua maklumat asas.');
                    return false;
                }
                return true;
            case 2:
                if (!formData.tajukStandardKandungan || formData.sp.length === 0) {
                    setError('Sila pilih Standard Kandungan dan sekurang-kurangnya satu Standard Pembelajaran.');
                    return false;
                }
                return true;
            case 3:
                if (!formData.objektif || !formData.aktiviti) {
                    setError('Sila lengkapkan objektif dan aktiviti pembelajaran.');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setError(null);
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        setError(null);
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo(0, 0);
    };

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
            if (!formData.subjek || selectedYear === '') {
                setAvailableSK([]);
                return;
            }

            // If bidang is required (availableBidang not empty) but not selected, don't fetch
            if (availableBidang.length > 0 && !formData.bidang) {
                setAvailableSK([]);
                return;
            }

            let query = supabase
                .from('referensi_rph')
                .select('sk')
                .eq('subjek', formData.subjek)
                .eq('tahun', selectedYear);

            if (formData.bidang) {
                query = query.eq('bidang', formData.bidang);
            } else {
                query = query.is('bidang', null);
            }

            const { data } = await query;

            if (data) {
                setAvailableSK([...new Set(data.map(d => d.sk))].sort());
            }
        };
        fetchSK();
    }, [formData.subjek, selectedYear, formData.bidang, availableBidang]);

    // Fetch SP & SPI when SK changes
    useEffect(() => {
        const fetchSP_SPI = async () => {
            if (!formData.subjek || selectedYear === '' || !formData.tajukStandardKandungan) {
                setAvailableSP([]);
                setAvailableSPI([]);
                return;
            }

            // If bidang is required but not selected
            if (availableBidang.length > 0 && !formData.bidang) {
                setAvailableSP([]);
                setAvailableSPI([]);
                return;
            }

            let query = supabase
                .from('referensi_rph')
                .select('sp, spi')
                .eq('subjek', formData.subjek)
                .eq('tahun', selectedYear)
                .eq('sk', formData.tajukStandardKandungan);

            if (formData.bidang) {
                query = query.eq('bidang', formData.bidang);
            } else {
                query = query.is('bidang', null);
            }

            const { data } = await query.maybeSingle();

            if (data) {
                setAvailableSP(data.sp || []);
                setAvailableSPI(data.spi || []);
            }
        };
        fetchSP_SPI();
    }, [formData.subjek, selectedYear, formData.bidang, formData.tajukStandardKandungan, availableBidang]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'tarikh') {
            setFormData(prev => ({ ...prev, tarikh: value, hari: getMalayDay(value) }));
        } else if (name === 'subjek') {
            setFormData(prev => ({
                ...prev,
                subjek: value,
                bidang: '',
                tajukStandardKandungan: '',
                sp: [],
                spi: [],
            }));
        } else if (name === 'bidang') {
            setFormData(prev => ({
                ...prev,
                bidang: value,
                tajukStandardKandungan: '',
                sp: [],
                spi: [],
            }));
        } else if (name === 'tajukStandardKandungan') {
            setFormData(prev => ({
                ...prev,
                tajukStandardKandungan: value,
                sp: [],
                spi: [],
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setError(null);
    };

    const handleMultiSelect = (name: 'sp' | 'spi', value: string | { tp: number; desc: string }) => {
        setFormData(prev => {
            if (name === 'sp') {
                const current = prev.sp;
                const val = value as string;
                const exists = current.includes(val);
                const next = exists ? current.filter(item => item !== val) : [...current, val];
                return { ...prev, sp: next };
            } else {
                const current = prev.spi;
                const val = value as { tp: number; desc: string };
                const exists = current.find(item => item.tp === val.tp && item.desc === val.desc);
                const next = exists 
                    ? current.filter(item => item.tp !== val.tp || item.desc !== val.desc)
                    : [...current, val];
                return { ...prev, spi: next };
            }
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
            
            // Clear draft
            localStorage.removeItem(DRAFT_KEY);

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
                setCurrentStep(1);
            }
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || 'Gagal menyimpan rekod. Sila cuba lagi.');
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

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const recordToGenerate: RPHRecord = {
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
            };
            const blob = await generateRPH_PDF(recordToGenerate);
            const url = URL.createObjectURL(blob);
            const fileName = `eRPH_${formData.tarikh}_${formData.kelas.replace(/ /g, '_')}.pdf`;

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '2rem' }}
            >
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={24} /> {initialData ? 'Kemaskini Rekod' : 'Rekod Pengajaran Harian Baru'}
            </h2>

            {/* Stepper */}
            <WizardStepper 
                steps={[
                    { step: 1, label: 'Maklumat Asas' },
                    { step: 2, label: 'DSKP & Standard' },
                    { step: 3, label: 'Kandungan PdPC' },
                    { step: 4, label: 'Semakan' }
                ]}
                currentStep={currentStep}
                onStepClick={(step) => {
                    if (step < currentStep) setCurrentStep(step);
                    else if (validateStep(currentStep)) setCurrentStep(step);
                }}
            />

            {error && (
                <div 
                    id="form-error"
                    role="alert"
                    style={{ 
                        backgroundColor: '#fee2e2', 
                        border: '1px solid #ef4444', 
                        color: '#b91c1c', 
                        padding: '1rem', 
                        borderRadius: '0.5rem', 
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} aria-describedby={error ? "form-error" : undefined}>
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="input-group">
                                    <label htmlFor="tarikh">Tarikh</label>
                                    <input 
                                        type="date" 
                                        id="tarikh" 
                                        name="tarikh" 
                                        value={formData.tarikh} 
                                        onChange={handleChange} 
                                        required 
                                        ref={firstFieldRef as any}
                                    />
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
                                    <label id="label-masa">Masa</label>
                                    <div ref={masaDropdownRef} style={{ position: 'relative', width: '100%' }}>
                                        <button
                                            type="button"
                                            id="masa-trigger"
                                            aria-haspopup="listbox"
                                            aria-expanded={isMasaDropdownOpen}
                                            aria-labelledby="label-masa"
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
                                                minHeight: '48px'
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
                                        </button>

                                        <AnimatePresence>
                                            {isMasaDropdownOpen && (
                                                <motion.div
                                                    role="listbox"
                                                    aria-labelledby="label-masa"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="dropdown-menu"
                                                >
                                                    {MASA_OPTIONS.map(masa => {
                                                        const isChecked = formData.masa.includes(masa);
                                                        return (
                                                            <div 
                                                                key={masa} 
                                                                role="option"
                                                                aria-selected={isChecked}
                                                                onClick={() => handleMasaToggle(masa)} 
                                                                className={`dropdown-item ${isChecked ? 'selected' : ''}`}
                                                                style={{ minHeight: '44px' }}
                                                            >
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

                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label htmlFor="subjek">Subjek</label>
                                <select id="subjek" name="subjek" value={formData.subjek} onChange={handleChange} required>
                                    <option value="">Pilih Subjek</option>
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* DSKP Hierarchy Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="input-group">
                                    <label htmlFor="bidang">Bidang</label>
                                    <select 
                                        id="bidang" 
                                        name="bidang" 
                                        value={formData.bidang} 
                                        onChange={handleChange} 
                                        disabled={!formData.subjek || selectedYear === '' || availableBidang.length === 0}
                                        required={availableBidang.length > 0}
                                        ref={firstFieldRef as any}
                                    >
                                        <option value="">{availableBidang.length === 0 ? 'Tiada Bidang' : 'Pilih Bidang'}</option>
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
                                        disabled={availableBidang.length > 0 ? !formData.bidang : (!formData.subjek || selectedYear === '')}
                                    >
                                        <option value="">Pilih SK</option>
                                        {availableSK.map(sk => <option key={sk} value={sk}>{sk}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label id="label-sp" style={{ marginBottom: 0 }}>Standard Pembelajaran (SP)</label>
                                    {availableSP.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: '32px' }}
                                                onClick={() => setFormData(prev => ({ ...prev, sp: availableSP }))}
                                            >
                                                Pilih Semua
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: '32px' }}
                                                onClick={() => setFormData(prev => ({ ...prev, sp: [] }))}
                                            >
                                                Kosongkan
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="multi-select-container" role="listbox" aria-labelledby="label-sp" aria-multiselectable="true">
                                    {availableSP.length > 0 ? (
                                        availableSP.map(sp => {
                                            const isSelected = formData.sp.includes(sp);
                                            return (
                                                <div 
                                                    key={sp} 
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    className={`multi-select-item ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleMultiSelect('sp', sp)}
                                                    style={{ minHeight: '44px' }}
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label id="label-spi" style={{ marginBottom: 0 }}>Standard Prestasi (SPI)</label>
                                    {availableSPI.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: '32px' }}
                                                onClick={() => setFormData(prev => ({ ...prev, spi: availableSPI }))}
                                            >
                                                Pilih Semua
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: '32px' }}
                                                onClick={() => setFormData(prev => ({ ...prev, spi: [] }))}
                                            >
                                                Kosongkan
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="multi-select-container" role="listbox" aria-labelledby="label-spi" aria-multiselectable="true">
                                    {availableSPI.length > 0 ? (
                                        availableSPI.map((spi, idx) => {
                                            const isSelected = formData.spi.some(item => item.tp === spi.tp && item.desc === spi.desc);
                                            return (
                                                <div 
                                                    key={`${spi.tp}-${idx}`} 
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    className={`multi-select-item ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleMultiSelect('spi', spi)}
                                                    style={{ minHeight: '44px' }}
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
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="input-group">
                                <label htmlFor="objektif">Objektif</label>
                                <textarea 
                                    id="objektif" 
                                    name="objektif" 
                                    value={formData.objektif} 
                                    onChange={handleChange} 
                                    rows={3} 
                                    required 
                                    className="font-jawi" 
                                    ref={firstFieldRef as any}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="aktiviti">Aktiviti</label>
                                <textarea id="aktiviti" name="aktiviti" value={formData.aktiviti} onChange={handleChange} rows={4} required className="font-jawi" />
                            </div>

                            <div className="input-group">
                                <label htmlFor="refleksi">Refleksi (Opsional)</label>
                                <textarea id="refleksi" name="refleksi" value={formData.refleksi} onChange={handleChange} rows={2} className="font-jawi" />
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="summary-card" style={{ 
                                backgroundColor: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '0.5rem', 
                                padding: '1.5rem' 
                            }}>
                                <h3 id="summary-title" style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Semakan Rekod</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" tabIndex={0} ref={firstFieldRef as any}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Tarikh & Masa</p>
                                        <p>{formData.tarikh} ({formData.hari})</p>
                                        <p>{formData.masa}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Kelas & Subjek</p>
                                        <p>{formData.kelas}</p>
                                        <p>{formData.subjek} (Tahun {selectedYear})</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>DSKP</p>
                                    {formData.bidang && <p><strong>Bidang:</strong> {formData.bidang}</p>}
                                    <p><strong>SK:</strong> {formData.tajukStandardKandungan}</p>
                                    <p><strong>SP:</strong> {formData.sp.join(', ')}</p>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Kandungan</p>
                                    <div className="font-jawi" style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                                        <strong>Objektif:</strong><br />
                                        {formData.objektif}
                                    </div>
                                </div>
                                
                                <p style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic', marginTop: '2rem' }}>
                                    Sila pastikan semua maklumat adalah betul sebelum menyimpan.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {currentStep > 1 ? (
                            <button type="button" className="btn btn-outline" style={{ minHeight: '48px' }} onClick={prevStep}>
                                <ArrowLeft size={18} className="rtl-mirror" /> Kembali
                            </button>
                        ) : (
                            onCancel && (
                                <button type="button" className="btn btn-outline" style={{ minHeight: '48px' }} onClick={onCancel}>
                                    <X size={18} /> Batal
                                </button>
                            )
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {currentStep < totalSteps ? (
                            <button type="button" className="btn btn-primary" style={{ minHeight: '48px' }} onClick={nextStep}>
                                Seterusnya
                            </button>
                        ) : (
                            <>
                                <button type="button" className="btn btn-outline" style={{ minHeight: '48px' }} onClick={() => setShowPrintModal(true)} title="Pratonton & Muat Turun">
                                    <Printer size={18} /> Pratonton
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ minHeight: '48px' }} disabled={loading}>
                                    {loading ? (
                                        <><Loader2 className="animate-spin" size={18} /> Menyimpan...</>
                                    ) : (
                                        initialData ? 'Kemaskini' : 'Simpan Rekod'
                                    )}
                                </button>
                            </>
                        )}
                    </div>
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
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="btn btn-outline" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
                                    {isGeneratingPDF ? (
                                        <><Loader2 className="animate-spin" size={18} /> Menjana...</>
                                    ) : (
                                        <><Download size={18} /> Muat Turun PDF</>
                                    )}
                                </button>
                                <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Cetak</button>
                            </div>
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
    </React.Fragment>
    );
};
