import { useCallback, useEffect, useRef, useState } from 'react';
import type { RPHRecord } from '../types';
import { api, errorMessage } from '../lib/apiClient';
import { useAuth } from './useAuth';

export const useRecords = (initialPage = 1, initialPageSize = 10) => {
    const { profile } = useAuth();
    const [records, setRecords] = useState<RPHRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [searchTerm, setSearchTerm] = useState('');
    const requestId = useRef(0);

    const fetchRecords = useCallback(async () => {
        if (!profile) {
            setRecords([]);
            setTotalCount(0);
            setLoading(false);
            return;
        }

        const current = ++requestId.current;
        setLoading(true);
        setError(null);

        try {
            const result = await api.listRecords({ page, pageSize, search: searchTerm });
            if (current !== requestId.current) return;
            setRecords(result.data);
            setTotalCount(result.totalCount);
        } catch (err) {
            if (current !== requestId.current) return;
            setError(errorMessage(err));
            setRecords([]);
            setTotalCount(0);
        } finally {
            if (current === requestId.current) setLoading(false);
        }
    }, [profile, page, pageSize, searchTerm]);

    useEffect(() => {
        void fetchRecords();
    }, [fetchRecords]);

    /** New search restarts at page 1 so the result set is never stale (audit F-03/F-07). */
    const updateSearch = (term: string) => {
        setSearchTerm(term);
        setPage(1);
    };

    const addRecord = async (record: Omit<RPHRecord, 'id'>) => {
        try {
            await api.createRecord(record);
        } catch (err) {
            throw new Error(errorMessage(err));
        }
        await fetchRecords();
    };

    const updateRecord = async (id: string, record: Partial<RPHRecord>) => {
        try {
            await api.updateRecord(id, record);
        } catch (err) {
            throw new Error(errorMessage(err));
        }
        await fetchRecords();
    };

    const deleteRecord = async (id: string) => {
        try {
            await api.deleteRecord(id);
        } catch (err) {
            throw new Error(errorMessage(err));
        }
        await fetchRecords();
    };

    return {
        records,
        loading,
        error,
        totalCount,
        page,
        setPage,
        pageSize,
        setPageSize,
        searchTerm,
        setSearchTerm: updateSearch,
        addRecord,
        updateRecord,
        deleteRecord,
        reload: fetchRecords,
    };
};
