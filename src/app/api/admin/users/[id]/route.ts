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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { password } = await req.json()
  if (!password?.trim()) {
    return NextResponse.json({ error: 'Password baru wajib diisi' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data:  { password: await bcrypt.hash(password, 10) },
    select: {
      id: true, username: true, name: true,
      role: true, points: true,
      branch: { select: { id: true, name: true, city: true } },
      createdAt: true,
    },
  })
  return NextResponse.json(user)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
