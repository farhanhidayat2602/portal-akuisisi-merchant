import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// This endpoint triggers a simulated scrape update.
// In production, this would call an actual Google Maps / TikTok scraping service.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log = await prisma.scrapingLog.create({
    data: {
      source: 'GOOGLE_MAPS',
      status: 'IN_PROGRESS',
    },
  })

  // Simulate async scraping (in production: call real scraper)
  try {
    // Update lastScraped timestamp for all merchants
    await prisma.merchant.updateMany({
      data: { lastScraped: new Date() },
    })

    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: {
        status: 'SUCCESS',
        newMerchants: 0,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Scraping completed. Database updated.',
      logId: log.id,
    })
  } catch (error) {
    await prisma.scrapingLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', error: String(error), completedAt: new Date() },
    })
    return NextResponse.json({ error: 'Scraping failed' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const logs = await prisma.scrapingLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(logs)
}
