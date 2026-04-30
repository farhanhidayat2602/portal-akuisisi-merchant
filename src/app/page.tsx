'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, User, Building2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') router.replace('/select-branch')
  }, [status, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })
      if (res?.error) {
        setError('Username atau password salah. Coba lagi.')
      } else {
        router.replace('/select-branch')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mandiri-700">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-mandiri-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-mandiri-600 rounded-full opacity-30" />
        <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] bg-mandiri-800 rounded-full opacity-40" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-mandiri-yellow/10 rounded-full" />

        <div className="relative z-10 text-white text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-mandiri-yellow rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 size={28} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-mandiri-yellow font-bold text-sm tracking-widest uppercase">Bank</p>
              <p className="text-white font-extrabold text-2xl leading-none">Mandiri</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-3 leading-tight">
            Portal Akuisisi<br />Merchant
          </h1>
          <p className="text-mandiri-200 text-base max-w-xs mx-auto leading-relaxed">
            Platform cerdas untuk tim sales dalam mengakuisisi merchant EDC & QRIS di area Kalimantan
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: 'Merchant', value: '96+' },
              { label: 'Cabang', value: '27' },
              { label: 'Kota', value: '12+' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-mandiri-yellow">{item.value}</p>
                <p className="text-xs text-mandiri-200 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 min-h-screen lg:min-h-0">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-mandiri-700 rounded-2xl flex items-center justify-center">
            <Building2 size={22} className="text-mandiri-yellow" />
          </div>
          <div>
            <p className="text-xs font-bold text-mandiri-700 tracking-widest uppercase">Bank Mandiri</p>
            <p className="font-bold text-slate-800 text-lg leading-none">Portal Akuisisi</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="card p-8 animate-slide-up">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Selamat Datang</h2>
              <p className="text-sm text-slate-500 mt-1">Masuk dengan akun sales Anda</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className={cn('input pl-10', error && 'border-red-300 focus:ring-red-400')}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className={cn('input pl-10 pr-10', error && 'border-red-300 focus:ring-red-400')}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Masuk...
                  </span>
                ) : 'Masuk'}
              </button>
            </form>

            <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-600">Demo Login:</p>
              <p>Sales: <span className="font-mono bg-slate-200 px-1 rounded">demo</span> / <span className="font-mono bg-slate-200 px-1 rounded">mandiri123</span></p>
              <p>Admin: <span className="font-mono bg-slate-200 px-1 rounded">admin</span> / <span className="font-mono bg-slate-200 px-1 rounded">admin2024</span></p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2024 PT Bank Mandiri (Persero) Tbk
          </p>
        </div>
      </div>
    </div>
  )
}
