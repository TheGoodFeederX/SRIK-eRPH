export type UserRole = 'teacher' | 'admin';

export interface AppUser {
    id: string;
    email: string;
    name: string;
}

export interface Profile extends AppUser {
    role: UserRole;
    created_at?: string;
    updated_at?: string;
}

export interface RPHRecord {
    id: string;
    user_id: string;
    tarikh: string;
    hari: string;
    tahun: number;
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
    status?: 'draft' | 'published';
    created_at?: string;
    updated_at?: string;
}

export interface ReferensiRPH {
    id: string;
    subjek: string;
    tahun: number;
    bidang?: string | null;
    sk: string;
    sp: string[];
    spi: Array<{ tp: number; desc: string }>;
    created_at?: string;
    updated_at?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
    };
}

export type Tab = 'form' | 'records' | 'dskp' | 'settings';
