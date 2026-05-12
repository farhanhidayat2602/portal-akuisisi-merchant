'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Building2, MapPin, ChevronRight, Search, LogOut,
  Calculator, Trophy, Store, TrendingUp, Shield, PiggyBank,
  Calendar, User, Layers
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
    if (h < 11) return 'Selamat pagi,'
    if (h < 15) return 'Selamat siang,'
    if (h < 18) return 'Selamat sore,'
    return 'Selamat malam,'
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#003B79] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans pb-10">

      {/* ── TOP HEADER (Dashboard Style) ── */}
      <div className="px-4 pt-6 max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-[#003B79] to-[#2B79C4] rounded-2xl p-5 relative overflow-hidden shadow-lg mb-6 flex justify-between items-start">
          {/* Background Graphics */}
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none flex items-end">
             {/* Simple Bar Chart Silhouette */}
             <div className="w-4 h-12 bg-white mx-1 rounded-t-sm" />
             <div className="w-4 h-20 bg-white mx-1 rounded-t-sm" />
             <div className="w-4 h-16 bg-white mx-1 rounded-t-sm" />
             <div className="w-4 h-24 bg-white mx-1 rounded-t-sm" />
             <div className="w-4 h-32 bg-white mx-1 rounded-t-sm" />
             <div className="w-4 h-20 bg-white mx-1 rounded-t-sm" />
             <div className="w-4 h-28 bg-white mx-1 rounded-t-sm" />
          </div>
          {/* Mandiri Golden Wave Ribbon Silhouette */}
          <div className="absolute right-10 bottom-0 pointer-events-none opacity-80">
            <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 40C10 -10 30 -10 60 40C70 20 90 20 120 40" stroke="#F5A623" strokeWidth="3" fill="none"/>
              <path d="M15 40C25 0 45 0 75 40" stroke="#F5A623" strokeWidth="2" fill="none" opacity="0.6"/>
              <path d="M60 40L60 10L65 40Z" fill="#F5A623"/>
            </svg>
          </div>

          <div className="relative z-10">
            <p className="text-blue-100 text-[13px] font-medium tracking-wide mb-1">{greeting()}</p>
            <h1 className="text-white text-[22px] font-extrabold tracking-tight leading-tight mb-2">
              {session?.user?.name || 'Demo Sales'}
            </h1>
            <p className="text-blue-200 text-[11px] font-bold tracking-widest uppercase">
              {isAdmin ? 'Administrator' : 'Sales Executive'}
            </p>
          </div>
          
          <div className="relative z-10 flex flex-col items-end">
            <button
              onClick={() => signOut({ callbackUrl: 'https://portal-balikpapan.vercel.app' })}
              className="text-white/80 hover:text-white p-1 mb-2 transition-colors"
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
            <div className="flex flex-col items-end">
              <Calendar size={14} className="text-blue-200 mb-1" />
              <div className="text-right">
                <p className="text-white text-[12px] font-bold">{format(new Date(), "EEEE", { locale: idLocale })}</p>
                <p className="text-blue-200 text-[10px] whitespace-nowrap">{format(new Date(), "d MMM yyyy", { locale: idLocale })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MENU CARDS (Similar to screenshot) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Kalkulator Fee */}
          <button
            onClick={() => router.push('/calculator')}
            className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98] border border-slate-100"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Calculator size={20} className="text-[#0064B4]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[#002A57] font-bold text-[15px] mb-0.5">Kalkulator Fee</p>
              <p className="text-slate-400 text-[12px] font-medium">Simulasi MDR & QRIS</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#F4F7FB] flex items-center justify-center shrink-0 text-[#0064B4]">
              <ChevronRight size={14} />
            </div>
          </button>

          {/* Simulasi Hemat */}
          <button
            onClick={() => router.push('/negotiation')}
            className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98] border border-slate-100"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <PiggyBank size={20} className="text-[#F5A623]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[#002A57] font-bold text-[15px] mb-0.5">Simulasi Hemat</p>
              <p className="text-slate-400 text-[12px] font-medium">Negosiasi vs bank lain</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#F4F7FB] flex items-center justify-center shrink-0 text-[#0064B4]">
              <ChevronRight size={14} />
            </div>
          </button>

          {/* Multi EDC */}
          <button
            onClick={() => router.push('/multi-edc')}
            className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98] border border-slate-100 md:col-span-2"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Layers size={20} className="text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[#002A57] font-bold text-[15px] mb-0.5">Kalkulator Multi-EDC</p>
              <p className="text-slate-400 text-[12px] font-medium">Simulasi penghematan 2 EDC vs 1 EDC</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#F4F7FB] flex items-center justify-center shrink-0 text-[#0064B4]">
              <ChevronRight size={14} />
            </div>
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => router.push('/leaderboard')}
            className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98] border border-slate-100 md:col-span-2"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Trophy size={20} className="text-indigo-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[#002A57] font-bold text-[15px] mb-0.5">Leaderboard</p>
              <p className="text-slate-400 text-[12px] font-medium">Monitoring & analisis performa sales</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#F4F7FB] flex items-center justify-center shrink-0 text-[#0064B4]">
              <ChevronRight size={14} />
            </div>
          </button>
        </div>

        {/* ── DIVIDER & ADMIN PANEL ── */}
        {isAdmin && (
          <>
            <div className="flex items-center gap-3 mb-4 opacity-70">
              <div className="w-6 h-px bg-slate-300"></div>
              <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Administrasi</p>
              <div className="flex-1 h-px bg-slate-300"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => router.push('/admin')}
                className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98] border border-slate-100 md:col-span-2"
              >
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[#002A57] font-bold text-[15px] mb-0.5">Manajemen User & Data</p>
                  <p className="text-slate-400 text-[12px] font-medium">Kelola akun, hak akses, dan master cabang</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#F4F7FB] flex items-center justify-center shrink-0 text-[#0064B4]">
                  <ChevronRight size={14} />
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── DAFTAR CABANG ── */}
        <div className="flex items-center gap-3 mb-5 opacity-70">
          <div className="w-6 h-px bg-slate-300"></div>
          <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Daftar Cabang</p>
          <div className="flex-1 h-px bg-slate-300"></div>
        </div>

        {/* Stats summary row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-[20px] font-extrabold text-[#003B79]">{branches.length}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">Cabang</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-[20px] font-extrabold text-[#003B79]">{totalMerchants}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">Merchant</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-[20px] font-extrabold text-[#003B79]">{totalCities}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">Kota</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama cabang atau kota..."
            className="w-full bg-white border border-slate-200 rounded-[16px] pl-11 pr-4 py-3.5 text-[14px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0064B4] focus:border-transparent shadow-sm transition-all"
          />
        </div>

        {/* Branch List */}
        {Object.entries(grouped).map(([city, cityBranches]) => (
          <div key={city} className="mb-6">
            <p className="text-[12px] font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
              <MapPin size={14} className="text-[#F5A623]" /> {city.toUpperCase()}
            </p>
            <div className="space-y-3">
              {cityBranches.map((branch, idx) => {
                const merchantCount = branch._count?.merchants ?? 0
                return (
                  <button
                    key={branch.id}
                    onClick={() => router.push(`/dashboard/${branch.id}`)}
                    className="w-full bg-white rounded-[20px] p-4 flex items-center gap-4 text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 hover:border-[#0064B4]/30 hover:shadow-md active:scale-[0.98] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F4F7FB] flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors text-slate-500 group-hover:text-[#0064B4]">
                      <Building2 size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#002A57] text-[15px] truncate mb-0.5">{branch.name}</p>
                      <p className="text-[12px] font-medium text-slate-400">{merchantCount} Merchant terdaftar</p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#F4F7FB] flex items-center justify-center shrink-0 text-slate-400 group-hover:text-[#0064B4] group-hover:bg-blue-50 transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-[#002A57] text-[14px]">Cabang tidak ditemukan</p>
            <p className="text-[12px] font-medium mt-1">Coba kata kunci kota atau nama lain</p>
          </div>
        )}

        <p className="text-center text-[11px] font-medium text-slate-400 mt-10 mb-4">
          © 2024 PT Bank Mandiri (Persero) Tbk.<br/>
          Sistem Informasi Acquisition Merchant
        </p>

      </div>
    </div>
  )
}
