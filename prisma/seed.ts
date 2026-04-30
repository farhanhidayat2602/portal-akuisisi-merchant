import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const branches = [
  { code: 'KC_KLANDASAN',          name: 'KC Klandasan',            city: 'Balikpapan',      lat: -1.2780, lng: 116.8286 },
  { code: 'KC_SUPRAPTO',           name: 'KC Suprapto',             city: 'Balikpapan',      lat: -1.2683, lng: 116.8296 },
  { code: 'KC_AHMAD_YANI',         name: 'KC Ahmad Yani',           city: 'Balikpapan',      lat: -1.2600, lng: 116.8411 },
  { code: 'KC_SUDIRMAN',           name: 'KC Sudirman',             city: 'Balikpapan',      lat: -1.2640, lng: 116.8329 },
  { code: 'KC_TANAH_GROGOT',       name: 'KC Tanah Grogot',         city: 'Paser',           lat: -1.9167, lng: 116.2167 },
  { code: 'KC_BALIKPAPAN_BARU',    name: 'KC Balikpapan Baru',      city: 'Balikpapan',      lat: -1.2408, lng: 116.8502 },
  { code: 'KC_PENAJEM_PASER',      name: 'KC Penajem Paser Utara',  city: 'PPU',             lat: -1.3517, lng: 116.4167 },
  { code: 'KC_KARANG_JATI',        name: 'KC Karang Jati',          city: 'Balikpapan',      lat: -1.2511, lng: 116.8349 },
  { code: 'KC_BATAKAN',            name: 'KC Batakan',              city: 'Balikpapan',      lat: -1.3117, lng: 116.8205 },
  { code: 'KC_TELKOM_DIVRE',       name: 'KC Telkom Divre VI',      city: 'Balikpapan',      lat: -1.2634, lng: 116.8504 },
  { code: 'KC_MUARA_RAPAK',        name: 'KC Muara Rapak',          city: 'Balikpapan',      lat: -1.2079, lng: 116.8384 },
  { code: 'KC_SUPERBLOCK',         name: 'KC Superblock',           city: 'Balikpapan',      lat: -1.2554, lng: 116.8447 },
  { code: 'KC_TANJUNG_REDEB',      name: 'KC Tanjung Redeb',        city: 'Berau',           lat: 2.1333,  lng: 117.5000 },
  { code: 'KC_TARAKAN_YOS',        name: 'KC Tarakan Yos Sudarso',  city: 'Tarakan',         lat: 3.3166,  lng: 117.5789 },
  { code: 'KC_TARAKAN_SIMPANG',    name: 'KC Tarakan Simpang Tiga', city: 'Tarakan',         lat: 3.3100,  lng: 117.5700 },
  { code: 'KC_NUNUKAN',            name: 'KC Nunukan',              city: 'Nunukan',         lat: 4.1373,  lng: 117.6682 },
  { code: 'KC_PULAU_BUNYU',        name: 'KC Pulau Bunyu',          city: 'Pulau Bunyu',     lat: 3.4667,  lng: 117.8667 },
  { code: 'KC_TANJUNG_SELOR',      name: 'KC Tajung Selor',         city: 'Tanjung Selor',   lat: 2.8291,  lng: 117.3733 },
  { code: 'KC_MALINAU',            name: 'KC Malinau',              city: 'Malinau',         lat: 3.5847,  lng: 116.6289 },
  { code: 'KC_BATU_KAJANG',        name: 'KC Batu Kajang',          city: 'Paser',           lat: -1.9547, lng: 115.9833 },
  { code: 'KC_SEPAKU',             name: 'KC Sepaku',               city: 'PPU (IKN)',       lat: -1.1847, lng: 116.9169 },
  { code: 'KC_SOEKARNO_HATTA',     name: 'KC Soekarno Hatta',       city: 'Balikpapan',      lat: -1.2265, lng: 116.8615 },
  { code: 'KC_SIMPANG_PAIT',       name: 'KC Simpang Pait',         city: 'Paser',           lat: -1.8947, lng: 115.9833 },
  { code: 'KC_BABULU_DARAT',       name: 'KC Babulu darat',         city: 'PPU',             lat: -1.7500, lng: 116.2000 },
  { code: 'KC_PASE_KUARO',         name: 'KC Pase Kuaro',           city: 'Paser',           lat: -1.9700, lng: 116.2400 },
  { code: 'KC_TANJSEL_SENKAWIT',   name: 'KC Tanjung Selor Senkawit', city: 'Tanjung Selor', lat: 2.8400,  lng: 117.3900 },
  { code: 'KC_PULAU_SEBATIK',      name: 'KC Pulau Sebatik',        city: 'Nunukan',         lat: 4.2000,  lng: 117.7500 },
]

function merchantCoord(baseLat: number, baseLng: number, index: number) {
  const offsets = [
    [0.003, -0.002], [-0.002, 0.004], [0.001, 0.003],
    [-0.004, -0.001], [0.005, 0.002], [-0.001, -0.005],
    [0.002, -0.004], [-0.003, 0.003], [0.004, 0.001],
  ]
  const [dlat, dlng] = offsets[index % offsets.length]
  return { lat: baseLat + dlat, lng: baseLng + dlng }
}

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
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3df9?w=600&q=80',
  'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&q=80',
  'https://images.unsplash.com/photo-1527515637462-cff94aca208f?w=600&q=80',
  'https://images.unsplash.com/photo-1544025162-d76538f0baf5?w=600&q=80',
  'https://images.unsplash.com/photo-1587253688817-4cf7f39e89c7?w=600&q=80',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
]

// Seed merchants: [branchCode, name, reviews, rating, isViralTikTok, estVolume]
const merchantSeeds: [string, string, number, number, boolean, number][] = [
  // KC Klandasan
  ['KC_KLANDASAN', 'Coto Makassar H. Kasim',              2630, 4.4, false, 180000000],
  ['KC_KLANDASAN', 'Biru Laut Seafood Restaurant',         4223, 4.4, true,  250000000],
  ['KC_KLANDASAN', 'Kampoeng Pasir Balikpapan',            2039, 4.6, true,  200000000],
  ['KC_KLANDASAN', 'Kedai Sambel Bawang Cik Nur',          890,  4.7, true,  75000000],
  ['KC_KLANDASAN', 'Soto Sapi Pak Haji Klandasan',         1240, 4.5, false, 90000000],

  // KC Suprapto
  ['KC_SUPRAPTO', 'RM. Haur Gading Balikpapan',           1115, 4.4, false, 100000000],
  ['KC_SUPRAPTO', 'Kopi Lima, LM',                         261,  4.8, true,  60000000],
  ['KC_SUPRAPTO', 'Depot Akok',                            453,  4.5, false, 70000000],
  ['KC_SUPRAPTO', 'Coffee Toffee Balikpapan Suprapto',     780,  4.3, false, 80000000],

  // KC Ahmad Yani
  ['KC_AHMAD_YANI', 'Shishi Ramen',                       1039, 4.7, true,  110000000],
  ['KC_AHMAD_YANI', 'Bondy Bakery & Restaurant',           2801, 4.6, false, 190000000],
  ['KC_AHMAD_YANI', 'Notre.',                              663,  4.4, true,  80000000],
  ['KC_AHMAD_YANI', 'Bakpao Telo Bu Sri',                  540,  4.6, true,  55000000],

  // KC Sudirman
  ['KC_SUDIRMAN', 'Kedai Laut Seafood Mayjend Sutoyo',    1854, 4.4, false, 150000000],
  ['KC_SUDIRMAN', 'Laziz Arabic Resto',                    1346, 4.7, true,  120000000],
  ['KC_SUDIRMAN', 'OPEN HOUSE Balikpapan',                 1193, 4.3, false, 110000000],
  ['KC_SUDIRMAN', 'Kopi Janji Jiwa Balikpapan',            2100, 4.5, true,  160000000],

  // KC Tanah Grogot
  ['KC_TANAH_GROGOT', 'Kedai Sampan Tradisional',         1175, 4.3, false, 90000000],
  ['KC_TANAH_GROGOT', 'Redsea Seafood Resto',              191,  4.4, false, 45000000],
  ['KC_TANAH_GROGOT', 'Waroeng Lurus.in',                  98,   5.0, true,  35000000],

  // KC Balikpapan Baru
  ['KC_BALIKPAPAN_BARU', 'Potokoffie Reserve',            2083, 4.9, true,  175000000],
  ['KC_BALIKPAPAN_BARU', 'All Tiam',                      1301, 4.5, true,  130000000],
  ['KC_BALIKPAPAN_BARU', 'Rm. Melati Ikan Bakar',          880,  4.3, false, 85000000],
  ['KC_BALIKPAPAN_BARU', 'Steak 21 Balikpapan',            3200, 4.4, false, 220000000],
  ['KC_BALIKPAPAN_BARU', 'Solaria Balikpapan Square',      4100, 4.2, false, 280000000],

  // KC Penajem Paser Utara
  ['KC_PENAJEM_PASER', 'Lalapan Sambal Gami hj Arni',     256,  4.5, false, 40000000],
  ['KC_PENAJEM_PASER', 'Denjavas',                         397,  4.2, true,  50000000],
  ['KC_PENAJEM_PASER', 'RM Kampoeng Pelangi',              290,  3.6, false, 35000000],

  // KC Karang Jati
  ['KC_KARANG_JATI', 'Kedai Kopi Hitam Manis',            1014, 4.6, true,  95000000],
  ['KC_KARANG_JATI', 'Senja Coffe',                        936,  4.5, true,  90000000],
  ['KC_KARANG_JATI', 'Bubur Ayam Samarinda',               400,  4.5, false, 55000000],
  ['KC_KARANG_JATI', 'Warung Ayam Geprek Bensu KJ',        1560, 4.4, true,  120000000],
  ['KC_KARANG_JATI', 'Warung Sate Taichan Viral',          870,  4.7, true,  80000000],

  // KC Batakan
  ['KC_BATAKAN', 'Meatshop and R&B Grill Balikpapan',     1253, 4.7, true,  130000000],
  ['KC_BATAKAN', 'Coco Beach café & Eatery',               316,  4.3, true,  60000000],
  ['KC_BATAKAN', 'Restoran Oemah Anggrek',                 849,  4.5, false, 90000000],
  ['KC_BATAKAN', 'Kopi Tuku Batakan',                      450,  4.8, true,  70000000],

  // KC Telkom Divre VI
  ['KC_TELKOM_DIVRE', 'Roti Tiam Bakery and Café',        2945, 4.5, false, 200000000],
  ['KC_TELKOM_DIVRE', 'Bakso Mie Ayam Pangsit Wardoyo',   4943, 4.5, false, 280000000],
  ['KC_TELKOM_DIVRE', 'Liberty Slice Pizza',               471,  4.8, true,  75000000],
  ['KC_TELKOM_DIVRE', 'Nasi Goreng Kambing Pak Agus',      1100, 4.4, false, 95000000],

  // KC Muara Rapak
  ['KC_MUARA_RAPAK', 'Bakso & Mie Ayam Gendon SBC',       1394, 4.6, false, 125000000],
  ['KC_MUARA_RAPAK', 'Mie Yamien Kajojo 1945',             1147, 4.6, false, 110000000],
  ['KC_MUARA_RAPAK', 'Brewforia',                          466,  5.0, true,  80000000],
  ['KC_MUARA_RAPAK', 'Seafood 88 Muara Rapak',             880,  4.3, false, 90000000],
  ['KC_MUARA_RAPAK', 'Martabak Mas Edy',                   720,  4.5, false, 65000000],

  // KC Superblock
  ['KC_SUPERBLOCK', 'Dandito Restaurant',                  8425, 4.6, true,  450000000],
  ['KC_SUPERBLOCK', 'Rumah Makan Torani',                  6248, 4.5, false, 380000000],
  ['KC_SUPERBLOCK', 'JJ Steak & Gelato',                   6901, 4.9, true,  420000000],
  ['KC_SUPERBLOCK', 'Mie Aceh Djamilah',                   1890, 4.3, false, 150000000],

  // KC Tanjung Redeb
  ['KC_TANJUNG_REDEB', 'SC Café & Restaurant',             498,  4.3, false, 60000000],
  ['KC_TANJUNG_REDEB', 'Samudra Seafood',                  604,  4.5, false, 75000000],
  ['KC_TANJUNG_REDEB', 'RM. Celebes',                      983,  4.3, false, 90000000],

  // KC Tarakan Yos Sudarso
  ['KC_TARAKAN_YOS', 'Lemakan Samudra',                   1068, 4.6, false, 95000000],
  ['KC_TARAKAN_YOS', 'The Uncle Coffe & Kitchen',          612,  4.4, true,  70000000],
  ['KC_TARAKAN_YOS', 'The Kopitiam Tarakan',               906,  4.4, false, 85000000],

  // KC Tarakan Simpang Tiga
  ['KC_TARAKAN_SIMPANG', 'Up Hill café and resto Tarakan', 565,  4.3, false, 65000000],
  ['KC_TARAKAN_SIMPANG', 'Galileo Café Tarakan',           1246, 4.4, true,  100000000],
  ['KC_TARAKAN_SIMPANG', 'Go Yumcha',                      181,  4.5, true,  45000000],

  // KC Nunukan
  ['KC_NUNUKAN', 'Rumah Makan Bamboe Kuning',             331,  4.3, false, 50000000],
  ['KC_NUNUKAN', 'Warung HIEK khas Solo',                  379,  4.1, false, 45000000],
  ['KC_NUNUKAN', 'Djaya Coffe and Roestery',               77,   4.6, true,  30000000],

  // KC Pulau Bunyu
  ['KC_PULAU_BUNYU', 'Oxide Coffe',                       38,   4.8, true,  20000000],
  ['KC_PULAU_BUNYU', 'Hologram Café',                      39,   4.5, true,  18000000],
  ['KC_PULAU_BUNYU', 'Triple NNN Café',                    4,    5.0, false, 10000000],

  // KC Tajung Selor
  ['KC_TANJUNG_SELOR', 'Urban Space - Rooftop',           742,  4.3, true,  80000000],
  ['KC_TANJUNG_SELOR', 'Bakso Enggal Rasa',               720,  4.5, false, 70000000],
  ['KC_TANJUNG_SELOR', 'GogiYuk',                          242,  4.7, true,  50000000],

  // KC Malinau
  ['KC_MALINAU', 'Kayangan Café And Resto',               192,  4.4, false, 40000000],
  ['KC_MALINAU', 'Ratio Coffe',                            75,   4.5, true,  25000000],
  ['KC_MALINAU', 'Evermore coffe and eatry',               37,   4.1, false, 18000000],

  // KC Batu Kajang
  ['KC_BATU_KAJANG', 'Kebuli dan Nasi Goreng Ali Baba',   47,   4.7, false, 22000000],
  ['KC_BATU_KAJANG', 'Berlyn Coffee',                      3,    5.0, true,  8000000],
  ['KC_BATU_KAJANG', 'JULIE The Half Plate',               89,   4.7, true,  30000000],

  // KC Sepaku (area IKN)
  ['KC_SEPAKU', 'Bebek Sunan IKN Nusantara',              293,  4.8, true,  55000000],
  ['KC_SEPAKU', 'Alam Lestari Resto',                      196,  4.8, false, 45000000],
  ['KC_SEPAKU', 'Aura Coffe Space',                        166,  4.8, true,  40000000],

  // KC Soekarno Hatta
  ['KC_SOEKARNO_HATTA', 'Soto Ayam Lamongan Kilo 10',     3327, 4.3, false, 210000000],
  ['KC_SOEKARNO_HATTA', 'Warung Padang UPIK',              1842, 4.3, false, 150000000],
  ['KC_SOEKARNO_HATTA', 'Pop Steak',                       138,  4.2, true,  45000000],
  ['KC_SOEKARNO_HATTA', 'Kedai Nasi Bebek Pak Dahlan',     890,  4.5, false, 80000000],

  // KC Simpang Pait
  ['KC_SIMPANG_PAIT', 'RM Alpi Pani',                     404,  4.3, false, 55000000],
  ['KC_SIMPANG_PAIT', 'Mie Ayam Solo',                     744,  4.2, false, 65000000],
  ['KC_SIMPANG_PAIT', 'Diari Kopi Longikis',               19,   3.9, false, 15000000],

  // KC Babulu Darat
  ['KC_BABULU_DARAT', 'PODOMORO Mie Ayam & Bakso',        266,  4.3, false, 40000000],
  ['KC_BABULU_DARAT', 'Pecel Asli Madiun Pak Bas',         78,   4.7, false, 25000000],
  ['KC_BABULU_DARAT', 'Bebek Goreng Mbah TO',              143,  4.7, false, 35000000],

  // KC Pase Kuaro
  ['KC_PASE_KUARO', 'Warung Gandul',                      1950, 4.2, false, 140000000],
  ['KC_PASE_KUARO', 'Kopiria Paser Kuaro',                 143,  4.5, true,  35000000],
  ['KC_PASE_KUARO', 'Warung Padang Sinar Minang',          184,  4.1, false, 40000000],

  // KC Tanjung Selor Senkawit
  ['KC_TANJSEL_SENKAWIT', 'Lepak Lomai Café & Resto',     343,  4.3, true,  50000000],
  ['KC_TANJSEL_SENKAWIT', 'Kuliner Tepi Kayan',           1101, 4.2, false, 90000000],
  ['KC_TANJSEL_SENKAWIT', 'Synonyms Coffe',               173,  4.8, true,  40000000],

  // KC Pulau Sebatik
  ['KC_PULAU_SEBATIK', 'Mr. Steak Indonesia',             38,   4.9, true,  20000000],
  ['KC_PULAU_SEBATIK', 'Hasanah café & Resto',            524,  4.5, false, 60000000],
  ['KC_PULAU_SEBATIK', 'The Sinar Café & Resto',           4,    5.0, false, 8000000],
]

async function main() {
  console.log('🌱 Seeding database...')

  // Create branches
  const branchMap: Record<string, string> = {}
  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: {},
      create: {
        code: b.code,
        name: b.name,
        city: b.city,
        lat: b.lat,
        lng: b.lng,
        address: `Jl. Utama No. 1, ${b.city}`,
      },
    })
    branchMap[b.code] = branch.id
    console.log(`  ✓ Branch: ${b.name}`)
  }

  // Create merchants
  const branchMerchantCount: Record<string, number> = {}
  let merchantIndex = 0
  for (const [branchCode, name, reviews, rating, isViral, estVolume] of merchantSeeds) {
    const branchId = branchMap[branchCode]
    if (!branchId) continue

    const branch = branches.find(b => b.code === branchCode)!
    const idx = branchMerchantCount[branchCode] ?? 0
    branchMerchantCount[branchCode] = idx + 1
    const { lat, lng } = merchantCoord(branch.lat, branch.lng, idx)

    const photoUrl = FOOD_PHOTOS[merchantIndex % FOOD_PHOTOS.length]
    const nameEncoded = encodeURIComponent(`${name} ${branch.city}`)

    await prisma.merchant.upsert({
      where: { id: `merchant_${merchantIndex}` },
      update: {},
      create: {
        id: `merchant_${merchantIndex}`,
        name,
        category: 'FnB',
        lat,
        lng,
        googleRating: rating,
        totalReviews: reviews,
        isViralTikTok: isViral,
        estimatedVolume: estVolume,
        photoUrl,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${nameEncoded}`,
        status: 'AVAILABLE',
        branchId,
        lastScraped: new Date(),
        address: `Area ${branch.city}`,
        priceRange: estVolume > 200000000 ? '$$$' : estVolume > 80000000 ? '$$' : '$',
      },
    })
    merchantIndex++
  }
  console.log(`  ✓ ${merchantIndex} merchants created`)

  // Create users
  const hashedPassword = await bcrypt.hash('mandiri123', 10)
  const adminPassword = await bcrypt.hash('admin2024', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Administrator',
      email: 'admin@bankmandiri.co.id',
      password: adminPassword,
      role: 'ADMIN',
      points: 0,
    },
  })

  const salesUsers = [
    { username: 'sales01', name: 'Andi Pratama',    email: 'andi.pratama@bankmandiri.co.id',    branchCode: 'KC_KLANDASAN',     points: 450 },
    { username: 'sales02', name: 'Budi Santoso',    email: 'budi.santoso@bankmandiri.co.id',    branchCode: 'KC_SUPRAPTO',      points: 320 },
    { username: 'sales03', name: 'Citra Dewi',      email: 'citra.dewi@bankmandiri.co.id',      branchCode: 'KC_SUPERBLOCK',    points: 680 },
    { username: 'sales04', name: 'Deni Kurniawan',  email: 'deni.kurniawan@bankmandiri.co.id',  branchCode: 'KC_AHMAD_YANI',    points: 210 },
    { username: 'sales05', name: 'Eka Rahayu',      email: 'eka.rahayu@bankmandiri.co.id',      branchCode: 'KC_BALIKPAPAN_BARU', points: 390 },
    { username: 'demo',    name: 'Demo Sales',      email: 'demo@bankmandiri.co.id',            branchCode: 'KC_SUPERBLOCK',    points: 150 },
  ]

  for (const u of salesUsers) {
    const branchId = branchMap[u.branchCode]
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: 'SALES',
        points: u.points,
        branchId,
      },
    })
    console.log(`  ✓ User: ${u.name}`)
  }

  console.log('\n✅ Database seeded successfully!')
  console.log('\n📋 Login Credentials:')
  console.log('   Admin  → username: admin    | password: admin2024')
  console.log('   Sales  → username: demo     | password: mandiri123')
  console.log('   Sales  → username: sales01  | password: mandiri123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
