import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'SALES' },
      select: {
        id: true,
        name: true,
        username: true,
        points: true,
        branch: { select: { name: true, city: true } },
        _count: { select: { visits: true } },
        visits: {
          where: { result: 'INTERESTED' },
          select: { id: true },
        },
      },
      orderBy: { points: 'desc' },
    })

    const ranked = users.map((u, idx) => ({
      rank: idx + 1,
      id: u.id,
      name: u.name,
      username: u.username,
      branch: u.branch?.name,
      city: u.branch?.city,
      points: u.points,
      totalVisits: u._count.visits,
      interested: u.visits.length,
    }))

    return NextResponse.json(ranked)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
