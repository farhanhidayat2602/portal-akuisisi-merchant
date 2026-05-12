'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import {
  CreditCard, TrendingDown, PiggyBank, Calendar,
  ChevronDown, ChevronUp, ArrowRight, Info,
  CheckCircle2, Layers, Users, Zap, FileText,
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

function MultiEDCContent() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const merchantId  = searchParams.get('merchantId')

  // ── Inputs ────────────────────────────────────────────────────────────────
  const [volume,          setVolume]          = useState('')
  const [selectedBank,    setSelectedBank]    = useState('')
  const [qrisPct,         setQrisPct]         = useState(30)
  const [debitPct,        setDebitPct]        = useState(70)
  const [mandiriNasabah,  setMandiriNasabah]  = useState(35)

  // Existing bank rates
  const [showExRates,     setShowExRates]     = useState(false)
  const [exDebitOnUs,     setExDebitOnUs]     = useState('1.00')
  const [exDebitOffUs,    setExDebitOffUs]    = useState('1.00')
  const [exKreditOnUs,    setExKreditOnUs]    = useState('2.00')
  const [exKreditOffUs,   setExKreditOffUs]   = useState('2.00')
  const [exQrisRate,      setExQrisRate]      = useState('0.70')

  // Mandiri rates
  const [showMRates,      setShowMRates]      = useState(false)
  const [mDebitOnUs,      setMDebitOnUs]      = useState('0.15')
  const [mKreditOnUs,     setMKreditOnUs]     = useState('1.80')

  const vol = parseFloat(volume.replace(/\D/g, '')) || 0

  // ── Calculations ──────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    if (vol === 0) return null

    const edcPct     = 100 - qrisPct
    const kreditPct  = 100 - debitPct

    const qrisVol    = vol * qrisPct  / 100
    const edcVol     = vol * edcPct   / 100
    const debitVol   = edcVol * debitPct  / 100
    const kreditVol  = edcVol * kreditPct / 100

    // Split by Mandiri cardholder %
    const mDebitVol  = debitVol  * mandiriNasabah / 100
    const oDebitVol  = debitVol  * (100 - mandiriNasabah) / 100
    const mKreditVol = kreditVol * mandiriNasabah / 100
    const oKreditVol = kreditVol * (100 - mandiriNasabah) / 100

    const exDonUs  = parseFloat(exDebitOnUs)   / 100
    const exDoffUs = parseFloat(exDebitOffUs)  / 100
    const exKonUs  = parseFloat(exKreditOnUs)  / 100
    const exKoffUs = parseFloat(exKreditOffUs) / 100
    const exQr     = parseFloat(exQrisRate)    / 100
    const mDonUs   = parseFloat(mDebitOnUs)    / 100
    const mKonUs   = parseFloat(mKreditOnUs)   / 100

    // Scenario 1 — 1 EDC (existing bank only)
    // Mandiri cardholders → Off-Us on competitor EDC
    // Non-Mandiri cardholders → On-Us on competitor EDC
    const fee1 =
      mDebitVol  * exDoffUs +
      oDebitVol  * exDonUs  +
      mKreditVol * exKoffUs +
      oKreditVol * exKonUs  +
      qrisVol    * exQr

    // Scenario 2 — 2 EDC (existing + Mandiri)
    // Mandiri cardholders → On-Us Mandiri EDC
    // Non-Mandiri cardholders → On-Us competitor EDC
    const fee2 =
      mDebitVol  * mDonUs   +
      oDebitVol  * exDonUs  +
      mKreditVol * mKonUs   +
      oKreditVol * exKonUs  +
      qrisVol    * exQr

    const savings      = fee1 - fee2
    const savingsPct   = fee1 > 0 ? (savings / fee1) * 100 : 0

    // Volume routed to each EDC (2 EDC scenario)
    const volMandiriEDC  = (mDebitVol + mKreditVol)
    const volExistingEDC = (oDebitVol + oKreditVol)

    return {
      vol, qrisVol, edcVol, debitVol, kreditVol,
      mDebitVol, oDebitVol, mKreditVol, oKreditVol,
      fee1, fee2, savings, savingsPct,
      savings6m:   savings * 6,
      savings1y:   savings * 12,
      volMandiriEDC, volExistingEDC,
      mandiriEDCFee: mDebitVol * mDonUs + mKreditVol * mKonUs,
      existingEDCFee: oDebitVol * exDonUs + oKreditVol * exKonUs,
    }
  }, [vol, qrisPct, debitPct, mandiriNasabah,
      exDebitOnUs, exDebitOffUs, exKreditOnUs, exKreditOffUs, exQrisRate,
      mDebitOnUs, mKreditOnUs])

  function handleDownloadPDF() {
    if (!calc) return
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210, m = 14, cW = W - m * 2

    // Header
    doc.setFillColor(0, 59, 121)
    doc.rect(0, 0, W, 38, 'F')
    doc.setFillColor(245, 166, 35)
    doc.rect(0, 38, W, 3.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('STRATEGI MULTI-EDC — PENGHEMATAN BIAYA', m, 13)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Bank Existing: ${selectedBank || 'Kompetitor'} + Mandiri EDC`, m, 21)
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, m, 28)
    if (session?.user?.name) doc.text('RO: ' + session.user.name, W - m, 28, { align: 'right' })

    let y = 48

    // Volume box
    doc.setFillColor(235, 243, 255)
    doc.roundedRect(m, y, cW, 16, 3, 3, 'F')
    doc.setTextColor(0, 59, 121)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('OMZET MERCHANT / BULAN', m + 4, y + 6)
    doc.setFontSize(14)
    doc.text(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(vol), m + 4, y + 13)
    y += 22

    // Comparison table
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(20, 30, 50)
    doc.text('PERBANDINGAN BIAYA TRANSAKSI', m, y); y += 5

    const drawRow = (label: string, v1: string, v2: string, style: 'header' | 'normal' | 'total' = 'normal') => {
      const rH = 8, c2 = m + 95, c3 = m + 145
      if (style === 'header') {
        doc.setFillColor(0, 59, 121); doc.rect(m, y, cW, rH, 'F')
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      } else if (style === 'total') {
        doc.setFillColor(219, 234, 254); doc.rect(m, y, cW, rH, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(20, 30, 50)
      } else {
        doc.setFillColor(y % 16 < 8 ? 248 : 242, y % 16 < 8 ? 250 : 246, y % 16 < 8 ? 252 : 250)
        doc.rect(m, y, cW, rH, 'F')
        doc.setTextColor(40, 50, 70); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      }
      doc.text(label, m + 3, y + 5.5)
      doc.text(v1, c2 + 3, y + 5.5)
      doc.text(v2, c3 + 3, y + 5.5)
      doc.setDrawColor(200, 210, 225)
      doc.rect(m, y, cW, rH)
      doc.line(c2, y, c2, y + rH)
      doc.line(c3, y, c3, y + rH)
      y += rH
    }

    const fmt2 = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
    drawRow('Komponen', `1 EDC (${selectedBank || 'Existing'})`, '2 EDC (+ Mandiri)', 'header')
    drawRow(`QRIS (${qrisPct}%)`, fmt2(calc.qrisVol * parseFloat(exQrisRate) / 100), fmt2(calc.qrisVol * parseFloat(exQrisRate) / 100))
    drawRow(`Nasabah Mandiri EDC (${mandiriNasabah}%)`, fmt2(calc.mDebitVol * parseFloat(exDebitOffUs) / 100 + calc.mKreditVol * parseFloat(exKreditOffUs) / 100), fmt2(calc.mandiriEDCFee))
    drawRow(`Nasabah Non-Mandiri EDC (${100 - mandiriNasabah}%)`, fmt2(calc.oDebitVol * parseFloat(exDebitOnUs) / 100 + calc.oKreditVol * parseFloat(exKreditOnUs) / 100), fmt2(calc.existingEDCFee))
    drawRow('TOTAL BIAYA / BULAN', fmt2(calc.fee1), fmt2(calc.fee2), 'total')
    y += 5

    // Savings box
    doc.setFillColor(22, 163, 74)
    doc.roundedRect(m, y, cW, 26, 4, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('MERCHANT BISA HEMAT DENGAN 2 EDC', W / 2, y + 7, { align: 'center' })
    doc.setFontSize(20)
    doc.text(fmt2(calc.savings), W / 2, y + 18, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(`per bulan  ·  ${calc.savingsPct.toFixed(1)}% lebih hemat`, W / 2, y + 24, { align: 'center' })
    y += 32

    // Projection
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(20, 30, 50)
    doc.text('PROYEKSI PENGHEMATAN', m, y); y += 5
    ;[['6 Bulan', calc.savings6m], ['1 Tahun', calc.savings1y]].forEach(([p, v]) => {
      doc.setFillColor(220, 252, 231); doc.roundedRect(m, y, cW / 2 - 3, 10, 2, 2, 'F')
      doc.setTextColor(21, 128, 61); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      doc.text(String(p), m + 3, y + 4); doc.text(fmt2(Number(v)), m + 3, y + 8.5)
      y += 14
    })

    // Footer
    doc.setFillColor(0, 59, 121); doc.rect(0, 272, W, 25, 'F')
    doc.setTextColor(160, 190, 225); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
    doc.text('Dokumen simulasi berdasarkan estimasi. Hasil aktual bergantung kebijakan bank.', W / 2, 281, { align: 'center' })
    doc.setTextColor(245, 166, 35); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('PT BANK MANDIRI (PERSERO) Tbk.', W / 2, 289, { align: 'center' })

    doc.save(`multi-edc-mandiri-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const edcPct    = 100 - qrisPct
  const kreditPct = 100 - debitPct
  const bankLabel = selectedBank || 'Bank Existing'

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <Navbar
        title="Kalkulator Multi-EDC"
        subtitle="Strategi 2 EDC untuk merchant yang tidak mau pindah bank"
        showBack
        backHref={merchantId ? `/merchant/${merchantId}` : '/select-branch'}
      />

      {/* Hero */}
      <div className="bg-mandiri-700 px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shrink-0">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Strategi Multi-EDC</h1>
            <p className="text-mandiri-200 text-xs">
              Nasabah Mandiri bayar lewat EDC Mandiri — lebih hemat tanpa harus pindah bank
            </p>
          </div>
        </div>
      </div>

      {/* Konsep singkat */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-3.5 mb-3">
          <p className="text-xs font-bold text-cyan-800 mb-2">💡 Bagaimana cara kerjanya?</p>
          <div className="space-y-1.5 text-xs text-cyan-700">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-mandiri-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">M</span>
              <span>Nasabah <b>kartu Mandiri</b> → diarahkan ke <b>EDC Mandiri</b> → tarif On-Us <b>0.15%</b></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">X</span>
              <span>Nasabah <b>kartu lain</b> → tetap ke <b>EDC {bankLabel}</b> → tarif On-Us seperti biasa</span>
            </div>
            <div className="mt-2 pt-2 border-t border-cyan-200 font-semibold">
              Hemat = selisih tarif Off-Us vs On-Us untuk porsi nasabah Mandiri
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

        {/* Step 2: Bank + Pattern */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">Bank Existing & Pola Transaksi</p>
          </div>

          {/* Bank selector */}
          <p className="text-xs font-bold text-slate-600 mb-2">Bank EDC Saat Ini</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {BANKS.map(b => (
              <button key={b} type="button"
                onClick={() => setSelectedBank(prev => prev === b ? '' : b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                  selectedBank === b ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                }`}
              >{b}</button>
            ))}
          </div>

          {/* QRIS vs Kartu */}
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
                  className={`relative w-full h-2.5 appearance-none bg-transparent cursor-pointer ${THUMB} [&::-webkit-slider-thumb]:border-red-400`}
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

        {/* Step 3: % Nasabah Mandiri — KEY SLIDER */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-mandiri-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-mandiri-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">3</span>
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

          {/* Visual routing */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-mandiri-50 border border-mandiri-200 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-mandiri-500 font-semibold mb-1">→ EDC Mandiri</p>
              <p className="text-base font-extrabold text-mandiri-700">{mandiriNasabah}%</p>
              <p className="text-[10px] text-mandiri-400">On-Us 0.15%</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-red-500 font-semibold mb-1">→ EDC {bankLabel}</p>
              <p className="text-base font-extrabold text-red-600">{100 - mandiriNasabah}%</p>
              <p className="text-[10px] text-red-400">On-Us seperti biasa</p>
            </div>
          </div>
        </div>

        {/* Rates — Existing */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button onClick={() => setShowExRates(v => !v)} className="w-full flex items-center gap-3 p-4">
            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-sm shrink-0">🏦</div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-bold text-slate-800 text-sm">Tarif {bankLabel}</p>
              <p className="text-xs text-slate-400 truncate">
                Debit On-Us {exDebitOnUs}% · Off-Us {exDebitOffUs}% · Kredit On-Us {exKreditOnUs}% · QRIS {exQrisRate}%
              </p>
            </div>
            {showExRates ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
          </button>
          {showExRates && (
            <div className="px-4 pb-4 border-t border-slate-100 space-y-2">
              <div className="grid grid-cols-2 gap-2 mt-3">
                {([
                  ['Debit On-Us (%)', exDebitOnUs, setExDebitOnUs],
                  ['Debit Off-Us (%)', exDebitOffUs, setExDebitOffUs],
                  ['Kredit On-Us (%)', exKreditOnUs, setExKreditOnUs],
                  ['Kredit Off-Us (%)', exKreditOffUs, setExKreditOffUs],
                ] as [string, string, any][]).map(([label, val, set]) => (
                  <div key={label}>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">{label}</label>
                    <input type="number" step="0.01" min="0" max="10" value={val}
                      onChange={e => set(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">QRIS (%)</label>
                <input type="number" step="0.01" min="0" max="5" value={exQrisRate}
                  onChange={e => setExQrisRate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rates — Mandiri */}
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
                {([
                  ['Debit On-Us (%)', mDebitOnUs, setMDebitOnUs],
                  ['Kredit On-Us (%)', mKreditOnUs, setMKreditOnUs],
                ] as [string, string, any][]).map(([label, val, set]) => (
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
            {/* Fee comparison cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                <CreditCard size={16} className="text-red-400 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-red-500 mb-1">1 EDC ({bankLabel})</p>
                <p className="text-xl font-extrabold text-red-600 leading-tight">{fmt(calc.fee1)}</p>
                <p className="text-[10px] text-red-400 mt-0.5">/ bulan</p>
              </div>
              <div className="bg-mandiri-50 border border-mandiri-200 rounded-2xl p-4 text-center">
                <Layers size={16} className="text-mandiri-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-mandiri-600 mb-1">2 EDC (+ Mandiri)</p>
                <p className="text-xl font-extrabold text-mandiri-700 leading-tight">{fmt(calc.fee2)}</p>
                <p className="text-[10px] text-mandiri-400 mt-0.5">/ bulan</p>
              </div>
            </div>

            {/* EDC breakdown (2 EDC scenario) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="font-bold text-slate-700 text-xs mb-3 uppercase tracking-wide">Rincian 2 EDC — Routing Transaksi</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-mandiri-50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 bg-mandiri-700 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">EDC</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-mandiri-700">Mandiri EDC</p>
                    <p className="text-[10px] text-mandiri-500">{mandiriNasabah}% nasabah · {fmt(calc.volMandiriEDC)}/bln · On-Us {mDebitOnUs}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-mandiri-700">{fmt(calc.mandiriEDCFee)}</p>
                    <p className="text-[10px] text-mandiri-400">fee/bln</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">EDC</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-600">{bankLabel} EDC</p>
                    <p className="text-[10px] text-red-400">{100 - mandiriNasabah}% nasabah · {fmt(calc.volExistingEDC)}/bln · On-Us {exDebitOnUs}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-red-600">{fmt(calc.existingEDCFee)}</p>
                    <p className="text-[10px] text-red-400">fee/bln</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-green-50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">QR</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-green-700">QRIS</p>
                    <p className="text-[10px] text-green-500">{qrisPct}% · {fmt(calc.qrisVol)}/bln · {exQrisRate}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-green-700">{fmt(calc.qrisVol * parseFloat(exQrisRate) / 100)}</p>
                    <p className="text-[10px] text-green-400">fee/bln</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings hero */}
            {calc.savings > 0 ? (
              <>
                <div className="bg-green-600 rounded-2xl p-5 text-center shadow-lg">
                  <PiggyBank size={28} className="text-green-200 mx-auto mb-2" />
                  <p className="text-green-100 text-sm font-semibold">Hemat dengan 2 EDC</p>
                  <p className="text-white text-3xl font-extrabold mt-1">{formatRupiah(calc.savings)}</p>
                  <p className="text-green-200 text-xs mt-1.5">
                    per bulan · {calc.savingsPct.toFixed(1)}% lebih hemat
                  </p>
                </div>

                {/* Proyeksi */}
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

                {/* Insights */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="font-bold text-slate-800 text-sm mb-3">Insight untuk Merchant</p>
                  <div className="space-y-2.5">
                    {[
                      { icon: '🔀', text: `${mandiriNasabah}% pelanggan punya kartu Mandiri — mereka kini bayar On-Us di EDC Mandiri (${mDebitOnUs}% vs ${exDebitOffUs}% Off-Us di ${bankLabel})` },
                      { icon: '💳', text: `Selisih tarif debit: ${(parseFloat(exDebitOffUs) - parseFloat(mDebitOnUs)).toFixed(2)}% per transaksi nasabah Mandiri — akumulasinya signifikan tiap bulan` },
                      { icon: '🏧', text: `Merchant tidak perlu pindah bank — EDC ${bankLabel} tetap berjalan untuk nasabah non-Mandiri` },
                      { icon: '⚡', text: `Tidak ada biaya tambahan untuk merchant — EDC Mandiri gratis, hemat langsung dirasakan` },
                      { icon: '📈', text: `Semakin banyak nasabah Mandiri, semakin besar penghematan — Bank Mandiri #1 terbesar di Indonesia` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-mandiri-700 rounded-2xl p-4 space-y-2.5">
                  <p className="text-white font-bold text-sm text-center">Siap Tambah EDC Mandiri?</p>
                  <button
                    onClick={() => merchantId ? router.push(`/merchant/${merchantId}`) : router.push('/select-branch')}
                    className="w-full bg-mandiri-yellow text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={15} /> Lanjutkan Proses Akuisisi <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={handleDownloadPDF}
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
                <p className="text-amber-500 text-xs mt-1">Coba naikkan % nasabah Mandiri atau sesuaikan tarif</p>
              </div>
            )}

            {/* Disclaimer */}
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
            <p className="text-xs mt-1">untuk melihat simulasi strategi 2 EDC</p>
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
