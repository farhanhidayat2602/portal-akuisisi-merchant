'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#032d5f] to-[#0b5191]">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-b from-[#032d5f] to-[#0b5191] overflow-hidden font-sans">
      
      {/* City Background Silhouette */}
      <div className="absolute bottom-0 left-0 w-full h-[40vh] pointer-events-none overflow-hidden">
        {/* Layer 1 - Back */}
        <div className="absolute bottom-0 w-[120%] -left-[10%] h-full flex items-end justify-center opacity-5">
          <div className="w-16 h-[30%] bg-white mx-0.5"></div>
          <div className="w-24 h-[50%] bg-white mx-0.5"></div>
          <div className="w-20 h-[40%] bg-white mx-0.5"></div>
          <div className="w-32 h-[70%] bg-white mx-0.5"></div>
          <div className="w-16 h-[55%] bg-white mx-0.5"></div>
          <div className="w-28 h-[80%] bg-white mx-0.5"></div>
          <div className="w-20 h-[65%] bg-white mx-0.5"></div>
          <div className="w-24 h-[45%] bg-white mx-0.5"></div>
          <div className="w-32 h-[85%] bg-white mx-0.5"></div>
          <div className="w-16 h-[60%] bg-white mx-0.5"></div>
          <div className="w-20 h-[35%] bg-white mx-0.5"></div>
          <div className="w-28 h-[75%] bg-white mx-0.5"></div>
          <div className="w-24 h-[50%] bg-white mx-0.5"></div>
          <div className="w-32 h-[80%] bg-white mx-0.5"></div>
          <div className="w-16 h-[40%] bg-white mx-0.5"></div>
        </div>
        {/* Layer 2 - Front */}
        <div className="absolute bottom-0 w-[120%] -left-[10%] h-full flex items-end justify-center opacity-10">
          <div className="w-20 h-[20%] bg-white mx-0.5"></div>
          <div className="w-16 h-[40%] bg-white mx-0.5"></div>
          <div className="w-28 h-[25%] bg-white mx-0.5"></div>
          <div className="w-24 h-[55%] bg-white mx-0.5"></div>
          <div className="w-16 h-[30%] bg-white mx-0.5"></div>
          <div className="w-32 h-[65%] bg-white mx-0.5"></div>
          <div className="w-20 h-[45%] bg-white mx-0.5"></div>
          <div className="w-24 h-[70%] bg-white mx-0.5"></div>
          <div className="w-28 h-[35%] bg-white mx-0.5"></div>
          <div className="w-16 h-[50%] bg-white mx-0.5"></div>
          <div className="w-20 h-[25%] bg-white mx-0.5"></div>
          <div className="w-32 h-[60%] bg-white mx-0.5"></div>
          <div className="w-24 h-[15%] bg-white mx-0.5"></div>
          <div className="w-28 h-[45%] bg-white mx-0.5"></div>
          <div className="w-20 h-[30%] bg-white mx-0.5"></div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-2xl">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center justify-center mb-8">
            {/* Bank Mandiri Logo */}
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_of_Bank_Mandiri.svg" 
              alt="Bank Mandiri" 
              className="h-10 mb-5"
            />
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 text-center tracking-tight">
              GMM & CIF Reporting
            </h1>
            <p className="text-[13px] text-slate-500 mt-2 text-center font-medium">
              Region IX / Kalimantan — Area Balikpapan
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className={cn(
                    'w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 placeholder:font-normal',
                    error && 'border-red-300 focus:ring-red-400'
                  )}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className={cn(
                    'w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 placeholder:font-normal',
                    error && 'border-red-300 focus:ring-red-400'
                  )}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl p-3">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2E68F5] hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-[15px] transition-all mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center opacity-60">
            <div className="w-full h-px bg-slate-300"></div>
            <span className="px-4 text-[13px] text-slate-500 font-medium">atau</span>
            <div className="w-full h-px bg-slate-300"></div>
          </div>

          <div className="mt-8 text-center">
            <button className="inline-flex items-center gap-2 text-[14px] font-bold text-[#2E68F5] hover:text-blue-800 transition-colors">
              <ShieldCheck size={18} />
              Butuh bantuan?
            </button>
          </div>
        </div>
        
        {/* Demo Login Information - styled to be subtle outside the card */}
        <div className="mt-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-xs text-blue-100 space-y-1.5 opacity-70 hover:opacity-100 transition-opacity">
          <p className="font-semibold text-white/90">Akun Demo:</p>
          <p className="flex justify-between items-center">
            <span>Sales</span> 
            <span className="font-mono bg-blue-900/60 px-2 py-1 rounded text-white/90">demo / mandiri123</span>
          </p>
          <p className="flex justify-between items-center">
            <span>Admin</span> 
            <span className="font-mono bg-blue-900/60 px-2 py-1 rounded text-white/90">admin / admin2024</span>
          </p>
        </div>
      </div>
    </div>
  )
}
