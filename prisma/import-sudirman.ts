// Import merchant Jalan Sudirman dari hasil riset lapangan
// Jalankan: npm run db:import-sudirman
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// [name, category, status, isMandiriEDC, isMandiriQRIS, mapsUrl]
// status: 'AVAILABLE' = target akuisisi, 'ACQUIRED' = sudah full Mandiri
type MerchantRow = [string, string, string, boolean, boolean, string]

const merchants: MerchantRow[] = [
  // ── SUDAH MANDIRI SEBAGIAN (punya EDC Mandiri, belum QRIS atau sebaliknya) ──
  // → status AVAILABLE: masih bisa didekati untuk channel yang belum
  ['The Luxe',                'Hotel',      'AVAILABLE', true,  false, 'https://www.google.com/maps/search/The+Luxe+Jalan+Sudirman+Balikpapan'],
  ['Athena',                  'Healthcare', 'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Athena+Jalan+Sudirman+Balikpapan'],
  ['Canton',                  'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Canton+Jalan+Sudirman+Balikpapan'],
  ['Soto Cak Gurih',          'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Soto+Cak+Gurih+Jalan+Sudirman+Balikpapan'],
  ['Soto Lapas',              'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Soto+Lapas+Jalan+Sudirman+Balikpapan'],
  ['Bakso Mie Ayam Lek Min',  'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/bakso+mie+ayam+Lek+Min+Jalan+Sudirman+Balikpapan'],
  ['Bebek Goreng Pak Asman',  'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Bebek+goreng+pak+asman+Jalan+Sudirman+Balikpapan'],
  ['Raja Lalapan',            'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Raja+lalapan+Jalan+Sudirman+Balikpapan'],
  ['Mr Sumo',                 'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Mr+Sumo+Jalan+Sudirman+Balikpapan'],
  ['Warung 94',               'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Warung+94+Jalan+Sudirman+Balikpapan'],
  ['Wr Ibu Siti',             'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Wr+Ibu+Siti+Jalan+Sudirman+Balikpapan'],
  ['Wr Banyuwangi Melawai',   'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/wr+banyuwangi+melawai+Jalan+Sudirman+Balikpapan'],
  ['Seruni',                  'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Seruni+Jalan+Sudirman+Balikpapan'],
  ['Amplang Si Bayak',        'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Amplang+Si+Bayak+Jalan+Sudirman+Balikpapan'],
  ['Hankin Donat Klandasan',  'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Hankin+Donat+Klandasan+Jalan+Sudirman+Balikpapan'],
  ['Donut Moo',               'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Donut+Moo+Jalan+Sudirman+Balikpapan'],
  ['Donat DPR',               'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Donat+DPR+Jalan+Sudirman+Balikpapan'],
  ['Perdana Frozen',          'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Perdana+frozen+Jalan+Sudirman+Balikpapan'],
  ['Cahaya Laut',             'FnB',        'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Cahaya+Laut+Jalan+Sudirman+Balikpapan'],
  ['CR Coffee',               'Cafe',       'AVAILABLE', true,  false, 'https://www.google.com/maps/search/CR+Coffee+Jalan+Sudirman+Balikpapan'],
  ['Kopken BP',               'Cafe',       'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Kopken+BP+Jalan+Sudirman+Balikpapan'],
  ['Luna Coffee',             'Cafe',       'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Luna+cofee+Jalan+Sudirman+Balikpapan'],
  ['The Gade Cafe',           'Cafe',       'AVAILABLE', true,  false, 'https://www.google.com/maps/search/The+gade+Cafe+Jalan+Sudirman+Balikpapan'],
  ['Analogy',                 'Cafe',       'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Analogy+Jalan+Sudirman+Balikpapan'],
  ['Kairos',                  'Cafe',       'AVAILABLE', true,  false, 'https://www.google.com/maps/search/kairos+Jalan+Sudirman+Balikpapan'],
  ['Padel Club',              'Cafe',       'AVAILABLE', true,  false, 'https://www.google.com/maps/search/padel+Club+Jalan+Sudirman+Balikpapan'],
  ['Kakiku',                  'Cafe',       'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Kakiku+Jalan+Sudirman+Balikpapan'],
  ['Nam Min BP',              'Cafe',       'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Nam+Min+BP+Jalan+Sudirman+Balikpapan'],
  ['Bontings',                'Retail',     'AVAILABLE', true,  false, 'https://www.google.com/maps/search/bontings+Jalan+Sudirman+Balikpapan'],
  ['Gadgetmart',              'Retail',     'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Gadgetmart+Jalan+Sudirman+Balikpapan'],
  ['Raja Parfum Plaza',       'Retail',     'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Raja+Parfum+Plaza+Jalan+Sudirman+Balikpapan'],
  ['Raja Parfum Klandasan',   'Retail',     'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Raja+Parfum+Klandasan+Jalan+Sudirman+Balikpapan'],
  ['Toko Smile',              'Retail',     'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Toko+smile+Jalan+Sudirman+Balikpapan'],
  ['Jenebora Stalkuda',       'Souvenir',   'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Jenebora+Stalkuda+Jalan+Sudirman+Balikpapan'],
  ['Lotus Hotel',             'Hotel',      'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Lotus+Hotel+Jalan+Sudirman+Balikpapan'],
  ['Nest Guest House',        'Hotel',      'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Nest+Guest+House+Jalan+Sudirman+Balikpapan'],
  ['Aurora',                  'Hotel',      'AVAILABLE', true,  false, 'https://www.google.com/maps/search/Aurora+Jalan+Sudirman+Balikpapan'],
  ['SPBU Stalkuda 0.7',       'Lainnya',    'AVAILABLE', true,  false, 'https://www.google.com/maps/search/SPBU+Stalkuda+0.7+Jalan+Sudirman+Balikpapan'],

  // ── BELUM MANDIRI SAMA SEKALI ──────────────────────────────────────────────
  // → target prioritas akuisisi
  ['Rumah Makan Torani (Pusat)', 'FnB',     'AVAILABLE', false, false, 'https://www.google.com/maps/search/Rumah+Makan+Torani+(Pusat)+Jalan+Sudirman+Balikpapan'],
  ['Torani Stalkuda',            'FnB',     'AVAILABLE', false, false, 'https://www.google.com/maps/search/Torani+Stalkuda+Jalan+Sudirman+Balikpapan'],

  // ── SUDAH MANDIRI PENUH (EDC + QRIS) ──────────────────────────────────────
  // → status ACQUIRED: referensi, tidak perlu dikunjungi
  ['Warteg Barokah',          'FnB',        'ACQUIRED',  true,  true,  'https://www.google.com/maps/search/warteg+barokah+Jalan+Sudirman+Balikpapan'],
  ['L2C',                     'Cafe',       'ACQUIRED',  true,  true,  'https://www.google.com/maps/search/L2C+Jalan+Sudirman+Balikpapan'],
  ['Natsha Clinic',           'Healthcare', 'ACQUIRED',  true,  true,  'https://www.google.com/maps/search/Natsha+Clinic+Jalan+Sudirman+Balikpapan'],
  ['Richese Factory Sudirman','FnB',        'ACQUIRED',  true,  true,  'https://www.google.com/maps/search/Richese+Factory+Sudirman+Jalan+Sudirman+Balikpapan'],
  ['Depot Miki Klandasan',    'FnB',        'ACQUIRED',  true,  true,  'https://www.google.com/maps/search/Depot+Miki+Klandasan+Jalan+Sudirman+Balikpapan'],
  ['RSPB',                    'Healthcare', 'ACQUIRED',  true,  true,  'https://www.google.com/maps/search/RSPB+Jalan+Sudirman+Balikpapan'],
  ['Bebek Goreng Slamet Lapas','FnB',       'ACQUIRED',  true,  true,  'https://www.google.com/maps/search/bebek+goreng+slamet+lapas+Jalan+Sudirman+Balikpapan'],
]

async function main() {
  const branch = await prisma.branch.findFirst({ where: { code: 'KC_SUDIRMAN' } })
  if (!branch) { console.error('Branch KC_SUDIRMAN tidak ditemukan'); process.exit(1) }

  console.log(`\nTarget branch: ${branch.name} (${branch.city})`)
  console.log(`Total merchant yang akan diimport: ${merchants.length}\n`)

  // Ambil nama merchant yang sudah ada di cabang ini
  const existing = await prisma.merchant.findMany({
    where: { branchId: branch.id },
    select: { name: true },
  })
  const existingNames = new Set(existing.map(m => m.name.toLowerCase().trim()))

  let created = 0, skipped = 0

  for (const [name, category, status, isMandiriEDC, isMandiriQRIS, mapsUrl] of merchants) {
    if (existingNames.has(name.toLowerCase().trim())) {
      console.log(`  [SKIP]  ${name}`)
      skipped++
      continue
    }

    // Koordinat acak di sekitar cabang
    const lat = branch.lat + (Math.random() - 0.5) * 0.012
    const lng = branch.lng + (Math.random() - 0.5) * 0.012

    await prisma.merchant.create({
      data: {
        name,
        category,
        address:       `Jl. Sudirman, ${branch.city}`,
        lat,
        lng,
        status,
        isMandiriEDC,
        isMandiriQRIS,
        isViralTikTok:  false,
        priceRange:     '$$',
        googleMapsUrl:  mapsUrl,
        photoUrl:       'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
        lastScraped:    new Date(),
        branchId:       branch.id,
      },
    })
    console.log(`  [OK]    ${name}  (${status})`)
    created++
  }

  console.log(`\n✅ Selesai! Ditambahkan: ${created} merchant  |  Dilewati: ${skipped} (sudah ada)`)
  console.log(`   - AVAILABLE (target akuisisi): ${merchants.filter(m => m[2] === 'AVAILABLE').length}`)
  console.log(`   - ACQUIRED  (sudah Mandiri):   ${merchants.filter(m => m[2] === 'ACQUIRED').length}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
