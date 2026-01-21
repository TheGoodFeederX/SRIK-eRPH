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
                tarikh: rec.tarikh,
                hari: rec.hari,
                kelas: rec.kelas,
                masa: rec.masa,
                subjek: rec.subjek,
                tajukStandardKandungan: rec.tajuk_standard_kandungan,
                aktiviti: rec.aktiviti,
                refleksi: rec.refleksi
            }));
            setRecords(mappedData);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const addRecord = async (record: Omit<RPHRecord, 'id'>) => {
        if (!user) return;

        const dbRecord = {
            user_id: user.id,
            tarikh: record.tarikh,
            hari: record.hari,
            kelas: record.kelas,
            masa: record.masa,
            subjek: record.subjek,
            tajuk_standard_kandungan: record.tajukStandardKandungan,
            aktiviti: record.aktiviti,
            refleksi: record.refleksi
        };

        const { data, error } = await supabase
            .from('rph_records')
            .insert([dbRecord])
            .select();

        if (!error && data) {
            fetchRecords();
        }
    };

    const updateRecord = async (id: string, record: Partial<RPHRecord>) => {
        if (!user) return;

        const dbRecord: any = {};
        if (record.tarikh) dbRecord.tarikh = record.tarikh;
        if (record.hari) dbRecord.hari = record.hari;
        if (record.kelas) dbRecord.kelas = record.kelas;
        if (record.masa) dbRecord.masa = record.masa;
        if (record.subjek) dbRecord.subjek = record.subjek;
        if (record.tajukStandardKandungan) dbRecord.tajuk_standard_kandungan = record.tajukStandardKandungan;
        if (record.aktiviti) dbRecord.aktiviti = record.aktiviti;
        if (record.refleksi) dbRecord.refleksi = record.refleksi;

        const { error } = await supabase
            .from('rph_records')
            .update(dbRecord)
            .eq('id', id)
            .eq('user_id', user.id);

        if (!error) {
            fetchRecords();
        }
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
