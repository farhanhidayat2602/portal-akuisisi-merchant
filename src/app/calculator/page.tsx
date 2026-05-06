'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { calculateFee, formatRupiah } from '@/lib/utils'
import { Calculator, TrendingUp, CreditCard, Smartphone, Info, Download, ChevronDown, Users, FileSpreadsheet } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'
import XLSXStyle from 'xlsx-js-style'

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
  const { data: session } = useSession()
  const defaultVolume = searchParams.get('volume') || ''
  const merchantName = searchParams.get('merchantName') || ''

  // Total volume
  const [totalVolume, setTotalVolume] = useState(defaultVolume)

  // Volume estimator helper
  const [showVolumeHelper, setShowVolumeHelper] = useState(false)
  const [avgSpend, setAvgSpend]           = useState('')
  const [customersPerDay, setCustomersPerDay] = useState('')
  const [operatingDays, setOperatingDays] = useState('26')

  useEffect(() => {
    if (!showVolumeHelper) return
    const spend = parseFloat(avgSpend) || 0
    const cust  = parseFloat(customersPerDay) || 0
    const days  = parseFloat(operatingDays) || 26
    if (spend > 0 && cust > 0) {
      setTotalVolume(String(Math.round(spend * cust * days)))
    }
  }, [avgSpend, customersPerDay, operatingDays, showVolumeHelper])

  // EDC split (% of total)
  const [edcPct, setEdcPct] = useState(60)     // % of total going to EDC
  const [qrisPct, setQrisPct] = useState(40)   // % going to QRIS (auto: 100-edcPct)

  // EDC sub-splits
  const [debitPct, setDebitPct]           = useState(70)
  const [debitOnUsPct, setDebitOnUsPct]   = useState(50)
  const [kreditOnUsPct, setKreditOnUsPct] = useState(40)

  // Adjustable rates (%)
  const [rateDebitOnUs,   setRateDebitOnUs]   = useState('0.15')
  const [rateDebitOffUs,  setRateDebitOffUs]  = useState('1.00')
  const [rateKreditOnUs,  setRateKreditOnUs]  = useState('1.80')
  const [rateKreditOffUs, setRateKreditOffUs] = useState('1.80')
  const [rateQris,        setRateQris]        = useState('0.70')

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

    const r1 = (parseFloat(rateDebitOnUs)   || 0) / 100
    const r2 = (parseFloat(rateDebitOffUs)  || 0) / 100
    const r3 = (parseFloat(rateKreditOnUs)  || 0) / 100
    const r4 = (parseFloat(rateKreditOffUs) || 0) / 100
    const r5 = (parseFloat(rateQris)        || 0) / 100

    const edcOnUsDebitFee   = edcOnUsDebit   * r1
    const edcOffUsDebitFee  = edcOffUsDebit  * r2
    const edcOnUsCreditFee  = edcOnUsCredit  * r3
    const edcOffUsCreditFee = edcOffUsCredit * r4
    const qrisFee           = qrisVol        * r5
    const totalFee          = edcOnUsDebitFee + edcOffUsDebitFee + edcOnUsCreditFee + edcOffUsCreditFee + qrisFee

    return {
      edcOnUsDebitFee, edcOffUsDebitFee, edcOnUsCreditFee, edcOffUsCreditFee,
      qrisFee, totalFee, annualProjection: totalFee * 12,
    }
  }, [vol, edcPct, debitPct, debitOnUsPct, kreditOnUsPct,
      rateDebitOnUs, rateDebitOffUs, rateKreditOnUs, rateKreditOffUs, rateQris])

  function handleExportExcel() {
    // ── Palette ─────────────────────────────────────────────────────────────
    const C = {
      NAVY:      '003B79',
      NAVY_DARK: '002550',
      BLUE:      '1A5BA8',
      BLUE_PALE: 'DBE8F6',
      GOLD:      'F5A623',
      GOLD_PALE: 'FEF3DD',
      WHITE:     'FFFFFF',
      OFF_WHITE: 'F7FAFD',
      ALT_ROW:   'EEF4FB',
      BORDER:    'C0D0E4',
      TEXT:      '1A2E3F',
      SUBTEXT:   '4A6A88',
      TOTAL_BG:  '002550',
      SECTION_BG:'0A3060',
    }

    const thin = (color = C.BORDER) => ({
      top:    { style: 'thin', color: { rgb: color } },
      bottom: { style: 'thin', color: { rgb: color } },
      left:   { style: 'thin', color: { rgb: color } },
      right:  { style: 'thin', color: { rgb: color } },
    })
    const medium = (color = C.NAVY) => ({
      top:    { style: 'medium', color: { rgb: color } },
      bottom: { style: 'medium', color: { rgb: color } },
      left:   { style: 'medium', color: { rgb: color } },
      right:  { style: 'medium', color: { rgb: color } },
    })

    // ── Style builders ───────────────────────────────────────────────────────
    const S = {
      title: {
        fill: { fgColor: { rgb: C.NAVY } },
        font: { bold: true, color: { rgb: C.WHITE }, sz: 15, name: 'Calibri' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thin(C.NAVY),
      },
      subtitle: {
        fill: { fgColor: { rgb: C.BLUE } },
        font: { bold: false, color: { rgb: C.WHITE }, sz: 10, name: 'Calibri', italic: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thin(C.BLUE),
      },
      infoLabel: {
        fill: { fgColor: { rgb: C.BLUE_PALE } },
        font: { bold: true, color: { rgb: C.NAVY }, sz: 9, name: 'Calibri' },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: thin(),
      },
      infoValue: {
        fill: { fgColor: { rgb: C.WHITE } },
        font: { color: { rgb: C.TEXT }, sz: 9, name: 'Calibri' },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: thin(),
      },
      sectionHeader: {
        fill: { fgColor: { rgb: C.SECTION_BG } },
        font: { bold: true, color: { rgb: C.WHITE }, sz: 10, name: 'Calibri' },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: { ...thin(C.SECTION_BG), left: { style: 'medium', color: { rgb: C.GOLD } } },
      },
      colHeader: {
        fill: { fgColor: { rgb: C.BLUE_PALE } },
        font: { bold: true, color: { rgb: C.NAVY }, sz: 9, name: 'Calibri' },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: thin(),
      },
      colHeaderRight: {
        fill: { fgColor: { rgb: C.BLUE_PALE } },
        font: { bold: true, color: { rgb: C.NAVY }, sz: 9, name: 'Calibri' },
        alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
        border: thin(),
      },
      data: (alt = false) => ({
        fill: { fgColor: { rgb: alt ? C.ALT_ROW : C.WHITE } },
        font: { color: { rgb: C.TEXT }, sz: 9, name: 'Calibri' },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: thin(),
      }),
      dataNum: (alt = false) => ({
        fill: { fgColor: { rgb: alt ? C.ALT_ROW : C.WHITE } },
        font: { color: { rgb: C.TEXT }, sz: 9, name: 'Calibri' },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: thin(),
        numFmt: '#,##0',
      }),
      dataPct: (alt = false) => ({
        fill: { fgColor: { rgb: alt ? C.ALT_ROW : C.WHITE } },
        font: { bold: true, color: { rgb: C.BLUE }, sz: 9, name: 'Calibri' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thin(),
      }),
      subHeader: (alt = false) => ({
        fill: { fgColor: { rgb: alt ? C.GOLD_PALE : C.OFF_WHITE } },
        font: { bold: true, color: { rgb: C.NAVY }, sz: 9, name: 'Calibri' },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: { ...thin(), left: { style: 'thin', color: { rgb: C.GOLD } } },
      }),
      total: {
        fill: { fgColor: { rgb: C.TOTAL_BG } },
        font: { bold: true, color: { rgb: C.WHITE }, sz: 10, name: 'Calibri' },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: medium(C.TOTAL_BG),
      },
      totalNum: {
        fill: { fgColor: { rgb: C.TOTAL_BG } },
        font: { bold: true, color: { rgb: C.GOLD }, sz: 11, name: 'Calibri' },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: medium(C.TOTAL_BG),
        numFmt: '#,##0',
      },
      totalBlank: {
        fill: { fgColor: { rgb: C.TOTAL_BG } },
        font: { color: { rgb: C.TOTAL_BG }, sz: 9 },
        border: medium(C.TOTAL_BG),
      },
      highlight: {
        fill: { fgColor: { rgb: C.GOLD_PALE } },
        font: { bold: true, color: { rgb: C.NAVY_DARK }, sz: 10, name: 'Calibri' },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: { ...thin(C.GOLD), left: { style: 'medium', color: { rgb: C.GOLD } } },
      },
      highlightNum: {
        fill: { fgColor: { rgb: C.GOLD_PALE } },
        font: { bold: true, color: { rgb: C.NAVY_DARK }, sz: 10, name: 'Calibri' },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: { ...thin(C.GOLD), right: { style: 'medium', color: { rgb: C.GOLD } } },
        numFmt: '#,##0',
      },
      footer: {
        fill: { fgColor: { rgb: C.NAVY } },
        font: { italic: true, color: { rgb: C.WHITE }, sz: 8, name: 'Calibri' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thin(C.NAVY),
      },
      empty: (bg = C.WHITE) => ({
        fill: { fgColor: { rgb: bg } },
        border: thin(bg),
      }),
    }

    // ── Data prep ────────────────────────────────────────────────────────────
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    const edcVol    = vol * (edcPct / 100)
    const qrisVol   = vol * ((100 - edcPct) / 100)
    const debitVol  = edcVol * (debitPct / 100)
    const kreditVol = edcVol * ((100 - debitPct) / 100)

    const NCOLS = 5 // A-E
    type RawRow = (string | number | null)[]

    // We'll collect rows + per-cell styles
    const rows: RawRow[] = []
    const styles: Record<string, any> = {}
    const merges: any[] = []
    const rowH: { hpt: number }[] = []

    function R() { return rows.length }

    function addRow(cells: RawRow, cellStyles: any[], hpt = 16) {
      rows.push(cells)
      rowH.push({ hpt })
      const r = rows.length - 1
      cells.forEach((_, c) => {
        if (cellStyles[c]) {
          styles[XLSXStyle.utils.encode_cell({ r, c })] = cellStyles[c]
        }
      })
    }

    function mergeRow(row: number, c1 = 0, c2 = NCOLS - 1) {
      merges.push({ s: { r: row, c: c1 }, e: { r: row, c: c2 } })
    }

    function blankRow(bg = C.WHITE, hpt = 6) {
      const cells: RawRow = Array(NCOLS).fill(null)
      const st = cells.map(() => S.empty(bg))
      addRow(cells, st, hpt)
    }

    function sectionRow(label: string) {
      const cells: RawRow = [label, null, null, null, null]
      const st = cells.map(() => S.sectionHeader)
      addRow(cells, st, 18)
      mergeRow(R() - 1)
    }

    // ── Build rows ───────────────────────────────────────────────────────────

    // Row 0: Title
    addRow(['SIMULASI FEE-BASED INCOME  —  BANK MANDIRI', null, null, null, null],
           Array(NCOLS).fill(S.title), 30)
    mergeRow(0)

    // Row 1: Subtitle
    addRow(['PT Bank Mandiri (Persero) Tbk  |  Laporan Internal ATF', null, null, null, null],
           Array(NCOLS).fill(S.subtitle), 16)
    mergeRow(1)

    // Row 2: blank
    blankRow(C.NAVY, 4)

    // Row 3: Info row
    addRow(
      ['Disiapkan oleh', session?.user?.name ?? '-', null, 'Tanggal', today],
      [S.infoLabel, S.infoValue, S.empty(), S.infoLabel, S.infoValue],
      16
    )

    if (merchantName) {
      addRow(['Merchant / Nasabah', merchantName, null, null, null],
             [S.infoLabel, S.infoValue, S.empty(), S.empty(), S.empty()], 16)
      merges.push({ s: { r: R() - 1, c: 1 }, e: { r: R() - 1, c: 4 } })
    }

    blankRow(C.WHITE, 8)

    // ── Section A ────────────────────────────────────────────────────────────
    sectionRow('A.   ASUMSI VOLUME TRANSAKSI')

    addRow(['Keterangan', 'Nilai', 'Satuan', null, null],
           [S.colHeader, S.colHeaderRight, S.colHeader, S.empty(C.BLUE_PALE), S.empty(C.BLUE_PALE)], 15)

    const useHelper = showVolumeHelper && parseFloat(avgSpend) > 0 && parseFloat(customersPerDay) > 0
    const dataRows_A: [string, number, string][] = useHelper
      ? [
          ['Rata-rata Spent per Pelanggan', parseFloat(avgSpend), 'Rp / orang'],
          ['Jumlah Pelanggan per Hari', parseFloat(customersPerDay), 'orang / hari'],
          ['Hari Operasional per Bulan', parseFloat(operatingDays) || 26, 'hari'],
          ['Total Volume Transaksi / Bulan', vol, 'Rp / bulan'],
        ]
      : [['Total Volume Transaksi / Bulan', vol, 'Rp / bulan']]

    dataRows_A.forEach(([label, value, unit], i) => {
      const alt = i % 2 === 1
      addRow([label, value, unit, null, null],
             [S.data(alt), S.dataNum(alt), S.data(alt), S.empty(alt ? C.ALT_ROW : C.WHITE), S.empty(alt ? C.ALT_ROW : C.WHITE)], 15)
    })

    blankRow(C.WHITE, 6)

    // ── Section B ────────────────────────────────────────────────────────────
    sectionRow('B.   SPLIT CHANNEL PEMBAYARAN')

    addRow(['Channel', 'Porsi (%)', 'Volume (Rp)', null, null],
           [S.colHeader, S.colHeader, S.colHeaderRight, S.empty(C.BLUE_PALE), S.empty(C.BLUE_PALE)], 15)

    ;[['Kartu (EDC)', edcPct, edcVol], ['QRIS', 100 - edcPct, qrisVol]].forEach(([label, pct, vl], i) => {
      const alt = i % 2 === 1
      addRow([label as string, `${pct}%`, vl as number, null, null],
             [S.data(alt), S.dataPct(alt), S.dataNum(alt), S.empty(alt ? C.ALT_ROW : C.WHITE), S.empty(alt ? C.ALT_ROW : C.WHITE)], 15)
    })

    blankRow(C.WHITE, 6)

    // ── Section C ────────────────────────────────────────────────────────────
    sectionRow('C.   DETAIL BREAKDOWN JENIS KARTU')

    addRow(['Kategori', 'Porsi (%)', 'Volume (Rp)', null, null],
           [S.colHeader, S.colHeader, S.colHeaderRight, S.empty(C.BLUE_PALE), S.empty(C.BLUE_PALE)], 15)

    addRow(['Kartu Debit', `${debitPct}%`, debitVol, null, null],
           [S.subHeader(false), S.dataPct(false), S.dataNum(false), S.empty(), S.empty()], 15)

    addRow(['    On-Us Debit  (Kartu Mandiri)', `${debitOnUsPct}%`, debitVol * (debitOnUsPct / 100), null, null],
           [S.data(true), S.dataPct(true), S.dataNum(true), S.empty(C.ALT_ROW), S.empty(C.ALT_ROW)], 14)

    addRow(['    Off-Us Debit  (Bank Lain)', `${100 - debitOnUsPct}%`, debitVol * ((100 - debitOnUsPct) / 100), null, null],
           [S.data(false), S.dataPct(false), S.dataNum(false), S.empty(), S.empty()], 14)

    addRow(['Kartu Kredit', `${100 - debitPct}%`, kreditVol, null, null],
           [S.subHeader(true), S.dataPct(true), S.dataNum(true), S.empty(C.ALT_ROW), S.empty(C.ALT_ROW)], 15)

    addRow(['    On-Us Kredit  (Kartu Mandiri)', `${kreditOnUsPct}%`, kreditVol * (kreditOnUsPct / 100), null, null],
           [S.data(false), S.dataPct(false), S.dataNum(false), S.empty(), S.empty()], 14)

    addRow(['    Off-Us Kredit  (Bank Lain)', `${100 - kreditOnUsPct}%`, kreditVol * ((100 - kreditOnUsPct) / 100), null, null],
           [S.data(true), S.dataPct(true), S.dataNum(true), S.empty(C.ALT_ROW), S.empty(C.ALT_ROW)], 14)

    blankRow(C.WHITE, 6)

    // ── Section D ────────────────────────────────────────────────────────────
    sectionRow('D.   RINCIAN FEE PER KATEGORI')

    addRow(['Kategori', 'Tarif MDR', 'Volume Transaksi (Rp)', 'Fee Mandiri (Rp)', null],
           [S.colHeader, S.colHeader, S.colHeaderRight, S.colHeaderRight, S.empty(C.BLUE_PALE)], 15)

    const feeRows: [string, string, number, number][] = [
      ['EDC Debit On-Us',   `${rateDebitOnUs}%`,   debitVol * (debitOnUsPct / 100),              result.edcOnUsDebitFee],
      ['EDC Debit Off-Us',  `${rateDebitOffUs}%`,  debitVol * ((100 - debitOnUsPct) / 100),      result.edcOffUsDebitFee],
      ['EDC Kredit On-Us',  `${rateKreditOnUs}%`,  kreditVol * (kreditOnUsPct / 100),            result.edcOnUsCreditFee],
      ['EDC Kredit Off-Us', `${rateKreditOffUs}%`, kreditVol * ((100 - kreditOnUsPct) / 100),    result.edcOffUsCreditFee],
      ['QRIS',              `${rateQris}%`,         qrisVol,                                      result.qrisFee],
    ]

    feeRows.forEach(([label, rate, volume, fee], i) => {
      const alt = i % 2 === 1
      addRow([label, rate, volume, fee, null],
             [S.data(alt), S.dataPct(alt), S.dataNum(alt), S.dataNum(alt), S.empty(alt ? C.ALT_ROW : C.WHITE)], 15)
    })

    // Total row
    addRow(['TOTAL FEE / BULAN', null, null, result.totalFee, null],
           [S.total, S.totalBlank, S.totalBlank, S.totalNum, S.totalBlank], 20)
    merges.push({ s: { r: R() - 1, c: 0 }, e: { r: R() - 1, c: 2 } })

    blankRow(C.WHITE, 6)

    // ── Section E ────────────────────────────────────────────────────────────
    sectionRow('E.   PROYEKSI PENDAPATAN FEE')

    addRow(['Periode', 'Proyeksi Fee Kumulatif (Rp)', null, null, null],
           [S.colHeader, S.colHeaderRight, S.empty(C.BLUE_PALE), S.empty(C.BLUE_PALE), S.empty(C.BLUE_PALE)], 15)
    merges.push({ s: { r: R() - 1, c: 1 }, e: { r: R() - 1, c: 4 } })

    const projRows: [string, number, boolean][] = [
      ['1 Bulan',  result.totalFee,             false],
      ['3 Bulan',  result.totalFee * 3,         true],
      ['6 Bulan',  result.totalFee * 6,         false],
      ['1 Tahun',  result.annualProjection,      true],
    ]

    projRows.forEach(([label, value, isHighlight]) => {
      if (isHighlight) {
        addRow([label, value, null, null, null],
               [S.highlight, S.highlightNum, S.empty(C.GOLD_PALE), S.empty(C.GOLD_PALE), S.empty(C.GOLD_PALE)], 17)
        merges.push({ s: { r: R() - 1, c: 1 }, e: { r: R() - 1, c: 4 } })
      } else {
        addRow([label, value, null, null, null],
               [S.data(false), S.dataNum(false), S.empty(), S.empty(), S.empty()], 15)
        merges.push({ s: { r: R() - 1, c: 1 }, e: { r: R() - 1, c: 4 } })
      }
    })

    blankRow(C.WHITE, 6)

    // ── Section F ────────────────────────────────────────────────────────────
    sectionRow('F.   CATATAN UNTUK ATF')

    const fmt = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

    const note1 = `Merchant ini berpotensi menghasilkan fee sebesar ${fmt(result.totalFee)}/bulan atau ${fmt(result.annualProjection)}/tahun untuk Bank Mandiri.`
    const note2 = result.annualProjection > 50_000_000
      ? 'Rekomendasikan ke Branch Manager untuk program Merchant Premium / Sponsorship.'
      : 'Dapat dipertimbangkan untuk program co-branding atau diskon biaya transaksi.'

    const noteStyle = {
      fill: { fgColor: { rgb: C.GOLD_PALE } },
      font: { color: { rgb: C.TEXT }, sz: 9, name: 'Calibri' },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true, indent: 1 },
      border: thin(C.GOLD),
    }

    addRow([note1, null, null, null, null], Array(NCOLS).fill(noteStyle), 28)
    mergeRow(R() - 1)

    addRow([note2, null, null, null, null], Array(NCOLS).fill({
      ...noteStyle,
      font: { ...noteStyle.font, italic: true, color: { rgb: C.BLUE } },
    }), 22)
    mergeRow(R() - 1)

    blankRow(C.WHITE, 8)

    // Footer
    addRow(['— Dokumen ini digenerate otomatis dari Portal Akuisisi Merchant Bank Mandiri —', null, null, null, null],
           Array(NCOLS).fill(S.footer), 14)
    mergeRow(R() - 1)

    // ── Assemble worksheet ───────────────────────────────────────────────────
    const ws = XLSXStyle.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 38 }, { wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 4 }]
    ws['!rows'] = rowH
    ws['!merges'] = merges

    // Apply styles
    Object.entries(styles).forEach(([addr, style]) => {
      if (!ws[addr]) ws[addr] = { v: null, t: 'z' }
      ws[addr].s = style
      if (style.numFmt) ws[addr].z = style.numFmt
    })

    const wb = XLSXStyle.utils.book_new()
    XLSXStyle.utils.book_append_sheet(wb, ws, 'Simulasi Fee-Based Income')
    const buf = XLSXStyle.write(wb, { type: 'array', bookType: 'xlsx' })
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulasi-fee-mandiri-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

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
      <Navbar title="Kalkulator Fee" subtitle="Simulasi pendapatan fee-based income" showBack backHref="/select-branch" />

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
            onChange={v => { setTotalVolume(v); setShowVolumeHelper(false) }}
            hint="Tanyakan langsung ke owner, atau gunakan estimator di bawah"
          />

          {/* Volume estimator helper */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowVolumeHelper(!showVolumeHelper)}
              className="flex items-center gap-1.5 text-xs font-semibold text-mandiri-600 hover:text-mandiri-800 transition-colors"
            >
              <ChevronDown size={14} className={cn('transition-transform duration-200', showVolumeHelper && 'rotate-180')} />
              Bantu hitung dari data pelanggan
            </button>

            {showVolumeHelper && (
              <div className="mt-3 bg-blue-50 rounded-xl p-4 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Isi asumsi di bawah → volume otomatis terhitung
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      <Users size={11} className="inline mr-1" />
                      Rata-rata Spent / Orang
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={avgSpend}
                        onChange={e => setAvgSpend(e.target.value.replace(/\D/g, ''))}
                        placeholder="50000"
                        className="input pl-9 py-2 text-sm"
                      />
                    </div>
                    {avgSpend && (
                      <p className="text-xs text-mandiri-600 font-semibold mt-1">{formatRupiah(parseFloat(avgSpend))}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Pelanggan / Hari
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customersPerDay}
                      onChange={e => setCustomersPerDay(e.target.value.replace(/\D/g, ''))}
                      placeholder="50"
                      className="input py-2 text-sm"
                    />
                    {customersPerDay && (
                      <p className="text-xs text-slate-400 mt-1">{customersPerDay} orang/hari</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Hari Operasional / Bulan</label>
                  <div className="flex gap-2 flex-wrap">
                    {['25', '26', '28', '30'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setOperatingDays(d)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                          operatingDays === d
                            ? 'bg-mandiri-700 text-white border-mandiri-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-mandiri-300'
                        )}
                      >
                        {d} hari
                      </button>
                    ))}
                  </div>
                </div>

                {parseFloat(avgSpend) > 0 && parseFloat(customersPerDay) > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <div className="grid grid-cols-3 gap-1 text-center text-xs mb-3">
                      <div>
                        <p className="text-slate-400 mb-1">Spent/orang</p>
                        <p className="font-bold text-slate-700">{formatRupiah(parseFloat(avgSpend))}</p>
                      </div>
                      <div className="flex items-center justify-center text-slate-300 font-bold">×</div>
                      <div>
                        <p className="text-slate-400 mb-1">Pelanggan/bln</p>
                        <p className="font-bold text-slate-700">{parseFloat(customersPerDay) * parseFloat(operatingDays)} org</p>
                      </div>
                    </div>
                    <div className="text-center border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-400 mb-1">= Volume Transaksi / Bulan</p>
                      <p className="text-xl font-extrabold text-mandiri-700">
                        {formatRupiah(parseFloat(avgSpend) * parseFloat(customersPerDay) * parseFloat(operatingDays))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Split EDC vs QRIS */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-mandiri-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <h3 className="font-bold text-slate-800">Split Kartu vs QRIS</h3>
          </div>

          <SliderInput
            label={`Porsi Kartu: ${edcPct}% | QRIS: ${100 - edcPct}%`}
            value={edcPct}
            onChange={v => setEdcPct(v)}
          />

          <div className="flex gap-2 mt-3">
            <div className="flex-1 p-3 bg-mandiri-50 rounded-xl text-center">
              <CreditCard size={14} className="text-mandiri-700 mx-auto mb-1" />
              <p className="text-xs font-semibold text-mandiri-700">Kartu</p>
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
              <h3 className="font-bold text-slate-800">Detail Breakdown Jenis Kartu</h3>
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
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-800">Rincian Fee per Kategori</h3>
                <span className="text-xs text-mandiri-600 bg-mandiri-50 px-2 py-1 rounded-lg font-medium">✏️ Tarif bisa diedit</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Sesuaikan tarif untuk simulasi negosiasi dengan nasabah</p>

              <div className="space-y-3">
                {[
                  { label: 'EDC Debit On-Us',   color: 'bg-mandiri-700', fee: result.edcOnUsDebitFee,   rate: rateDebitOnUs,   setRate: setRateDebitOnUs,   min: 0.1,  max: 0.3  },
                  { label: 'EDC Debit Off-Us',   color: 'bg-mandiri-yellow', fee: result.edcOffUsDebitFee,  rate: rateDebitOffUs,  setRate: setRateDebitOffUs,  min: 0.5,  max: 2.0  },
                  { label: 'EDC Kredit On-Us',   color: 'bg-mandiri-500', fee: result.edcOnUsCreditFee,  rate: rateKreditOnUs,  setRate: setRateKreditOnUs,  min: 1.0,  max: 3.0  },
                  { label: 'EDC Kredit Off-Us',  color: 'bg-amber-400',   fee: result.edcOffUsCreditFee, rate: rateKreditOffUs, setRate: setRateKreditOffUs, min: 1.0,  max: 3.0  },
                  { label: 'QRIS',               color: 'bg-green-500',   fee: result.qrisFee,           rate: rateQris,        setRate: setRateQris,        min: 0.3,  max: 1.0  },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', item.color)} />
                    <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        step="0.01"
                        min={item.min}
                        max={item.max}
                        value={item.rate}
                        onChange={e => item.setRate(e.target.value)}
                        className="w-16 text-center text-xs font-bold border border-mandiri-200 rounded-lg py-1 px-1 text-mandiri-700 bg-white focus:outline-none focus:ring-1 focus:ring-mandiri-400"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                    <span className={cn('text-sm font-bold shrink-0 w-20 text-right', item.fee > 0 ? 'text-slate-800' : 'text-slate-300')}>
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

            {/* Export button */}
            <button
              onClick={handleExportExcel}
              className="w-full flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-700 active:scale-98 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-sm shadow-green-900/20"
            >
              <FileSpreadsheet size={18} />
              Download Excel untuk ATF
            </button>

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
