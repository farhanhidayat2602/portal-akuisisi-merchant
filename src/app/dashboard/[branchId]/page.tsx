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
  Zap, RefreshCw, X, ChevronDown, Map, List,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
type FilterStatus = 'ALL' | 'AVAILABLE' | 'INTERESTED' | 'FOLLOW_UP' | 'REJECTED'
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
    viral:     merchants.filter(m => m.isViralTikTok).length,
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
            { label: 'Tersedia',    value: stats.available,  color: 'bg-green-500' },
            { label: 'Dikunjungi', value: stats.locked,     color: 'bg-yellow-400' },
            { label: 'Tertarik',   value: stats.interested, color: 'bg-purple-500' },
            { label: 'Viral',       value: stats.viral,     color: 'bg-pink-500' },
          ].map(s => (
            <div key={s.label} className="bg-mandiri-600 rounded-xl px-3 py-2 flex items-center gap-2 shrink-0">
              <span className={cn('w-2 h-2 rounded-full shrink-0', s.color)} />
              <span className="text-white text-xs font-semibold">{s.value}</span>
              <span className="text-mandiri-200 text-xs">{s.label}</span>
            </div>
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
              {(['ALL', 'AVAILABLE', 'INTERESTED', 'FOLLOW_UP', 'REJECTED'] as FilterStatus[]).map(s => (
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
    </div>
  )
}
