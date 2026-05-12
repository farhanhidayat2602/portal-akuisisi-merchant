'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { RotateCcw, Info, Trash2, Lightbulb, CheckCircle2 } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type EdcConfig = {
  id: string
  bank: string
  porsi: number
  onUsPct: number
  mdrOnUs: string
  mdrOffUs: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const BANKS = [
  { id: 'mandiri',  name: 'Mandiri',    color: '#003B79' },
  { id: 'bca',      name: 'BCA',        color: '#0064B4' },
  { id: 'bri',      name: 'BRI',        color: '#B60000' },
  { id: 'bni',      name: 'BNI',        color: '#E87722' },
  { id: 'cimb',     name: 'CIMB Niaga', color: '#7B2B2B' },
  { id: 'btn',      name: 'BTN',        color: '#1B5E20' },
  { id: 'danamon',  name: 'Danamon',    color: '#D4145A' },
  { id: 'permata',  name: 'Permata',    color: '#5C35A5' },
  { id: 'other',    name: 'Lainnya',    color: '#64748B' },
]

const THEMES = [
  { badge: '#003B79', light: '#EBF3FF', barFade: '#003B7950' },
  { badge: '#0064B4', light: '#E6F0FA', barFade: '#0064B450' },
  { badge: '#1E40AF', light: '#EEF2FF', barFade: '#1E40AF50' },
  { badge: '#D97706', light: '#FFFBEB', barFade: '#D9770650' },
]

const DEFAULTS: EdcConfig[] = [
  { id: '1', bank: 'mandiri', porsi: 40, onUsPct: 70, mdrOnUs: '0.30', mdrOffUs: '1.60' },
  { id: '2', bank: 'bca',     porsi: 30, onUsPct: 60, mdrOnUs: '0.40', mdrOffUs: '1.70' },
  { id: '3', bank: 'bri',     porsi: 20, onUsPct: 50, mdrOnUs: '0.45', mdrOffUs: '1.80' },
  { id: '4', bank: 'bni',     porsi: 10, onUsPct: 40, mdrOnUs: '0.50', mdrOffUs: '1.90' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtK(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`
  if (abs >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} jt`
  if (abs >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}

function calcEdc(vol: number, edc: EdcConfig) {
  const edcVol   = vol * edc.porsi / 100
  const onUsVol  = edcVol * edc.onUsPct / 100
  const offUsVol = edcVol * (100 - edc.onUsPct) / 100
  const onUsFee  = onUsVol  * parseFloat(edc.mdrOnUs)  / 100
  const offUsFee = offUsVol * parseFloat(edc.mdrOffUs) / 100
  const totalFee = onUsFee + offUsFee
  const effMDR   = edcVol > 0 ? (totalFee / edcVol) * 100 : 0
  return { edcVol, onUsVol, offUsVol, onUsFee, offUsFee, totalFee, effMDR }
}

// ── Label cell (sticky left) ──────────────────────────────────────────────────
function LabelCell({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="bg-slate-50 border-r border-b border-slate-100 p-3 flex items-start gap-2 sticky left-0 z-10">
      <span className="text-base leading-none mt-0.5">{icon}</span>
      <div>
        <p className="text-[11px] font-bold text-slate-600 leading-tight">{title}</p>
        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

// ── Number input ──────────────────────────────────────────────────────────────
function Num({
  value, onChange, step = 1, min = 0, max = 100, suffix = '%', width = 'w-16',
}: {
  value: string | number; onChange: (v: string) => void
  step?: number; min?: number; max?: number; suffix?: string; width?: string
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number" step={step} min={min} max={max}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${width} border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white`}
      />
      <span className="text-xs font-semibold text-slate-400">{suffix}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
function EDCComparisonContent() {
  const router = useRouter()

  const [numEdc, setNumEdc] = useState<2 | 3 | 4>(2)
  const [rawVolume, setRawVolume] = useState('1000000000')
  const [edcs, setEdcs] = useState<EdcConfig[]>(DEFAULTS)

  const vol        = parseFloat(rawVolume.replace(/\D/g, '')) || 0
  const activeEdcs = edcs.slice(0, numEdc)

  const results = useMemo(() => activeEdcs.map(e => calcEdc(vol, e)), [vol, activeEdcs])

  const totalFee      = results.reduce((s, r) => s + r.totalFee, 0)
  const totalEdcVol   = results.reduce((s, r) => s + r.edcVol, 0)
  const avgEffMDR     = totalEdcVol > 0 ? (totalFee / totalEdcVol) * 100 : 0
  const netSettlement = vol - totalFee
  const porsiSum      = activeEdcs.reduce((s, e) => s + e.porsi, 0)
  const bestIdx       = results.reduce((b, r, i) => r.effMDR < results[b].effMDR ? i : b, 0)

  const upd = (idx: number, field: keyof EdcConfig, val: string | number) =>
    setEdcs(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e))

  const resetEdc = (idx: number) =>
    setEdcs(prev => prev.map((e, i) => i === idx ? { ...DEFAULTS[idx], id: e.id } : e))

  const resetAll = () => { setEdcs(DEFAULTS); setNumEdc(2); setRawVolume('1000000000') }

  const bank = (id: string) => BANKS.find(b => b.id === id) ?? BANKS[BANKS.length - 1]

  const cols = numEdc

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <Navbar
        title="EDC Cost Comparison Calculator"
        subtitle="Bandingkan biaya & potongan dari 2–4 mesin EDC sekaligus"
        showBack
        backHref="/select-branch"
      />

      <div className="p-3 md:p-5 max-w-[1440px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <h1 className="text-base font-extrabold text-slate-800">Perbandingan Kalkulator Mesin EDC</h1>
              <p className="text-xs text-slate-400 mt-0.5">Bandingkan biaya &amp; potongan dari 2–4 mesin EDC sekaligus</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Jumlah Mesin EDC:</span>
              <div className="flex gap-1">
                {([2, 3, 4] as const).map(n => (
                  <button key={n} onClick={() => setNumEdc(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${numEdc === n ? 'bg-[#003B79] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >{n}</button>
                ))}
              </div>
              <button onClick={resetAll}
                className="flex items-center gap-1.5 px-3 h-9 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <RotateCcw size={13} /> Reset Semua
              </button>
            </div>
          </div>

          {/* ── Stats bar ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 border-b border-slate-100 divide-x divide-y md:divide-y-0 divide-slate-100">
            {/* Omset */}
            <div className="p-4 col-span-2 md:col-span-1">
              <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Omset Bulanan (Rp) <Info size={10} className="text-slate-300" />
              </p>
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50">
                <span className="text-xs text-slate-400 font-medium shrink-0">Rp</span>
                <input
                  type="text" inputMode="numeric"
                  value={vol > 0 ? vol.toLocaleString('id-ID') : ''}
                  onChange={e => setRawVolume(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="flex-1 min-w-0 text-sm font-bold text-slate-800 font-mono focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Total Potongan</p>
              <p className={`text-xl font-extrabold ${totalFee > 0 ? 'text-red-500' : 'text-slate-200'}`}>{fmtK(totalFee)}</p>
            </div>

            <div className="p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Effective MDR</p>
              <p className={`text-xl font-extrabold ${avgEffMDR > 0 ? 'text-slate-700' : 'text-slate-200'}`}>{avgEffMDR.toFixed(2)}%</p>
            </div>

            <div className="p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Net Settlement</p>
              <p className={`text-xl font-extrabold ${netSettlement > 0 ? 'text-green-600' : 'text-slate-200'}`}>{fmtK(netSettlement)}</p>
            </div>

            <div className="p-4 bg-blue-50 col-span-2 md:col-span-1">
              <div className="flex items-start gap-2">
                <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-blue-700 mb-0.5">Catatan</p>
                  <p className="text-[11px] text-blue-600 leading-relaxed">
                    Perhitungan bersifat estimasi berdasarkan MDR dan porsi penggunaan yang Anda input.
                  </p>
                  {porsiSum !== 100 && vol > 0 && (
                    <p className="text-[10px] text-amber-600 font-bold mt-1">⚠️ Porsi total: {porsiSum}% (seharusnya 100%)</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Comparison Grid ─────────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `140px repeat(${cols}, minmax(210px, 1fr))`,
                minWidth: `${140 + cols * 210}px`,
              }}
            >
              {/* ── Row: EDC Headers ── */}
              <div className="bg-slate-50 border-r border-b border-slate-100 p-3 sticky left-0 z-10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MESIN EDC</span>
              </div>
              {activeEdcs.map((edc, idx) => {
                const t = THEMES[idx]
                const b = bank(edc.bank)
                return (
                  <div key={edc.id} className="border-r border-b border-slate-100 p-3" style={{ backgroundColor: t.light }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-md shrink-0" style={{ backgroundColor: t.badge }}>
                        EDC {idx + 1}
                      </span>
                      <select
                        value={edc.bank}
                        onChange={e => upd(idx, 'bank', e.target.value)}
                        className="flex-1 min-w-0 text-sm font-bold border-0 bg-transparent focus:outline-none cursor-pointer"
                        style={{ color: b.color }}
                      >
                        {BANKS.map(bk => <option key={bk.id} value={bk.id}>{bk.name}</option>)}
                      </select>
                      <button onClick={() => resetEdc(idx)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0" title="Reset EDC ini">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* ── Row: Porsi Penggunaan ── */}
              <LabelCell icon="🏧" title="EDC & Porsi" sub="Penggunaan" />
              {activeEdcs.map((edc, idx) => {
                const t = THEMES[idx]
                return (
                  <div key={edc.id} className="border-r border-b border-slate-100 p-4">
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-2">
                      Porsi Penggunaan EDC <Info size={10} className="text-slate-300" />
                    </p>
                    <Num
                      value={edc.porsi} min={0} max={100}
                      onChange={v => upd(idx, 'porsi', Math.min(100, Math.max(0, parseInt(v) || 0)))}
                    />
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${edc.porsi}%`, backgroundColor: t.badge }} />
                    </div>
                    <p className="text-[10px] text-slate-400 text-right mt-1">{edc.porsi}%</p>
                  </div>
                )
              })}

              {/* ── Row: Mix Transaksi ── */}
              <LabelCell icon="🔄" title="Mix Transaksi" sub="(On-Us / Off-Us)" />
              {activeEdcs.map((edc, idx) => {
                const t   = THEMES[idx]
                const off = 100 - edc.onUsPct
                return (
                  <div key={edc.id} className="border-r border-b border-slate-100 p-4">
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-2">
                      Mix Transaksi <Info size={10} className="text-slate-300" />
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-2.5">
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold mb-1">On-Us (Nasabah Bank)</p>
                        <Num value={edc.onUsPct} onChange={v => upd(idx, 'onUsPct', Math.min(100, Math.max(0, parseInt(v) || 0)))} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold mb-1">Off-Us (Bank Lain)</p>
                        <Num value={off} onChange={v => upd(idx, 'onUsPct', Math.min(100, Math.max(0, 100 - (parseInt(v) || 0))))} />
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden flex">
                      <div className="h-full transition-all" style={{ width: `${edc.onUsPct}%`, backgroundColor: t.badge }} />
                      <div className="h-full flex-1" style={{ backgroundColor: t.barFade }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{edc.onUsPct}%</span><span>{off}%</span>
                    </div>
                  </div>
                )
              })}

              {/* ── Row: MDR ── */}
              <LabelCell icon="💱" title="MDR (%)" sub="On-Us & Off-Us" />
              {activeEdcs.map((edc, idx) => (
                <div key={edc.id} className="border-r border-b border-slate-100 p-4">
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-2">
                    MDR (%) <Info size={10} className="text-slate-300" />
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold mb-1">On-Us</p>
                      <Num value={edc.mdrOnUs} step={0.01} max={10} onChange={v => upd(idx, 'mdrOnUs', v)} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold mb-1">Off-Us</p>
                      <Num value={edc.mdrOffUs} step={0.01} max={10} onChange={v => upd(idx, 'mdrOffUs', v)} />
                    </div>
                  </div>
                </div>
              ))}

              {/* ── Row: Hasil Perhitungan ── */}
              <LabelCell icon="📊" title="Hasil" sub="Perhitungan" />
              {results.map((r, idx) => {
                const edc = activeEdcs[idx]
                const t   = THEMES[idx]
                const isB = idx === bestIdx
                return (
                  <div key={edc.id} className="border-r border-slate-100 p-4">
                    <div className="space-y-2 mb-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Volume Transaksi</span>
                        <span className="font-semibold text-slate-700">{fmtK(r.edcVol)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Potongan On-Us ({edc.onUsPct}%)</span>
                        <span className="font-semibold text-slate-600">{fmtK(r.onUsFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Potongan Off-Us ({100 - edc.onUsPct}%)</span>
                        <span className="font-semibold text-slate-600">{fmtK(r.offUsFee)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-slate-100">
                        <span className="text-red-600">Total Potongan</span>
                        <span className="text-red-600">{fmtK(r.totalFee)}</span>
                      </div>
                    </div>
                    <div className="relative rounded-xl p-3 text-center overflow-hidden" style={{ backgroundColor: t.badge }}>
                      {isB && vol > 0 && (
                        <div className="absolute top-1.5 right-2">
                          <span className="text-[9px] font-black text-white bg-green-500 px-1.5 py-0.5 rounded-full">TERBAIK</span>
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-white/60 mb-0.5">Effective MDR</p>
                      <p className="text-2xl font-black text-white">{r.effMDR.toFixed(2)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Summary Table + Insights ─────────────────────────────────── */}
          <div className="p-5 border-t border-slate-100">
            <div className="flex gap-5 flex-col xl:flex-row">

              {/* Table */}
              <div className="flex-1 overflow-x-auto">
                <p className="text-sm font-bold text-slate-700 mb-3">Ringkasan Perbandingan</p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      <th className="text-left font-semibold text-slate-500 py-2 pr-4 w-44 whitespace-nowrap">Metrik</th>
                      {activeEdcs.map((edc, idx) => {
                        const b = bank(edc.bank)
                        return (
                          <th key={edc.id} className="text-center font-bold py-2 px-3 whitespace-nowrap" style={{ color: b.color }}>
                            {b.name}
                          </th>
                        )
                      })}
                      <th className="text-center font-bold text-slate-700 py-2 px-3">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: 'Porsi Penggunaan EDC',
                        vals: activeEdcs.map(e => `${e.porsi}%`),
                        total: <span className={porsiSum === 100 ? 'text-green-600 font-black' : 'text-amber-600 font-black'}>{porsiSum}%</span>,
                      },
                      {
                        label: 'Volume Transaksi (Rp)',
                        vals: results.map(r => r.edcVol.toLocaleString('id-ID')),
                        total: totalEdcVol.toLocaleString('id-ID'),
                      },
                      {
                        label: 'Rata-rata MDR On-Us (%)',
                        vals: activeEdcs.map(e => `${e.mdrOnUs}%`),
                        total: '—',
                      },
                      {
                        label: 'Rata-rata MDR Off-Us (%)',
                        vals: activeEdcs.map(e => `${e.mdrOffUs}%`),
                        total: '—',
                      },
                    ].map((row, ri) => (
                      <tr key={ri} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 pr-4 text-slate-500 font-medium whitespace-nowrap">{row.label}</td>
                        {row.vals.map((v, vi) => (
                          <td key={vi} className="text-center py-2.5 px-3 font-semibold text-slate-700">{v}</td>
                        ))}
                        <td className="text-center py-2.5 px-3 font-bold text-slate-500">
                          {typeof row.total === 'string' ? row.total : row.total}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-200 hover:bg-red-50 transition-colors">
                      <td className="py-2.5 pr-4 font-bold text-slate-700 whitespace-nowrap">Total Potongan (Rp)</td>
                      {results.map((r, i) => (
                        <td key={i} className="text-center py-2.5 px-3 font-bold text-red-500">
                          {r.totalFee.toLocaleString('id-ID')}
                        </td>
                      ))}
                      <td className="text-center py-2.5 px-3 font-black text-red-600">{totalFee.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr className="hover:bg-blue-50 transition-colors">
                      <td className="py-2.5 pr-4 font-bold text-slate-700 whitespace-nowrap">Effective MDR (%)</td>
                      {results.map((r, i) => {
                        const t = THEMES[i]
                        const isB = i === bestIdx && vol > 0
                        return (
                          <td key={i} className="text-center py-2.5 px-3 font-black" style={{ color: t.badge }}>
                            {r.effMDR.toFixed(2)}%
                            {isB && <span className="ml-1 text-[9px] font-black text-green-500">✓</span>}
                          </td>
                        )
                      })}
                      <td className="text-center py-2.5 px-3 font-black text-[#003B79]">{avgEffMDR.toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Insights */}
              <div className="xl:w-72 bg-amber-50 border border-amber-200 rounded-xl p-4 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={15} className="text-amber-500" />
                  <p className="text-sm font-bold text-amber-700">Insight</p>
                </div>
                {vol > 0 ? (
                  <div className="space-y-3 text-xs text-amber-800">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Total potongan terendah di kombinasi ini adalah <b>{fmtK(totalFee)}</b></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-green-500 mt-0.5 shrink-0" />
                      <span>
                        EDC paling efisien (Effective MDR terendah) adalah{' '}
                        <b>{bank(activeEdcs[bestIdx]?.bank ?? 'mandiri').name} ({results[bestIdx]?.effMDR.toFixed(2)}%)</b>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Net settlement merchant setelah semua potongan: <b>{fmtK(netSettlement)}</b></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Sesuaikan porsi penggunaan dan MDR untuk mendapatkan simulasi terbaik</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">Masukkan omzet untuk melihat insight perbandingan.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function MultiEDCPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-[#003B79] rounded-full animate-spin" />
      </div>
    }>
      <EDCComparisonContent />
    </Suspense>
  )
}
