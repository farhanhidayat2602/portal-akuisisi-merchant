'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/Navbar'
import { MerchantCard } from '@/components/MerchantCard'
import { Branch, Merchant } from '@/types'
import { calculateDistance, formatNumber, getStatusLabel } from '@/lib/utils'
import {
  Search, Filter, SlidersHorizontal, MapPin, Star, TrendingUp,
  Zap, RefreshCw, X, ChevronDown, Map, List, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const DynamicMap = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-72 bg-slate-100 rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-mandiri-200 border-t-mandiri-600 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-400">Memuat peta...</p>
      </div>
    </div>
  ),
})

type SortKey = 'reviews' | 'rating' | 'distance' | 'volume'
type FilterStatus = 'ALL' | 'AVAILABLE' | 'LOCKED' | 'INTERESTED' | 'FOLLOW_UP' | 'REJECTED' | 'ACQUIRED'
type ViewMode = 'split' | 'map' | 'list'

export default function DashboardPage({ params }: { params: { branchId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [branch, setBranch] = useState<Branch | null>(null)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('reviews')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [filterViral, setFilterViral] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [showFilters, setShowFilters] = useState(false)

  // Add merchant modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '', category: 'FnB', address: '', phone: '',
    ownerName: '', estimatedVolume: '', googleMapsUrl: '',
  })
  const [addSubmitting, setAddSubmitting] = useState(false)

  function resetAddForm() {
    setAddForm({ name: '', category: 'FnB', address: '', phone: '', ownerName: '', estimatedVolume: '', googleMapsUrl: '' })
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/')
  }, [status, router])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [branchesRes, merchantsRes] = await Promise.all([
        fetch('/api/branches'),
        fetch(`/api/merchants?branchId=${params.branchId}${filterViral ? '&viral=true' : ''}`),
      ])
      const branchesData: Branch[] = await branchesRes.json()
      const merchantsData: Merchant[] = await merchantsRes.json()
      const found = branchesData.find(b => b.id === params.branchId)
      setBranch(found ?? null)
      setMerchants(merchantsData)
    } finally {
      setLoading(false)
    }
  }, [params.branchId, filterViral])

  useEffect(() => { loadData() }, [loadData])

  // Auto-refresh every 30s for anti-collision updates
  useEffect(() => {
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const filtered = merchants
    .filter(m => {
      if (filterStatus !== 'ALL' && m.status !== filterStatus) return false
      if (filterViral && !m.isViralTikTok) return false
      if (search) {
        const q = search.toLowerCase()
        return m.name.toLowerCase().includes(q) || (m.address ?? '').toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'reviews') return (b.totalReviews ?? 0) - (a.totalReviews ?? 0)
      if (sortBy === 'rating')  return (b.googleRating ?? 0) - (a.googleRating ?? 0)
      if (sortBy === 'volume')  return (b.estimatedVolume ?? 0) - (a.estimatedVolume ?? 0)
      if (sortBy === 'distance' && branch) {
        const da = calculateDistance(branch.lat, branch.lng, a.lat, a.lng)
        const db = calculateDistance(branch.lat, branch.lng, b.lat, b.lng)
        return da - db
      }
      return 0
    })

  const stats = {
    total:     merchants.length,
    available: merchants.filter(m => m.status === 'AVAILABLE').length,
    locked:    merchants.filter(m => m.status === 'LOCKED').length,
    interested: merchants.filter(m => m.status === 'INTERESTED').length,
    acquired:  merchants.filter(m => m.status === 'ACQUIRED').length,
    viral:     merchants.filter(m => m.isViralTikTok).length,
  }

  async function handleAddMerchant(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.name.trim()) return
    setAddSubmitting(true)
    try {
      const res = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          category: addForm.category,
          address: addForm.address.trim() || undefined,
          phone: addForm.phone.trim() || undefined,
          ownerName: addForm.ownerName.trim() || undefined,
          estimatedVolume: addForm.estimatedVolume ? parseFloat(addForm.estimatedVolume) : undefined,
          googleMapsUrl: addForm.googleMapsUrl.trim() || undefined,
          branchId: params.branchId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Gagal menambahkan merchant'); return }
      toast.success(`✅ ${addForm.name} berhasil ditambahkan!`)
      setShowAddModal(false)
      resetAddForm()
      await loadData()
      router.push(`/merchant/${data.merchant.id}`)
    } finally {
      setAddSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {branch && <Navbar title={branch.name} showBack backHref="/select-branch" branchName={branch.city} />}
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!branch) return null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title={branch.name}
        showBack
        backHref="/select-branch"
        branchName={`${branch.city} • ${stats.total} merchant`}
      />

      {/* Stats row */}
      <div className="bg-mandiri-700 px-4 pb-3">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { label: 'Tersedia',   value: stats.available,  dot: 'bg-green-500',        action: () => setFilterStatus(f => f === 'AVAILABLE' ? 'ALL' : 'AVAILABLE'), active: filterStatus === 'AVAILABLE' },
            { label: 'Dikunjungi', value: stats.locked,     dot: 'bg-yellow-400',        action: () => setFilterStatus(f => f === 'LOCKED'    ? 'ALL' : 'LOCKED'),    active: filterStatus === 'LOCKED'    },
            { label: 'Tertarik',   value: stats.interested, dot: 'bg-purple-500',        action: () => setFilterStatus(f => f === 'INTERESTED' ? 'ALL' : 'INTERESTED'), active: filterStatus === 'INTERESTED' },
            { label: 'Akuisisi',   value: stats.acquired,   dot: 'bg-mandiri-green',     action: () => setFilterStatus(f => f === 'ACQUIRED'  ? 'ALL' : 'ACQUIRED'),  active: filterStatus === 'ACQUIRED'  },
            { label: 'Viral',      value: stats.viral,      dot: 'bg-pink-500',          action: () => setFilterViral(v => !v),                                       active: filterViral                  },
          ].map(s => (
            <button
              key={s.label}
              onClick={s.action}
              className={cn(
                'rounded-xl px-3 py-2 flex items-center gap-2 shrink-0 transition-all active:scale-95',
                s.active ? 'bg-white/25 ring-2 ring-white/60' : 'bg-mandiri-600 hover:bg-mandiri-500'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
              <span className="text-white text-xs font-semibold">{s.value}</span>
              <span className="text-mandiri-200 text-xs">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 sticky top-[88px] z-30">
        <div className="max-w-6xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari merchant..."
              className="w-full pl-8 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-mandiri-300"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={13} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
              showFilters ? 'bg-mandiri-700 text-white border-mandiri-700' : 'bg-white text-slate-600 border-slate-200 hover:border-mandiri-300'
            )}
          >
            <SlidersHorizontal size={14} />
            Filter
          </button>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            {(['split', 'list', 'map'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={cn(
                  'px-2.5 py-2 transition-colors',
                  viewMode === v ? 'bg-mandiri-700 text-white' : 'text-slate-500 hover:bg-slate-50'
                )}
                title={v === 'split' ? 'Split view' : v === 'list' ? 'List' : 'Map'}
              >
                {v === 'list' ? <List size={14} /> : <Map size={14} />}
              </button>
            ))}
          </div>
          <button onClick={loadData} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="max-w-6xl mx-auto mt-3 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {(['ALL', 'AVAILABLE', 'LOCKED', 'INTERESTED', 'FOLLOW_UP', 'REJECTED', 'ACQUIRED'] as FilterStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    filterStatus === s ? 'bg-mandiri-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {s === 'ALL' ? 'Semua' : getStatusLabel(s as any)}
                </button>
              ))}
            </div>
            <div className="h-px w-full bg-slate-100" />
            {/* Sort */}
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 self-center">Urutkan:</span>
              {([
                { key: 'reviews',  label: 'Ulasan' },
                { key: 'rating',   label: 'Rating' },
                { key: 'distance', label: 'Terdekat' },
                { key: 'volume',   label: 'Volume' },
              ] as { key: SortKey; label: string }[]).map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    sortBy === s.key ? 'bg-mandiri-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFilterViral(!filterViral)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1',
                filterViral ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Zap size={10} /> Viral TikTok
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-4">
        <div className={cn(
          'flex gap-4',
          viewMode === 'split' ? 'flex-col lg:flex-row' : 'flex-col'
        )}>
          {/* Map */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div className={cn(
              viewMode === 'split' ? 'lg:w-1/2' : 'w-full'
            )}>
              <DynamicMap
                branch={branch}
                merchants={filtered}
                selectedId={selectedId}
                onSelectMerchant={m => {
                  setSelectedId(m.id)
                  router.push(`/merchant/${m.id}`)
                }}
                height={viewMode === 'map' ? '65vh' : '400px'}
              />
              <p className="text-xs text-slate-400 mt-2 text-center">
                {filtered.length} merchant ditampilkan • klik pin untuk detail
              </p>
            </div>
          )}

          {/* Merchant list */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div className={cn(
              'flex flex-col gap-2',
              viewMode === 'split' ? 'lg:w-1/2 lg:max-h-[500px] lg:overflow-y-auto' : 'w-full'
            )}>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Star size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Tidak ada merchant ditemukan</p>
                  <p className="text-sm mt-1">Coba ubah filter pencarian</p>
                </div>
              ) : (
                filtered.map(m => (
                  <MerchantCard
                    key={m.id}
                    merchant={m}
                    onClick={() => router.push(`/merchant/${m.id}`)}
                    distance={branch ? calculateDistance(branch.lat, branch.lng, m.lat, m.lng) : undefined}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* FAB — Tambah Merchant */}
      <button
        onClick={() => { resetAddForm(); setShowAddModal(true) }}
        className="fixed bottom-6 right-5 z-40 flex items-center gap-2 bg-mandiri-700 hover:bg-mandiri-800 text-white font-semibold text-sm px-4 py-3 rounded-2xl shadow-lg shadow-mandiri-900/30 transition-all active:scale-95"
      >
        <Plus size={18} />
        Tambah Merchant
      </button>

      {/* Modal tambah merchant */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-xl animate-slide-up max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Tambah Merchant Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Merchant yang belum ada di daftar</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMerchant} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Nama Merchant <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Cth: Warung Makan Sumber Rejeki"
                  className="input"
                  required
                  autoFocus
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Kategori</label>
                <div className="grid grid-cols-3 gap-2">
                  {['FnB', 'Retail', 'Fashion', 'Elektronik', 'Minimarket', 'Apotek', 'Salon', 'Hotel', 'Bengkel', 'Klinik', 'Supermarket', 'Lainnya'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, category: cat }))}
                      className={cn(
                        'py-2 rounded-xl text-xs font-semibold border-2 transition-all',
                        addForm.category === cat
                          ? 'border-mandiri-500 bg-mandiri-50 text-mandiri-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Alamat</label>
                <input
                  type="text"
                  value={addForm.address}
                  onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Cth: Jl. Sudirman No. 12, Balikpapan"
                  className="input"
                />
              </div>

              {/* Telepon & Nama Pemilik */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">No. Telepon</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Cth: 0812xxxx"
                    className="input"
                    inputMode="tel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Nama Pemilik</label>
                  <input
                    type="text"
                    value={addForm.ownerName}
                    onChange={e => setAddForm(f => ({ ...f, ownerName: e.target.value }))}
                    placeholder="Cth: Pak Budi"
                    className="input"
                  />
                </div>
              </div>

              {/* Estimasi Volume */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Estimasi Volume Transaksi / Bulan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                  <input
                    type="number"
                    value={addForm.estimatedVolume}
                    onChange={e => setAddForm(f => ({ ...f, estimatedVolume: e.target.value }))}
                    placeholder="Cth: 150000000"
                    className="input pl-10"
                    inputMode="numeric"
                  />
                </div>
                {addForm.estimatedVolume && (
                  <p className="text-xs text-slate-400 mt-1">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(addForm.estimatedVolume))}
                  </p>
                )}
              </div>

              {/* Google Maps URL */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Link Google Maps <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="url"
                  value={addForm.googleMapsUrl}
                  onChange={e => setAddForm(f => ({ ...f, googleMapsUrl: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                  className="input text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Paste link dari Google Maps untuk navigasi langsung</p>
              </div>

              <div className="pb-4">
                <button
                  type="submit"
                  disabled={addSubmitting || !addForm.name.trim()}
                  className="btn-primary w-full py-3"
                >
                  {addSubmitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <Plus size={16} />
                      Tambahkan & Mulai Kunjungi
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
