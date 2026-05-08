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
      <div className="min-h-screen flex items-center justify-center bg-[#003B79]">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#003B79] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#002A57] rounded-full opacity-30 pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] bg-[#001935] rounded-full opacity-40 pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-[#F5A623]/10 rounded-full pointer-events-none" />

        <div className="relative z-10 text-white text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3.5 mb-8">
            <div className="w-14 h-14 bg-[#002A57] rounded-[16px] flex items-center justify-center shadow-lg border border-white/5">
              <Building2 size={28} className="text-[#F5A623]" />
            </div>
            <div className="text-left">
              <p className="text-[#F5A623] font-bold text-[13px] tracking-widest uppercase mb-0.5">Bank Mandiri</p>
              <p className="text-white font-extrabold text-[28px] leading-none tracking-tight">Portal Akuisisi</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 leading-tight">
            Sistem Informasi<br />Acquisition Merchant
          </h1>
          <p className="text-blue-100 text-[15px] max-w-sm mx-auto leading-relaxed font-medium">
            Platform cerdas untuk tim sales dalam mengakuisisi merchant EDC & QRIS di area Kalimantan
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: 'Merchant', value: '96+' },
              { label: 'Cabang', value: '27' },
              { label: 'Kota', value: '12+' },
            ].map(item => (
              <div key={item.label} className="bg-[#002A57]/50 rounded-[20px] p-4 backdrop-blur-md border border-white/10 shadow-sm">
                <p className="text-[26px] font-black text-[#F5A623]">{item.value}</p>
                <p className="text-[13px] font-medium text-blue-100 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F5F7FA] min-h-screen lg:min-h-0">
        
        <div className="w-full max-w-md">
          {/* Mobile logo - aligns with the user's screenshot */}
          <div className="lg:hidden flex items-center justify-center gap-3.5 mb-10">
            <div className="w-14 h-14 bg-[#003B79] rounded-[16px] flex items-center justify-center shadow-md">
              <Building2 size={24} className="text-[#F5A623]" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-[#0064B4] tracking-widest uppercase mb-0.5">Bank Mandiri</p>
              <p className="font-extrabold text-[#002A57] text-[22px] leading-none tracking-tight">Portal Akuisisi</p>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] animate-slide-up border border-slate-100">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-[26px] font-extrabold text-[#002A57] leading-tight mb-2">Selamat Datang</h2>
              <p className="text-[14px] font-medium text-slate-500">Masuk dengan akun sales Anda</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-[#002A57] mb-2">Username</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className={cn(
                      'w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-[14px] text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0064B4] focus:border-transparent transition-all placeholder:text-slate-400 placeholder:font-normal',
                      error && 'border-red-300 focus:ring-red-400'
                    )}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#002A57] mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className={cn(
                      'w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-[14px] text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#0064B4] focus:border-transparent transition-all placeholder:text-slate-400 placeholder:font-normal',
                      error && 'border-red-300 focus:ring-red-400'
                    )}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0064B4] transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-[13px] font-medium text-red-600 bg-red-50 rounded-[12px] p-3 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#003B79] hover:bg-[#002A57] active:scale-[0.98] text-white font-bold py-3.5 rounded-[14px] text-[15px] transition-all shadow-md mt-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : 'Masuk'}
              </button>
            </form>

            <div className="mt-8 p-4 bg-slate-50 rounded-[16px] border border-slate-100 text-[12px] text-slate-600 space-y-2.5">
              <p className="font-bold text-[#002A57]">Demo Login:</p>
              <div className="flex items-center gap-2 font-medium">
                <span className="w-10">Sales:</span>
                <span className="font-mono bg-slate-200/50 text-[#003B79] px-2 py-1 rounded-[6px]">demo</span>
                <span className="text-slate-400">/</span>
                <span className="font-mono bg-slate-200/50 text-[#003B79] px-2 py-1 rounded-[6px]">mandiri123</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span className="w-10">Admin:</span>
                <span className="font-mono bg-slate-200/50 text-[#003B79] px-2 py-1 rounded-[6px]">admin</span>
                <span className="text-slate-400">/</span>
                <span className="font-mono bg-slate-200/50 text-[#003B79] px-2 py-1 rounded-[6px]">admin2024</span>
              </div>
            </div>
          </div>

          <p className="text-center text-[12px] font-medium text-slate-400 mt-8">
            © 2024 PT Bank Mandiri (Persero) Tbk
          </p>
        </div>
      </div>
    </div>
  )
}
