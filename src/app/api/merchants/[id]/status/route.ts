import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Quick status update (e.g., mark as ACQUIRED or reset to AVAILABLE)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { status } = await req.json()
    const allowed = ['AVAILABLE', 'ACQUIRED', 'DO_NOT_VISIT']
    if (!allowed.includes(status) && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    const merchant = await prisma.merchant.update({
      where: { id: params.id },
      data: {
        status,
        doNotVisitUntil: status === 'AVAILABLE' ? null : undefined,
      },
    })
    return NextResponse.json(merchant)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
