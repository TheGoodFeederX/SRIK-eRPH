import 'dotenv/config';
import { pool, withPrivileged } from './pool.js';

/**
 * Idempotent DSKP seed. Never truncates and never overwrites edited rows
 * (audit D-02): conflicts on the natural key (subjek, tahun, bidang, sk) are ignored.
 */
const rows = [
  {
    subjek: 'Pendidikan Islam',
    tahun: 1,
    bidang: 'Al-Quran',
    sk: '1.1 Huruf Hijaiyah Berbaris Satu Di Atas',
    sp: [
      '1.1.1 Mengenal pasti dan menyebut huruf hijaiyah berbaris satu di atas',
      '1.1.2 Membaca huruf hijaiyah berbaris satu di atas',
    ],
    spi: [
      { tp: 1, desc: 'Mengenal pasti dan menyebut huruf hijaiyah berbaris satu di atas' },
      { tp: 2, desc: 'Membaca huruf hijaiyah berbaris satu di atas' },
    ],
  },
  {
    subjek: 'Pendidikan Islam',
    tahun: 1,
    bidang: 'Aqidah',
    sk: '2.1 Rukun Iman',
    sp: ['2.1.1 Menyatakan maksud Rukun Iman', '2.1.2 Menyenaraikan Rukun Iman'],
    spi: [
      { tp: 1, desc: 'Menyatakan maksud Rukun Iman' },
      { tp: 2, desc: 'Menyatakan Rukun Iman satu persatu' },
    ],
  },
  {
    subjek: 'Sains',
    tahun: 2,
    bidang: null,
    sk: '1.1 Kemahiran Proses Sains',
    sp: ['1.1.1 Memerhati', '1.1.2 Mengelas', '1.1.3 Mengukur dan menggunakan nombor'],
    spi: [
      { tp: 1, desc: 'Menyatakan semua deria yang terlibat untuk membuat pemerhatian tentang fenomena atau perubahan yang berlaku' },
      { tp: 2, desc: 'Memerihalkan penggunaan semua deria yang terlibat untuk membuat pemerhatian tentang fenomena atau perubahan yang berlaku' },
    ],
  },
  {
    subjek: 'Bahasa Melayu',
    tahun: 3,
    bidang: null,
    sk: '1.1 Mendengar dan memberikan respons',
    sp: ['1.1.1 Mendengar, mengecam sebutan, memahami, dan menyebut dengan betul dan tepat; (i) ayat tunggal (ii) ayat majmuk'],
    spi: [
      { tp: 1, desc: 'Memberikan respons terhadap arahan, soalan, dan pesanan pada tahap sangat terhad.' },
      { tp: 2, desc: 'Memberikan respons terhadap arahan, soalan, dan pesanan pada tahap terhad.' },
    ],
  },
];

async function main() {
  const applied = await withPrivileged(async (db) => {
    const keys: string[] = [];

    for (const row of rows) {
      const result = await db.query<{ id: string }>(
        `insert into public.referensi_rph (subjek, tahun, bidang, sk, sp, spi)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (subjek, tahun, (coalesce(bidang, '')), sk) do nothing
         returning id`,
        [row.subjek, row.tahun, row.bidang, row.sk, JSON.stringify(row.sp), JSON.stringify(row.spi)],
      );
      keys.push(result.rows[0] ? `added:${row.subjek}/${row.sk}` : `exists:${row.subjek}/${row.sk}`);
    }

    return keys;
  });

  console.log(applied.join('\n'));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
