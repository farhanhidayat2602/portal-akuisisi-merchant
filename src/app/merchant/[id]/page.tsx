'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Merchant } from '@/types'
import {
  Star, MapPin, Users, TrendingUp, Phone, Navigation, Zap,
  Lock, Unlock, CheckCircle, XCircle, Clock, ChevronRight,
  AlertTriangle, Calculator, ExternalLink, Building2,
  UserPlus, Briefcase, Trash2, Network,
} from 'lucide-react'
import { RetailContact, SupplierContact } from '@/types'
import { formatRupiah, formatNumber, getStatusColor, getStatusLabel, getStatusDot, calculateDistance, formatDistance } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

type VisitResult = 'INTERESTED' | 'FOLLOW_UP' | 'REJECTED'

const REJECT_REASONS = [
  'Sudah pakai bank lain',
  'Owner tidak ada / tidak bisa ditemui',
  'Tidak butuh EDC / QRIS',
  'Volume transaksi terlalu kecil',
  'Sedang renovasi / tutup sementara',
  'Menolak ditemui',
  'Lainnya',
]

export default function MerchantDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [locking, setLocking] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showCalcChoice, setShowCalcChoice] = useState(false)
  const [calcVolume, setCalcVolume] = useState('')

  // Visit form state
  const [visitResult, setVisitResult] = useState<VisitResult>('INTERESTED')
  const [notes, setNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [isHardReject, setIsHardReject] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [estVolume, setEstVolume] = useState('')

  // Existing EDC state
  const [existingEDC, setExistingEDC]         = useState<'NONE' | 'MANDIRI' | 'OTHER' | ''>('')
  const [existingBankName, setExistingBankName] = useState('')

  // Ecosystem state
  const [retailContacts, setRetailContacts]       = useState<RetailContact[]>([])
  const [supplierContacts, setSupplierContacts]   = useState<SupplierContact[]>([])

  const addRetail    = () => setRetailContacts(p => [...p, { name: '', relation: '', phone: '' }])
  const removeRetail = (i: number) => setRetailContacts(p => p.filter((_, idx) => idx !== i))
  const setRetail    = (i: number, k: keyof RetailContact, v: string) =>
    setRetailContacts(p => p.map((c, idx) => idx === i ? { ...c, [k]: v } : c))

  const addSupplier    = () => setSupplierContacts(p => [...p, { businessName: '', ownerName: '', phone: '' }])
  const removeSupplier = (i: number) => setSupplierContacts(p => p.filter((_, idx) => idx !== i))
  const setSupplier    = (i: number, k: keyof SupplierContact, v: string) =>
    setSupplierContacts(p => p.map((s, idx) => idx === i ? { ...s, [k]: v } : s))

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/')
  }, [status, router])

  async function loadMerchant() {
    try {
      const res = await fetch(`/api/merchants/${params.id}`)
      if (!res.ok) { router.back(); return }
      const data: Merchant = await res.json()
      setMerchant(data)
      const myLock = data.lock?.userId === session?.user?.id
      setIsLocked(myLock)
      if (myLock) setShowVisitForm(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) loadMerchant()
  }, [params.id, session])

  // Restore form state from sessionStorage when returning from calculator
  useEffect(() => {
    if (!merchant || !session) return
    const myLock = merchant.lock?.userId === session.user?.id
    if (!myLock) return
    const saved = sessionStorage.getItem(`visitForm_${merchant.id}`)
    if (!saved) return
    try {
      const d = JSON.parse(saved)
      if (d.visitResult)             setVisitResult(d.visitResult)
      if (d.notes      != null)      setNotes(d.notes)
      if (d.rejectReason != null)    setRejectReason(d.rejectReason)
      if (d.isHardReject != null)    setIsHardReject(d.isHardReject)
      if (d.followUpDate != null)    setFollowUpDate(d.followUpDate)
      if (d.estVolume    != null)    setEstVolume(d.estVolume)
      if (d.existingEDC  != null)    setExistingEDC(d.existingEDC)
      if (d.existingBankName != null) setExistingBankName(d.existingBankName)
      if (d.retailContacts)          setRetailContacts(d.retailContacts)
      if (d.supplierContacts)        setSupplierContacts(d.supplierContacts)
    } catch {}
  }, [merchant?.id])

  function saveFormState() {
    if (!merchant) return
    sessionStorage.setItem(`visitForm_${merchant.id}`, JSON.stringify({
      visitResult, notes, rejectReason, isHardReject, followUpDate,
      estVolume, existingEDC, existingBankName, retailContacts, supplierContacts,
    }))
  }

  function clearFormState() {
    if (!merchant) return
    sessionStorage.removeItem(`visitForm_${merchant.id}`)
  }

  async function handleStartVisit() {
    if (!merchant) return
    setLocking(true)
    try {
      const res = await fetch(`/api/merchants/${merchant.id}/lock`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'SESSION_STALE') {
          toast.error('Sesi sudah tidak valid. Silakan logout dan login kembali.', { duration: 6000 })
          setTimeout(() => signOut({ callbackUrl: 'https://portal-balikpapan.vercel.app' }), 2000)
        } else if (data.error === 'ALREADY_LOCKED') {
          toast.error(`❌ ${data.message}`, { duration: 5000 })
        } else {
          toast.error(data.message ?? 'Gagal mengunci merchant')
        }
        return
      }
      setIsLocked(true)
      setShowVisitForm(true)
      toast.success('✅ Merchant dikunci. Selamat berpenetrasi!')

      // Open Google Maps for navigation
      if (merchant.googleMapsUrl) {
        window.open(merchant.googleMapsUrl, '_blank')
      }
    } finally {
      setLocking(false)
    }
  }

  async function handleCancelVisit() {
    if (!merchant) return
    try {
      await fetch(`/api/merchants/${merchant.id}/lock`, { method: 'DELETE' })
      clearFormState()
      setIsLocked(false)
      setShowVisitForm(false)
      toast('Kunjungan dibatalkan', { icon: '↩️' })
      await loadMerchant()
    } catch {
      toast.error('Gagal membatalkan kunjungan')
    }
  }

  async function handleSubmitVisit(e: React.FormEvent) {
    e.preventDefault()
    if (!merchant) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          result: visitResult,
          notes,
          rejectReason: visitResult === 'REJECTED' ? rejectReason : undefined,
          followUpDate: visitResult === 'FOLLOW_UP' ? followUpDate : undefined,
          isHardReject: visitResult === 'REJECTED' ? isHardReject : false,
          estVolume: estVolume ? parseFloat(estVolume) : undefined,
          existingEDC:      existingEDC || undefined,
          existingBankName: existingEDC === 'OTHER' ? existingBankName : undefined,
          ecosystemData: {
            retail:    retailContacts.filter(c => c.name.trim() || c.phone.trim()),
            suppliers: supplierContacts.filter(s => s.businessName.trim() || s.phone.trim()),
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error('Gagal menyimpan hasil kunjungan'); return }

      toast.success(`🎉 +${data.pointsEarned} poin! Hasil kunjungan disimpan.`)
      clearFormState()

      if (visitResult === 'INTERESTED') {
        setCalcVolume(estVolume || String(merchant.estimatedVolume ?? ''))
        setShowVisitForm(false)
        setShowCalcChoice(true)
      } else {
        router.push(`/dashboard/${merchant.branchId}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !merchant) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar showBack title="Detail Merchant" />
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const isLockedByOther = merchant.lock && merchant.lock.userId !== session?.user?.id
  const myLockActive = merchant.lock?.userId === session?.user?.id
  const branchLat = merchant.branch?.lat
  const branchLng = merchant.branch?.lng
  const dist = branchLat && branchLng
    ? calculateDistance(branchLat, branchLng, merchant.lat, merchant.lng)
    : null

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <Navbar
        showBack
        backHref={`/dashboard/${merchant.branchId}`}
        title={merchant.name}
        branchName={merchant.branch?.name}
      />

      {/* Hero */}
      <div className="relative h-48 bg-slate-200 overflow-hidden">
        {merchant.photoUrl && (
          <img src={merchant.photoUrl} alt={merchant.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">{merchant.name}</h1>
              <p className="text-white/80 text-sm">{merchant.category}</p>
            </div>
            <span className={cn('badge text-sm px-3 py-1', getStatusColor(merchant.status as any))}>
              <span className={cn('w-2 h-2 rounded-full', getStatusDot(merchant.status as any))} />
              {getStatusLabel(merchant.status as any)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-4 mt-4">
        {/* Lock alert */}
        {isLockedByOther && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
              <Lock size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold text-yellow-800 text-sm">Sedang Dikunjungi Rekan Lain</p>
              <p className="text-yellow-700 text-xs mt-0.5">
                {merchant.lock!.user?.name} sedang mengunjungi merchant ini.
                Auto-release pada {format(new Date(merchant.lock!.expiresAt), 'HH:mm', { locale: idLocale })}.
              </p>
            </div>
          </div>
        )}

        {/* Active visit alert */}
        {myLockActive && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800 text-sm">Kunjungan Aktif</p>
              <p className="text-green-700 text-xs mt-0.5">Merchant ini sedang Anda kunjungi.</p>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          {merchant.googleRating && (
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Star size={18} className="text-amber-500 fill-amber-400" />
              </div>
              <div>
                <p className="font-bold text-slate-800">{merchant.googleRating}</p>
                <p className="text-xs text-slate-500">{formatNumber(merchant.totalReviews ?? 0)} ulasan</p>
              </div>
            </div>
          )}
          {dist != null && (
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800">{formatDistance(dist)}</p>
                <p className="text-xs text-slate-500">dari cabang</p>
              </div>
            </div>
          )}
          {merchant.estimatedVolume && (
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-mandiri-50 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-mandiri-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">{formatRupiah(merchant.estimatedVolume)}</p>
                <p className="text-xs text-slate-500">est. volume/bln</p>
              </div>
            </div>
          )}
          {merchant.isViralTikTok && (
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                <Zap size={18} className="text-pink-500" />
              </div>
              <div>
                <p className="font-bold text-pink-600">Viral</p>
                <p className="text-xs text-slate-500">Trending TikTok</p>
              </div>
            </div>
          )}
        </div>

        {/* Intelligence Info */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">Informasi Merchant</h3>
          <div className="space-y-2.5 text-sm">
            {merchant.address && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{merchant.address}</span>
              </div>
            )}
            {merchant.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span>{merchant.phone}</span>
              </div>
            )}
            {merchant.ownerName && (
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={14} className="text-slate-400 shrink-0" />
                <span>Owner: {merchant.ownerName}</span>
              </div>
            )}
            {merchant.priceRange && (
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-slate-400 text-xs">💰</span>
                <span>Kisaran harga: {merchant.priceRange}</span>
              </div>
            )}
            {merchant.branch && (
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 size={14} className="text-slate-400 shrink-0" />
                <span>Cabang: {merchant.branch.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Existing EDC/QRIS info */}
        {(merchant.isMandiriEDC || merchant.isMandiriQRIS) && (
          <div className="card p-4 border-l-4 border-mandiri-500">
            <p className="text-sm font-semibold text-mandiri-700">Sudah Terdaftar Mandiri</p>
            <div className="flex gap-2 mt-2">
              {merchant.isMandiriEDC  && <span className="badge bg-mandiri-100 text-mandiri-700">EDC Mandiri</span>}
              {merchant.isMandiriQRIS && <span className="badge bg-green-100 text-green-700">QRIS Mandiri</span>}
            </div>
          </div>
        )}

        {/* Visit history */}
        {merchant.visits && merchant.visits.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">
              Riwayat Kunjungan ({merchant.visits.length})
            </h3>
            <div className="space-y-2.5">
              {merchant.visits.slice(0, 5).map(v => (
                <div key={v.id} className="flex items-start gap-3 text-sm">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    v.result === 'INTERESTED' ? 'bg-purple-100' :
                    v.result === 'FOLLOW_UP' ? 'bg-blue-100' : 'bg-red-100'
                  )}>
                    {v.result === 'INTERESTED' ? <CheckCircle size={12} className="text-purple-500" /> :
                     v.result === 'FOLLOW_UP' ? <Clock size={12} className="text-blue-500" /> :
                     <XCircle size={12} className="text-red-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-700">
                      {v.result === 'INTERESTED' ? 'Tertarik' : v.result === 'FOLLOW_UP' ? 'Follow Up' : 'Ditolak'}
                      <span className="text-slate-400 font-normal text-xs ml-2">oleh {v.user?.name}</span>
                    </p>
                    {v.notes && <p className="text-xs text-slate-500 mt-0.5">{v.notes}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(new Date(v.visitedAt), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isLockedByOther && merchant.status !== 'DO_NOT_VISIT' && merchant.status !== 'ACQUIRED' && (
          <div className="space-y-3">
            {!myLockActive ? (
              <button
                onClick={handleStartVisit}
                disabled={locking}
                className="btn-primary w-full py-4 text-base"
              >
                {locking ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengunci Merchant...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Navigation size={18} />
                    Mulai Kunjungi Merchant
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowVisitForm(!showVisitForm)}
                className="btn-primary w-full py-4 text-base"
              >
                <CheckCircle size={18} />
                Input Hasil Kunjungan
              </button>
            )}

            <div className="flex gap-2">
              {merchant.googleMapsUrl && (
                <a
                  href={merchant.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  <Navigation size={14} />
                  Navigasi
                </a>
              )}
              <button
                onClick={() => {
                  setCalcVolume(String(merchant.estimatedVolume ?? ''))
                  setShowCalcChoice(true)
                }}
                className="btn-secondary flex-1 py-2.5 text-sm"
              >
                <Calculator size={14} />
                Kalkulator
              </button>
              {myLockActive && (
                <button onClick={handleCancelVisit} className="btn-danger py-2.5 px-4 text-sm">
                  Batal
                </button>
              )}
            </div>
          </div>
        )}

        {/* Visit form */}
        {showVisitForm && myLockActive && (
          <form onSubmit={handleSubmitVisit} className="card p-5 space-y-4 animate-slide-up">
            <h3 className="font-bold text-slate-800">Hasil Kunjungan</h3>

            {/* Result selection */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: 'INTERESTED', label: 'Tertarik',  emoji: '🎯', color: 'border-purple-400 bg-purple-50 text-purple-700' },
                { v: 'FOLLOW_UP',  label: 'Follow Up', emoji: '📅', color: 'border-blue-400 bg-blue-50 text-blue-700' },
                { v: 'REJECTED',   label: 'Tolak',     emoji: '❌', color: 'border-red-400 bg-red-50 text-red-700' },
              ] as { v: VisitResult; label: string; emoji: string; color: string }[]).map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setVisitResult(opt.v)}
                  className={cn(
                    'border-2 rounded-xl p-3 text-center transition-all',
                    visitResult === opt.v ? opt.color : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  )}
                >
                  <div className="text-2xl mb-1">{opt.emoji}</div>
                  <div className="text-xs font-semibold">{opt.label}</div>
                </button>
              ))}
            </div>

            {/* ── STATUS EDC MERCHANT ── */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-slate-700">
                Status EDC / QRIS Merchant Saat Ini
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'NONE',    label: 'Belum punya',    emoji: '🚫', color: 'border-slate-400 bg-slate-50 text-slate-700' },
                  { v: 'MANDIRI', label: 'Sudah Mandiri',  emoji: '🏧', color: 'border-mandiri-400 bg-mandiri-50 text-mandiri-700' },
                  { v: 'OTHER',   label: 'Bank lain',      emoji: '🏦', color: 'border-red-400 bg-red-50 text-red-700' },
                ] as { v: typeof existingEDC; label: string; emoji: string; color: string }[]).map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => { setExistingEDC(opt.v); if (opt.v !== 'OTHER') setExistingBankName('') }}
                    className={cn(
                      'border-2 rounded-xl p-2.5 text-center transition-all',
                      existingEDC === opt.v ? opt.color : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                    )}
                  >
                    <div className="text-xl mb-1">{opt.emoji}</div>
                    <div className="text-xs font-semibold leading-tight">{opt.label}</div>
                  </button>
                ))}
              </div>

              {existingEDC === 'OTHER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nama Bank yang Digunakan
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {['BCA', 'BRI', 'BNI', 'CIMB', 'BTN', 'Lainnya'].map(bank => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setExistingBankName(bank)}
                        className={cn(
                          'py-1.5 rounded-lg text-xs font-semibold border transition-all',
                          existingBankName === bank
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                        )}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={existingBankName}
                    onChange={e => setExistingBankName(e.target.value)}
                    placeholder="Atau ketik nama bank..."
                    className="input py-2 text-sm"
                  />
                </div>
              )}

              {existingEDC === 'MANDIRI' && (
                <div className="flex items-center gap-2 bg-mandiri-50 rounded-xl px-3 py-2">
                  <span className="text-sm">✅</span>
                  <p className="text-xs text-mandiri-700 font-medium">
                    Merchant sudah jadi nasabah Mandiri — fokus ke upsell produk lain
                  </p>
                </div>
              )}

              {existingEDC === 'OTHER' && existingBankName && (
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                  <span className="text-sm">💡</span>
                  <p className="text-xs text-amber-700 font-medium">
                    Gunakan Kalkulator Negosiasi untuk tunjukkan penghematan vs {existingBankName}
                  </p>
                </div>
              )}
            </div>

            {/* Conditional fields */}
            {visitResult === 'INTERESTED' && (
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Estimasi Volume Transaksi/Bulan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                  <input
                    type="number"
                    value={estVolume}
                    onChange={e => setEstVolume(e.target.value)}
                    placeholder="Contoh: 150000000"
                    className="input pl-10"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {estVolume ? formatRupiah(parseFloat(estVolume)) : 'Masukkan estimasi volume transaksi bulanan'}
                </p>
              </div>
            )}

            {visitResult === 'FOLLOW_UP' && (
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Jadwal Follow Up
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input"
                  required
                />
              </div>
            )}

            {visitResult === 'REJECTED' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Alasan Penolakan</label>
                  <select
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">-- Pilih alasan --</option>
                    {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHardReject}
                    onChange={e => setIsHardReject(e.target.checked)}
                    className="w-4 h-4 rounded text-mandiri-700"
                  />
                  <span className="text-sm text-slate-600">
                    Hard Reject (jangan kunjungi 90 hari)
                  </span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Catatan (opsional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Catatan tambahan mengenai hasil kunjungan..."
                rows={3}
                className="input resize-none"
              />
            </div>

            {/* ── EKOSISTEM MERCHANT ── */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Network size={15} className="text-mandiri-600" />
                <h4 className="font-bold text-slate-800 text-sm">Ekosistem Merchant</h4>
                <span className="text-xs text-slate-400 ml-auto">Opsional</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Gali potensi nasabah lain dari jaringan merchant ini
              </p>

              {/* Retail / Keluarga */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <UserPlus size={13} className="text-purple-500" />
                    <p className="text-xs font-bold text-slate-700">Potensi Retail (Owner / Keluarga)</p>
                  </div>
                  <button
                    type="button"
                    onClick={addRetail}
                    className="text-xs text-mandiri-600 font-semibold hover:text-mandiri-800 flex items-center gap-0.5"
                  >
                    + Tambah
                  </button>
                </div>
                {retailContacts.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    Klik "+ Tambah" untuk mencatat kontak retail
                  </p>
                )}
                <div className="space-y-2">
                  {retailContacts.map((c, i) => (
                    <div key={i} className="bg-purple-50 rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Nama"
                          value={c.name}
                          onChange={e => setRetail(i, 'name', e.target.value)}
                          className="input py-2 text-sm"
                        />
                        <input
                          placeholder="Hubungan (cth: Istri)"
                          value={c.relation}
                          onChange={e => setRetail(i, 'relation', e.target.value)}
                          className="input py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          placeholder="Nomor HP"
                          inputMode="tel"
                          value={c.phone}
                          onChange={e => setRetail(i, 'phone', e.target.value)}
                          className="input py-2 text-sm flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeRetail(i)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supplier */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={13} className="text-amber-500" />
                    <p className="text-xs font-bold text-slate-700">Potensi Supplier</p>
                  </div>
                  <button
                    type="button"
                    onClick={addSupplier}
                    className="text-xs text-mandiri-600 font-semibold hover:text-mandiri-800 flex items-center gap-0.5"
                  >
                    + Tambah
                  </button>
                </div>
                {supplierContacts.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    Klik "+ Tambah" untuk mencatat supplier merchant
                  </p>
                )}
                <div className="space-y-2">
                  {supplierContacts.map((s, i) => (
                    <div key={i} className="bg-amber-50 rounded-xl p-3 space-y-2">
                      <input
                        placeholder="Nama Usaha Supplier (cth: Toko Sumber Makmur)"
                        value={s.businessName}
                        onChange={e => setSupplier(i, 'businessName', e.target.value)}
                        className="input py-2 text-sm w-full"
                      />
                      <div className="flex gap-2">
                        <input
                          placeholder="Nama Pemilik"
                          value={s.ownerName}
                          onChange={e => setSupplier(i, 'ownerName', e.target.value)}
                          className="input py-2 text-sm flex-1"
                        />
                        <input
                          placeholder="Nomor HP"
                          inputMode="tel"
                          value={s.phone}
                          onChange={e => setSupplier(i, 'phone', e.target.value)}
                          className="input py-2 text-sm flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeSupplier(i)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || (visitResult === 'REJECTED' && !rejectReason) || (visitResult === 'FOLLOW_UP' && !followUpDate)}
              className="btn-primary w-full py-3"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : 'Simpan Hasil Kunjungan'}
            </button>
          </form>
        )}

        {/* ── KALKULATOR CHOICE MODAL ── */}
        {showCalcChoice && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCalcChoice(false)}
            />
            <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-xl animate-slide-up">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
              <h3 className="font-bold text-slate-800 text-base mb-1 text-center">
                Pilih Jenis Kalkulator
              </h3>
              <p className="text-xs text-slate-400 text-center mb-5">
                Apakah merchant ini sudah punya EDC dari bank lain?
              </p>

              <div className="space-y-3">
                {/* Sudah punya EDC */}
                <button
                  onClick={() => {
                    saveFormState()
                    setShowCalcChoice(false)
                    router.push(`/negotiation?volume=${calcVolume}&merchantId=${merchant.id}&branchId=${merchant.branchId}`)
                  }}
                  className="w-full flex items-start gap-4 bg-red-50 border-2 border-red-100 hover:border-red-300 rounded-2xl p-4 text-left transition-all active:scale-98"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xl">🏦</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Sudah punya EDC bank lain</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Bandingkan biaya bank existing vs Mandiri — tunjukkan berapa merchant bisa hemat
                    </p>
                    <span className="inline-block mt-2 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      Kalkulator Negosiasi
                    </span>
                  </div>
                </button>

                {/* Belum punya EDC */}
                <button
                  onClick={() => {
                    saveFormState()
                    setShowCalcChoice(false)
                    router.push(`/calculator?merchantId=${merchant.id}&volume=${calcVolume}`)
                  }}
                  className="w-full flex items-start gap-4 bg-mandiri-50 border-2 border-mandiri-100 hover:border-mandiri-300 rounded-2xl p-4 text-left transition-all active:scale-98"
                >
                  <div className="w-10 h-10 bg-mandiri-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xl">✨</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Belum punya EDC</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Simulasikan potensi fee-based income dari merchant baru untuk Mandiri
                    </p>
                    <span className="inline-block mt-2 text-xs font-semibold text-mandiri-700 bg-mandiri-100 px-2 py-0.5 rounded-full">
                      Kalkulator Fee MDR
                    </span>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowCalcChoice(false)}
                className="w-full mt-4 py-2.5 text-sm text-slate-400 font-medium hover:text-slate-600 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* DO NOT VISIT notice */}
        {merchant.status === 'DO_NOT_VISIT' && (
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <AlertTriangle size={20} className="text-gray-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-700 text-sm">Jangan Dikunjungi</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Merchant ini ditandai Do Not Visit sampai{' '}
                {merchant.doNotVisitUntil
                  ? format(new Date(merchant.doNotVisitUntil), 'd MMM yyyy', { locale: idLocale })
                  : 'waktu tidak ditentukan'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
