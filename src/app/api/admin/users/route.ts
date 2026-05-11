import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { username: 'asc' }],
    select: {
      id: true, username: true, name: true,
      role: true, points: true,
      branch: { select: { id: true, name: true, city: true } },
      createdAt: true,
    },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { username, password } = await req.json()

  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) {
    return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 })
  }

  // Auto-derive name and email from username
  const name  = username.replace(/_/g, ' ')
  const email = `${username.toLowerCase()}@bankmandiri.co.id`

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, name, email, password: hashed, role: 'SALES', points: 0 },
    select: {
      id: true, username: true, name: true,
      role: true, points: true,
      branch: { select: { id: true, name: true, city: true } },
      createdAt: true,
    },
  })
  return NextResponse.json(user, { status: 201 })
}
