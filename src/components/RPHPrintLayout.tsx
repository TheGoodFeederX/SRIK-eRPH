import React from 'react';
import type { RPHRecord } from '../types';

interface RPHPrintLayoutProps {
    record: RPHRecord;
    showPageBreak?: boolean;
    minHeight?: string;
}

export const RPHPrintLayout: React.FC<RPHPrintLayoutProps> = ({ record, showPageBreak, minHeight = '4.5in' }) => {
    return (
        <div
            className="print-record-container"
            style={{
                border: '2px solid #000',
                padding: '2rem',
                marginBottom: showPageBreak ? '2rem' : '0',
                pageBreakAfter: showPageBreak ? 'always' : 'auto',
                pageBreakInside: 'avoid',
                backgroundColor: 'white',
                minHeight: minHeight,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>SEKOLAH RENDAH ISLAM AL-KHAIRIAH</h1>
                        <h2 style={{ fontSize: '1rem', margin: '0.2rem 0 0 0' }}>REKOD PENGAJARAN HARIAN</h2>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <div><strong>Tarikh:</strong> {record.tarikh}</div>
                    <div><strong>Hari:</strong> {record.hari}</div>
                    <div><strong>Kelas:</strong> {record.kelas}</div>
                    <div><strong>Masa:</strong> {record.masa}</div>
                </div>

                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <strong>Subjek:</strong>
                    <div style={{ marginTop: '0.15rem' }}>{record.subjek}</div>
                </div>

                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <strong>Tajuk / Standard Kandungan:</strong>
                    <div style={{ marginTop: '0.15rem', whiteSpace: 'pre-wrap' }}>{record.tajukStandardKandungan}</div>
                </div>

                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <strong>Objektif:</strong>
                    <div style={{ marginTop: '0.15rem', whiteSpace: 'pre-wrap' }}>{record.objektif}</div>
                </div>

                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <strong>Aktiviti:</strong>
                    <div style={{ marginTop: '0.15rem', whiteSpace: 'pre-wrap', minHeight: '80px' }}>{record.aktiviti}</div>
                </div>

                <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <strong>Refleksi:</strong>
                    <div style={{ marginTop: '0.15rem', whiteSpace: 'pre-wrap' }}>{record.refleksi}</div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.8rem' }}>
                <div style={{ borderTop: '1px solid #000', width: '150px', textAlign: 'center', paddingTop: '0.25rem' }}>
                    <p>Tandatangan Guru</p>
                </div>
                <div style={{ borderTop: '1px solid #000', width: '150px', textAlign: 'center', paddingTop: '0.25rem' }}>
                    <p>Guru Besar/PK</p>
                </div>
            </div>
        </div>
    );
};
