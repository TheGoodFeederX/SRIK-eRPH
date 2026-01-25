import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('.env'))
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY)

async function checkCount() {
    const { data, error } = await supabase
        .from('referensi_rph')
        .select('id')

    if (error) console.error(error)
    else console.log(`Returned rows: ${data.length}`)
}

checkCount()
