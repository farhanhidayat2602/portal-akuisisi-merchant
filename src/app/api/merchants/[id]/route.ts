import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Clean expired locks
    await prisma.merchantLock.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    const merchant = await prisma.merchant.findUnique({
      where: { id: params.id },
      include: {
        branch: true,
        lock: { include: { user: { select: { id: true, name: true, username: true } } } },
        visits: {
          orderBy: { visitedAt: 'desc' },
          include: { user: { select: { id: true, name: true, username: true } } },
        },
      },
    })

    if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      ...merchant,
      status: merchant.lock ? 'LOCKED' : merchant.status,
    })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const merchant = await prisma.merchant.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(merchant)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
