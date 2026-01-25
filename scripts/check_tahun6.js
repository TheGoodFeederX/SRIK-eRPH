import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('.env'))
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY)

async function checkTahun6() {
    const { count, error } = await supabase
        .from('referensi_rph')
        .select('*', { count: 'exact', head: true })
        .eq('tahun', 6)

    if (error) console.error(error)
    else console.log(`Tahun 6 count: ${count}`)
}

checkTahun6()
