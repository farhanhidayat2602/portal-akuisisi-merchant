'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Trophy, Star, TrendingUp, MapPin, Crown, Medal, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  username: string
  branch?: string
  city?: string
  points: number
  totalVisits: number
  interested: number
}

const RANK_STYLES = [
  { bg: 'bg-amber-50 border-amber-300',  icon: Crown,  iconColor: 'text-amber-500', label: '🥇' },
  { bg: 'bg-slate-50 border-slate-300',  icon: Medal,  iconColor: 'text-slate-500', label: '🥈' },
  { bg: 'bg-orange-50 border-orange-300', icon: Award, iconColor: 'text-orange-500', label: '🥉' },
]

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/')
  }, [status, router])

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  const myEntry = data.find(e => e.id === session?.user?.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar title="Leaderboard" subtitle="Ranking Sales Terbaik" showBack backHref="/select-branch" />
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-mandiri-200 border-t-mandiri-700 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const top3 = data.slice(0, 3)
  const rest = data.slice(3)

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <Navbar title="Leaderboard" subtitle="Ranking Sales Terbaik Bulan Ini" showBack backHref="/select-branch" />

      {/* Header */}
      <div className="bg-mandiri-700 px-4 py-6 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <Trophy size={28} className="text-mandiri-yellow mx-auto mb-2" />
          <h2 className="text-xl font-bold">Hall of Champions</h2>
          <p className="text-mandiri-200 text-sm mt-1">Sales dengan performa akuisisi terbaik</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* My position card */}
        {myEntry && (
          <div className="card p-4 border-2 border-mandiri-500">
            <p className="text-xs font-bold text-mandiri-600 mb-2">📊 Posisi Anda</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-mandiri-700 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                #{myEntry.rank}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{myEntry.name}</p>
                <p className="text-xs text-slate-500">{myEntry.branch}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-mandiri-700">{myEntry.points.toLocaleString()}</p>
                <p className="text-xs text-slate-500">poin</p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 podium */}
        {top3.length >= 2 && (
          <div className="flex items-end gap-3 justify-center pt-4 pb-2">
            {/* 2nd */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 bg-slate-100 border-2 border-slate-300 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
                {top3[1] ? top3[1].name.charAt(0) : '?'}
              </div>
              <p className="text-xs font-bold text-slate-700 truncate">{top3[1]?.name?.split(' ')[0]}</p>
              <p className="text-lg font-extrabold text-slate-600">{(top3[1]?.points ?? 0).toLocaleString()}</p>
              <div className="bg-slate-200 rounded-t-xl mt-2 pt-2 pb-4">
                <span className="text-xl">🥈</span>
              </div>
            </div>
            {/* 1st */}
            <div className="flex-1 text-center -mb-2">
              <div className="w-16 h-16 bg-amber-100 border-2 border-amber-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
                {top3[0]?.name.charAt(0)}
              </div>
              <p className="text-xs font-bold text-slate-800 truncate">{top3[0]?.name?.split(' ')[0]}</p>
              <p className="text-xl font-extrabold text-amber-600">{top3[0]?.points?.toLocaleString()}</p>
              <div className="bg-amber-400 rounded-t-xl mt-2 pt-2 pb-6">
                <span className="text-2xl">🥇</span>
              </div>
            </div>
            {/* 3rd */}
            {top3[2] && (
              <div className="flex-1 text-center">
                <div className="w-14 h-14 bg-orange-50 border-2 border-orange-300 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
                  {top3[2].name.charAt(0)}
                </div>
                <p className="text-xs font-bold text-slate-700 truncate">{top3[2].name?.split(' ')[0]}</p>
                <p className="text-lg font-extrabold text-orange-600">{top3[2].points.toLocaleString()}</p>
                <div className="bg-orange-200 rounded-t-xl mt-2 pt-2 pb-3">
                  <span className="text-xl">🥉</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full ranking */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <p className="font-bold text-slate-700 text-sm">Ranking Lengkap</p>
          </div>
          <div className="divide-y divide-slate-50">
            {data.map(entry => {
              const isMe = entry.id === session?.user?.id
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 transition-colors',
                    isMe && 'bg-mandiri-50'
                  )}
                >
                  {/* Rank */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    entry.rank === 1 ? 'bg-amber-400 text-white' :
                    entry.rank === 2 ? 'bg-slate-400 text-white' :
                    entry.rank === 3 ? 'bg-orange-400 text-white' :
                    'bg-slate-100 text-slate-600'
                  )}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn('font-semibold text-sm truncate', isMe ? 'text-mandiri-700' : 'text-slate-800')}>
                        {entry.name}
                      </p>
                      {isMe && <span className="badge bg-mandiri-100 text-mandiri-700 text-xs">Saya</span>}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={9} />
                      {entry.branch ?? 'No branch'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <p className="text-xs text-slate-400">Kunjungan</p>
                      <p className="font-bold text-slate-700 text-sm">{entry.totalVisits}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Tertarik</p>
                      <p className="font-bold text-green-600 text-sm">{entry.interested}</p>
                    </div>
                    <div>
                      <p className="text-xs text-mandiri-500">Poin</p>
                      <p className={cn('font-extrabold text-base', isMe ? 'text-mandiri-700' : 'text-slate-700')}>
                        {entry.points.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Points guide */}
        <div className="card p-4">
          <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
            <Star size={14} className="text-mandiri-yellow" />
            Sistem Poin
          </h3>
          <div className="space-y-2">
            {[
              { action: 'Merchant Tertarik',       points: '+50 poin', color: 'text-purple-600' },
              { action: 'Follow Up dijadwalkan',    points: '+10 poin', color: 'text-blue-600' },
              { action: 'Kunjungan berhasil (tolak)', points: '+5 poin',  color: 'text-slate-600' },
            ].map(item => (
              <div key={item.action} className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{item.action}</span>
                <span className={cn('font-bold', item.color)}>{item.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
