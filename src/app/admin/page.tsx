'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import {
  Database, RefreshCw, Plus, Search,
  CheckCircle, XCircle, Clock, BarChart2, Users,
  Store, AlertTriangle, Download, FileSpreadsheet,
  X, ChevronRight, Star, Zap, Trophy, MapPin,
} from 'lucide-react'
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface ScrapingLog {
  id: string
  source: string
  status: string
  newMerchants: number
  error?: string
  startedAt: string
  completedAt?: string
}

interface Stats {
  totalMerchants: number
  available: number
  interested: number
  followUp: number
  rejected: number
  doNotVisit: number
  acquired: number
  viral: number
  totalVisits: number
  totalUsers: number
}

type ModalType = 'merchants' | 'visits' | 'users' | 'viral' | null

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  AVAILABLE:    'bg-green-500',
  INTERESTED:   'bg-purple-500',
  FOLLOW_UP:    'bg-blue-500',
  REJECTED:     'bg-red-400',
  DO_NOT_VISIT: 'bg-gray-400',
  ACQUIRED:     'bg-emerald-500',
  LOCKED:       'bg-yellow-400',
}

const RESULT_STYLE: Record<string, { bg: string; label: string }> = {
  INTERESTED: { bg: 'bg-purple-100 text-purple-700', label: 'Tertarik' },
  FOLLOW_UP:  { bg: 'bg-blue-100 text-blue-700',     label: 'Follow Up' },
  REJECTED:   { bg: 'bg-red-100 text-red-600',       label: 'Ditolak' },
}

const MEDALS = ['🥇', '🥈', '🥉']

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [logs,          setLogs]          = useState<ScrapingLog[]>([])
  const [stats,         setStats]         = useState<Stats | null>(null)
  const [scraping,      setScraping]      = useState(false)
  const [loadingStats,  setLoadingStats]  = useState(true)
  const [activeTab,     setActiveTab]     = useState<'overview' | 'merchants' | 'scraping'>('overview')

  // Raw data for modals
  const [allMerchants,  setAllMerchants]  = useState<any[]>([])
  const [allVisits,     setAllVisits]     = useState<any[]>([])
  const [allUsers,      setAllUsers]      = useState<any[]>([])

  // Modal state
  const [modalType,       setModalType]       = useState<ModalType>(null)
  const [modalSearch,     setModalSearch]     = useState('')
  const [merchantFilter,  setMerchantFilter]  = useState('ALL')

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/'); return }
    if (status === 'authenticated' && session.user.role !== 'ADMIN') {
      router.replace('/select-branch')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') { loadStats(); loadLogs() }
  }, [session])

  async function loadStats() {
    setLoadingStats(true)
    try {
      const [merchantsRes, visitsRes, usersRes] = await Promise.all([
        fetch('/api/merchants'),
        fetch('/api/visits'),
        fetch('/api/leaderboard'),
      ])
      const merchants = await merchantsRes.json()
      const visits    = await visitsRes.json()
      const users     = await usersRes.json()

      setAllMerchants(Array.isArray(merchants) ? merchants : [])
      setAllVisits(Array.isArray(visits) ? visits : [])
      setAllUsers(Array.isArray(users) ? users : [])

      setStats({
        totalMerchants: merchants.length,
        available:   merchants.filter((m: any) => m.status === 'AVAILABLE').length,
        interested:  merchants.filter((m: any) => m.status === 'INTERESTED').length,
        followUp:    merchants.filter((m: any) => m.status === 'FOLLOW_UP').length,
        rejected:    merchants.filter((m: any) => m.status === 'REJECTED').length,
        doNotVisit:  merchants.filter((m: any) => m.status === 'DO_NOT_VISIT').length,
        acquired:    merchants.filter((m: any) => m.status === 'ACQUIRED').length,
        viral:       merchants.filter((m: any) => m.isViralTikTok).length,
        totalVisits: Array.isArray(visits) ? visits.length : 0,
        totalUsers:  Array.isArray(users) ? users.length : 0,
      })
    } finally {
      setLoadingStats(false)
    }
  }

  async function loadLogs() {
    try {
      const res = await fetch('/api/scrape/trigger')
      if (res.ok) setLogs(await res.json())
    } catch {}
  }

  async function handleScrape() {
    setScraping(true)
    const tid = toast.loading('Menjalankan proses scraping...')
    try {
      const res = await fetch('/api/scrape/trigger', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Scraping selesai! Database diperbarui.', { id: tid })
        await loadLogs()
        await loadStats()
      } else {
        toast.error(data.error ?? 'Scraping gagal', { id: tid })
      }
    } finally {
      setScraping(false)
    }
  }

  function openModal(type: ModalType) {
    setModalType(type)
    setModalSearch('')
    setMerchantFilter('ALL')
  }

  // ─── Modal content ───────────────────────────────────────────────────────────
  function renderModalContent() {
    // ── Merchants & Viral ─────────────────────────────────────────────────────
    if (modalType === 'merchants' || modalType === 'viral') {
      const base = modalType === 'viral'
        ? allMerchants.filter((m: any) => m.isViralTikTok)
        : allMerchants

      const filtered = base
        .filter((m: any) => merchantFilter === 'ALL' || m.status === merchantFilter)
        .filter((m: any) => {
          if (!modalSearch) return true
          const q = modalSearch.toLowerCase()
          return m.name.toLowerCase().includes(q)
            || (m.category ?? '').toLowerCase().includes(q)
            || (m.branch?.name ?? '').toLowerCase().includes(q)
        })

      if (filtered.length === 0) return (
        <div className="py-16 text-center text-slate-400">
          <Store size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Merchant tidak ditemukan</p>
        </div>
      )

      return (
        <div className="divide-y divide-slate-50">
          {filtered.map((m: any) => (
            <button
              key={m.id}
              onClick={() => { setModalType(null); router.push(`/merchant/${m.id}`) }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              {/* Status dot */}
              <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', STATUS_DOT[m.status] ?? 'bg-slate-300')} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 text-sm truncate">{m.name}</span>
                  {m.isViralTikTok && <Zap size={11} className="text-pink-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <MapPin size={9} className="text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-400">{m.branch?.name ?? '–'}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{m.category}</span>
                  {m.googleRating && (
                    <>
                      <span className="text-slate-300">·</span>
                      <Star size={9} className="text-yellow-400 fill-yellow-400 shrink-0" />
                      <span className="text-xs text-slate-500">{m.googleRating}</span>
                    </>
                  )}
                </div>
                {/* EDC / QRIS chips */}
                <div className="flex gap-1 mt-1">
                  {m.isMandiriEDC  && <span className="text-[10px] font-semibold bg-mandiri-100 text-mandiri-700 px-1.5 py-0.5 rounded">EDC</span>}
                  {m.isMandiriQRIS && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">QRIS</span>}
                  {m.estimatedVolume > 0 && (
                    <span className="text-[10px] text-slate-400">
                      ~{formatRupiah(m.estimatedVolume)}/bln
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', getStatusColor(m.status))}>
                  {getStatusLabel(m.status)}
                </span>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      )
    }

    // ── Visits ────────────────────────────────────────────────────────────────
    if (modalType === 'visits') {
      const filtered = allVisits.filter((v: any) => {
        if (!modalSearch) return true
        const q = modalSearch.toLowerCase()
        return (v.merchant?.name ?? '').toLowerCase().includes(q)
          || (v.user?.name ?? '').toLowerCase().includes(q)
          || (v.result ?? '').toLowerCase().includes(q)
      })

      if (filtered.length === 0) return (
        <div className="py-16 text-center text-slate-400">
          <CheckCircle size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Kunjungan tidak ditemukan</p>
        </div>
      )

      return (
        <div className="divide-y divide-slate-50">
          {filtered.map((v: any) => {
            const rs = RESULT_STYLE[v.result] ?? { bg: 'bg-slate-100 text-slate-600', label: v.result }
            return (
              <button
                key={v.id}
                onClick={() => { setModalType(null); router.push(`/merchant/${v.merchant?.id}`) }}
                className="w-full px-5 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Result + merchant */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', rs.bg)}>
                        {rs.label}
                      </span>
                      <span className="font-semibold text-slate-800 text-sm truncate">{v.merchant?.name}</span>
                    </div>
                    {/* Sales + time */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-bold text-purple-600">{v.user?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{v.user?.name}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(v.visitedAt), { locale: idLocale, addSuffix: true })}
                      </span>
                    </div>
                    {/* Notes */}
                    {v.notes && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 italic">"{v.notes}"</p>
                    )}
                    {/* Est volume */}
                    {v.estVolume > 0 && (
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        Potensi volume: {formatRupiah(v.estVolume)}/bln
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-slate-400">
                      {format(new Date(v.visitedAt), 'd MMM', { locale: idLocale })}
                    </p>
                    <ChevronRight size={13} className="text-slate-300 mt-1 ml-auto" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )
    }

    // ── Users / Sales ─────────────────────────────────────────────────────────
    if (modalType === 'users') {
      const filtered = allUsers.filter((u: any) => {
        if (!modalSearch) return true
        const q = modalSearch.toLowerCase()
        return u.name.toLowerCase().includes(q)
          || (u.branch ?? '').toLowerCase().includes(q)
          || (u.city ?? '').toLowerCase().includes(q)
      })

      if (filtered.length === 0) return (
        <div className="py-16 text-center text-slate-400">
          <Users size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Sales tidak ditemukan</p>
        </div>
      )

      return (
        <div className="divide-y divide-slate-50">
          {filtered.map((u: any) => {
            const convRate = u.totalVisits > 0
              ? Math.round((u.interested / u.totalVisits) * 100)
              : 0
            const barWidth = allUsers[0]?.points > 0
              ? Math.round((u.points / allUsers[0].points) * 100)
              : 0

            return (
              <div key={u.id} className="flex items-center gap-3 px-5 py-4">
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {u.rank <= 3
                    ? <span className="text-xl">{MEDALS[u.rank - 1]}</span>
                    : <span className="text-sm font-bold text-slate-400">#{u.rank}</span>
                  }
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <span className="text-purple-700 font-extrabold text-base">
                    {u.name?.[0]?.toUpperCase()}
                  </span>
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{u.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={9} className="text-slate-400" />
                    <p className="text-xs text-slate-400 truncate">{u.branch} · {u.city}</p>
                  </div>
                  {/* Points bar */}
                  <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden w-full">
                    <div
                      className="h-full bg-purple-400 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="flex items-center gap-1 justify-end">
                    <Trophy size={11} className="text-yellow-500" />
                    <span className="font-extrabold text-purple-700 text-sm">{u.points}</span>
                    <span className="text-xs text-slate-400">pts</span>
                  </div>
                  <p className="text-xs text-slate-400">{u.totalVisits} kunjungan</p>
                  <p className={cn('text-xs font-semibold', convRate >= 30 ? 'text-green-600' : 'text-slate-500')}>
                    {convRate}% konversi
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    return null
  }

  // ─── Modal config per type ────────────────────────────────────────────────
  const MODAL_CONFIG: Record<Exclude<ModalType, null>, {
    icon: React.ReactNode; title: string; subtitle: string; iconBg: string
    filterBar?: React.ReactNode
  }> = {
    merchants: {
      icon: <Store size={18} className="text-white" />,
      iconBg: 'bg-mandiri-700',
      title: 'Semua Merchant',
      subtitle: `${allMerchants.length} merchant di seluruh cabang`,
      filterBar: (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { key: 'ALL',         label: 'Semua' },
            { key: 'AVAILABLE',   label: 'Tersedia' },
            { key: 'ACQUIRED',    label: 'Akuisisi' },
            { key: 'INTERESTED',  label: 'Tertarik' },
            { key: 'FOLLOW_UP',   label: 'Follow Up' },
            { key: 'REJECTED',    label: 'Ditolak' },
            { key: 'LOCKED',      label: 'Dikunjungi' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setMerchantFilter(f.key)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors',
                merchantFilter === f.key ? 'bg-mandiri-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      ),
    },
    visits: {
      icon: <CheckCircle size={18} className="text-white" />,
      iconBg: 'bg-green-500',
      title: 'Riwayat Kunjungan',
      subtitle: `${allVisits.length} kunjungan tercatat`,
    },
    users: {
      icon: <Users size={18} className="text-white" />,
      iconBg: 'bg-purple-500',
      title: 'Sales Aktif',
      subtitle: `${allUsers.length} sales terdaftar`,
    },
    viral: {
      icon: <Zap size={18} className="text-white" />,
      iconBg: 'bg-pink-500',
      title: 'Merchant Viral TikTok',
      subtitle: `${allMerchants.filter(m => m.isViralTikTok).length} merchant viral`,
      filterBar: (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { key: 'ALL', label: 'Semua Status' },
            { key: 'AVAILABLE', label: 'Tersedia' },
            { key: 'ACQUIRED', label: 'Akuisisi' },
            { key: 'INTERESTED', label: 'Tertarik' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setMerchantFilter(f.key)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors',
                merchantFilter === f.key ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      ),
    },
  }

  // ─── Mini summary chips per modal ─────────────────────────────────────────
  function renderMiniSummary() {
    if (modalType === 'merchants') return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { label: 'Tersedia', count: allMerchants.filter(m => m.status === 'AVAILABLE').length, color: 'text-green-600 bg-green-50' },
          { label: 'Akuisisi', count: allMerchants.filter(m => m.status === 'ACQUIRED').length,  color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Tertarik', count: allMerchants.filter(m => m.status === 'INTERESTED').length, color: 'text-purple-600 bg-purple-50' },
          { label: 'Viral',    count: allMerchants.filter(m => m.isViralTikTok).length,          color: 'text-pink-600 bg-pink-50' },
        ].map(s => (
          <div key={s.label} className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0', s.color)}>
            <span>{s.count}</span> <span className="font-normal">{s.label}</span>
          </div>
        ))}
      </div>
    )

    if (modalType === 'visits') return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { label: 'Tertarik',  count: allVisits.filter(v => v.result === 'INTERESTED').length, color: 'text-purple-600 bg-purple-50' },
          { label: 'Follow Up', count: allVisits.filter(v => v.result === 'FOLLOW_UP').length,  color: 'text-blue-600 bg-blue-50' },
          { label: 'Ditolak',   count: allVisits.filter(v => v.result === 'REJECTED').length,   color: 'text-red-500 bg-red-50' },
        ].map(s => (
          <div key={s.label} className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0', s.color)}>
            <span>{s.count}</span> <span className="font-normal">{s.label}</span>
          </div>
        ))}
      </div>
    )

    if (modalType === 'users') {
      const totalPts = allUsers.reduce((s: number, u: any) => s + u.points, 0)
      const totalVisits = allUsers.reduce((s: number, u: any) => s + u.totalVisits, 0)
      return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { label: 'Total Poin',     value: totalPts.toLocaleString('id-ID'), color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Total Kunjungan', value: totalVisits,                      color: 'text-green-600 bg-green-50' },
          ].map(s => (
            <div key={s.label} className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0', s.color)}>
              <span>{s.value}</span> <span className="font-normal">{s.label}</span>
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  if (status === 'loading' || loadingStats) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar title="Admin Panel" />
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <Navbar title="Admin Panel" subtitle="Manajemen Portal Akuisisi Merchant" />

      {/* Admin banner */}
      <div className="bg-mandiri-700 px-4 py-4 text-white">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-mandiri-yellow rounded-xl flex items-center justify-center">
            <Database size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold">Admin Dashboard</p>
            <p className="text-mandiri-200 text-xs">Login sebagai: {session?.user?.name}</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="flex items-center gap-2 bg-mandiri-yellow text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-mandiri-yellow-dark transition-colors disabled:opacity-60"
            >
              <RefreshCw size={14} className={scraping ? 'animate-spin' : ''} />
              {scraping ? 'Memproses...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-4">
        <div className="max-w-4xl mx-auto flex gap-1">
          {([
            { key: 'overview',  label: 'Overview',  icon: BarChart2 },
            { key: 'merchants', label: 'Merchant',  icon: Store },
            { key: 'scraping',  label: 'Scraping',  icon: RefreshCw },
          ] as { key: typeof activeTab; label: string; icon: any }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-mandiri-700 text-mandiri-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-5">

            {/* KPI Cards — clickable */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Merchant',  value: stats.totalMerchants, icon: Store,        color: 'bg-mandiri-700', modal: 'merchants' as ModalType, hint: 'Semua merchant' },
                { label: 'Total Kunjungan', value: stats.totalVisits,    icon: CheckCircle,  color: 'bg-green-500',  modal: 'visits'    as ModalType, hint: 'Riwayat kunjungan' },
                { label: 'Sales Aktif',     value: stats.totalUsers,     icon: Users,        color: 'bg-purple-500', modal: 'users'     as ModalType, hint: 'Lihat leaderboard' },
                { label: 'Viral TikTok',    value: stats.viral,          icon: BarChart2,    color: 'bg-pink-500',   modal: 'viral'     as ModalType, hint: 'Merchant viral' },
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => openModal(s.modal)}
                  className={cn(
                    'card p-4 flex flex-col gap-2 text-left group transition-all active:scale-95 hover:brightness-110',
                    s.color
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <s.icon size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-white">{s.value}</p>
                      <p className="text-xs text-white/80">{s.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-white/70 text-xs font-semibold group-hover:text-white transition-colors">
                    <span>{s.hint}</span>
                    <ChevronRight size={11} />
                  </div>
                </button>
              ))}
            </div>

            {/* Status breakdown */}
            <div className="card p-5">
              <h3 className="font-bold text-slate-700 mb-4">Status Merchant</h3>
              <div className="space-y-3">
                {[
                  { label: 'Tersedia (Available)',    value: stats.available,   max: stats.totalMerchants, color: 'bg-green-500' },
                  { label: 'Tertarik (Interested)',   value: stats.interested,  max: stats.totalMerchants, color: 'bg-purple-500' },
                  { label: 'Follow Up',               value: stats.followUp,    max: stats.totalMerchants, color: 'bg-blue-500' },
                  { label: 'Ditolak (Rejected)',      value: stats.rejected,    max: stats.totalMerchants, color: 'bg-red-400' },
                  { label: 'Do Not Visit',            value: stats.doNotVisit,  max: stats.totalMerchants, color: 'bg-gray-400' },
                  { label: 'Sudah Akuisisi',          value: stats.acquired,    max: stats.totalMerchants, color: 'bg-mandiri-green' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{s.label}</span>
                      <span className="font-bold text-slate-700">{s.value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', s.color)}
                        style={{ width: s.max > 0 ? `${(s.value / s.max) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export */}
            <div className="card p-5">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-green-600" />
                Export Data ke Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 mb-3">Download data sebagai file CSV — bisa dibuka di Excel atau Google Sheets.</p>
              <div className="grid grid-cols-2 gap-3">
                <a href="/api/export?type=merchants" download className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                  <Download size={14} /> Data Merchant
                </a>
                <a href="/api/export?type=visits" download className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  <Download size={14} /> Riwayat Kunjungan
                </a>
                <a href="/api/export?type=ecosystem" download className="col-span-2 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">
                  <Download size={14} /> Ekosistem Leads (Retail &amp; Supplier)
                </a>
              </div>
            </div>

            {/* Tips */}
            <div className="card p-5 bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-amber-800 text-sm">Info Sistem</p>
                  <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Database diperbarui otomatis setiap 7 hari (klik "Update Database" untuk manual)</li>
                    <li>Merchant lock otomatis expired setelah 4 jam</li>
                    <li>Hard Reject otomatis dibuka kembali setelah 90 hari</li>
                    <li>Poin sales diakumulasikan dari setiap hasil kunjungan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MERCHANTS TAB */}
        {activeTab === 'merchants' && <MerchantManagement />}

        {/* SCRAPING TAB */}
        {activeTab === 'scraping' && (
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-2">Refresh Data Merchant</h3>
              <p className="text-sm text-slate-600 mb-4">
                Tombol ini memperbarui timestamp <em>lastScraped</em> semua merchant.
                Untuk menambah merchant baru, gunakan tab <strong>Merchant → Tambah</strong> atau jalankan
                script <code className="bg-slate-100 px-1 rounded">npm run db:add-merchants</code> di terminal.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl mb-1">🗺️</p>
                  <p className="text-xs font-bold text-green-700">Google Maps</p>
                  <p className="text-xs text-green-600 mt-0.5">Rating ≥ 4.0, Review ≥ 50</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-3 text-center">
                  <p className="text-2xl mb-1">🎵</p>
                  <p className="text-xs font-bold text-pink-700">TikTok</p>
                  <p className="text-xs text-pink-600 mt-0.5">Viral, Trending Balikpapan</p>
                </div>
              </div>
              <button onClick={handleScrape} disabled={scraping} className="btn-primary w-full mt-4">
                <RefreshCw size={16} className={scraping ? 'animate-spin' : ''} />
                {scraping ? 'Memproses...' : 'Refresh Timestamp Sekarang'}
              </button>
            </div>

            {/* Scraping logs */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="font-bold text-slate-700 text-sm">Riwayat Update</p>
              </div>
              {logs.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Database size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada riwayat update</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        log.status === 'SUCCESS' ? 'bg-green-100' :
                        log.status === 'FAILED'  ? 'bg-red-100' : 'bg-yellow-100'
                      )}>
                        {log.status === 'SUCCESS' ? <CheckCircle size={14} className="text-green-600" /> :
                         log.status === 'FAILED'  ? <XCircle size={14} className="text-red-600" /> :
                         <Clock size={14} className="text-yellow-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700">{log.source}</p>
                        <p className="text-xs text-slate-400">
                          {format(new Date(log.startedAt), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                        </p>
                        {log.error && <p className="text-xs text-red-500 mt-0.5">{log.error}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={cn(
                          'badge text-xs',
                          log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                          log.status === 'FAILED'  ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        )}>{log.status}</span>
                        {log.newMerchants > 0 && (
                          <p className="text-xs text-green-600 mt-1">+{log.newMerchants} baru</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ────────────────────────────────────────────────────── */}
      {modalType && (() => {
        const cfg = MODAL_CONFIG[modalType]
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalType(null)}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-2xl bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] animate-slide-up">

              {/* Handle */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-0 shrink-0" />

              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', cfg.iconBg)}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-extrabold text-slate-800 text-base leading-tight">{cfg.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{cfg.subtitle}</p>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search + filters */}
              <div className="px-5 pt-3 pb-3 border-b border-slate-100 shrink-0 space-y-2.5">
                {/* Mini summary chips */}
                {renderMiniSummary()}

                {/* Search bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    placeholder={
                      modalType === 'merchants' || modalType === 'viral' ? 'Cari nama, kategori, cabang...' :
                      modalType === 'visits' ? 'Cari merchant atau sales...' :
                      'Cari nama atau cabang...'
                    }
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mandiri-300"
                    autoFocus
                  />
                  {modalSearch && (
                    <button onClick={() => setModalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filter tabs (merchant & viral only) */}
                {cfg.filterBar}
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {renderModalContent()}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Merchant Management sub-component (unchanged) ────────────────────────────
const EMPTY_FORM = {
  name: '', branchId: '', category: 'FnB', address: '',
  googleRating: '', totalReviews: '', estimatedVolume: '',
  isViralTikTok: false, phone: '', ownerName: '',
}

function MerchantManagement() {
  const [merchants, setMerchants] = useState<any[]>([])
  const [branches,  setBranches]  = useState<any[]>([])
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY_FORM })
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/merchants').then(r => r.json()),
      fetch('/api/branches').then(r => r.json()),
    ]).then(([m, b]) => {
      setMerchants(Array.isArray(m) ? m : [])
      setBranches(Array.isArray(b) ? b : [])
      setLoading(false)
    })
  }, [])

  const filtered = merchants.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  async function resetStatus(id: string) {
    await fetch(`/api/merchants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'AVAILABLE', doNotVisitUntil: null }),
    })
    setMerchants(prev => prev.map(m => m.id === id ? { ...m, status: 'AVAILABLE' } : m))
    toast.success('Status merchant direset ke Available')
  }

  async function handleAddMerchant(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.branchId) {
      toast.error('Nama merchant dan cabang wajib diisi')
      return
    }
    setSaving(true)
    const tid = toast.loading('Menyimpan merchant...')
    try {
      const res = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          googleRating:    form.googleRating    ? parseFloat(form.googleRating)    : null,
          totalReviews:    form.totalReviews    ? parseInt(form.totalReviews)      : null,
          estimatedVolume: form.estimatedVolume ? parseFloat(form.estimatedVolume) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan')
      toast.success(`${form.name} berhasil ditambahkan!`, { id: tid })
      setMerchants(prev => [data.merchant, ...prev])
      setForm({ ...EMPTY_FORM })
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message, { id: tid })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari merchant..."
            className="input pl-9 text-sm"
          />
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-mandiri-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-mandiri-800 transition-colors shrink-0"
        >
          <Plus size={15} />
          Tambah
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border-2 border-mandiri-200 bg-mandiri-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-mandiri-700 flex items-center gap-2">
              <Store size={16} /> Tambah Merchant Baru
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <XCircle size={18} />
            </button>
          </div>
          <form onSubmit={handleAddMerchant} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Nama Merchant <span className="text-red-500">*</span></label>
                <input className="input text-sm" placeholder="cth: Warung Pak Budi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Cabang / KC <span className="text-red-500">*</span></label>
                <select className="input text-sm" value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))} required>
                  <option value="">-- Pilih Cabang --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Kategori</label>
                <select className="input text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {['FnB', 'Retail', 'Fashion', 'Health', 'Service', 'Education', 'Entertainment', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Alamat</label>
                <input className="input text-sm" placeholder="cth: Jl. Ahmad Yani No. 10" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Rating Google</label>
                <input type="number" step="0.1" min="1" max="5" className="input text-sm" placeholder="4.5" value={form.googleRating} onChange={e => setForm(f => ({ ...f, googleRating: e.target.value }))} />
              </div>
              <div>
                <label className="label">Jumlah Ulasan</label>
                <input type="number" min="0" className="input text-sm" placeholder="500" value={form.totalReviews} onChange={e => setForm(f => ({ ...f, totalReviews: e.target.value }))} />
              </div>
              <div>
                <label className="label">Est. Volume (Rp)</label>
                <input type="number" min="0" className="input text-sm" placeholder="50000000" value={form.estimatedVolume} onChange={e => setForm(f => ({ ...f, estimatedVolume: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">No. Telepon</label>
                <input className="input text-sm" placeholder="0812-3456-7890" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Nama Pemilik</label>
                <input className="input text-sm" placeholder="cth: Budi Santoso" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none p-3 bg-pink-50 rounded-xl border border-pink-100">
              <div
                onClick={() => setForm(f => ({ ...f, isViralTikTok: !f.isViralTikTok }))}
                className={cn('w-10 h-5 rounded-full transition-colors relative', form.isViralTikTok ? 'bg-pink-500' : 'bg-slate-300')}
              >
                <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.isViralTikTok ? 'translate-x-5' : 'translate-x-0.5')} />
              </div>
              <span className="text-sm font-medium text-slate-700">Viral di TikTok</span>
            </label>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                : <><Plus size={16} /> Tambahkan Merchant</>
              }
            </button>
          </form>
        </div>
      )}

      <p className="text-xs text-slate-400">{filtered.length} merchant ditemukan</p>
      <div className="card overflow-hidden">
        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
          {filtered.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{m.name}</p>
                <p className="text-xs text-slate-400">{m.branch?.name} · {m.totalReviews ?? 0} ulasan</p>
              </div>
              <span className={cn('badge text-xs shrink-0', getStatusColor(m.status))}>
                {getStatusLabel(m.status)}
              </span>
              {(m.status === 'DO_NOT_VISIT' || m.status === 'REJECTED') && (
                <button
                  onClick={() => resetStatus(m.id)}
                  title="Reset ke Available"
                  className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 shrink-0"
                >
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
