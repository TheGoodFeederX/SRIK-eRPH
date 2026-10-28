-- 04_dskp_seed.sql
-- Seed data for DSKP hierarchy (referensi_rph)

-- Clean up existing data to avoid duplicates if re-run
truncate table public.referensi_rph restart identity;

insert into public.referensi_rph (subjek, tahun, bidang, sk, sp, spi)
values 
-- Pendidikan Islam Tahun 1
('Pendidikan Islam', 1, 'Al-Quran', '1.1 Huruf Hijaiyah Berbaris Satu Di Atas', 
  '[
    "1.1.1 Mengenal pasti dan menyebut huruf hijaiyah berbaris satu di atas",
    "1.1.2 Membaca huruf hijaiyah berbaris satu di atas"
  ]'::jsonb, 
  '[
    {"tp": 1, "desc": "Mengenal pasti dan menyebut huruf hijaiyah berbaris satu di atas"},
    {"tp": 2, "desc": "Membaca huruf hijaiyah berbaris satu di atas"}
  ]'::jsonb
),
('Pendidikan Islam', 1, 'Aqidah', '2.1 Rukun Iman', 
  '[
    "2.1.1 Menyatakan maksud Rukun Iman",
    "2.1.2 Menyenaraikan Rukun Iman"
  ]'::jsonb, 
  '[
    {"tp": 1, "desc": "Menyatakan maksud Rukun Iman"},
    {"tp": 2, "desc": "Menyatakan Rukun Iman satu persatu"}
  ]'::jsonb
),

-- Sains Tahun 2
('Sains', 2, null, '1.1 Kemahiran Proses Sains', 
  '[
    "1.1.1 Memerhati",
    "1.1.2 Mengelas",
    "1.1.3 Mengukur dan menggunakan nombor"
  ]'::jsonb, 
  '[
    {"tp": 1, "desc": "Menyatakan semua deria yang terlibat untuk membuat pemerhatian tentang fenomena atau perubahan yang berlaku"},
    {"tp": 2, "desc": "Memerihalkan penggunaan semua deria yang terlibat untuk membuat pemerhatian tentang fenomena atau perubahan yang berlaku"}
  ]'::jsonb
),

-- Bahasa Melayu Tahun 3
('Bahasa Melayu', 3, null, '1.1 Mendengar dan memberikan respons', 
  '[
    "1.1.1 Mendengar, mengecam sebutan, memahami, dan menyebut dengan betul dan tepat; (i) ayat tunggal (ii) ayat majmuk"
  ]'::jsonb, 
  '[
    {"tp": 1, "desc": "Memberikan respons terhadap arahan, soalan, dan pesanan pada tahap sangat terhad."},
    {"tp": 2, "desc": "Memberikan respons terhadap arahan, soalan, dan pesanan pada tahap terhad."}
  ]'::jsonb
);

-- Notify PostgREST to reload schema cache
notify pgrst, 'reload schema';
