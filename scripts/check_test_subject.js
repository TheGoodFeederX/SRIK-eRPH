import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('.env'))
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY)

async function checkTestWrapper() {
    const { count, data, error } = await supabase
        .from('referensi_rph')
        .select('*', { count: 'exact' })
        .eq('subjek', 'TEST SUBJECT 2')

    if (error) console.error(error)
    else {
        console.log(`Count for 'TEST SUBJECT 2': ${count}`)
        console.log(data)
    }
}

checkTestWrapper()
