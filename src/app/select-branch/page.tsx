'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Building2, MapPin, ChevronRight, Search, LogOut,
  Calculator, Trophy, Store, TrendingUp, Shield, PiggyBank,
  Calendar, User
} from 'lucide-react'
import { Branch } from '@/types'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function SelectBranchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [branches, setBranches]   = useState<Branch[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [totalMerchants, setTotalMerchants] = useState(0)
  const [merchantStats, setMerchantStats] = useState({
    available: 0, acquired: 0, locked: 0, interested: 0, viral: 0,
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/')
  }, [status, router])

  useEffect(() => {
    Promise.all([
      fetch('/api/branches').then(r => r.json()),
      fetch('/api/merchants').then(r => r.json()),
    ]).then(([branchData, merchantData]: [any, any[]]) => {
      setBranches(Array.isArray(branchData) ? branchData : [])
      const merchants = Array.isArray(merchantData) ? merchantData : []
      setTotalMerchants(merchants.length)
      setMerchantStats({
        available:  merchants.filter((m: any) => m.status === 'AVAILABLE').length,
        acquired:   merchants.filter((m: any) => m.status === 'ACQUIRED').length,
        locked:     merchants.filter((m: any) => m.status === 'LOCKED').length,
        interested: merchants.filter((m: any) => m.status === 'INTERESTED').length,
        viral:      merchants.filter((m: any) => m.isViralTikTok).length,
      })
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#003B79] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans pb-10">

      {/* ── HEADER ── */}
      <div className="bg-[#003B79] relative overflow-hidden">
        {/* decorative shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-6">
          {/* Top row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md border border-white/10">
                <Store size={22} className="text-[#003B79]" />
              </div>
              <div>
                <p className="text-blue-100/90 text-xs font-medium mb-0.5">{greeting()},</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold text-lg leading-none">{session?.user?.name || 'Demo Sales'}</h2>
                </div>
                <div className="mt-1.5">
                  <span className="bg-[#002A57] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-white/10 shadow-sm">
                    {isAdmin ? '🛡️ Administrator' : '👤 Sales Executive'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shadow-sm"
              title="Keluar"
            >
              <LogOut size={18} className="text-white translate-x-0.5" />
            </button>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 mb-6 text-blue-100/90 bg-white/10 inline-flex px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
            <Calendar size={14} className="text-white" />
            <span className="text-xs font-semibold tracking-wide">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale })}
            </span>
          </div>

          {/* Stats chips */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: Building2, label: 'Cabang',   value: branches.length },
              { icon: Store,     label: 'Merchant',  value: totalMerchants   },
              { icon: MapPin,    label: 'Kota',       value: totalCities      },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 shadow-sm">
                <s.icon size={18} className="text-blue-200 mx-auto mb-2 opacity-90" />
                <p className="text-white font-bold text-2xl leading-none mb-1.5">{s.value}</p>
                <p className="text-blue-100 text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Merchant status breakdown */}
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
            {[
              { label: 'Tersedia',   value: merchantStats.available,  dot: 'bg-slate-300' },
              { label: 'Akuisisi',   value: merchantStats.acquired,   dot: 'bg-[#0064B4]' },
              { label: 'Dikunjungi', value: merchantStats.locked,     dot: 'bg-[#F5A623]' },
              { label: 'Tertarik',   value: merchantStats.interested, dot: 'bg-blue-300' },
              { label: 'Viral',      value: merchantStats.viral,      dot: 'bg-blue-100' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 bg-[#002A57]/60 backdrop-blur-md rounded-full px-3.5 py-1.5 shrink-0 border border-white/10 shadow-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                <span className="text-white font-bold text-xs">{s.value}</span>
                <span className="text-blue-100/90 text-[11px] font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6">

        {/* ── QUICK ACTIONS (Professional Styling) ── */}
        <div className="grid grid-cols-2 gap-3.5 mb-4">
          {/* Calculator Fee card */}
          <button
            onClick={() => router.push('/calculator')}
            className="flex flex-col bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all border border-slate-200"
          >
            <div className="w-10 h-10 bg-[#F5F7FA] rounded-xl flex items-center justify-center mb-3">
              <Calculator size={20} className="text-[#003B79]" />
            </div>
            <p className="text-[#002A57] font-bold text-sm leading-tight mb-1">Kalkulator Fee</p>
            <p className="text-slate-500 text-xs font-medium mb-3">Simulasi MDR & QRIS</p>
            <div className="mt-auto flex items-center gap-1 text-[#0064B4] text-xs font-bold">
              Buka <ChevronRight size={14} />
            </div>
          </button>

          {/* Negotiation Calculator card */}
          <button
            onClick={() => router.push('/negotiation')}
            className="flex flex-col bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all border border-slate-200"
          >
            <div className="w-10 h-10 bg-[#F5F7FA] rounded-xl flex items-center justify-center mb-3">
              <PiggyBank size={20} className="text-[#003B79]" />
            </div>
            <p className="text-[#002A57] font-bold text-sm leading-tight mb-1">Simulasi Hemat</p>
            <p className="text-slate-500 text-xs font-medium mb-3">Negosiasi vs bank lain</p>
            <div className="mt-auto flex items-center gap-1 text-[#0064B4] text-xs font-bold">
              Hitung <ChevronRight size={14} />
            </div>
          </button>
        </div>

        {/* Leaderboard banner */}
        <button
          onClick={() => router.push('/leaderboard')}
          className="w-full bg-[#003B79] rounded-2xl p-4 mb-6 flex items-center gap-4 text-left active:scale-[0.98] transition-all shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-sm z-10 shadow-inner">
            <Trophy size={20} className="text-[#F5A623]" />
          </div>
          <div className="flex-1 z-10">
            <p className="text-white font-bold text-sm mb-0.5">Papan Peringkat Sales</p>
            <p className="text-blue-100 text-xs font-medium">Lihat ranking poin terbaik bulan ini</p>
          </div>
          <ChevronRight size={20} className="text-white/70 shrink-0 z-10" />
        </button>

        {/* ── INFO BANNER (admin only) ── */}
        {isAdmin && (
          <button
            onClick={() => router.push('/admin')}
            className="w-full bg-white rounded-2xl p-4 mb-6 flex items-center gap-4 text-left active:scale-[0.98] transition-all shadow-sm border border-slate-200"
          >
            <div className="w-11 h-11 bg-[#F5F7FA] rounded-xl flex items-center justify-center shrink-0">
              <Shield size={20} className="text-[#003B79]" />
            </div>
            <div className="flex-1">
              <p className="text-[#002A57] font-bold text-sm mb-0.5">Admin Panel</p>
              <p className="text-slate-500 text-xs font-medium">Kelola merchant, export data, statistik</p>
            </div>
            <ChevronRight size={20} className="text-[#0064B4] shrink-0" />
          </button>
        )}

        {/* ── SEARCH ── */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama cabang atau kota..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0064B4] focus:border-transparent shadow-sm transition-all"
          />
        </div>

        {/* ── SECTION TITLE ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#003B79]" />
            <p className="font-bold text-[#002A57] text-sm">Pilih Cabang Tujuan</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-md">{filtered.length} Cabang</span>
        </div>

        {/* ── BRANCH LIST ── */}
        {Object.entries(grouped).map(([city, cityBranches]) => (
          <div key={city} className="mb-6">
            {/* City header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center bg-[#F5A623]/10 border border-[#F5A623]/20 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-bold text-[#D4880A] tracking-wide">{city.toUpperCase()}</span>
              </div>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="space-y-3">
              {cityBranches.map((branch, idx) => {
                const merchantCount = branch._count?.merchants ?? 0
                const maxMerchant = Math.max(...cityBranches.map(b => b._count?.merchants ?? 0), 1)
                const barWidth = Math.round((merchantCount / maxMerchant) * 100)

                return (
                  <button
                    key={branch.id}
                    onClick={() => router.push(`/dashboard/${branch.id}`)}
                    className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left shadow-sm border border-slate-200 hover:border-[#0064B4] hover:shadow-md active:scale-[0.98] transition-all group"
                  >
                    {/* Rank number */}
                    <div className="w-10 h-10 rounded-full bg-[#F5F7FA] border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#0064B4]/10 transition-colors">
                      <span className="text-sm font-bold text-slate-600 group-hover:text-[#0064B4] transition-colors">{idx + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#002A57] text-sm truncate">{branch.name}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 mb-3">
                        <MapPin size={12} className="text-slate-400" />
                        <p className="text-xs font-medium text-slate-500">{branch.city}</p>
                      </div>
                      {/* Bar indicator */}
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-[90%]">
                        <div
                          className="h-full bg-[#0064B4] rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-center justify-center">
                      <p className="text-xl font-black text-[#003B79] leading-none mb-1">{merchantCount}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Merchant</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 shrink-0 group-hover:text-[#0064B4] transition-colors ml-1" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Search size={32} className="mx-auto mb-3 opacity-30 text-[#003B79]" />
            <p className="font-bold text-[#002A57] text-sm">Cabang tidak ditemukan</p>
            <p className="text-xs font-medium mt-1 text-slate-500">Coba kata kunci kota atau nama lain</p>
          </div>
        )}
      </div>
    </div>
  )
}
