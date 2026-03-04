import { useState, useEffect, useCallback } from 'react';
import type { RPHRecord } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';

export const useRecords = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<RPHRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = useCallback(async () => {
        if (!user) {
            setRecords([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('rph_records')
            .select('*')
            .eq('user_id', user.id)
            .order('tarikh', { ascending: false });

        if (!error && data) {
            const mappedData: RPHRecord[] = data.map((rec: any) => ({
                id: rec.id,
                user_id: rec.user_id,
                tarikh: rec.tarikh,
                hari: rec.hari,
                kelas: rec.kelas,
                masa: rec.masa,
                subjek: rec.subjek,
                content: rec.content || {},
                created_at: rec.created_at
            }));
            setRecords(mappedData);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const addRecord = async (record: Omit<RPHRecord, 'id'>) => {
        if (!user) throw new Error('User not authenticated');

        const dbRecord = {
            user_id: user.id,
            tarikh: record.tarikh,
            hari: record.hari,
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

        const dbRecord: any = {};
        if (record.tarikh) dbRecord.tarikh = record.tarikh;
        if (record.hari) dbRecord.hari = record.hari;
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

    return { records, loading, addRecord, updateRecord, deleteRecord };
};
