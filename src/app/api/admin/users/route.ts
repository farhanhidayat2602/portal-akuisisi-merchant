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
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true, username: true, name: true, email: true,
      role: true, points: true, branchId: true,
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
  const body = await req.json()
  const { username, name, email, password, role, branchId } = body

  if (!username || !name || !email || !password) {
    return NextResponse.json({ error: 'Field username, name, email, password wajib diisi' }, { status: 400 })
  }

  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  })
  if (exists) {
    return NextResponse.json({ error: 'Username atau email sudah digunakan' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      username,
      name,
      email,
      password: hashed,
      role: role ?? 'SALES',
      branchId: branchId || null,
      points: 0,
    },
    select: {
      id: true, username: true, name: true, email: true,
      role: true, points: true, branchId: true,
      branch: { select: { id: true, name: true, city: true } },
      createdAt: true,
    },
  })
  return NextResponse.json(user, { status: 201 })
}
