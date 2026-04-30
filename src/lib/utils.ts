import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MerchantStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(0)}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

export function getStatusColor(status: MerchantStatus): string {
  const map: Record<MerchantStatus, string> = {
    AVAILABLE:    'bg-green-100 text-green-700',
    LOCKED:       'bg-yellow-100 text-yellow-700',
    INTERESTED:   'bg-purple-100 text-purple-700',
    FOLLOW_UP:    'bg-blue-100 text-blue-700',
    REJECTED:     'bg-red-100 text-red-700',
    DO_NOT_VISIT: 'bg-gray-100 text-gray-600',
    ACQUIRED:     'bg-mandiri-green/10 text-mandiri-green',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function getStatusLabel(status: MerchantStatus): string {
  const map: Record<MerchantStatus, string> = {
    AVAILABLE:    'Tersedia',
    LOCKED:       'Sedang Dikunjungi',
    INTERESTED:   'Tertarik',
    FOLLOW_UP:    'Follow Up',
    REJECTED:     'Ditolak',
    DO_NOT_VISIT: 'Jangan Kunjungi',
    ACQUIRED:     'Sudah Akuisisi',
  }
  return map[status] ?? status
}

export function getStatusDot(status: MerchantStatus): string {
  const map: Record<MerchantStatus, string> = {
    AVAILABLE:    'bg-green-500',
    LOCKED:       'bg-yellow-500 animate-pulse',
    INTERESTED:   'bg-purple-500',
    FOLLOW_UP:    'bg-blue-500',
    REJECTED:     'bg-red-500',
    DO_NOT_VISIT: 'bg-gray-400',
    ACQUIRED:     'bg-mandiri-green',
  }
  return map[status] ?? 'bg-gray-400'
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${(km * 1000).toFixed(0)}m`
  return `${km.toFixed(1)}km`
}

export function calculateFee(
  edcOnUsDebit: number,
  edcOnUsCredit: number,
  edcOffUsDebit: number,
  edcOffUsCredit: number,
  qrisTotal: number
) {
  const edcOnUsDebitFee   = edcOnUsDebit   * 0.0015
  const edcOnUsCreditFee  = edcOnUsCredit  * 0.018
  const edcOffUsDebitFee  = edcOffUsDebit  * 0.01
  const edcOffUsCreditFee = edcOffUsCredit * 0.018
  const qrisFee           = qrisTotal      * 0.007

  const totalEDCFee  = edcOnUsDebitFee + edcOnUsCreditFee + edcOffUsDebitFee + edcOffUsCreditFee
  const totalFee     = totalEDCFee + qrisFee

  return {
    edcOnUsDebitFee,
    edcOnUsCreditFee,
    edcOffUsDebitFee,
    edcOffUsCreditFee,
    qrisFee,
    totalEDCFee,
    totalQRISFee: qrisFee,
    totalFee,
    monthlyProjection: totalFee,
    annualProjection:  totalFee * 12,
  }
}

export function getRatingStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5 ? 1 : 0
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half)
}

export function getPriorityScore(reviews: number, rating: number, isViral: boolean): number {
  const reviewScore  = Math.min(reviews / 1000, 5) * 20
  const ratingScore  = rating * 10
  const viralBonus   = isViral ? 15 : 0
  return Math.round(reviewScore + ratingScore + viralBonus)
}
