'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import {
  CreditCard, TrendingDown, PiggyBank, Calendar,
  ChevronDown, ChevronUp, ArrowRight, Info,
  CheckCircle2, Layers, Users, Zap, FileText, Plus, X,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import jsPDF from 'jspdf'

function fmt(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}

const BANKS = ['BCA', 'BRI', 'BNI', 'CIMB', 'BTN', 'Danamon', 'Lainnya']

const THUMB = '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md'

const COLORS = [
  { bg: 'bg-red-500',    light: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    ring: 'focus:ring-red-200'    },
  { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', ring: 'focus:ring-orange-200' },
  { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', ring: 'focus:ring-purple-200' },
  { bg: 'bg-pink-500',   light: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-600',   ring: 'focus:ring-pink-200'   },
]

type EdcEntry = {
  id: string
  bank: string
  debitOnUs: string
  debitOffUs: string
  kreditOnUs: string
  kreditOffUs: string
  qrisRate: string
  showRates: boolean
}

function makeEdc(): EdcEntry {
  return {
    id: Math.random().toString(36).slice(2),
    bank: '',
    debitOnUs: '1.00',
    debitOffUs: '1.00',
    kreditOnUs: '2.00',
    kreditOffUs: '2.00',
    qrisRate: '0.70',
    showRates: false,
  }
}

function MultiEDCContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const merchantId   = searchParams.get('merchantId')

  const [edcs, setEdcs]               = useState<EdcEntry[]>([makeEdc()])
  const [primaryIdx, setPrimaryIdx]   = useState(0)

  const [volume,         setVolume]         = useState('')
  const [qrisPct,        setQrisPct]        = useState(30)
  const [debitPct,       setDebitPct]       = useState(70)
  const [mandiriNasabah, setMandiriNasabah] = useState(35)
  const [showMRates,     setShowMRates]     = useState(false)
  const [mDebitOnUs,     setMDebitOnUs]     = useState('0.15')
  const [mKreditOnUs,    setMKreditOnUs]    = useState('1.80')

  const vol = parseFloat(volume.replace(/\D/g, '')) || 0

  const updateEdc = (idx: number, field: keyof EdcEntry, value: string | boolean) =>
    setEdcs(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))

  const addEdc = () => {
    if (edcs.length >= 4) return
    setEdcs(prev => [...prev, makeEdc()])
  }

  const removeEdc = (idx: number) => {
    if (edcs.length <= 1) return
    setEdcs(prev => {
      const next = prev.filter((_, i) => i !== idx)
      if (primaryIdx >= next.length) setPrimaryIdx(next.length - 1)
      else if (primaryIdx > idx) setPrimaryIdx(p => p - 1)
      return next
    })
  }

  const calc = useMemo(() => {
    if (vol === 0) return null
    const p = edcs[primaryIdx] ?? edcs[0]

    const edcPct    = 100 - qrisPct
    const kreditPct = 100 - debitPct
    const qrisVol   = vol * qrisPct / 100
    const edcVol    = vol * edcPct  / 100
    const debitVol  = edcVol * debitPct  / 100
    const kreditVol = edcVol * kreditPct / 100

    const mDVol  = debitVol  * mandiriNasabah / 100
    const oDVol  = debitVol  * (100 - mandiriNasabah) / 100
    const mKVol  = kreditVol * mandiriNasabah / 100
    const oKVol  = kreditVol * (100 - mandiriNasabah) / 100

    const exDon  = parseFloat(p.debitOnUs)   / 100
    const exDoff = parseFloat(p.debitOffUs)  / 100
    const exKon  = parseFloat(p.kreditOnUs)  / 100
    const exKoff = parseFloat(p.kreditOffUs) / 100
    const exQr   = parseFloat(p.qrisRate)    / 100
    const mDon   = parseFloat(mDebitOnUs)    / 100
    const mKon   = parseFloat(mKreditOnUs)   / 100

    // Before: N EDC (Mandiri cardholders Off-Us at primary existing EDC)
    const feeA = mDVol * exDoff + oDVol * exDon + mKVol * exKoff + oKVol * exKon + qrisVol * exQr
    // After:  N+1 EDC (Mandiri cardholders On-Us at new Mandiri EDC)
    const feeB = mDVol * mDon  + oDVol * exDon + mKVol * mKon  + oKVol * exKon + qrisVol * exQr

    const savings    = feeA - feeB
    const savingsPct = feeA > 0 ? (savings / feeA) * 100 : 0

    return {
      feeA, feeB, savings, savingsPct,
      savings6m: savings * 6,
      savings1y: savings * 12,
      mVol: mDVol + mKVol,
      oVol: oDVol + oKVol,
      qrisVol,
      mandiriFee:   mDVol * mDon  + mKVol * mKon,
      existingFee:  oDVol * exDon + oKVol * exKon,
      qrisFee:      qrisVol * exQr,
      mMDRoff: exDoff, mMDRon: mDon,
      primary: p,
      mDVol, oDVol, mKVol, oKVol,
    }
  }, [vol, qrisPct, debitPct, mandiriNasabah, edcs, primaryIdx, mDebitOnUs, mKreditOnUs])

  function handlePDF() {
    if (!calc) return
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210, m = 14, cW = W - m * 2
    doc.setFillColor(0, 59, 121); doc.rect(0, 0, W, 38, 'F')
    doc.setFillColor(245, 166, 35); doc.rect(0, 38, W, 3.5, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15)
    doc.text('STRATEGI MULTI-EDC — PENGHEMATAN BIAYA', m, 13)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    const bankNames = edcs.map(e => e.bank || 'Existing').join(' + ')
    doc.text(`EDC: ${bankNames} + Mandiri (total ${edcs.length + 1} EDC)`, m, 21)
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, m, 28)
    if (session?.user?.name) doc.text('RO: ' + session.user.name, W - m, 28, { align: 'right' })

    let y = 48
    const fmt2 = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

    doc.setFillColor(235, 243, 255); doc.roundedRect(m, y, cW, 16, 3, 3, 'F')
    doc.setTextColor(0, 59, 121); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('OMZET MERCHANT / BULAN', m + 4, y + 6); doc.setFontSize(14)
    doc.text(fmt2(vol), m + 4, y + 13); y += 22

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(20, 30, 50)
    doc.text('PERBANDINGAN BIAYA TRANSAKSI', m, y); y += 5

    const drawRow = (label: string, v1: string, v2: string, style: 'header' | 'normal' | 'total' = 'normal') => {
      const rH = 8, c2 = m + 95, c3 = m + 145
      if (style === 'header') { doc.setFillColor(0, 59, 121); doc.rect(m, y, cW, rH, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8) }
      else if (style === 'total') { doc.setFillColor(219, 234, 254); doc.rect(m, y, cW, rH, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(20, 30, 50) }
      else { doc.setFillColor(y % 16 < 8 ? 248 : 242, y % 16 < 8 ? 250 : 246, y % 16 < 8 ? 252 : 250); doc.rect(m, y, cW, rH, 'F'); doc.setTextColor(40, 50, 70); doc.setFont('helvetica', 'normal'); doc.setFontSize(8) }
      doc.text(label, m + 3, y + 5.5); doc.text(v1, c2 + 3, y + 5.5); doc.text(v2, c3 + 3, y + 5.5)
      doc.setDrawColor(200, 210, 225); doc.rect(m, y, cW, rH); doc.line(c2, y, c2, y + rH); doc.line(c3, y, c3, y + rH)
      y += rH
    }

    drawRow('Komponen', `${edcs.length} EDC (Existing)`, `${edcs.length + 1} EDC (+ Mandiri)`, 'header')
    drawRow(`QRIS (${qrisPct}%)`, fmt2(calc.qrisFee), fmt2(calc.qrisFee))
    drawRow(`Nasabah Mandiri (${mandiriNasabah}%)`, fmt2(calc.mDVol * parseFloat(calc.primary.debitOffUs) / 100 + calc.mKVol * parseFloat(calc.primary.kreditOffUs) / 100), fmt2(calc.mandiriFee))
    drawRow(`Nasabah Non-Mandiri (${100 - mandiriNasabah}%)`, fmt2(calc.existingFee), fmt2(calc.existingFee))
    drawRow('TOTAL BIAYA / BULAN', fmt2(calc.feeA), fmt2(calc.feeB), 'total')
    y += 5

    doc.setFillColor(22, 163, 74); doc.roundedRect(m, y, cW, 26, 4, 4, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text(`MERCHANT BISA HEMAT DENGAN ${edcs.length + 1} EDC`, W / 2, y + 7, { align: 'center' })
    doc.setFontSize(20); doc.text(fmt2(calc.savings), W / 2, y + 18, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.text(`per bulan  ·  ${calc.savingsPct.toFixed(1)}% lebih hemat`, W / 2, y + 24, { align: 'center' })
    y += 32

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(20, 30, 50)
    doc.text('PROYEKSI PENGHEMATAN', m, y); y += 5
    ;[['6 Bulan', calc.savings6m], ['1 Tahun', calc.savings1y]].forEach(([p, v]) => {
      doc.setFillColor(220, 252, 231); doc.roundedRect(m, y, cW / 2 - 3, 10, 2, 2, 'F')
      doc.setTextColor(21, 128, 61); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      doc.text(String(p), m + 3, y + 4); doc.text(fmt2(Number(v)), m + 3, y + 8.5)
      y += 14
    })

    doc.setFillColor(0, 59, 121); doc.rect(0, 272, W, 25, 'F')
    doc.setTextColor(160, 190, 225); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
    doc.text('Dokumen simulasi berdasarkan estimasi. Hasil aktual bergantung kebijakan bank.', W / 2, 281, { align: 'center' })
    doc.setTextColor(245, 166, 35); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('PT BANK MANDIRI (PERSERO) Tbk.', W / 2, 289, { align: 'center' })
    doc.save(`multi-edc-mandiri-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const edcPct    = 100 - qrisPct
  const kreditPct = 100 - debitPct
  const totalEdc  = edcs.length + 1

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <Navbar
        title="Kalkulator Multi-EDC"
        subtitle="Simulasi penambahan EDC Mandiri untuk merchant"
        showBack
        backHref={merchantId ? `/merchant/${merchantId}` : '/select-branch'}
      />

      <div className="bg-mandiri-700 px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shrink-0">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Strategi Multi-EDC</h1>
            <p className="text-mandiri-200 text-xs">
              {edcs.length} EDC existing + Mandiri = {totalEdc} EDC · nasabah Mandiri bayar On-Us, merchant hemat langsung
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-3.5 mb-3">
          <p className="text-xs font-bold text-cyan-800 mb-2">💡 Cara kerja strategi ini</p>
          <div className="space-y-1.5 text-xs text-cyan-700">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-mandiri-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">M</span>
              <span>Nasabah <b>kartu Mandiri</b> → EDC Mandiri → tarif On-Us <b>0.15%</b> (lebih murah)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">X</span>
              <span>Nasabah <b>kartu lain</b> → tetap ke EDC bank mereka masing-masing → On-Us seperti biasa</span>
            </div>
            <div className="mt-2 pt-2 border-t border-cyan-200 font-semibold">
              Hemat = selisih Off-Us vs On-Us untuk porsi nasabah Mandiri · EDC lama tidak dihapus
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-3">

        {/* Step 1: Volume */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-mandiri-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">Omzet Merchant per Bulan</p>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">Rp</span>
            <input
              type="text" inputMode="numeric" value={volume}
              onChange={e => setVolume(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mandiri-300 bg-slate-50"
            />
          </div>
          {vol > 0 && <p className="text-xs text-mandiri-600 font-bold mt-1.5">{formatRupiah(vol)} / bulan</p>}
        </div>

        {/* Step 2: EDC Existing (Dynamic) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">EDC Existing Merchant</p>
                <p className="text-[11px] text-slate-400">{edcs.length} EDC terpasang · maks. 4</p>
              </div>
            </div>
            {edcs.length < 4 && (
              <button
                onClick={addEdc}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <Plus size={12} /> Tambah EDC
              </button>
            )}
          </div>

          <div className="space-y-3">
            {edcs.map((edc, idx) => {
              const c = COLORS[idx % COLORS.length]
              const isPrimary = idx === primaryIdx
              return (
                <div key={edc.id} className={`border-2 rounded-2xl overflow-hidden transition-all ${isPrimary && edcs.length > 1 ? 'border-amber-300' : 'border-slate-100'}`}>
                  <div className={`${c.light} px-3 py-2.5 flex items-center gap-2`}>
                    <div className={`w-7 h-7 ${c.bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <span className="text-white text-xs font-bold">{idx + 1}</span>
                    </div>
                    <p className={`text-xs font-bold ${c.text} flex-1`}>
                      EDC ke-{idx + 1} {edc.bank ? `— ${edc.bank}` : ''}
                      {isPrimary && edcs.length > 1 && (
                        <span className="ml-2 bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">handle nasabah Mandiri</span>
                      )}
                    </p>
                    {edcs.length > 1 && (
                      <button onClick={() => removeEdc(idx)} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="px-3 py-3 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Pilih Bank</p>
                      <div className="flex flex-wrap gap-1.5">
                        {BANKS.map(b => (
                          <button key={b} type="button"
                            onClick={() => updateEdc(idx, 'bank', edc.bank === b ? '' : b)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-2 transition-all ${
                              edc.bank === b ? `${c.bg} text-white border-transparent` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >{b}</button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => updateEdc(idx, 'showRates', !edc.showRates)}
                      className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <span className="font-medium truncate mr-2">
                        Tarif: D-OnUs {edc.debitOnUs}% · D-OffUs {edc.debitOffUs}% · K-OnUs {edc.kreditOnUs}% · K-OffUs {edc.kreditOffUs}% · QRIS {edc.qrisRate}%
                      </span>
                      {edc.showRates ? <ChevronUp size={13} className="shrink-0" /> : <ChevronDown size={13} className="shrink-0" />}
                    </button>

                    {edc.showRates && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        {([
                          ['Debit On-Us (%)', 'debitOnUs'],
                          ['Debit Off-Us (%)', 'debitOffUs'],
                          ['Kredit On-Us (%)', 'kreditOnUs'],
                          ['Kredit Off-Us (%)', 'kreditOffUs'],
                          ['QRIS (%)', 'qrisRate'],
                        ] as [string, keyof EdcEntry][]).map(([lbl, field]) => (
                          <div key={String(field)} className={field === 'qrisRate' ? 'col-span-2' : ''}>
                            <label className="text-xs text-slate-500 font-semibold block mb-1">{lbl}</label>
                            <input type="number" step="0.01" min="0" max="10"
                              value={edc[field] as string}
                              onChange={e => updateEdc(idx, field, e.target.value)}
                              className={`w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 ${c.ring}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Primary EDC selector (only if >1 EDC) */}
          {edcs.length > 1 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-800 mb-2">⚠️ Nasabah Mandiri saat ini diproses EDC mana?</p>
              <div className="flex flex-wrap gap-1.5">
                {edcs.map((edc, idx) => (
                  <button key={edc.id}
                    onClick={() => setPrimaryIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                      primaryIdx === idx
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-amber-700 border-amber-300 hover:border-amber-400'
                    }`}
                  >
                    EDC {idx + 1}{edc.bank ? ` (${edc.bank})` : ''}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-amber-500 mt-1.5">
                Off-Us rate EDC ini digunakan untuk menghitung penghematan nasabah Mandiri
              </p>
            </div>
          )}
        </div>

        {/* Step 3: Pola Transaksi */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">Pola Transaksi</p>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-green-600">QRIS {qrisPct}%</span>
                <span className="text-blue-600">Kartu EDC {edcPct}%</span>
              </div>
              <div className="relative h-7 flex items-center">
                <div className="absolute inset-x-0 h-2.5 rounded-full overflow-hidden flex">
                  <div className="bg-green-400 h-full transition-all" style={{ width: `${qrisPct}%` }} />
                  <div className="bg-blue-400 h-full flex-1" />
                </div>
                <input type="range" min={0} max={100} value={qrisPct}
                  onChange={e => setQrisPct(parseInt(e.target.value))}
                  className={`relative w-full h-2.5 appearance-none bg-transparent cursor-pointer ${THUMB} [&::-webkit-slider-thumb]:border-slate-400`}
                />
              </div>
            </div>
            {edcPct > 0 && (
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-blue-600">Debit {debitPct}%</span>
                  <span className="text-purple-600">Kredit {kreditPct}%</span>
                </div>
                <div className="relative h-7 flex items-center">
                  <div className="absolute inset-x-0 h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-blue-400 h-full transition-all" style={{ width: `${debitPct}%` }} />
                    <div className="bg-purple-400 h-full flex-1" />
                  </div>
                  <input type="range" min={0} max={100} value={debitPct}
                    onChange={e => setDebitPct(parseInt(e.target.value))}
                    className={`relative w-full h-2.5 appearance-none bg-transparent cursor-pointer ${THUMB} [&::-webkit-slider-thumb]:border-blue-400`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: % Nasabah Mandiri */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-mandiri-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-mandiri-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">4</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Estimasi Nasabah Mandiri</p>
              <p className="text-xs text-slate-400">Berapa % pelanggan merchant yang punya kartu Mandiri?</p>
            </div>
          </div>

          <div className="bg-mandiri-50 rounded-xl p-3 mb-3">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-mandiri-600" />
                <span className="text-xs font-semibold text-mandiri-700">Nasabah Mandiri</span>
              </div>
              <span className="text-2xl font-extrabold text-mandiri-700">{mandiriNasabah}%</span>
            </div>
            <div className="relative h-8 flex items-center">
              <div className="absolute inset-x-0 h-3 rounded-full overflow-hidden flex">
                <div className="bg-mandiri-500 h-full transition-all" style={{ width: `${mandiriNasabah}%` }} />
                <div className="bg-slate-200 h-full flex-1" />
              </div>
              <input type="range" min={5} max={80} value={mandiriNasabah}
                onChange={e => setMandiriNasabah(parseInt(e.target.value))}
                className={`relative w-full h-3 appearance-none bg-transparent cursor-pointer ${THUMB} [&::-webkit-slider-thumb]:border-mandiri-700`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5% (sedikit)</span><span>Mandiri #1 di Indonesia</span><span>80% (dominan)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-mandiri-50 border border-mandiri-200 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-mandiri-500 font-semibold mb-1">→ EDC Mandiri (baru)</p>
              <p className="text-base font-extrabold text-mandiri-700">{mandiriNasabah}%</p>
              <p className="text-[10px] text-mandiri-400">On-Us {mDebitOnUs}%</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-red-500 font-semibold mb-1">→ EDC Existing</p>
              <p className="text-base font-extrabold text-red-600">{100 - mandiriNasabah}%</p>
              <p className="text-[10px] text-red-400">On-Us bank masing-masing</p>
            </div>
          </div>
        </div>

        {/* Tarif Mandiri */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button onClick={() => setShowMRates(v => !v)} className="w-full flex items-center gap-3 p-4">
            <div className="w-7 h-7 bg-mandiri-100 rounded-lg flex items-center justify-center text-sm shrink-0">🏧</div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-bold text-slate-800 text-sm">Tarif Mandiri EDC</p>
              <p className="text-xs text-slate-400">Debit On-Us {mDebitOnUs}% · Kredit On-Us {mKreditOnUs}%</p>
            </div>
            {showMRates ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
          </button>
          {showMRates && (
            <div className="px-4 pb-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2 mt-3">
                {([['Debit On-Us (%)', mDebitOnUs, setMDebitOnUs], ['Kredit On-Us (%)', mKreditOnUs, setMKreditOnUs]] as [string, string, any][]).map(([label, val, set]) => (
                  <div key={label}>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">{label}</label>
                    <input type="number" step="0.01" min="0" max="10" value={val}
                      onChange={e => set(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mandiri-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RESULTS ── */}
        {calc ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                <CreditCard size={16} className="text-red-400 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-red-500 mb-1">{edcs.length} EDC Existing</p>
                <p className="text-xl font-extrabold text-red-600 leading-tight">{fmt(calc.feeA)}</p>
                <p className="text-[10px] text-red-400 mt-0.5">/ bulan</p>
              </div>
              <div className="bg-mandiri-50 border border-mandiri-200 rounded-2xl p-4 text-center">
                <Layers size={16} className="text-mandiri-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-mandiri-600 mb-1">{totalEdc} EDC (+ Mandiri)</p>
                <p className="text-xl font-extrabold text-mandiri-700 leading-tight">{fmt(calc.feeB)}</p>
                <p className="text-[10px] text-mandiri-400 mt-0.5">/ bulan</p>
              </div>
            </div>

            {/* Routing breakdown */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="font-bold text-slate-700 text-xs mb-3 uppercase tracking-wide">
                Routing Transaksi — Skenario {totalEdc} EDC
              </p>
              <div className="space-y-2">
                {/* Mandiri EDC (new) */}
                <div className="flex items-center gap-3 bg-mandiri-50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 bg-mandiri-700 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">M</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-mandiri-700">
                      Mandiri EDC
                      <span className="ml-1.5 bg-mandiri-200 text-mandiri-700 text-[9px] px-1.5 py-0.5 rounded-full">BARU</span>
                    </p>
                    <p className="text-[10px] text-mandiri-500">{mandiriNasabah}% nasabah · {fmt(calc.mVol)}/bln · On-Us {mDebitOnUs}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-mandiri-700">{fmt(calc.mandiriFee)}</p>
                    <p className="text-[10px] text-mandiri-400">fee/bln</p>
                  </div>
                </div>

                {/* Existing EDCs combined */}
                <div className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white text-[9px] font-bold leading-tight text-center">EDC<br/>x{edcs.length}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-600">
                      {edcs.map(e => e.bank || 'Existing').join(' + ')} EDC
                    </p>
                    <p className="text-[10px] text-red-400">{100 - mandiriNasabah}% nasabah non-Mandiri · {fmt(calc.oVol)}/bln · On-Us masing-masing</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-red-600">{fmt(calc.existingFee)}</p>
                    <p className="text-[10px] text-red-400">fee/bln</p>
                  </div>
                </div>

                {/* QRIS */}
                <div className="flex items-center gap-3 bg-green-50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">QR</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-green-700">QRIS</p>
                    <p className="text-[10px] text-green-500">{qrisPct}% · {fmt(calc.qrisVol)}/bln · {calc.primary.qrisRate}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-green-700">{fmt(calc.qrisFee)}</p>
                    <p className="text-[10px] text-green-400">fee/bln</p>
                  </div>
                </div>
              </div>
            </div>

            {calc.savings > 0 ? (
              <>
                <div className="bg-green-600 rounded-2xl p-5 text-center shadow-lg">
                  <PiggyBank size={28} className="text-green-200 mx-auto mb-2" />
                  <p className="text-green-100 text-sm font-semibold">Hemat dengan {totalEdc} EDC</p>
                  <p className="text-white text-3xl font-extrabold mt-1">{formatRupiah(calc.savings)}</p>
                  <p className="text-green-200 text-xs mt-1.5">per bulan · {calc.savingsPct.toFixed(1)}% lebih hemat</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <Calendar size={18} className="text-mandiri-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 mb-1">Hemat 6 Bulan</p>
                    <p className="text-lg font-extrabold text-mandiri-700">{formatRupiah(calc.savings6m)}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <TrendingDown size={18} className="text-mandiri-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 mb-1">Hemat 1 Tahun</p>
                    <p className="text-lg font-extrabold text-mandiri-700">{formatRupiah(calc.savings1y)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="font-bold text-slate-800 text-sm mb-3">Insight untuk Merchant</p>
                  <div className="space-y-2.5">
                    {[
                      { icon: '🔀', text: `${mandiriNasabah}% pelanggan kartu Mandiri — kini bayar On-Us di EDC Mandiri (${mDebitOnUs}% vs ${calc.primary.debitOffUs}% Off-Us sebelumnya)` },
                      { icon: '💳', text: `Selisih tarif debit: ${(parseFloat(calc.primary.debitOffUs) - parseFloat(mDebitOnUs)).toFixed(2)}% per transaksi nasabah Mandiri — akumulasinya signifikan tiap bulan` },
                      { icon: '🏧', text: `Merchant tidak perlu hapus EDC lama — semua ${edcs.length} EDC existing tetap berjalan untuk nasabah bank masing-masing` },
                      { icon: '⚡', text: 'Tidak ada biaya tambahan untuk merchant — EDC Mandiri gratis, hemat langsung dirasakan sejak hari pertama' },
                      { icon: '📈', text: 'Semakin banyak nasabah Mandiri, semakin besar penghematan — Bank Mandiri #1 terbesar di Indonesia' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-mandiri-700 rounded-2xl p-4 space-y-2.5">
                  <p className="text-white font-bold text-sm text-center">Siap Tambah EDC Mandiri?</p>
                  <button
                    onClick={() => merchantId ? router.push(`/merchant/${merchantId}`) : router.push('/select-branch')}
                    className="w-full bg-mandiri-yellow text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={15} /> Lanjutkan Proses Akuisisi <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={handlePDF}
                    className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95"
                  >
                    <FileText size={14} /> Download PDF untuk Merchant
                  </button>
                  <button
                    onClick={() => router.push(merchantId ? `/negotiation?merchantId=${merchantId}` : '/negotiation')}
                    className="w-full bg-white/10 border border-white/25 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                  >
                    <Zap size={14} /> Coba Simulasi Pindah Bank
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-amber-700 font-semibold text-sm">Penghematan minimal pada konfigurasi ini</p>
                <p className="text-amber-500 text-xs mt-1">Coba naikkan % nasabah Mandiri atau periksa tarif Off-Us EDC existing</p>
              </div>
            )}

            <div className="flex items-start gap-2 bg-slate-100 rounded-xl p-3">
              <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Perhitungan berdasarkan estimasi dan tarif umum pasar. Hasil aktual dapat berbeda sesuai kebijakan bank. Bukan penawaran resmi.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Layers size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-sm">Masukkan omzet merchant</p>
            <p className="text-xs mt-1">untuk melihat simulasi strategi multi-EDC</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MultiEDCPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin" />
      </div>
    }>
      <MultiEDCContent />
    </Suspense>
  )
}
