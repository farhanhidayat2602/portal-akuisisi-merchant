import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Mapping: branch code → new username (format pic.<namacabang>)
const branchToUsername: Record<string, string> = {
  KC_KLANDASAN:        'pic.klandasan',
  KC_SUPRAPTO:         'pic.suprapto',
  KC_AHMAD_YANI:       'pic.ahmadyani',
  KC_SUDIRMAN:         'pic.sudirman',
  KC_BALIKPAPAN_BARU:  'pic.balikpapanbaru',
  KC_KARANG_JATI:      'pic.karangjati',
  KC_BATAKAN:          'pic.batakan',
  KC_TELKOM_DIVRE:     'pic.telkomdivre',
  KC_MUARA_RAPAK:      'pic.muararapak',
  KC_SUPERBLOCK:       'pic.superblock',
  KC_SOEKARNO_HATTA:   'pic.soekarnohatta',
  KC_SEPAKU:           'pic.sepaku',
  KC_TANAH_GROGOT:     'pic.tanahgrogot',
  KC_BATU_KAJANG:      'pic.batukajang',
  KC_SIMPANG_PAIT:     'pic.simpangpait',
  KC_PASE_KUARO:       'pic.pasekuaro',
  KC_PENAJEM_PASER:    'pic.penajeimpaser',
  KC_BABULU_DARAT:     'pic.babuludarat',
  KC_TANJUNG_REDEB:    'pic.tanjungredeb',
  KC_TARAKAN_YOS:      'pic.tarakanyos',
  KC_TARAKAN_SIMPANG:  'pic.tarakansimpang',
  KC_NUNUKAN:          'pic.nunukan',
  KC_PULAU_SEBATIK:    'pic.pulausebatik',
  KC_PULAU_BUNYU:      'pic.pulaubunyu',
  KC_TANJUNG_SELOR:    'pic.tanjungselor',
  KC_TANJSEL_SENKAWIT: 'pic.tanjselsenkawit',
  KC_MALINAU:          'pic.malinau',
}

async function main() {
  console.log('🔄 Update credentials semua user → pic123\n')

  const newPw = await bcrypt.hash('pic123', 10)

  // Update admin
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (admin) {
    await prisma.user.update({ where: { id: admin.id }, data: { password: newPw } })
    console.log('✓ admin  |  pw: pic123')
  } else {
    console.log('⚠ user admin tidak ditemukan — lewati')
  }

  // Update sales users by branch code (robust: tidak bergantung username lama)
  for (const [branchCode, newUsername] of Object.entries(branchToUsername)) {
    const branch = await prisma.branch.findUnique({ where: { code: branchCode } })
    if (!branch) {
      console.log(`⚠ branch ${branchCode} tidak ditemukan — lewati`)
      continue
    }

    const user = await prisma.user.findFirst({
      where: { branchId: branch.id, role: 'SALES' },
    })
    if (!user) {
      console.log(`⚠ user untuk branch ${branchCode} tidak ditemukan — lewati`)
      continue
    }

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username: newUsername,
          email:    `${newUsername}@bankmandiri.co.id`,
          password: newPw,
        },
      })
      console.log(`✓ ${user.username.padEnd(22)} → ${newUsername.padEnd(22)}  |  pw: pic123`)
    } catch (e: any) {
      console.log(`✗ Gagal update ${user.username}: ${e.message}`)
    }
  }

  console.log('\n✅ Selesai! Semua user sudah diupdate ke format pic.xxx / pic123')
  console.log('\n📋 Ringkasan Credentials:')
  console.log('   Admin → username: admin               | password: pic123')
  console.log('   Sales → username: pic.<namacabang>    | password: pic123')
  console.log('   Contoh: pic.klandasan / pic123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
