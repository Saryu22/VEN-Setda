import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// PERBAIKAN: Gunakan framer-motion agar build sukses
import { motion } from 'framer-motion'; 
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Menggunakan relative path agar fleksibel saat di deploy ke Vercel
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        // Arahkan berdasarkan role dari backend
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch (err) {
      console.error("Login connection error:", err);
      setError('Terjadi kesalahan koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafafa]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden border border-zinc-100"
      >
        <div className="p-10 sm:p-12">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-zinc-100/50">
              <img 
                src="https://pemda.lamandaukab.go.id/wp-content/uploads/2020/02/LOGO-KABUPATEN-LAMANDAU.png" 
                alt="Lamandau Logo" 
                className="w-14 h-auto drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">VEN Setda</h1>
            <p className="text-zinc-500 mt-3 text-sm font-medium">Sistem Inventaris Elektronik Terpadu</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-400 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  required
                  type="text"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  required
                  type="password"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-4 bg-red-50/50 text-red-600 rounded-2xl text-xs font-semibold border border-red-100/50"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xl shadow-zinc-900/10 flex items-center justify-center gap-2 disabled:opacity-50 mt-8"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Portal</span>
                  <LogIn size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center space-y-6">
            <div className="p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100/50">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-3">Akun Percobaan</p>
              <div className="flex flex-col gap-2 text-[11px] font-semibold text-zinc-500">
                <div className="flex justify-between px-2">
                  <span>Admin</span>
                  <span className="text-zinc-400 font-mono">admin / admin123</span>
                </div>
                <div className="h-px bg-zinc-200/50 w-full" />
                <div className="flex justify-between px-2">
                  <span>User</span>
                  <span className="text-zinc-400 font-mono">user / user123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}