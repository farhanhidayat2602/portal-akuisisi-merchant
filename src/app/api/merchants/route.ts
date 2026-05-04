import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId  = searchParams.get('branchId')
    const status    = searchParams.get('status')
    const search    = searchParams.get('search')
    const viral     = searchParams.get('viral')

    const where: any = {}
    if (branchId) where.branchId = branchId
    if (status)   where.status   = status
    if (viral === 'true') where.isViralTikTok = true
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Clean expired locks
    await prisma.merchantLock.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    const merchants = await prisma.merchant.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, city: true } },
        lock: { include: { user: { select: { name: true, username: true } } } },
        visits: {
          orderBy: { visitedAt: 'desc' },
          take: 1,
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: [{ totalReviews: 'desc' }, { googleRating: 'desc' }],
    })

    // Update status based on active locks
    const updated = merchants.map(m => ({
      ...m,
      status: m.lock ? 'LOCKED' : m.status,
    }))

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, category, address, lat, lng, googleRating, totalReviews,
            estimatedVolume, isViralTikTok, branchId: bodyBranchId, phone, ownerName, priceRange, googleMapsUrl } = body

    // SALES can only add to their own branch; ADMIN can specify any branch
    const branchId = session.user.role === 'ADMIN'
      ? (bodyBranchId ?? session.user.branchId)
      : session.user.branchId

    if (!name || !branchId) {
      return NextResponse.json({ error: 'name dan branchId wajib diisi' }, { status: 400 })
    }

    // SALES cannot add to another branch
    if (session.user.role !== 'ADMIN' && bodyBranchId && bodyBranchId !== session.user.branchId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } })
    if (!branch) return NextResponse.json({ error: 'Branch tidak ditemukan' }, { status: 404 })

    // Koordinat default = di sekitar branch jika tidak diisi
    const merchantLat = lat ?? (branch.lat + (Math.random() - 0.5) * 0.008)
    const merchantLng = lng ?? (branch.lng + (Math.random() - 0.5) * 0.008)
    const nameEncoded = encodeURIComponent(`${name} ${branch.city}`)

    const merchant = await prisma.merchant.create({
      data: {
        name,
        category:        category || 'FnB',
        address:         address || `Area ${branch.city}`,
        lat:             merchantLat,
        lng:             merchantLng,
        googleRating:    googleRating ? parseFloat(googleRating) : null,
        totalReviews:    totalReviews ? parseInt(totalReviews) : null,
        estimatedVolume: estimatedVolume ? parseFloat(estimatedVolume) : null,
        isViralTikTok:   isViralTikTok ?? false,
        phone:           phone || null,
        ownerName:       ownerName || null,
        priceRange:      priceRange || '$$',
        status:          'AVAILABLE',
        branchId,
        lastScraped:     new Date(),
        googleMapsUrl:   googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${nameEncoded}`,
        photoUrl:        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
      },
    })

    return NextResponse.json({ success: true, merchant })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal menambahkan merchant' }, { status: 500 })
  }
}
