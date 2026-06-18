import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import type { AppDatabase } from './connection';
import { openDatabase } from './connection';
import { migrateAppSchema } from './schema';

const seedRows = [
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
      {
        tp: 1,
        desc: 'Menyatakan semua deria yang terlibat untuk membuat pemerhatian tentang fenomena atau perubahan yang berlaku',
      },
      {
        tp: 2,
        desc: 'Memerihalkan penggunaan semua deria yang terlibat untuk membuat pemerhatian tentang fenomena atau perubahan yang berlaku',
      },
    ],
  },
  {
    subjek: 'Bahasa Melayu',
    tahun: 3,
    bidang: null,
    sk: '1.1 Mendengar dan memberikan respons',
    sp: [
      '1.1.1 Mendengar, mengecam sebutan, memahami, dan menyebut dengan betul dan tepat; (i) ayat tunggal (ii) ayat majmuk',
    ],
    spi: [
      { tp: 1, desc: 'Memberikan respons terhadap arahan, soalan, dan pesanan pada tahap sangat terhad.' },
      { tp: 2, desc: 'Memberikan respons terhadap arahan, soalan, dan pesanan pada tahap terhad.' },
    ],
  },
] as const;

export function seedDskp(db: AppDatabase): void {
  const insert = db.prepare(`
    insert into referensi_rph (id, subjek, tahun, bidang, sk, sp, spi)
    values (@id, @subjek, @tahun, @bidang, @sk, @sp, @spi)
  `);

  const transaction = db.transaction(() => {
    db.prepare('delete from referensi_rph').run();

    for (const row of seedRows) {
      insert.run({
        id: nanoid(),
        subjek: row.subjek,
        tahun: row.tahun,
        bidang: row.bidang,
        sk: row.sk,
        sp: JSON.stringify(row.sp),
        spi: JSON.stringify(row.spi),
      });
    }
  });

  transaction();
}

function isDirectRun(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  const databasePath = process.env.DATABASE_PATH ?? 'data/erph.sqlite';
  const db = openDatabase(databasePath);

  try {
    migrateAppSchema(db);
    seedDskp(db);
    console.log(`Seeded ${seedRows.length} DSKP rows into ${databasePath}.`);
  } finally {
    db.close();
  }
}
