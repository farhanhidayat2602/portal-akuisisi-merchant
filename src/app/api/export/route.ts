import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function toCSV(rows: any[][], headers: string[]): string {
  const escape = (v: any) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [headers.join(','), ...rows.map(r => r.map(escape).join(','))]
  return lines.join('\r\n')
}

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

    const headers = [
      'Nama Merchant', 'Cabang', 'Kota', 'Kategori', 'Alamat',
      'Rating Google', 'Jumlah Ulasan', 'Est. Volume (Rp)',
      'Status', 'Viral TikTok', 'Telepon', 'Nama Pemilik',
      'Kunjungan Terakhir Oleh', 'Tanggal Kunjungan Terakhir',
    ]

    const rows = merchants.map(m => [
      m.name,
      m.branch?.name ?? '',
      m.branch?.city ?? '',
      m.category,
      m.address ?? '',
      m.googleRating ?? '',
      m.totalReviews ?? '',
      m.estimatedVolume ?? '',
      m.status,
      m.isViralTikTok ? 'Ya' : 'Tidak',
      m.phone ?? '',
      m.ownerName ?? '',
      m.visits[0]?.user?.name ?? '',
      m.visits[0]?.visitedAt ? new Date(m.visits[0].visitedAt).toLocaleDateString('id-ID') : '',
    ])

    const csv = toCSV(rows, headers)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="merchant-${new Date().toISOString().slice(0,10)}.csv"`,
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

    const headers = [
      'Tanggal', 'Sales', 'Merchant', 'Cabang',
      'Hasil', 'Hard Reject', 'Est. Volume (Rp)',
      'Follow Up Tanggal', 'Catatan', 'Alasan Tolak',
    ]

    const rows = visits.map(v => [
      new Date(v.visitedAt).toLocaleDateString('id-ID'),
      v.user?.name ?? '',
      v.merchant?.name ?? '',
      v.merchant?.branch?.name ?? '',
      v.result,
      v.isHardReject ? 'Ya' : 'Tidak',
      v.estVolume ?? '',
      v.followUpDate ? new Date(v.followUpDate).toLocaleDateString('id-ID') : '',
      v.notes ?? '',
      v.rejectReason ?? '',
    ])

    const csv = toCSV(rows, headers)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="kunjungan-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
