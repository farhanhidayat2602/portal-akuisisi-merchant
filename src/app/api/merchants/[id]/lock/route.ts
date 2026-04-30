import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Lock a merchant (anti-collision)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Clean expired locks first
    await prisma.merchantLock.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    const merchant = await prisma.merchant.findUnique({
      where: { id: params.id },
      include: { lock: { include: { user: { select: { name: true } } } } },
    })

    if (!merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })

    // Check if already locked by someone else
    if (merchant.lock && merchant.lock.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'ALREADY_LOCKED',
          message: `Merchant sedang dikunjungi oleh ${merchant.lock.user.name}`,
          lockedBy: merchant.lock.user.name,
        },
        { status: 409 }
      )
    }

    // Check if DO_NOT_VISIT
    if (merchant.status === 'DO_NOT_VISIT' || merchant.status === 'ACQUIRED') {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: `Merchant berstatus ${merchant.status}` },
        { status: 400 }
      )
    }

    // Upsert lock (expires in 4 hours)
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000)
    const lock = await prisma.merchantLock.upsert({
      where: { merchantId: params.id },
      update: { userId: session.user.id, lockedAt: new Date(), expiresAt },
      create: { merchantId: params.id, userId: session.user.id, expiresAt },
    })

    return NextResponse.json({ success: true, lock })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to lock merchant' }, { status: 500 })
  }
}

// Unlock a merchant
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.merchantLock.deleteMany({
      where: {
        merchantId: params.id,
        userId: session.user.id,
      },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to unlock' }, { status: 500 })
  }
}
