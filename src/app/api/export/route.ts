import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'merchants'

  if (type === 'merchants') {
    const merchants = await prisma.merchant.findMany({
      include: {
        branch: { select: { name: true, city: true } },
        visits: {
          orderBy: { visitedAt: 'desc' },
          take: 1,
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: [{ totalReviews: 'desc' }],
    })

    const rows = merchants.map(m => ({
      'Nama Merchant':            m.name,
      'Cabang':                   m.branch?.name ?? '',
      'Kota':                     m.branch?.city ?? '',
      'Kategori':                 m.category,
      'Alamat':                   m.address ?? '',
      'Rating Google':            m.googleRating ?? '',
      'Jumlah Ulasan':            m.totalReviews ?? '',
      'Est. Volume (Rp)':         m.estimatedVolume ?? '',
      'Status':                   m.status,
      'Viral TikTok':             m.isViralTikTok ? 'Ya' : 'Tidak',
      'Telepon':                  m.phone ?? '',
      'Nama Pemilik':             m.ownerName ?? '',
      'Kunjungan Terakhir Oleh':  m.visits[0]?.user?.name ?? '',
      'Tanggal Kunjungan':        m.visits[0]?.visitedAt
                                    ? new Date(m.visits[0].visitedAt).toLocaleDateString('id-ID')
                                    : '',
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 30 }, { wch: 22 }, { wch: 15 }, { wch: 12 }, { wch: 30 },
      { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 12 },
      { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 18 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Data Merchant')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="merchant-${new Date().toISOString().slice(0,10)}.xlsx"`,
      },
    })
  }

  if (type === 'visits') {
    const visits = await prisma.visit.findMany({
      include: {
        merchant: { select: { name: true, branch: { select: { name: true } } } },
        user: { select: { name: true } },
      },
      orderBy: { visitedAt: 'desc' },
    })

    const edcLabel = (edc: string | null) => {
      if (edc === 'NONE')    return 'Belum punya EDC'
      if (edc === 'MANDIRI') return 'Sudah Mandiri'
      if (edc === 'OTHER')   return 'Bank lain'
      return ''
    }

    const rows = visits.map(v => ({
      'Tanggal':           new Date(v.visitedAt).toLocaleDateString('id-ID'),
      'Sales':             v.user?.name ?? '',
      'Merchant':          v.merchant?.name ?? '',
      'Cabang':            v.merchant?.branch?.name ?? '',
      'Hasil':             v.result,
      'Status EDC':        edcLabel(v.existingEDC),
      'Bank Existing':     v.existingBankName ?? '',
      'Hard Reject':       v.isHardReject ? 'Ya' : 'Tidak',
      'Est. Volume (Rp)':  v.estVolume ?? '',
      'Follow Up Tanggal': v.followUpDate
                             ? new Date(v.followUpDate).toLocaleDateString('id-ID')
                             : '',
      'Catatan':           v.notes ?? '',
      'Alasan Tolak':      v.rejectReason ?? '',
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 14 }, { wch: 20 }, { wch: 30 }, { wch: 22 },
      { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 12 },
      { wch: 16 }, { wch: 16 }, { wch: 30 }, { wch: 25 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Kunjungan')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="kunjungan-${new Date().toISOString().slice(0,10)}.xlsx"`,
      },
    })
  }

  if (type === 'ecosystem') {
    const allVisits = await prisma.visit.findMany({
      include: {
        merchant: { select: { name: true, branch: { select: { name: true } } } },
        user: { select: { name: true } },
      },
      orderBy: { visitedAt: 'desc' },
    })
    const visits = allVisits.filter(v => v.ecosystemData !== null)

    type EcoRow = Record<string, string | number>
    const rows: EcoRow[] = []

    for (const v of visits) {
      const eco = v.ecosystemData as { retail?: { name: string; relation: string; phone: string }[]; suppliers?: { businessName: string; ownerName: string; phone: string }[] } | null
      if (!eco) continue

      const base = {
        'Tanggal Kunjungan': new Date(v.visitedAt).toLocaleDateString('id-ID'),
        'Sales':             v.user?.name ?? '',
        'Nama Merchant':     v.merchant?.name ?? '',
        'Cabang':            v.merchant?.branch?.name ?? '',
      }

      for (const r of (eco.retail ?? [])) {
        if (!r.name && !r.phone) continue
        rows.push({
          ...base,
          'Tipe Lead':     'Retail (Owner/Keluarga)',
          'Nama':          r.name ?? '',
          'Hubungan':      r.relation ?? '',
          'Nama Pemilik':  '',
          'Nomor HP':      r.phone ?? '',
        })
      }

      for (const s of (eco.suppliers ?? [])) {
        if (!s.businessName && !s.phone) continue
        rows.push({
          ...base,
          'Tipe Lead':     'Supplier',
          'Nama':          s.businessName ?? '',
          'Hubungan':      '',
          'Nama Pemilik':  s.ownerName ?? '',
          'Nomor HP':      s.phone ?? '',
        })
      }
    }

    const wb = XLSX.utils.book_new()
    const ws = rows.length > 0
      ? XLSX.utils.json_to_sheet(rows)
      : XLSX.utils.aoa_to_sheet([['Tanggal Kunjungan','Sales','Nama Merchant','Cabang','Tipe Lead','Nama','Hubungan','Nama Pemilik','Nomor HP']])
    ws['!cols'] = [
      { wch: 16 }, { wch: 20 }, { wch: 28 }, { wch: 22 },
      { wch: 22 }, { wch: 25 }, { wch: 18 }, { wch: 22 }, { wch: 18 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Ekosistem Leads')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ekosistem-leads-${new Date().toISOString().slice(0,10)}.xlsx"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
