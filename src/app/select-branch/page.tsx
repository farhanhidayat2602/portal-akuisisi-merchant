'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, MapPin, ChevronRight, Search, LogOut, Star, Users } from 'lucide-react'
import { Branch } from '@/types'

export default function SelectBranchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/')
  }, [status, router])

  useEffect(() => {
    fetch('/api/branches')
      .then(r => r.json())
      .then(data => { setBranches(data); setLoading(false) })
  }, [])

  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, Branch[]>>((acc, b) => {
    const city = b.city
    if (!acc[city]) acc[city] = []
    acc[city].push(b)
    return acc
  }, {})

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Memuat cabang...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-mandiri-700 px-4 pt-10 pb-6 text-white">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-mandiri-yellow rounded-xl flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-mandiri-200">Selamat datang,</p>
                <p className="font-bold">{session?.user?.name}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 rounded-xl bg-mandiri-600 hover:bg-mandiri-800 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
          <h1 className="text-xl font-bold mb-1">Pilih Cabang Tujuan</h1>
          <p className="text-mandiri-200 text-sm">Pilih KC yang akan menjadi fokus kunjungan hari ini</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari cabang atau kota..."
            className="input pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Cabang', value: branches.length, icon: Building2 },
            { label: 'Total Merchant', value: branches.reduce((s, b) => s + (b._count?.merchants ?? 0), 0), icon: Star },
            { label: 'Kota', value: Object.keys(grouped).length, icon: MapPin },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className="text-xl font-bold text-mandiri-700">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Branch List */}
        {Object.entries(grouped).map(([city, cityBranches]) => (
          <div key={city} className="mb-5">
            <div className="flex items-center gap-2 mb-2.5">
              <MapPin size={13} className="text-mandiri-500" />
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">{city}</h2>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">{cityBranches.length} cabang</span>
            </div>
            <div className="space-y-2">
              {cityBranches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => router.push(`/dashboard/${branch.id}`)}
                  className="w-full card-hover p-4 flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 bg-mandiri-50 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-mandiri-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{branch.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} />
                      {branch.city}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-mandiri-700">{branch._count?.merchants ?? 0}</p>
                    <p className="text-xs text-slate-400">merchant</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Cabang tidak ditemukan</p>
            <p className="text-sm mt-1">Coba kata kunci lain</p>
          </div>
        )}
      </div>
    </div>
  )
}
