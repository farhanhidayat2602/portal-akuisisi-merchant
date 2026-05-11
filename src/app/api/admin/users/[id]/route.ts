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

  const body = await req.json()
  const { name, email, role, branchId, password } = body

  const data: any = {}
  if (name)     data.name     = name
  if (email)    data.email    = email
  if (role)     data.role     = role
  data.branchId = branchId || null
  if (password) data.password = await bcrypt.hash(password, 10)

  // Prevent demoting yourself
  if (params.id === session.user.id && role === 'SALES') {
    return NextResponse.json({ error: 'Tidak bisa mengubah role diri sendiri' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true, username: true, name: true, email: true,
      role: true, points: true, branchId: true,
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
