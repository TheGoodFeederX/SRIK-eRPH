import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const inspectSchema = async () => {
    console.log('Inspecting schema...');

    // Try to query the OpenAPI spec which lists everything
    const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`);
    if (response.ok) {
        const spec = await response.json();
        console.log('Tables/Views in spec:', Object.keys(spec.definitions || {}));
        console.log('RPCs in spec:', Object.keys(spec.paths).filter(p => p.startsWith('/rpc/')));
    } else {
        console.error('Failed to fetch OpenAPI spec:', response.status);
    }

    // Try standard table query as fallback
    const { data: tables, error: tableErr } = await supabase.from('referensi_rph').select('*').limit(1);
    console.log('referensi_rph access:', tableErr ? 'FAILED: ' + tableErr.message : 'SUCCESS');
};

inspectSchema();
