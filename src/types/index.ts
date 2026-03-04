export interface RPHRecord {
    id: string;
    user_id: string;
    tarikh: string;
    hari: string;
    kelas: string;
    masa: string;
    subjek: string;
    content: {
        bidang?: string;
        tajukStandardKandungan?: string;
        objektif?: string;
        aktiviti?: string;
        refleksi?: string;
        sp?: string[];
        spi?: Array<{ tp: number; desc: string }>;
    };
    created_at?: string;
}

export interface ReferensiRPH {
    id: string;
    subjek: string;
    tahun: number | null;
    bidang?: string;
    sk: string;
    sp?: string[];
    spi?: Array<{ tp: number; desc: string }>;
}

export type Tab = 'form' | 'records' | 'dskp' | 'settings';
