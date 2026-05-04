'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import {
  Calculator, TrendingUp, PiggyBank, Calendar,
  ArrowRight, Clock, CheckCircle2, Info,
  ChevronDown, ChevronUp, CreditCard, Smartphone,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

// Format dengan 1 desimal untuk kartu perbandingan biaya agar tidak misleading
// misal Rp 2.3jt vs Rp 1.7jt — bukan keduanya "Rp 2jt"
function fmtFee(n: number): string {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}

// ── Reusable payment pattern sliders ────────────────────────────────────────
interface PatternSliderProps {
  qrisPct: number; setQrisPct: (v: number) => void
  debitPct: number; setDebitPct: (v: number) => void
  debitOnUsPct: number; setDebitOnUsPct: (v: number) => void
  kreditOnUsPct: number; setKreditOnUsPct: (v: number) => void
  thumbColor: string
}

function PaymentPattern({ qrisPct, setQrisPct, debitPct, setDebitPct,
  debitOnUsPct, setDebitOnUsPct, kreditOnUsPct, setKreditOnUsPct, thumbColor }: PatternSliderProps) {
  const edcPct    = 100 - qrisPct
  const kreditPct = 100 - debitPct
  return (
    <div className="space-y-3">
      {/* QRIS vs EDC */}
      <div>
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="flex items-center gap-1 text-green-600"><Smartphone size={10} /> QRIS {qrisPct}%</span>
          <span className="flex items-center gap-1 text-blue-600"><CreditCard size={10} /> Kartu (EDC) {edcPct}%</span>
        </div>
        <div className="relative h-7 flex items-center">
          <div className="absolute inset-x-0 h-2.5 rounded-full overflow-hidden flex">
            <div className="bg-green-400 h-full transition-all" style={{ width: `${qrisPct}%` }} />
            <div className="bg-blue-400 h-full flex-1" />
          </div>
          <input type="range" min={0} max={100} value={qrisPct}
            onChange={e => setQrisPct(parseInt(e.target.value))}
            className={`relative w-full h-2.5 appearance-none bg-transparent cursor-pointer ${thumbColor}`}
          />
        </div>
      </div>

      {/* Debit vs Kredit */}
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
              className={`relative w-full h-2.5 appearance-none bg-transparent cursor-pointer ${thumbColor}`}
            />
          </div>
        </div>
      )}

      {/* On-Us sliders */}
      {edcPct > 0 && (
        <div className={`grid gap-2 ${kreditPct > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {debitPct > 0 && (
            <div className="bg-blue-50 rounded-xl p-2.5">
              <p className="text-xs font-bold text-blue-700 mb-1.5">Kartu Debit</p>
              <div className="flex justify-between text-xs text-blue-500 mb-1">
                <span>On-Us {debitOnUsPct}%</span><span>Off-Us {100 - debitOnUsPct}%</span>
              </div>
              <input type="range" min={0} max={100} value={debitOnUsPct}
                onChange={e => setDebitOnUsPct(parseInt(e.target.value))}
                className="w-full h-1.5 bg-blue-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          )}
          {kreditPct > 0 && (
            <div className="bg-purple-50 rounded-xl p-2.5">
              <p className="text-xs font-bold text-purple-700 mb-1.5">Kartu Kredit</p>
              <div className="flex justify-between text-xs text-purple-500 mb-1">
                <span>On-Us {kreditOnUsPct}%</span><span>Off-Us {100 - kreditOnUsPct}%</span>
              </div>
              <input type="range" min={0} max={100} value={kreditOnUsPct}
                onChange={e => setKreditOnUsPct(parseInt(e.target.value))}
                className="w-full h-1.5 bg-purple-200 rounded-full appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Rate input rows (expandable) ─────────────────────────────────────────────
function RateInputs({ rates, ringColor }: {
  rates: [string, string, React.Dispatch<React.SetStateAction<string>>][]
  ringColor: string
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {rates.slice(0, -1).map(([label, val, set]) => (
          <div key={label}>
            <label className="text-xs text-slate-500 font-semibold block mb-1">{label}</label>
            <input type="number" step="0.01" min="0" max="10" value={val}
              onChange={e => set(e.target.value)}
              className={`w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 ${ringColor}`}
            />
          </div>
        ))}
      </div>
      {/* QRIS — last item, full width */}
      {rates.slice(-1).map(([label, val, set]) => (
        <div key={label} className="mt-2">
          <label className="text-xs text-slate-500 font-semibold block mb-1">{label}</label>
          <input type="number" step="0.01" min="0" max="10" value={val}
            onChange={e => set(e.target.value)}
            className={`w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 ${ringColor}`}
          />
        </div>
      ))}
    </>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
function NegotiationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [volume, setVolume] = useState(() => {
    const v = searchParams.get('volume')
    return v ? v.replace(/\D/g, '') : ''
  })
  const merchantId = searchParams.get('merchantId')

  // ── Pola Pembayaran Bank Lain ─────────────────────────────────────────────
  const [exQrisPct, setExQrisPct]             = useState(40)
  const [exDebitPct, setExDebitPct]           = useState(70)
  const [exDebitOnUsPct, setExDebitOnUsPct]   = useState(50)
  const [exKreditOnUsPct, setExKreditOnUsPct] = useState(40)

  // ── Pola Pembayaran Mandiri ───────────────────────────────────────────────
  // Default On-Us lebih tinggi — lebih banyak nasabah Mandiri pakai kartu Mandiri
  const [mPatQrisPct, setMPatQrisPct]             = useState(40)
  const [mPatDebitPct, setMPatDebitPct]           = useState(70)
  const [mPatDebitOnUsPct, setMPatDebitOnUsPct]   = useState(70)
  const [mPatKreditOnUsPct, setMPatKreditOnUsPct] = useState(60)

  // ── Tarif Bank Existing (expandable) ─────────────────────────────────────
  const [showExRates, setShowExRates]   = useState(false)
  const [exDebitOnUs, setExDebitOnUs]   = useState('1.00')
  const [exDebitOffUs, setExDebitOffUs] = useState('1.00')
  const [exKreditOnUs, setExKreditOnUs]   = useState('2.00')
  const [exKreditOffUs, setExKreditOffUs] = useState('2.00')
  const [exQrisRate, setExQrisRate]     = useState('0.70')

  // ── Tarif Mandiri (expandable) ────────────────────────────────────────────
  const [showMRates, setShowMRates]     = useState(false)
  const [mDebitOnUs, setMDebitOnUs]     = useState('0.15')
  const [mDebitOffUs, setMDebitOffUs]   = useState('1.00')
  const [mKreditOnUs, setMKreditOnUs]   = useState('1.80')
  const [mKreditOffUs, setMKreditOffUs] = useState('1.80')
  const [mQrisRate, setMQrisRate]       = useState('0.70')

  const vol = parseFloat(volume.replace(/\D/g, '')) || 0

  const calc = useMemo(() => {
    if (vol === 0) return null

    // ── Volumes: Bank Lain ──────────────────────────────────────────────────
    const exEdcPct    = 100 - exQrisPct
    const exKreditPct = 100 - exDebitPct
    const exQrisVol        = vol * exQrisPct / 100
    const exEdcVol         = vol * exEdcPct  / 100
    const exDebitVol       = exEdcVol * exDebitPct  / 100
    const exKreditVol      = exEdcVol * exKreditPct / 100
    const exDebitOnUsVol   = exDebitVol  * exDebitOnUsPct  / 100
    const exDebitOffUsVol  = exDebitVol  * (100 - exDebitOnUsPct)  / 100
    const exKreditOnUsVol  = exKreditVol * exKreditOnUsPct / 100
    const exKreditOffUsVol = exKreditVol * (100 - exKreditOnUsPct) / 100

    const existingTotal =
      exDebitOnUsVol   * (parseFloat(exDebitOnUs)   / 100) +
      exDebitOffUsVol  * (parseFloat(exDebitOffUs)  / 100) +
      exKreditOnUsVol  * (parseFloat(exKreditOnUs)  / 100) +
      exKreditOffUsVol * (parseFloat(exKreditOffUs) / 100) +
      exQrisVol        * (parseFloat(exQrisRate)    / 100)

    // ── Volumes: Mandiri ────────────────────────────────────────────────────
    const mEdcPct    = 100 - mPatQrisPct
    const mKreditPct = 100 - mPatDebitPct
    const mQrisVol        = vol * mPatQrisPct / 100
    const mEdcVol         = vol * mEdcPct     / 100
    const mDebitVol       = mEdcVol * mPatDebitPct  / 100
    const mKreditVol      = mEdcVol * mKreditPct    / 100
    const mDebitOnUsVol   = mDebitVol  * mPatDebitOnUsPct  / 100
    const mDebitOffUsVol  = mDebitVol  * (100 - mPatDebitOnUsPct)  / 100
    const mKreditOnUsVol  = mKreditVol * mPatKreditOnUsPct / 100
    const mKreditOffUsVol = mKreditVol * (100 - mPatKreditOnUsPct) / 100

    const mandiriTotal =
      mDebitOnUsVol   * (parseFloat(mDebitOnUs)   / 100) +
      mDebitOffUsVol  * (parseFloat(mDebitOffUs)  / 100) +
      mKreditOnUsVol  * (parseFloat(mKreditOnUs)  / 100) +
      mKreditOffUsVol * (parseFloat(mKreditOffUs) / 100) +
      mQrisVol        * (parseFloat(mQrisRate)    / 100)

    const savingsPerMonth = existingTotal - mandiriTotal

    return {
      exQrisVol, exEdcVol,
      mQrisVol,  mEdcVol,
      existingTotal, mandiriTotal, savingsPerMonth,
      savings6Month: savingsPerMonth * 6,
      savings1Year:  savingsPerMonth * 12,
      savingsPct: existingTotal > 0 ? (savingsPerMonth / existingTotal) * 100 : 0,
    }
  }, [
    vol,
    exQrisPct, exDebitPct, exDebitOnUsPct, exKreditOnUsPct,
    mPatQrisPct, mPatDebitPct, mPatDebitOnUsPct, mPatKreditOnUsPct,
    exDebitOnUs, exDebitOffUs, exKreditOnUs, exKreditOffUs, exQrisRate,
    mDebitOnUs, mDebitOffUs, mKreditOnUs, mKreditOffUs, mQrisRate,
  ])

  const goBack = () => merchantId ? router.push(`/merchant/${merchantId}`) : router.back()

  const THUMB = '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md'

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <Navbar
        title="Kalkulator Negosiasi"
        subtitle="Perbandingan biaya EDC existing vs Mandiri"
        showBack
        backHref={merchantId ? `/merchant/${merchantId}` : '/select-branch'}
      />

      {/* Hero */}
      <div className="bg-mandiri-700 px-4 py-5 text-white">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
            <PiggyBank size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base">Simulasi Penghematan</h1>
            <p className="text-mandiri-200 text-xs">
              Tunjukkan berapa merchant bisa hemat dengan beralih ke Mandiri
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">

        {/* Step 1: Volume */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-mandiri-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">Input Omzet Merchant per Bulan</p>
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
          <p className="text-xs text-slate-400 mt-1.5">💡 &quot;Rata-rata omzet per bulan berapa pak?&quot;</p>
        </div>

        {/* Step 2a: Pola Pembayaran Bank Lain */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Pola Pembayaran Bank Lain</p>
              <p className="text-xs text-slate-400">Komposisi transaksi merchant saat ini</p>
            </div>
            <span className="ml-auto text-lg">🏦</span>
          </div>
          <PaymentPattern
            qrisPct={exQrisPct} setQrisPct={setExQrisPct}
            debitPct={exDebitPct} setDebitPct={setExDebitPct}
            debitOnUsPct={exDebitOnUsPct} setDebitOnUsPct={setExDebitOnUsPct}
            kreditOnUsPct={exKreditOnUsPct} setKreditOnUsPct={setExKreditOnUsPct}
            thumbColor={`${THUMB} [&::-webkit-slider-thumb]:border-red-500`}
          />
          <p className="text-xs text-slate-400 mt-2">💡 &quot;Customer biasanya bayar pakai QR atau kartu ya pak?&quot;</p>
        </div>

        {/* Step 2b: Pola Pembayaran Mandiri */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-mandiri-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-mandiri-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Pola Pembayaran Mandiri</p>
              <p className="text-xs text-slate-400">Estimasi komposisi setelah pindah ke Mandiri</p>
            </div>
            <span className="ml-auto text-lg">🏧</span>
          </div>
          <PaymentPattern
            qrisPct={mPatQrisPct} setQrisPct={setMPatQrisPct}
            debitPct={mPatDebitPct} setDebitPct={setMPatDebitPct}
            debitOnUsPct={mPatDebitOnUsPct} setDebitOnUsPct={setMPatDebitOnUsPct}
            kreditOnUsPct={mPatKreditOnUsPct} setKreditOnUsPct={setMPatKreditOnUsPct}
            thumbColor={`${THUMB} [&::-webkit-slider-thumb]:border-mandiri-700`}
          />
          <div className="mt-2 bg-mandiri-50 rounded-xl px-3 py-2">
            <p className="text-xs text-mandiri-700 font-medium">
              💡 On-Us biasanya lebih tinggi — nasabah Mandiri cenderung bayar pakai kartu Mandiri
            </p>
          </div>
        </div>

        {/* Tarif Bank Existing */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button onClick={() => setShowExRates(v => !v)} className="w-full flex items-center gap-3 p-4">
            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-sm shrink-0">🏦</div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-bold text-slate-800 text-sm">Tarif Bank Existing</p>
              <p className="text-xs text-slate-400 truncate">
                Debit On-Us {exDebitOnUs}% · Kredit On-Us {exKreditOnUs}% · QRIS {exQrisRate}%
              </p>
            </div>
            {showExRates ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
          </button>
          {showExRates && (
            <div className="px-4 pb-4 border-t border-slate-100">
              <RateInputs ringColor="focus:ring-red-200" rates={[
                ['Debit On-Us (%)', exDebitOnUs, setExDebitOnUs],
                ['Debit Off-Us (%)', exDebitOffUs, setExDebitOffUs],
                ['Kredit On-Us (%)', exKreditOnUs, setExKreditOnUs],
                ['Kredit Off-Us (%)', exKreditOffUs, setExKreditOffUs],
                ['QRIS (%)', exQrisRate, setExQrisRate],
              ]} />
            </div>
          )}
        </div>

        {/* Tarif Mandiri */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button onClick={() => setShowMRates(v => !v)} className="w-full flex items-center gap-3 p-4">
            <div className="w-7 h-7 bg-mandiri-100 rounded-lg flex items-center justify-center text-sm shrink-0">🏧</div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-bold text-slate-800 text-sm">Tarif Mandiri</p>
              <p className="text-xs text-slate-400 truncate">
                Debit On-Us {mDebitOnUs}% · Kredit On-Us {mKreditOnUs}% · QRIS {mQrisRate}%
              </p>
            </div>
            {showMRates ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
          </button>
          {showMRates && (
            <div className="px-4 pb-4 border-t border-slate-100">
              <RateInputs ringColor="focus:ring-mandiri-200" rates={[
                ['Debit On-Us (%)', mDebitOnUs, setMDebitOnUs],
                ['Debit Off-Us (%)', mDebitOffUs, setMDebitOffUs],
                ['Kredit On-Us (%)', mKreditOnUs, setMKreditOnUs],
                ['Kredit Off-Us (%)', mKreditOffUs, setMKreditOffUs],
                ['QRIS (%)', mQrisRate, setMQrisRate],
              ]} />
            </div>
          )}
        </div>

        {/* ── RESULTS ── */}
        {calc ? (
          <>
            {/* Ringkasan Input — dua kolom */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="font-bold text-slate-700 text-xs mb-3 uppercase tracking-wide">Ringkasan Input</p>
              <div className="grid grid-cols-2 gap-2">
                {/* Bank Lain */}
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-500 mb-2">🏦 Bank Lain</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">QRIS</span>
                      <span className="font-semibold text-green-700">{formatRupiah(calc.exQrisVol)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">EDC</span>
                      <span className="font-semibold text-blue-700">{formatRupiah(calc.exEdcVol)}</span>
                    </div>
                  </div>
                </div>
                {/* Mandiri */}
                <div className="bg-mandiri-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-mandiri-600 mb-2">🏧 Mandiri</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">QRIS</span>
                      <span className="font-semibold text-green-700">{formatRupiah(calc.mQrisVol)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">EDC</span>
                      <span className="font-semibold text-blue-700">{formatRupiah(calc.mEdcVol)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Perbandingan Biaya */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="font-bold text-slate-800 text-sm mb-3">Perbandingan Biaya Transaksi / Bulan</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-red-500 mb-1">🏦 Bank Existing</p>
                  <p className="text-xl font-extrabold text-red-600 leading-tight">{fmtFee(calc.existingTotal)}</p>
                  <p className="text-xs text-red-400 mt-0.5">per bulan</p>
                </div>
                <div className="bg-mandiri-50 border border-mandiri-200 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-mandiri-600 mb-1">🏧 Bank Mandiri</p>
                  <p className="text-xl font-extrabold text-mandiri-700 leading-tight">{fmtFee(calc.mandiriTotal)}</p>
                  <p className="text-xs text-mandiri-400 mt-0.5">per bulan</p>
                </div>
              </div>
            </div>

            {/* Savings */}
            {calc.savingsPerMonth > 0 ? (
              <>
                <div className="bg-green-600 rounded-2xl p-5 text-center shadow-lg">
                  <PiggyBank size={28} className="text-green-200 mx-auto mb-2" />
                  <p className="text-green-100 text-sm font-semibold">Merchant Bisa Hemat</p>
                  <p className="text-white text-3xl font-extrabold mt-1">{formatRupiah(calc.savingsPerMonth)}</p>
                  <p className="text-green-200 text-xs mt-1.5">
                    per bulan · {calc.savingsPct.toFixed(1)}% lebih hemat dari sekarang
                  </p>
                </div>

                {/* Proyeksi */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <Calendar size={18} className="text-mandiri-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 mb-1">Hemat 6 Bulan</p>
                    <p className="text-lg font-extrabold text-mandiri-700">{formatRupiah(calc.savings6Month)}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <TrendingUp size={18} className="text-mandiri-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 mb-1">Hemat 1 Tahun</p>
                    <p className="text-lg font-extrabold text-mandiri-700">{formatRupiah(calc.savings1Year)}</p>
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="font-bold text-slate-800 text-sm mb-3">Insight untuk Merchant</p>
                  <div className="space-y-3">
                    {[
                      { icon: '💳', text: `Debit On-Us lebih hemat: Mandiri ${mDebitOnUs}% vs bank existing ${exDebitOnUs}%` },
                      { icon: '🔄', text: `Kredit On-Us lebih kompetitif: Mandiri ${mKreditOnUs}% vs bank existing ${exKreditOnUs}%` },
                      { icon: '📊', text: `Pola On-Us Mandiri lebih tinggi (${mPatDebitOnUsPct}% debit) — lebih banyak nasabah pakai kartu Mandiri` },
                      { icon: '🏆', text: `Total hemat ${formatRupiah(calc.savingsPerMonth)} setiap bulan — tanpa tambah omzet sekalipun` },
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
                  <p className="text-white font-bold text-sm text-center">Siap Hemat Bersama Mandiri?</p>
                  <button onClick={goBack}
                    className="w-full bg-mandiri-yellow text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={15} /> Lanjutkan Proses Akuisisi <ArrowRight size={13} />
                  </button>
                  <button onClick={goBack}
                    className="w-full bg-mandiri-600/60 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-mandiri-600 transition-colors"
                  >
                    <Clock size={14} /> Jadwalkan Follow Up
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-amber-700 font-semibold text-sm">Biaya hampir sama atau lebih tinggi dari Mandiri</p>
                <p className="text-amber-500 text-xs mt-1">
                  Coba naikkan porsi On-Us Mandiri atau sesuaikan tarif bank existing
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 bg-slate-100 rounded-xl p-3">
              <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Perhitungan menggunakan estimasi dan tarif umum pasar. Hasil aktual dapat berbeda sesuai kebijakan bank terkait. Kalkulator ini hanya untuk simulasi, bukan penawaran resmi.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Calculator size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-sm">Masukkan omzet merchant</p>
            <p className="text-xs mt-1">untuk melihat simulasi penghematan</p>
          </div>
        )}

      </div>
    </div>
  )
}

export default function NegotiationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin" />
      </div>
    }>
      <NegotiationContent />
    </Suspense>
  )
}
