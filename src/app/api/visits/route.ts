import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { merchantId, result, notes, rejectReason, followUpDate, isHardReject, estVolume } = body

    if (!merchantId || !result) {
      return NextResponse.json({ error: 'merchantId and result are required' }, { status: 400 })
    }

    // Create visit
    const visit = await prisma.visit.create({
      data: {
        merchantId,
        userId: session.user.id,
        result,
        notes,
        rejectReason,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        isHardReject: isHardReject ?? false,
        estVolume,
      },
    })

    // Update merchant status based on result
    let newStatus: string
    let doNotVisitUntil: Date | null = null

    if (result === 'INTERESTED') {
      newStatus = 'INTERESTED'
    } else if (result === 'FOLLOW_UP') {
      newStatus = 'FOLLOW_UP'
    } else {
      newStatus = isHardReject ? 'DO_NOT_VISIT' : 'REJECTED'
      if (isHardReject) {
        doNotVisitUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    }

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        status: newStatus,
        doNotVisitUntil,
      },
    })

    // Release lock
    await prisma.merchantLock.deleteMany({ where: { merchantId, userId: session.user.id } })

    // Award points
    const pointsMap: Record<string, number> = {
      INTERESTED: 50,
      FOLLOW_UP:  10,
      REJECTED:    5,
    }
    const pts = pointsMap[result] ?? 5
    await prisma.user.update({
      where: { id: session.user.id },
      data: { points: { increment: pts } },
    })

    return NextResponse.json({ success: true, visit, pointsEarned: pts })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const merchantId = searchParams.get('merchantId')
    const userId     = searchParams.get('userId')

    const visits = await prisma.visit.findMany({
      where: {
        ...(merchantId && { merchantId }),
        ...(userId && { userId }),
        ...(!userId && session.user.role !== 'ADMIN' && { userId: session.user.id }),
      },
      include: {
        user:     { select: { name: true, username: true } },
        merchant: { select: { id: true, name: true } },
      },
      orderBy: { visitedAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(visits)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
