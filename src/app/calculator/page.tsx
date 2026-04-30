'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { calculateFee, formatRupiah } from '@/lib/utils'
import { Calculator, TrendingUp, CreditCard, Smartphone, Info, Download } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'

function NumberInput({
  label, value, onChange, sublabel, hint
}: {
  label: string; value: string; onChange: (v: string) => void; sublabel?: string; hint?: string
}) {
  const parsed = parseFloat(value.replace(/\D/g, '')) || 0
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
      {sublabel && <p className="text-xs text-slate-400 mb-1.5">{sublabel}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={e => {
            const raw = e.target.value.replace(/\D/g, '')
            onChange(raw)
          }}
          placeholder="0"
          className="input pl-10 pr-3 font-mono"
        />
      </div>
      {parsed > 0 && (
        <p className="text-xs text-mandiri-600 font-semibold mt-1">{formatRupiah(parsed)}</p>
      )}
      {hint && <p className="text-xs text-slate-400 mt-1">💡 {hint}</p>}
    </div>
  )
}

function SliderInput({
  label, value, onChange, max = 100
}: {
  label: string; value: number; onChange: (v: number) => void; max?: number
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-semibold text-slate-600">{label}</label>
        <span className="text-xs font-bold text-mandiri-700">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-mandiri-700"
      />
    </div>
  )
}

const COLORS = ['#003B79', '#0064B4', '#F5A623', '#FFC84A', '#00A651']

function CalculatorContent() {
  const searchParams = useSearchParams()
  const defaultVolume = searchParams.get('volume') || ''

  // Total volume
  const [totalVolume, setTotalVolume] = useState(defaultVolume)

  // EDC split (% of total)
  const [edcPct, setEdcPct] = useState(60)     // % of total going to EDC
  const [qrisPct, setQrisPct] = useState(40)   // % going to QRIS (auto: 100-edcPct)

  // EDC sub-splits
  const [debitPct, setDebitPct]           = useState(70) // % of EDC that is Debit
  const [debitOnUsPct, setDebitOnUsPct]   = useState(50) // % of Debit that is On-Us
  const [kreditOnUsPct, setKreditOnUsPct] = useState(40) // % of Kredit that is On-Us

  const vol = parseFloat(totalVolume) || 0

  const result = useMemo(() => {
    const edcVol     = vol * (edcPct / 100)
    const qrisVol    = vol * ((100 - edcPct) / 100)
    const debitVol   = edcVol * (debitPct / 100)
    const kreditVol  = edcVol * ((100 - debitPct) / 100)

    const edcOnUsDebit   = debitVol  * (debitOnUsPct / 100)
    const edcOffUsDebit  = debitVol  * ((100 - debitOnUsPct) / 100)
    const edcOnUsCredit  = kreditVol * (kreditOnUsPct / 100)
    const edcOffUsCredit = kreditVol * ((100 - kreditOnUsPct) / 100)

    return calculateFee(edcOnUsDebit, edcOnUsCredit, edcOffUsDebit, edcOffUsCredit, qrisVol)
  }, [vol, edcPct, debitPct, debitOnUsPct, kreditOnUsPct])

  const pieData = [
    { name: 'EDC Debit On-Us (0.15%)',  value: result.edcOnUsDebitFee  },
    { name: 'EDC Kredit On-Us (1.8%)',  value: result.edcOnUsCreditFee },
    { name: 'EDC Debit Off-Us (1%)',    value: result.edcOffUsDebitFee },
    { name: 'EDC Kredit Off-Us (1.8%)', value: result.edcOffUsCreditFee },
    { name: 'QRIS (0.7%)',              value: result.qrisFee },
  ].filter(d => d.value > 0)

  const barData = [
    { name: 'Bulan ini', fee: result.totalFee },
    { name: '3 Bulan',   fee: result.totalFee * 3 },
    { name: '6 Bulan',   fee: result.totalFee * 6 },
    { name: '1 Tahun',   fee: result.annualProjection },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <Navbar title="Kalkulator Fee" subtitle="Simulasi pendapatan fee-based income" />

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Info header */}
        <div className="card p-4 bg-mandiri-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mandiri-yellow rounded-xl flex items-center justify-center shrink-0">
              <Calculator size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold">Simulasi Fee-Based Income</p>
              <p className="text-mandiri-200 text-xs mt-0.5">
                Kalkulasi potensi pendapatan Mandiri dari merchant ini
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Total Volume */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-mandiri-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
            <h3 className="font-bold text-slate-800">Estimasi Volume Transaksi</h3>
          </div>
          <NumberInput
            label="Total Volume Transaksi / Bulan"
            value={totalVolume}
            onChange={setTotalVolume}
            hint="Tanyakan langsung ke owner atau estimasi dari ramai/tidaknya merchant"
          />
        </div>

        {/* Step 2: Split EDC vs QRIS */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-mandiri-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <h3 className="font-bold text-slate-800">Split EDC vs QRIS</h3>
          </div>

          <SliderInput
            label={`Porsi EDC: ${edcPct}% | QRIS: ${100 - edcPct}%`}
            value={edcPct}
            onChange={v => setEdcPct(v)}
          />

          <div className="flex gap-2 mt-3">
            <div className="flex-1 p-3 bg-mandiri-50 rounded-xl text-center">
              <CreditCard size={14} className="text-mandiri-700 mx-auto mb-1" />
              <p className="text-xs font-semibold text-mandiri-700">EDC</p>
              <p className="text-sm font-bold text-mandiri-800">{formatRupiah(vol * edcPct / 100)}</p>
            </div>
            <div className="flex-1 p-3 bg-green-50 rounded-xl text-center">
              <Smartphone size={14} className="text-green-600 mx-auto mb-1" />
              <p className="text-xs font-semibold text-green-700">QRIS</p>
              <p className="text-sm font-bold text-green-800">{formatRupiah(vol * (100 - edcPct) / 100)}</p>
            </div>
          </div>
        </div>

        {/* Step 3: EDC breakdown */}
        {edcPct > 0 && vol > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-mandiri-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <h3 className="font-bold text-slate-800">Detail Breakdown EDC</h3>
            </div>
            <div className="space-y-5">
              {/* Debit vs Kredit split */}
              <SliderInput
                label={`Kartu Debit: ${debitPct}% | Kartu Kredit: ${100 - debitPct}%`}
                value={debitPct}
                onChange={v => setDebitPct(v)}
              />

              {/* Debit section */}
              {debitPct > 0 && (
                <div className="bg-mandiri-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={13} className="text-mandiri-700" />
                    <p className="text-xs font-bold text-mandiri-700">
                      Kartu Debit — {formatRupiah(vol * edcPct / 100 * debitPct / 100)}
                    </p>
                  </div>
                  <SliderInput
                    label={`On-Us (Kartu Mandiri): ${debitOnUsPct}% | Off-Us (Bank Lain): ${100 - debitOnUsPct}%`}
                    value={debitOnUsPct}
                    onChange={v => setDebitOnUsPct(v)}
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-slate-500">On-Us Debit <span className="text-mandiri-600">(0.15%)</span></p>
                      <p className="font-bold text-mandiri-700">{formatRupiah(vol * edcPct/100 * debitPct/100 * debitOnUsPct/100)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-slate-500">Off-Us Debit <span className="text-mandiri-600">(1.00%)</span></p>
                      <p className="font-bold text-mandiri-700">{formatRupiah(vol * edcPct/100 * debitPct/100 * (100-debitOnUsPct)/100)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Kredit section */}
              {debitPct < 100 && (
                <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={13} className="text-amber-600" />
                    <p className="text-xs font-bold text-amber-700">
                      Kartu Kredit — {formatRupiah(vol * edcPct / 100 * (100 - debitPct) / 100)}
                    </p>
                  </div>
                  <SliderInput
                    label={`On-Us (Kartu Mandiri): ${kreditOnUsPct}% | Off-Us (Bank Lain): ${100 - kreditOnUsPct}%`}
                    value={kreditOnUsPct}
                    onChange={v => setKreditOnUsPct(v)}
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-slate-500">On-Us Kredit <span className="text-amber-600">(1.80%)</span></p>
                      <p className="font-bold text-amber-700">{formatRupiah(vol * edcPct/100 * (100-debitPct)/100 * kreditOnUsPct/100)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-slate-500">Off-Us Kredit <span className="text-amber-600">(1.80%)</span></p>
                      <p className="font-bold text-amber-700">{formatRupiah(vol * edcPct/100 * (100-debitPct)/100 * (100-kreditOnUsPct)/100)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {vol > 0 && (
          <>
            {/* Fee breakdown table */}
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4">Rincian Fee per Kategori</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'EDC Debit On-Us',   rate: '0.15%', fee: result.edcOnUsDebitFee,   color: 'bg-mandiri-700' },
                  { label: 'EDC Kredit On-Us',  rate: '1.80%', fee: result.edcOnUsCreditFee,  color: 'bg-mandiri-500' },
                  { label: 'EDC Debit Off-Us',  rate: '1.00%', fee: result.edcOffUsDebitFee,  color: 'bg-mandiri-yellow' },
                  { label: 'EDC Kredit Off-Us', rate: '1.80%', fee: result.edcOffUsCreditFee, color: 'bg-amber-400' },
                  { label: 'QRIS',              rate: '0.70%', fee: result.qrisFee,            color: 'bg-green-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', item.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <span className="text-xs text-slate-400 ml-2 shrink-0">({item.rate})</span>
                      </div>
                    </div>
                    <span className={cn(
                      'text-sm font-bold shrink-0',
                      item.fee > 0 ? 'text-slate-800' : 'text-slate-300'
                    )}>
                      {item.fee > 0 ? formatRupiah(item.fee) : '—'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-center">
                <span className="font-bold text-slate-700">Total Fee / Bulan</span>
                <span className="text-xl font-extrabold text-mandiri-700">{formatRupiah(result.totalFee)}</span>
              </div>
            </div>

            {/* Projections */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 text-center">
                <TrendingUp size={16} className="text-mandiri-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Proyeksi 6 Bulan</p>
                <p className="font-extrabold text-mandiri-700 text-lg">{formatRupiah(result.totalFee * 6)}</p>
              </div>
              <div className="card p-4 text-center bg-mandiri-700 text-white">
                <TrendingUp size={16} className="text-mandiri-yellow mx-auto mb-2" />
                <p className="text-xs text-mandiri-200 mb-1">Proyeksi 1 Tahun</p>
                <p className="font-extrabold text-mandiri-yellow text-lg">{formatRupiah(result.annualProjection)}</p>
              </div>
            </div>

            {/* Pie chart */}
            {pieData.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-slate-800 mb-4">Komposisi Sumber Fee</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatRupiah(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 flex-1">{d.name}</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bar chart */}
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4">Proyeksi Kumulatif</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => formatRupiah(v).replace('Rp ', '')} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [formatRupiah(v), 'Fee Mandiri']} />
                    <Bar dataKey="fee" fill="#003B79" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Retention program suggestion */}
            {result.annualProjection > 5000000 && (
              <div className="card p-5 border-l-4 border-mandiri-yellow">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-mandiri-yellow mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Saran Program Retensi</p>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Dengan potensi fee tahunan <strong className="text-mandiri-700">{formatRupiah(result.annualProjection)}</strong>,
                      merchant ini layak mendapatkan program sponsorship/partnership Mandiri.
                      {result.annualProjection > 50000000
                        ? ' Rekomendasikan ke Branch Manager untuk program Merchant Premium.'
                        : ' Pertimbangkan program diskon biaya transaksi atau co-branding.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {vol === 0 && (
          <div className="text-center py-10 text-slate-400">
            <Calculator size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Masukkan volume transaksi</p>
            <p className="text-sm mt-1">untuk melihat simulasi pendapatan fee Mandiri</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin" /></div>}>
      <CalculatorContent />
    </Suspense>
  )
}
