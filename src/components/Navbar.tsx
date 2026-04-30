'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Building2, Map, Trophy, Calculator, LogOut, ArrowLeft, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface NavbarProps {
  title?: string
  showBack?: boolean
  backHref?: string
  branchName?: string
  subtitle?: string
}

export function Navbar({ title, showBack, backHref, branchName, subtitle }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <header className="bg-mandiri-700 text-white sticky top-0 z-40 shadow-mandiri">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-14 flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => backHref ? router.push(backHref) : router.back()}
              className="p-1.5 rounded-lg hover:bg-mandiri-600 transition-colors shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-8 h-8 bg-mandiri-yellow rounded-lg flex items-center justify-center shrink-0">
              <Building2 size={14} className="text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{title ?? 'Portal Akuisisi'}</p>
            {(branchName || subtitle) && (
              <p className="text-xs text-mandiri-200 truncate">{branchName ?? subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-mandiri-200 hidden sm:block">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 rounded-lg hover:bg-mandiri-600 transition-colors"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom nav links */}
      <div className="border-t border-mandiri-600">
        <div className="max-w-6xl mx-auto px-4 flex">
          {[
            { href: '/select-branch', icon: Building2, label: 'Cabang' },
            { href: '#map',           icon: Map,       label: 'Peta' },
            { href: '/leaderboard',   icon: Trophy,    label: 'Ranking' },
            { href: '/calculator',    icon: Calculator, label: 'Kalkulator' },
          ].map(item => {
            const active = pathname.startsWith(item.href) && item.href !== '#map'
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2',
                  active
                    ? 'text-mandiri-yellow border-mandiri-yellow'
                    : 'text-mandiri-200 border-transparent hover:text-white'
                )}
              >
                <item.icon size={13} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
