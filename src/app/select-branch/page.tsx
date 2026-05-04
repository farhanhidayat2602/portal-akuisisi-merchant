'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Building2, MapPin, ChevronRight, Search, LogOut,
  Calculator, Trophy, Store, TrendingUp, Zap, Shield,
} from 'lucide-react'
import { Branch } from '@/types'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function SelectBranchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [branches, setBranches]   = useState<Branch[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [totalMerchants, setTotalMerchants] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/')
  }, [status, router])

  useEffect(() => {
    Promise.all([
      fetch('/api/branches').then(r => r.json()),
      fetch('/api/merchants').then(r => r.json()),
    ]).then(([branchData, merchantData]) => {
      setBranches(Array.isArray(branchData) ? branchData : [])
      setTotalMerchants(Array.isArray(merchantData) ? merchantData.length : 0)
      setLoading(false)
    })
  }, [])

  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, Branch[]>>((acc, b) => {
    if (!acc[b.city]) acc[b.city] = []
    acc[b.city].push(b)
    return acc
  }, {})

  const totalCities = Object.keys(
    branches.reduce<Record<string, boolean>>((a, b) => ({ ...a, [b.city]: true }), {})
  ).length

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 11) return 'Selamat Pagi'
    if (h < 15) return 'Selamat Siang'
    if (h < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── HEADER ── */}
      <div className="bg-mandiri-700 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-mandiri-600 rounded-full opacity-40" />
        <div className="absolute top-16 -right-4 w-28 h-28 bg-mandiri-yellow rounded-full opacity-20" />

        <div className="relative max-w-2xl mx-auto px-4 pt-10 pb-6">
          {/* Top row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-mandiri-yellow rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-mandiri-200 text-xs font-medium">{greeting()},</p>
                <p className="text-white font-bold text-base leading-tight">{session?.user?.name}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block ${isAdmin ? 'bg-mandiri-yellow text-white' : 'bg-mandiri-600 text-mandiri-200'}`}>
                  {isAdmin ? '⚡ Administrator' : '👤 Sales'}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2.5 rounded-xl bg-mandiri-600/60 hover:bg-mandiri-600 transition-colors backdrop-blur-sm"
            >
              <LogOut size={16} className="text-white" />
            </button>
          </div>

          {/* Date */}
          <p className="text-mandiri-300 text-xs mb-4">
            📅 {format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale })}
          </p>

          {/* Stats chips */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { icon: Building2, label: 'Cabang',   value: branches.length,  bg: 'bg-mandiri-600/60' },
              { icon: Store,     label: 'Merchant',  value: totalMerchants,    bg: 'bg-mandiri-600/60' },
              { icon: MapPin,    label: 'Kota',       value: totalCities,       bg: 'bg-mandiri-600/60' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10`}>
                <s.icon size={14} className="text-mandiri-200 mx-auto mb-1" />
                <p className="text-white font-extrabold text-lg leading-none">{s.value}</p>
                <p className="text-mandiri-300 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-1 pb-10">

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
          {/* Calculator card */}
          <button
            onClick={() => router.push('/calculator')}
            className="relative overflow-hidden bg-mandiri-yellow rounded-2xl p-4 text-left shadow-md active:scale-95 transition-transform"
          >
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/10 rounded-full" />
            <Calculator size={22} className="text-white mb-2" />
            <p className="text-white font-bold text-sm">Kalkulator Fee</p>
            <p className="text-yellow-100 text-xs mt-0.5">Simulasi MDR & QRIS</p>
            <div className="mt-3 flex items-center gap-1 text-yellow-100 text-xs font-semibold">
              Buka <ChevronRight size={12} />
            </div>
          </button>

          {/* Leaderboard card */}
          <button
            onClick={() => router.push('/leaderboard')}
            className="relative overflow-hidden bg-purple-600 rounded-2xl p-4 text-left shadow-md active:scale-95 transition-transform"
          >
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/10 rounded-full" />
            <Trophy size={22} className="text-yellow-300 mb-2" />
            <p className="text-white font-bold text-sm">Leaderboard</p>
            <p className="text-purple-200 text-xs mt-0.5">Ranking poin sales</p>
            <div className="mt-3 flex items-center gap-1 text-purple-200 text-xs font-semibold">
              Lihat <ChevronRight size={12} />
            </div>
          </button>
        </div>

        {/* ── MINI CALCULATOR WIDGET ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-mandiri-yellow rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <p className="font-bold text-slate-800 text-sm">Simulasi Cepat Fee EDC</p>
          </div>
          <MiniCalculator onFull={() => router.push('/calculator')} />
        </div>

        {/* ── INFO BANNER (admin only) ── */}
        {isAdmin && (
          <button
            onClick={() => router.push('/admin')}
            className="w-full bg-mandiri-700 rounded-2xl p-4 mb-4 flex items-center gap-3 text-left active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 bg-mandiri-yellow rounded-xl flex items-center justify-center shrink-0">
              <Shield size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Admin Panel</p>
              <p className="text-mandiri-300 text-xs">Kelola merchant, export data, lihat statistik</p>
            </div>
            <ChevronRight size={16} className="text-mandiri-400" />
          </button>
        )}

        {/* ── SEARCH ── */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari cabang atau kota..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mandiri-300 shadow-sm"
          />
        </div>

        {/* ── SECTION TITLE ── */}
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-mandiri-600" />
          <p className="font-bold text-slate-700 text-sm">Pilih Cabang Tujuan</p>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} cabang</span>
        </div>

        {/* ── BRANCH LIST ── */}
        {Object.entries(grouped).map(([city, cityBranches]) => (
          <div key={city} className="mb-5">
            {/* City header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 bg-mandiri-700 px-3 py-1 rounded-full">
                <MapPin size={10} className="text-mandiri-200" />
                <span className="text-xs font-bold text-white tracking-wide">{city.toUpperCase()}</span>
              </div>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">{cityBranches.length} cabang</span>
            </div>

            <div className="space-y-2">
              {cityBranches.map((branch, idx) => {
                const merchantCount = branch._count?.merchants ?? 0
                const maxMerchant = Math.max(...cityBranches.map(b => b._count?.merchants ?? 0), 1)
                const barWidth = Math.round((merchantCount / maxMerchant) * 100)

                return (
                  <button
                    key={branch.id}
                    onClick={() => router.push(`/dashboard/${branch.id}`)}
                    className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm border border-slate-100 hover:border-mandiri-200 hover:shadow-md active:scale-95 transition-all"
                  >
                    {/* Rank number */}
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-500">{idx + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{branch.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={9} className="text-slate-400" />
                        <p className="text-xs text-slate-400">{branch.city}</p>
                      </div>
                      {/* Bar indicator */}
                      <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-mandiri-400 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold text-mandiri-700">{merchantCount}</p>
                      <p className="text-xs text-slate-400">merchant</p>
                    </div>
                    <ChevronRight size={15} className="text-slate-300 shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Building2 size={44} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">Cabang tidak ditemukan</p>
            <p className="text-sm mt-1">Coba kata kunci lain</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MINI CALCULATOR ──────────────────────────────────────────────────────────
function MiniCalculator({ onFull }: { onFull: () => void }) {
  const [volume, setVolume] = useState('')
  const [edcPct, setEdcPct] = useState(60)

  const vol     = parseFloat(volume.replace(/\D/g, '')) || 0
  const edcVol  = vol * edcPct / 100
  const qrisVol = vol * (100 - edcPct) / 100
  const estFee  = edcVol * 0.009 + qrisVol * 0.007  // rough estimate

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
    return `Rp ${n.toLocaleString('id-ID')}`
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          value={volume}
          onChange={e => setVolume(e.target.value.replace(/\D/g, ''))}
          placeholder="Volume transaksi / bulan"
          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mandiri-300 bg-slate-50"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>EDC {edcPct}%</span><span>QRIS {100 - edcPct}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={edcPct}
          onChange={e => setEdcPct(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-mandiri-700"
        />
      </div>

      {vol > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-mandiri-50 rounded-xl p-2">
            <p className="text-xs text-slate-500">EDC</p>
            <p className="text-xs font-bold text-mandiri-700">{fmt(edcVol)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-2">
            <p className="text-xs text-slate-500">QRIS</p>
            <p className="text-xs font-bold text-green-700">{fmt(qrisVol)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-2">
            <p className="text-xs text-slate-500">Est. Fee</p>
            <p className="text-xs font-bold text-amber-700">{fmt(estFee)}</p>
          </div>
        </div>
      )}

      <button
        onClick={onFull}
        className="w-full bg-mandiri-700 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-mandiri-800 transition-colors"
      >
        <Calculator size={13} /> Buka Kalkulator Lengkap
      </button>
    </div>
  )
}
