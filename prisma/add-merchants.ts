// Script tambah merchant baru hasil riset Google Maps & TikTok
// Jalankan: npm run db:add-merchants
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Format: [branchCode, name, reviews, rating, isViralTikTok, estVolume, category]
const newMerchants: [string, string, number, number, boolean, number, string][] = [

  // ── KC KLANDASAN ──────────────────────────────────────────────────────────
  ['KC_KLANDASAN', 'Kepiting Kenari Balikpapan',        2200, 4.4, false, 180000000, 'FnB'],
  ['KC_KLANDASAN', 'Kedai KR Gunung 4',                  850, 4.6, true,   65000000, 'FnB'],
  ['KC_KLANDASAN', 'Warung Soto Banjar Hj. Noor',       1640, 4.5, false,  90000000, 'FnB'],
  ['KC_KLANDASAN', 'Ayam Penyet Surabaya Klandasan',    1120, 4.3, false,  75000000, 'FnB'],

  // ── KC SUDIRMAN ───────────────────────────────────────────────────────────
  ['KC_SUDIRMAN', 'Kampung Kecil Balikpapan',           7800, 4.5, false, 350000000, 'FnB'],
  ['KC_SUDIRMAN', 'Open House Hill Café Balikpapan',    1800, 4.3, true,  140000000, 'FnB'],
  ['KC_SUDIRMAN', 'Goey Kopitiam Balikpapan',            980, 4.4, false,  85000000, 'FnB'],
  ['KC_SUDIRMAN', 'Es Teler 77 Sudirman',               2100, 4.2, false, 120000000, 'FnB'],

  // ── KC SUPERBLOCK ─────────────────────────────────────────────────────────
  ['KC_SUPERBLOCK', 'Resto 4 Rasa Balikpapan',           120, 4.7, true,   55000000, 'FnB'],
  ['KC_SUPERBLOCK', 'Rooks Café Balikpapan',             650, 4.5, true,   90000000, 'FnB'],
  ['KC_SUPERBLOCK', 'Sushi Tei Balikpapan Square',      1890, 4.3, false, 280000000, 'FnB'],
  ['KC_SUPERBLOCK', 'D\'Cost Seafood Balikpapan',        2300, 4.2, false, 220000000, 'FnB'],

  // ── KC BALIKPAPAN BARU ────────────────────────────────────────────────────
  ['KC_BALIKPAPAN_BARU', 'Warung Daun Kalimantan',       430, 4.5, true,   45000000, 'FnB'],
  ['KC_BALIKPAPAN_BARU', 'Pizza Hut Balikpapan',        3200, 4.1, false, 260000000, 'FnB'],
  ['KC_BALIKPAPAN_BARU', 'KFC Balikpapan Baru',         4100, 4.0, false, 380000000, 'FnB'],
  ['KC_BALIKPAPAN_BARU', 'Tong Tji Tea House',           870, 4.4, false,  70000000, 'FnB'],

  // ── KC AHMAD YANI ─────────────────────────────────────────────────────────
  ['KC_AHMAD_YANI', 'Warung Kopi Phoenam Balikpapan',    780, 4.5, false,  65000000, 'FnB'],
  ['KC_AHMAD_YANI', 'Nasi Kuning Bu Har',               1540, 4.6, true,   80000000, 'FnB'],
  ['KC_AHMAD_YANI', 'Mie Gacoan Balikpapan',            5200, 4.3, true,  310000000, 'FnB'],

  // ── KC KARANG JATI ────────────────────────────────────────────────────────
  ['KC_KARANG_JATI', 'Warung Qita Sungai Ampal',         280, 4.6, true,   40000000, 'FnB'],
  ['KC_KARANG_JATI', 'Sambel Layah Balikpapan',         1200, 4.3, false,  85000000, 'FnB'],
  ['KC_KARANG_JATI', 'Nasi Padang Sederhana Karang Jati', 1680, 4.2, false, 90000000, 'FnB'],

  // ── KC MUARA RAPAK ────────────────────────────────────────────────────────
  ['KC_MUARA_RAPAK', 'Kedai The Pan Kilo 8',             320, 4.5, true,   38000000, 'FnB'],
  ['KC_MUARA_RAPAK', 'Ayam Goreng Pak Ndut',             890, 4.4, false,  70000000, 'FnB'],
  ['KC_MUARA_RAPAK', 'Bakso Lapangan Tembak Muara Rapak', 2100, 4.3, false, 130000000, 'FnB'],

  // ── KC TELKOM DIVRE VI ────────────────────────────────────────────────────
  ['KC_TELKOM_DIVRE', 'Black Canyon Coffee Balikpapan',  2100, 4.2, false, 180000000, 'FnB'],
  ['KC_TELKOM_DIVRE', 'Warung Kopi Phoenam Telkom',       560, 4.5, false,  50000000, 'FnB'],
  ['KC_TELKOM_DIVRE', 'Bebek Goreng H. Slamet Balikpapan', 1340, 4.4, false, 95000000, 'FnB'],

  // ── KC SOEKARNO HATTA ─────────────────────────────────────────────────────
  ['KC_SOEKARNO_HATTA', 'McDonald\'s Balikpapan Airport', 5600, 3.9, false, 420000000, 'FnB'],
  ['KC_SOEKARNO_HATTA', 'Kopi Kenangan Soekarno Hatta',  1200, 4.3, true,  110000000, 'FnB'],
  ['KC_SOEKARNO_HATTA', 'Pondok Nelayan Manggar',         780, 4.4, false,  75000000, 'FnB'],

  // ── KC BATAKAN ────────────────────────────────────────────────────────────
  ['KC_BATAKAN', 'Pantai Manggar Beach Café',            1100, 4.4, true,   90000000, 'FnB'],
  ['KC_BATAKAN', 'Kedai Pondok Nelayan Batakan',          920, 4.3, false,  70000000, 'FnB'],

  // ── KC SEPAKU (area IKN) ──────────────────────────────────────────────────
  ['KC_SEPAKU', 'Kafe Titik Nol IKN',                    560, 4.7, true,   65000000, 'FnB'],
  ['KC_SEPAKU', 'Rumah Makan Melayu IKN',                340, 4.4, false,  40000000, 'FnB'],
  ['KC_SEPAKU', 'Warung Pak Camat Sepaku',                210, 4.5, false,  30000000, 'FnB'],

  // ── KC PENAJEM PASER UTARA ────────────────────────────────────────────────
  ['KC_PENAJEM_PASER', 'Seafood 99 Penajam',             480, 4.3, false,  55000000, 'FnB'],
  ['KC_PENAJEM_PASER', 'Kopi Kawan Penajam',             230, 4.5, true,   28000000, 'FnB'],

  // ── KC TANJUNG REDEB (Berau) ──────────────────────────────────────────────
  ['KC_TANJUNG_REDEB', 'Kepiting Soka Berau',            640, 4.5, true,   70000000, 'FnB'],
  ['KC_TANJUNG_REDEB', 'Warung Ikan Bakar Berau',        870, 4.3, false,  60000000, 'FnB'],

  // ── KC TARAKAN ────────────────────────────────────────────────────────────
  ['KC_TARAKAN_YOS', 'Kepiting Tarakan Seafood',          990, 4.4, false,  85000000, 'FnB'],
  ['KC_TARAKAN_YOS', 'Kopi Tiam 88 Tarakan',             560, 4.6, true,   55000000, 'FnB'],
  ['KC_TARAKAN_SIMPANG', 'Warung Bubur Kepiting Tarakan', 430, 4.5, false,  50000000, 'FnB'],
]

const FOOD_PHOTOS = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
]

function randCoord(base: number, range = 0.008) {
  return base + (Math.random() - 0.5) * range
}

async function main() {
  console.log('➕ Menambahkan merchant baru hasil riset...\n')

  const branches = await prisma.branch.findMany()
  const branchMap = Object.fromEntries(branches.map(b => [b.code, b]))

  let added = 0
  let skipped = 0

  for (let i = 0; i < newMerchants.length; i++) {
    const [branchCode, name, reviews, rating, isViral, estVolume, category] = newMerchants[i]
    const branch = branchMap[branchCode]

    if (!branch) {
      console.log(`  ⚠ Branch tidak ditemukan: ${branchCode}`)
      skipped++
      continue
    }

    // Cek apakah merchant dengan nama sama sudah ada
    const existing = await prisma.merchant.findFirst({ where: { name, branchId: branch.id } })
    if (existing) {
      console.log(`  ↩ Skip (sudah ada): ${name}`)
      skipped++
      continue
    }

    const lat = randCoord(branch.lat)
    const lng = randCoord(branch.lng)
    const nameEncoded = encodeURIComponent(`${name} ${branch.city}`)

    await prisma.merchant.create({
      data: {
        name,
        category,
        lat,
        lng,
        googleRating:    rating,
        totalReviews:    reviews,
        isViralTikTok:   isViral,
        estimatedVolume: estVolume,
        photoUrl:        FOOD_PHOTOS[i % FOOD_PHOTOS.length],
        googleMapsUrl:   `https://www.google.com/maps/search/?api=1&query=${nameEncoded}`,
        status:          'AVAILABLE',
        branchId:        branch.id,
        lastScraped:     new Date(),
        address:         `Area ${branch.city}`,
        priceRange:      estVolume > 200000000 ? '$$$' : estVolume > 80000000 ? '$$' : '$',
      },
    })

    console.log(`  ✓ [${branch.name}] ${name} — ⭐${rating} (${reviews} ulasan)${isViral ? ' 🔥TikTok' : ''}`)
    added++
  }

  console.log(`\n✅ Selesai! ${added} merchant ditambahkan, ${skipped} dilewati.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
