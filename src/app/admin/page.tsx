'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import {
  Database, RefreshCw, Plus, Search,
  CheckCircle, XCircle, Clock, BarChart2, Users,
  Store, AlertTriangle, Download, FileSpreadsheet,
} from 'lucide-react'
import { formatRupiah, formatNumber, getStatusColor, getStatusLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
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

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<ScrapingLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [scraping, setScraping] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'scraping'>('overview')

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/'); return }
    if (status === 'authenticated' && session.user.role !== 'ADMIN') {
      router.replace('/select-branch')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadStats()
      loadLogs()
    }
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
    const tid = toast.loading('🔍 Menjalankan proses scraping...')
    try {
      const res = await fetch('/api/scrape/trigger', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('✅ Scraping selesai! Database diperbarui.', { id: tid })
        await loadLogs()
        await loadStats()
      } else {
        toast.error(data.error ?? 'Scraping gagal', { id: tid })
      }
    } finally {
      setScraping(false)
    }
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
            { key: 'overview',   label: 'Overview',  icon: BarChart2 },
            { key: 'merchants',  label: 'Merchant',  icon: Store },
            { key: 'scraping',   label: 'Scraping',  icon: RefreshCw },
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
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Merchant',  value: stats.totalMerchants, icon: Store,     color: 'bg-mandiri-700',  text: 'text-white' },
                { label: 'Total Kunjungan', value: stats.totalVisits,    icon: CheckCircle, color: 'bg-green-500',  text: 'text-white' },
                { label: 'Sales Aktif',     value: stats.totalUsers,     icon: Users,      color: 'bg-purple-500', text: 'text-white' },
                { label: 'Viral TikTok',    value: stats.viral,          icon: BarChart2,  color: 'bg-pink-500',   text: 'text-white' },
              ].map(s => (
                <div key={s.label} className={cn('card p-4 flex items-center gap-3', s.color)}>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <s.icon size={18} className={s.text} />
                  </div>
                  <div>
                    <p className={cn('text-2xl font-extrabold', s.text)}>{s.value}</p>
                    <p className={cn('text-xs', s.text, 'opacity-80')}>{s.label}</p>
                  </div>
                </div>
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
                <a
                  href="/api/export?type=merchants"
                  download
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  <Download size={14} />
                  Data Merchant
                </a>
                <a
                  href="/api/export?type=visits"
                  download
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Download size={14} />
                  Riwayat Kunjungan
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
        {activeTab === 'merchants' && (
          <MerchantManagement />
        )}

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
              <button
                onClick={handleScrape}
                disabled={scraping}
                className="btn-primary w-full mt-4"
              >
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
                        )}>
                          {log.status}
                        </span>
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
    </div>
  )
}

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
      toast.success(`✅ ${form.name} berhasil ditambahkan!`, { id: tid })
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
      {/* Header row */}
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

      {/* Add Merchant Form */}
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
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Nama Merchant <span className="text-red-500">*</span></label>
                <input
                  className="input text-sm"
                  placeholder="cth: Warung Pak Budi"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Cabang / KC <span className="text-red-500">*</span></label>
                <select
                  className="input text-sm"
                  value={form.branchId}
                  onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                  required
                >
                  <option value="">-- Pilih Cabang --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Kategori</label>
                <select
                  className="input text-sm"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {['FnB', 'Retail', 'Fashion', 'Health', 'Service', 'Education', 'Entertainment', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Alamat</label>
                <input
                  className="input text-sm"
                  placeholder="cth: Jl. Ahmad Yani No. 10"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Rating Google</label>
                <input
                  type="number" step="0.1" min="1" max="5"
                  className="input text-sm"
                  placeholder="4.5"
                  value={form.googleRating}
                  onChange={e => setForm(f => ({ ...f, googleRating: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Jumlah Ulasan</label>
                <input
                  type="number" min="0"
                  className="input text-sm"
                  placeholder="500"
                  value={form.totalReviews}
                  onChange={e => setForm(f => ({ ...f, totalReviews: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Est. Volume (Rp)</label>
                <input
                  type="number" min="0"
                  className="input text-sm"
                  placeholder="50000000"
                  value={form.estimatedVolume}
                  onChange={e => setForm(f => ({ ...f, estimatedVolume: e.target.value }))}
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">No. Telepon</label>
                <input
                  className="input text-sm"
                  placeholder="0812-3456-7890"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Nama Pemilik</label>
                <input
                  className="input text-sm"
                  placeholder="cth: Budi Santoso"
                  value={form.ownerName}
                  onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                />
              </div>
            </div>

            {/* Viral toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none p-3 bg-pink-50 rounded-xl border border-pink-100">
              <div
                onClick={() => setForm(f => ({ ...f, isViralTikTok: !f.isViralTikTok }))}
                className={cn(
                  'w-10 h-5 rounded-full transition-colors relative',
                  form.isViralTikTok ? 'bg-pink-500' : 'bg-slate-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  form.isViralTikTok ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </div>
              <span className="text-sm font-medium text-slate-700">🔥 Viral di TikTok</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
              ) : (
                <><Plus size={16} /> Tambahkan Merchant</>
              )}
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
                <p className="text-xs text-slate-400">{m.branch?.name} • {m.totalReviews ?? 0} ulasan</p>
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
