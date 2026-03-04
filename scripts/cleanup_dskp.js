import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load env
const envConfig = dotenv.parse(fs.readFileSync('.env'))
const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanup() {
    console.log('Starting cleanup...')

    let allRecords = []
    let from = 0
    const step = 1000

    // 1. Fetch all records with pagination
    console.log('Fetching all records...')
    while (true) {
        const { data, error } = await supabase
            .from('referensi_rph')
            .select('id, subjek, tahun, sk')
            .range(from, from + step - 1)

        if (error) {
            console.error('Error fetching:', error)
            return
        }

        allRecords = allRecords.concat(data)
        process.stdout.write(`\rFetched ${allRecords.length} records...`)

        // Safety break
        if (allRecords.length > 20000) {
            console.log('\nReached safety limit of 20000 records. Stopping fetch.')
            break
        }

        if (data.length < step) break
        from += step

        // Small delay to be nice
        await new Promise(r => setTimeout(r, 200))
    }
    console.log('\nFetch complete (or stopped).')

    // 2. Identify duplicates
    const uniqueGroups = {}

    for (const r of allRecords) {
        // Normalize key
        const subjek = (r.subjek || '').trim()
        const sk = (r.sk || '').trim()
        const tahun = r.tahun
        const key = `${subjek}|${tahun}|${sk}`

        if (!uniqueGroups[key]) {
            uniqueGroups[key] = []
        }
        uniqueGroups[key].push(r)
    }

    const toDelete = []
    let duplicateCount = 0

    for (const key in uniqueGroups) {
        const group = uniqueGroups[key]
        if (group.length > 1) {
            // Sort by ID to keep consistent (e.g. keep oldest/smallest ID)
            // Assuming ID is numeric or UUID, sorting ensures we don't randomly delete different ones on different runs
            group.sort((a, b) => (a.id > b.id ? 1 : -1))

            // Keep first, delete rest
            const [keep, ...remove] = group
            toDelete.push(...remove.map(r => r.id))
            duplicateCount += remove.length
        }
    }

    console.log(`Total records: ${allRecords.length}`)
    console.log(`Unique groups: ${Object.keys(uniqueGroups).length}`)
    console.log(`Duplicates found: ${duplicateCount}`)

    // Report subject distribution
    const distinctSubjects = {}
    allRecords.forEach(r => {
        const s = r.subjek || '(empty)'
        distinctSubjects[s] = (distinctSubjects[s] || 0) + 1
    })
    console.log('\nSubject Distribution in fetched records:')
    console.table(distinctSubjects)

    if (duplicateCount === 0) {
        console.log('No duplicates found. Exiting.')
        return
    }

    // 3. Delete duplicates
    console.log('Deleting duplicates...')
    const deleteBatchSize = 100
    let deletedCount = 0

    for (let i = 0; i < toDelete.length; i += deleteBatchSize) {
        const chunk = toDelete.slice(i, i + deleteBatchSize)
        const { error: delError } = await supabase
            .from('referensi_rph')
            .delete()
            .in('id', chunk)

        if (delError) {
            console.error('Error deleting chunk:', delError)
        } else {
            deletedCount += chunk.length
            process.stdout.write(`\rDeleted ${deletedCount}/${duplicateCount}`)
        }
    }
    console.log('\nCleanup complete.')

    // 4. Report unique subjects found
    const uniqueSubjects = new Set()
    allRecords.forEach(r => {
        // Check if this record is in the delete list
        // Optimization: We could just iterate uniqueGroups, but we want to know what remains
        // Actually simpler: iterate uniqueGroups keys.
        if (r.subjek) uniqueSubjects.add(r.subjek)
    })

    console.log('\nUnique Subjects present in DB (before delete):')
    console.log(Array.from(uniqueSubjects).sort())
}

cleanup()
