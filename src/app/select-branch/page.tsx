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
          <p className="text-slate-500 text-sm font-medium">Memuat data...</p>
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

        <div className="relative max-w-2xl mx-auto px-4 pt-10 pb-6">
          {/* Top row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-[#F5A623] rounded-[14px] flex items-center justify-center shadow-md">
                <Store size={22} className="text-white" />
              </div>
              <div>
                <p className="text-blue-100/90 text-[11px] mb-0.5 font-medium">{greeting()},</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-extrabold text-[17px] leading-none">{session?.user?.name || 'Demo Sales'}</h2>
                </div>
                <div className="mt-1.5">
                  <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20 backdrop-blur-sm">
                    {isAdmin ? '🛡️ Admin' : '👤 Sales'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-sm shadow-sm"
            >
              <LogOut size={16} className="text-white translate-x-0.5" />
            </button>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 mb-5 text-blue-100/90">
            <div className="w-5 h-5 rounded-[6px] bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Calendar size={11} className="text-white" />
            </div>
            <span className="text-[12px] font-semibold tracking-wide">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale })}
            </span>
          </div>

          {/* Stats chips */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { icon: Building2, label: 'Cabang',   value: branches.length },
              { icon: Store,     label: 'Merchant',  value: totalMerchants   },
              { icon: MapPin,    label: 'Kota',       value: totalCities      },
            ].map(s => (
              <div key={s.label} className="bg-[#002A57]/50 backdrop-blur-md rounded-[16px] p-3.5 text-center border border-white/10 shadow-sm">
                <s.icon size={16} className="text-blue-200 mx-auto mb-2 opacity-80" />
                <p className="text-white font-black text-[22px] leading-none mb-1.5">{s.value}</p>
                <p className="text-blue-200/90 text-[11px] font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Merchant status breakdown */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { label: 'Tersedia',   value: merchantStats.available,  dot: 'bg-[#4CAF50]' },
              { label: 'Akuisisi',   value: merchantStats.acquired,   dot: 'bg-[#26A69A]' },
              { label: 'Dikunjungi', value: merchantStats.locked,     dot: 'bg-[#FFCA28]' },
              { label: 'Tertarik',   value: merchantStats.interested, dot: 'bg-[#AB47BC]' },
              { label: 'Viral',      value: merchantStats.viral,      dot: 'bg-[#EC407A]' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 bg-[#002A57]/50 backdrop-blur-md rounded-full px-3 py-1.5 shrink-0 border border-white/10 shadow-sm">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot} shadow-sm`} />
                <span className="text-white font-bold text-[12px]">{s.value}</span>
                <span className="text-blue-100/80 text-[11px] font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4">

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Calculator Fee card */}
          <button
            onClick={() => router.push('/calculator')}
            className="relative overflow-hidden bg-gradient-to-br from-[#F9A825] to-[#F57F17] rounded-[20px] p-4.5 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all border border-orange-400/30"
          >
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
            <Calculator size={20} className="text-white mb-2" />
            <p className="text-white font-bold text-[14px] leading-tight mb-0.5">Kalkulator Fee</p>
            <p className="text-orange-50 text-[11px] font-medium">Simulasi MDR & QRIS</p>
            <div className="mt-3 flex items-center gap-1 text-white text-[11px] font-bold">
              Buka <ChevronRight size={12} strokeWidth={3} />
            </div>
          </button>

          {/* Negotiation Calculator card */}
          <button
            onClick={() => router.push('/negotiation')}
            className="relative overflow-hidden bg-gradient-to-br from-[#43A047] to-[#2E7D32] rounded-[20px] p-4.5 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all border border-green-400/30"
          >
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
            <PiggyBank size={20} className="text-white mb-2" />
            <p className="text-white font-bold text-[14px] leading-tight mb-0.5">Simulasi Hemat</p>
            <p className="text-green-50 text-[11px] font-medium">Negosiasi vs bank lain</p>
            <div className="mt-3 flex items-center gap-1 text-white text-[11px] font-bold">
              Hitung <ChevronRight size={12} strokeWidth={3} />
            </div>
          </button>
        </div>

        {/* Leaderboard banner */}
        <button
          onClick={() => router.push('/leaderboard')}
          className="w-full bg-gradient-to-r from-[#8E24AA] to-[#7B1FA2] rounded-[20px] p-4 mb-5 flex items-center gap-3.5 text-left active:scale-[0.98] transition-all shadow-sm border border-purple-400/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="w-10 h-10 bg-white/10 rounded-[12px] flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-sm z-10 shadow-inner">
            <Trophy size={18} className="text-yellow-300" />
          </div>
          <div className="flex-1 z-10">
            <p className="text-white font-bold text-[14px] mb-0.5">Leaderboard</p>
            <p className="text-purple-100 text-[11px] font-medium">Ranking poin sales terbaik bulan ini</p>
          </div>
          <ChevronRight size={18} className="text-white/70 shrink-0 z-10" />
        </button>

        {/* ── INFO BANNER (admin only) ── */}
        {isAdmin && (
          <button
            onClick={() => router.push('/admin')}
            className="w-full bg-[#003B79] rounded-[20px] p-4 mb-5 flex items-center gap-3.5 text-left active:scale-[0.98] transition-all shadow-sm border border-blue-800"
          >
            <div className="w-10 h-10 bg-[#F5A623] rounded-[12px] flex items-center justify-center shrink-0 shadow-inner">
              <Shield size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-[14px] mb-0.5">Admin Panel</p>
              <p className="text-blue-200 text-[11px] font-medium">Kelola merchant, export data, statistik</p>
            </div>
            <ChevronRight size={18} className="text-blue-300 shrink-0" />
          </button>
        )}

        {/* ── SEARCH ── */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari cabang atau kota..."
            className="w-full bg-white border border-slate-200 rounded-[16px] pl-11 pr-4 py-3.5 text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0064B4] focus:border-transparent shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all"
          />
        </div>

        {/* ── SECTION TITLE ── */}
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[#0064B4]" />
          <p className="font-extrabold text-slate-800 text-[14px]">Pilih Cabang Tujuan</p>
          <span className="text-[11px] font-medium text-slate-400 ml-auto">{filtered.length} cabang</span>
        </div>

        {/* ── BRANCH LIST ── */}
        {Object.entries(grouped).map(([city, cityBranches]) => (
          <div key={city} className="mb-6">
            {/* City header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex items-center gap-1.5 bg-[#003B79] px-3 py-1.5 rounded-[8px] shadow-sm">
                <span className="text-[10px] font-bold text-white tracking-wider">{city.toUpperCase()}</span>
              </div>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-medium text-slate-400">{cityBranches.length} cabang</span>
            </div>

            <div className="space-y-2.5">
              {cityBranches.map((branch, idx) => {
                const merchantCount = branch._count?.merchants ?? 0
                const maxMerchant = Math.max(...cityBranches.map(b => b._count?.merchants ?? 0), 1)
                const barWidth = Math.round((merchantCount / maxMerchant) * 100)

                return (
                  <button
                    key={branch.id}
                    onClick={() => router.push(`/dashboard/${branch.id}`)}
                    className="w-full bg-white rounded-[16px] p-4 flex items-center gap-3.5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-[#0064B4]/30 hover:shadow-md active:scale-[0.98] transition-all group"
                  >
                    {/* Rank number */}
                    <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#0064B4]/5 group-hover:border-[#0064B4]/20 transition-colors">
                      <span className="text-[13px] font-black text-slate-500 group-hover:text-[#0064B4] transition-colors">{idx + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-[14px] truncate">{branch.name}</p>
                      <div className="flex items-center gap-1 mt-1 mb-2.5">
                        <MapPin size={10} className="text-slate-400" />
                        <p className="text-[11px] font-medium text-slate-500">{branch.city}</p>
                      </div>
                      {/* Bar indicator */}
                      <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden w-[85%]">
                        <div
                          className="h-full bg-[#0064B4] rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-center justify-center mr-1">
                      <p className="text-[18px] font-black text-[#003B79] leading-none mb-1">{merchantCount}</p>
                      <p className="text-[10px] font-medium text-slate-400">merchant</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 shrink-0 group-hover:text-[#0064B4] transition-colors" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-[20px] border border-slate-100 border-dashed">
            <Search size={32} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold text-slate-600">Cabang tidak ditemukan</p>
            <p className="text-[13px] font-medium mt-1">Coba kata kunci kota atau nama lain</p>
          </div>
        )}
      </div>
    </div>
  )
}
