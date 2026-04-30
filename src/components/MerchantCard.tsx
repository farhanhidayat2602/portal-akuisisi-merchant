'use client'

import { Merchant } from '@/types'
import { formatNumber, formatRupiah, getStatusColor, getStatusDot, getStatusLabel } from '@/lib/utils'
import { Star, MapPin, Users, TrendingUp, ChevronRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MerchantCardProps {
  merchant: Merchant
  onClick?: () => void
  distance?: number
  compact?: boolean
}

export function MerchantCard({ merchant, onClick, distance, compact }: MerchantCardProps) {
  const priorityScore = getPriority(merchant)

  return (
    <div
      onClick={onClick}
      className={cn(
        'card-hover flex gap-3 p-3.5',
        compact && 'p-3'
      )}
    >
      {/* Photo */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
        {merchant.photoUrl ? (
          <img src={merchant.photoUrl} alt={merchant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl">🍽️</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm leading-tight truncate">{merchant.name}</p>
            {merchant.address && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                <MapPin size={10} className="shrink-0" />
                {merchant.address}
              </p>
            )}
          </div>
          <ChevronRight size={14} className="text-slate-400 shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center flex-wrap gap-2 mt-2">
          {/* Status badge */}
          <span className={cn('badge', getStatusColor(merchant.status as any))}>
            <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(merchant.status as any))} />
            {getStatusLabel(merchant.status as any)}
          </span>

          {/* Viral TikTok */}
          {merchant.isViralTikTok && (
            <span className="badge bg-pink-50 text-pink-600">
              <Zap size={9} />
              Viral TikTok
            </span>
          )}

          {/* Rating */}
          {merchant.googleRating && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600 font-semibold">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              {merchant.googleRating}
              <span className="text-slate-400 font-normal">({formatNumber(merchant.totalReviews ?? 0)})</span>
            </span>
          )}

          {/* Distance */}
          {distance != null && (
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <MapPin size={9} />
              {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
            </span>
          )}
        </div>

        {!compact && merchant.estimatedVolume && (
          <p className="text-xs text-mandiri-600 font-semibold mt-1.5 flex items-center gap-1">
            <TrendingUp size={10} />
            Est. Volume: {formatRupiah(merchant.estimatedVolume)}/bulan
          </p>
        )}
      </div>
    </div>
  )
}

function getPriority(m: Merchant) {
  const r = Math.min((m.totalReviews ?? 0) / 1000, 5) * 20
  const g = (m.googleRating ?? 4) * 10
  const v = m.isViralTikTok ? 15 : 0
  return Math.round(r + g + v)
}
