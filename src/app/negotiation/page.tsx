'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import {
  Calculator, TrendingUp, PiggyBank, Calendar,
  ArrowRight, Clock, CheckCircle2, Info,
  ChevronDown, ChevronUp, CreditCard, Smartphone,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

export default function NegotiationPage() {
  const router = useRouter()

  const [volume, setVolume]           = useState('')
  const [qrisPct, setQrisPct]         = useState(40)
  const [debitPct, setDebitPct]       = useState(70)
  const [debitOnUsPct, setDebitOnUsPct]   = useState(50)
  const [kreditOnUsPct, setKreditOnUsPct] = useState(40)

  const [showExRates, setShowExRates]     = useState(false)
  const [exDebitOnUs, setExDebitOnUs]   = useState('1.00')
  const [exDebitOffUs, setExDebitOffUs] = useState('1.00')
  const [exKreditOnUs, setExKreditOnUs]   = useState('2.00')
  const [exKreditOffUs, setExKreditOffUs] = useState('2.00')
  const [exQris, setExQris]             = useState('0.70')

  const [showMRates, setShowMRates]   = useState(false)
  const [mDebitOnUs, setMDebitOnUs]   = useState('0.15')
  const [mDebitOffUs, setMDebitOffUs] = useState('1.00')
  const [mKreditOnUs, setMKreditOnUs] = useState('1.80')
  const [mKreditOffUs, setMKreditOffUs] = useState('1.80')
  const [mQris, setMQris]             = useState('0.70')

  const edcPct    = 100 - qrisPct
  const kreditPct = 100 - debitPct

  const vol = parseFloat(volume.replace(/\D/g, '')) || 0

  const calc = useMemo(() => {
    if (vol === 0) return null

    const qrisVol       = vol * qrisPct / 100
    const edcVol        = vol * edcPct / 100
    const debitVol      = edcVol * debitPct / 100
    const kreditVol     = edcVol * kreditPct / 100
    const debitOnUsVol  = debitVol * debitOnUsPct / 100
    const debitOffUsVol = debitVol * (100 - debitOnUsPct) / 100
    const kreditOnUsVol = kreditVol * kreditOnUsPct / 100
    const kreditOffUsVol = kreditVol * (100 - kreditOnUsPct) / 100

    const exDebitOnUsFee  = debitOnUsVol  * (parseFloat(exDebitOnUs)  / 100)
    const exDebitOffUsFee = debitOffUsVol * (parseFloat(exDebitOffUs) / 100)
    const exKreditOnUsFee  = kreditOnUsVol  * (parseFloat(exKreditOnUs)  / 100)
    const exKreditOffUsFee = kreditOffUsVol * (parseFloat(exKreditOffUs) / 100)
    const exQrisFee   = qrisVol * (parseFloat(exQris) / 100)
    const existingTotal = exDebitOnUsFee + exDebitOffUsFee + exKreditOnUsFee + exKreditOffUsFee + exQrisFee

    const mDebitOnUsFee  = debitOnUsVol  * (parseFloat(mDebitOnUs)  / 100)
    const mDebitOffUsFee = debitOffUsVol * (parseFloat(mDebitOffUs) / 100)
    const mKreditOnUsFee = kreditOnUsVol * (parseFloat(mKreditOnUs) / 100)
    const mKreditOffUsFee = kreditOffUsVol * (parseFloat(mKreditOffUs) / 100)
    const mQrisFee       = qrisVol * (parseFloat(mQris) / 100)
    const mandiriTotal   = mDebitOnUsFee + mDebitOffUsFee + mKreditOnUsFee + mKreditOffUsFee + mQrisFee

    const savingsPerMonth = existingTotal - mandiriTotal

    return {
      qrisVol, edcVol, debitVol, kreditVol,
      existingTotal, mandiriTotal, savingsPerMonth,
      savings6Month: savingsPerMonth * 6,
      savings1Year:  savingsPerMonth * 12,
      savingsPct: existingTotal > 0 ? (savingsPerMonth / existingTotal) * 100 : 0,
    }
  }, [vol, qrisPct, edcPct, debitPct, kreditPct, debitOnUsPct, kreditOnUsPct,
      exDebitOnUs, exDebitOffUs, exKreditOnUs, exKreditOffUs, exQris,
      mDebitOnUs, mDebitOffUs, mKreditOnUs, mKreditOffUs, mQris])

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <Navbar
        title="Kalkulator Negosiasi"
        subtitle="Perbandingan biaya EDC existing vs Mandiri"
        showBack
        backHref="/select-branch"
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
              type="text"
              inputMode="numeric"
              value={volume}
              onChange={e => setVolume(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mandiri-300 bg-slate-50"
            />
          </div>
          {vol > 0 && (
            <p className="text-xs text-mandiri-600 font-bold mt-1.5">{formatRupiah(vol)} / bulan</p>
          )}
          <p className="text-xs text-slate-400 mt-1.5">
            💡 &quot;Rata-rata omzet per bulan berapa pak?&quot;
          </p>
        </div>

        {/* Step 2: Pola Pembayaran */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-mandiri-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">Pola Pembayaran</p>
          </div>

          {/* QRIS vs EDC */}
          <div className="mb-3">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1 text-green-600">
                <Smartphone size={10} /> QRIS {qrisPct}%
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <CreditCard size={10} /> Kartu (EDC) {edcPct}%
              </span>
            </div>
            <div className="relative h-8 flex items-center">
              <div className="absolute inset-x-0 h-3 rounded-full overflow-hidden flex">
                <div className="bg-green-400 h-full transition-all" style={{ width: `${qrisPct}%` }} />
                <div className="bg-blue-400 h-full flex-1" />
              </div>
              <input
                type="range" min={0} max={100} value={qrisPct}
                onChange={e => setQrisPct(parseInt(e.target.value))}
                className="relative w-full h-3 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-mandiri-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              💡 &quot;Customer biasanya bayar pakai QR atau kartu ya pak?&quot;
            </p>
          </div>

          {/* Debit vs Kredit (only if EDC > 0) */}
          {edcPct > 0 && (
            <div className="border-t border-slate-100 pt-3 mb-3">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-600">Debit {debitPct}%</span>
                <span className="text-purple-600">Kredit {kreditPct}%</span>
              </div>
              <div className="relative h-8 flex items-center">
                <div className="absolute inset-x-0 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-blue-400 h-full transition-all" style={{ width: `${debitPct}%` }} />
                  <div className="bg-purple-400 h-full flex-1" />
                </div>
                <input
                  type="range" min={0} max={100} value={debitPct}
                  onChange={e => setDebitPct(parseInt(e.target.value))}
                  className="relative w-full h-3 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                💡 &quot;Kalau kartu, lebih banyak debit atau kredit?&quot;
              </p>
            </div>
          )}

          {/* On-Us sliders */}
          {edcPct > 0 && (
            <div className={`grid gap-3 ${kreditPct > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {debitPct > 0 && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-700 mb-2">
                    Kartu Debit
                  </p>
                  <div className="flex justify-between text-xs text-blue-500 mb-1">
                    <span>On-Us {debitOnUsPct}%</span>
                    <span>Off-Us {100 - debitOnUsPct}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={debitOnUsPct}
                    onChange={e => setDebitOnUsPct(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-blue-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              )}
              {kreditPct > 0 && (
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-purple-700 mb-2">
                    Kartu Kredit
                  </p>
                  <div className="flex justify-between text-xs text-purple-500 mb-1">
                    <span>On-Us {kreditOnUsPct}%</span>
                    <span>Off-Us {100 - kreditOnUsPct}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={kreditOnUsPct}
                    onChange={e => setKreditOnUsPct(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-purple-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tarif Settings */}
        {/* Existing Bank Rates */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={() => setShowExRates(v => !v)}
            className="w-full flex items-center gap-3 p-4"
          >
            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-sm shrink-0">
              🏦
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-bold text-slate-800 text-sm">Tarif Bank Existing</p>
              <p className="text-xs text-slate-400 truncate">
                Debit On-Us {exDebitOnUs}% · Kredit On-Us {exKreditOnUs}% · QRIS {exQris}%
              </p>
            </div>
            {showExRates
              ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
              : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
          </button>
          {showExRates && (
            <div className="px-4 pb-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2 mt-3">
                {([
                  ['Debit On-Us (%)', exDebitOnUs, setExDebitOnUs],
                  ['Debit Off-Us (%)', exDebitOffUs, setExDebitOffUs],
                  ['Kredit On-Us (%)', exKreditOnUs, setExKreditOnUs],
                  ['Kredit Off-Us (%)', exKreditOffUs, setExKreditOffUs],
                ] as [string, string, React.Dispatch<React.SetStateAction<string>>][]).map(([label, val, set]) => (
                  <div key={label}>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">{label}</label>
                    <input
                      type="number" step="0.01" min="0" max="10" value={val}
                      onChange={e => set(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <label className="text-xs text-slate-500 font-semibold block mb-1">QRIS (%)</label>
                <input
                  type="number" step="0.01" min="0" max="10" value={exQris}
                  onChange={e => setExQris(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mandiri Rates */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={() => setShowMRates(v => !v)}
            className="w-full flex items-center gap-3 p-4"
          >
            <div className="w-7 h-7 bg-mandiri-100 rounded-lg flex items-center justify-center text-sm shrink-0">
              🏧
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-bold text-slate-800 text-sm">Tarif Mandiri</p>
              <p className="text-xs text-slate-400 truncate">
                Debit On-Us {mDebitOnUs}% · Kredit On-Us {mKreditOnUs}% · QRIS {mQris}%
              </p>
            </div>
            {showMRates
              ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
              : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
          </button>
          {showMRates && (
            <div className="px-4 pb-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2 mt-3">
                {([
                  ['Debit On-Us (%)', mDebitOnUs, setMDebitOnUs],
                  ['Debit Off-Us (%)', mDebitOffUs, setMDebitOffUs],
                  ['Kredit On-Us (%)', mKreditOnUs, setMKreditOnUs],
                  ['Kredit Off-Us (%)', mKreditOffUs, setMKreditOffUs],
                ] as [string, string, React.Dispatch<React.SetStateAction<string>>][]).map(([label, val, set]) => (
                  <div key={label}>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">{label}</label>
                    <input
                      type="number" step="0.01" min="0" max="10" value={val}
                      onChange={e => set(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mandiri-200"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <label className="text-xs text-slate-500 font-semibold block mb-1">QRIS (%)</label>
                <input
                  type="number" step="0.01" min="0" max="10" value={mQris}
                  onChange={e => setMQris(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mandiri-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── RESULTS ── */}
        {calc ? (
          <>
            {/* Ringkasan Input */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="font-bold text-slate-700 text-xs mb-2 uppercase tracking-wide">Ringkasan Input</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-xs text-slate-400">Omzet</p>
                  <p className="text-xs font-bold text-slate-700">{formatRupiah(vol)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-2">
                  <p className="text-xs text-slate-400">QRIS</p>
                  <p className="text-xs font-bold text-green-700">{formatRupiah(calc.qrisVol)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2">
                  <p className="text-xs text-slate-400">EDC</p>
                  <p className="text-xs font-bold text-blue-700">{formatRupiah(calc.edcVol)}</p>
                </div>
              </div>
            </div>

            {/* Perbandingan Biaya */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="font-bold text-slate-800 text-sm mb-3">
                Perbandingan Biaya Transaksi / Bulan
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-red-500 mb-1">🏦 Bank Existing</p>
                  <p className="text-xl font-extrabold text-red-600 leading-tight">
                    {formatRupiah(calc.existingTotal)}
                  </p>
                  <p className="text-xs text-red-400 mt-0.5">per bulan</p>
                </div>
                <div className="bg-mandiri-50 border border-mandiri-200 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-mandiri-600 mb-1">🏧 Bank Mandiri</p>
                  <p className="text-xl font-extrabold text-mandiri-700 leading-tight">
                    {formatRupiah(calc.mandiriTotal)}
                  </p>
                  <p className="text-xs text-mandiri-400 mt-0.5">per bulan</p>
                </div>
              </div>
            </div>

            {/* Savings highlight */}
            {calc.savingsPerMonth > 0 ? (
              <>
                <div className="bg-green-600 rounded-2xl p-5 text-center shadow-lg">
                  <PiggyBank size={28} className="text-green-200 mx-auto mb-2" />
                  <p className="text-green-100 text-sm font-semibold">Merchant Bisa Hemat</p>
                  <p className="text-white text-3xl font-extrabold mt-1">
                    {formatRupiah(calc.savingsPerMonth)}
                  </p>
                  <p className="text-green-200 text-xs mt-1.5">
                    per bulan · {calc.savingsPct.toFixed(1)}% lebih hemat dari sekarang
                  </p>
                </div>

                {/* Proyeksi */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <Calendar size={18} className="text-mandiri-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 mb-1">Hemat 6 Bulan</p>
                    <p className="text-lg font-extrabold text-mandiri-700">
                      {formatRupiah(calc.savings6Month)}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <TrendingUp size={18} className="text-mandiri-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 mb-1">Hemat 1 Tahun</p>
                    <p className="text-lg font-extrabold text-mandiri-700">
                      {formatRupiah(calc.savings1Year)}
                    </p>
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="font-bold text-slate-800 text-sm mb-3">Insight untuk Merchant</p>
                  <div className="space-y-3">
                    {[
                      {
                        icon: '💳',
                        text: `Debit On-Us lebih hemat: Mandiri ${mDebitOnUs}% vs bank existing ${exDebitOnUs}%`,
                      },
                      {
                        icon: '🔄',
                        text: `Kredit On-Us lebih kompetitif: Mandiri ${mKreditOnUs}% vs bank existing ${exKreditOnUs}%`,
                      },
                      {
                        icon: '📱',
                        text: `QRIS tetap sama — tidak ada biaya tambahan untuk pindah`,
                      },
                      {
                        icon: '🏆',
                        text: `Total hemat ${formatRupiah(calc.savingsPerMonth)} setiap bulan — tanpa tambah omzet sekalipun`,
                      },
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
                  <button
                    onClick={() => router.push('/select-branch')}
                    className="w-full bg-mandiri-yellow text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={15} />
                    Lanjutkan Proses Akuisisi
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => router.push('/select-branch')}
                    className="w-full bg-mandiri-600/60 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-mandiri-600 transition-colors"
                  >
                    <Clock size={14} />
                    Jadwalkan Follow Up
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-amber-700 font-semibold text-sm">
                  Biaya hampir sama atau lebih tinggi dari Mandiri
                </p>
                <p className="text-amber-500 text-xs mt-1">
                  Coba sesuaikan porsi On-Us atau tarif bank existing untuk simulasi yang lebih akurat
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
