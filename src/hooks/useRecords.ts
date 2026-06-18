import { useState, useEffect, useCallback } from 'react';
import type { RPHRecord } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

const parseYearFromKelas = (kelas: string) => {
    const match = kelas.match(/^([1-6])\b/);
    return match ? Number(match[1]) : 1;
};

export const useRecords = (initialPage = 0, initialPageSize = 10) => {
    const { user } = useAuth();
    const [records, setRecords] = useState<RPHRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRecords = useCallback(async () => {
        if (!user) {
            setRecords([]);
            setLoading(false);
            setTotalCount(0);
            return;
        }

        setLoading(true);
        const from = page * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('rph_records')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id);

        if (searchTerm) {
            query = query.or(`subjek.ilike.%${searchTerm}%,kelas.ilike.%${searchTerm}%,hari.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query
            .order('tarikh', { ascending: false })
            .range(from, to);

        if (!error && data) {
            const mappedData: RPHRecord[] = (data as unknown[]).map((r) => {
                const rec = r as Record<string, unknown>;
                return {
                    id: String(rec.id),
                    user_id: String(rec.user_id),
                    tarikh: String(rec.tarikh),
                    hari: String(rec.hari),
                    tahun: typeof rec.tahun === 'number' ? rec.tahun : parseYearFromKelas(String(rec.kelas)),
                    kelas: String(rec.kelas),
                    masa: String(rec.masa),
                    subjek: String(rec.subjek),
                    content: (rec.content as RPHRecord['content']) || {},
                    created_at: String(rec.created_at)
                };
            });
            setRecords(mappedData);
            if (count !== null) setTotalCount(count);
        }
        setLoading(false);
    }, [user, page, pageSize, searchTerm]);

    useEffect(() => {
        let isMounted = true;
        
        const initialFetch = async () => {
            if (isMounted) {
                await fetchRecords();
            }
        };
        
        initialFetch();
        
        return () => {
            isMounted = false;
        };
    }, [fetchRecords]);

    const addRecord = async (record: Omit<RPHRecord, 'id'>) => {
        if (!user) throw new Error('User not authenticated');

        const dbRecord = {
            user_id: user.id,
            tarikh: record.tarikh,
            hari: record.hari,
            tahun: record.tahun,
            kelas: record.kelas,
            masa: record.masa,
            subjek: record.subjek,
            content: record.content
        };

        const { data, error } = await supabase
            .from('rph_records')
            .insert([dbRecord])
            .select();

        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error(error.message);
        }
        
        if (data) {
            await fetchRecords();
        }
    };

    const updateRecord = async (id: string, record: Partial<RPHRecord>) => {
        if (!user) throw new Error('User not authenticated');

        const dbRecord: Partial<RPHRecord> = {};
        if (record.tarikh) dbRecord.tarikh = record.tarikh;
        if (record.hari) dbRecord.hari = record.hari;
        if (record.tahun) dbRecord.tahun = record.tahun;
        if (record.kelas) dbRecord.kelas = record.kelas;
        if (record.masa) dbRecord.masa = record.masa;
        if (record.subjek) dbRecord.subjek = record.subjek;
        if (record.content) dbRecord.content = record.content;

        const { error } = await supabase
            .from('rph_records')
            .update(dbRecord)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Supabase update error:', error);
            throw new Error(error.message);
        }
        
        await fetchRecords();
    };

    const deleteRecord = async (id: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('rph_records')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (!error) {
            fetchRecords();
        }
    };

    return { 
        records, 
        loading, 
        totalCount, 
        page, 
        setPage, 
        pageSize, 
        setPageSize, 
        searchTerm, 
        setSearchTerm, 
        addRecord, 
        updateRecord, 
        deleteRecord 
    };
};
