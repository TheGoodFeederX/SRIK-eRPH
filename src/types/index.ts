export interface RPHRecord {
    id: string;
    tarikh: string;
    hari: string;
    kelas: string;
    masa: string;
    subjek: string;
    tajukStandardKandungan: string;
    aktiviti: string;
    refleksi: string;
}


export interface ReferensiRPH {
    id: string;
    subjek: string;
    tahun: number | null;
    sk: string;
}

export type Tab = 'form' | 'records' | 'dskp' | 'settings';
