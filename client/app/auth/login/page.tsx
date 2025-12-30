"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Unauthorized access");

      login({ 
        id: data.userId, 
        email: email, 
        role: data.role, // 'admin', 'pharmacy_admin', or 'user'
        name: data.username || email.split('@')[0] 
      }, data.access);

      toast.success('Welcome back!');

      // ROLE-BASED REDIRECTION
      if (data.role === 'admin') {
        router.push('/admin/dashboard'); // Platform Owner
      } else if (data.role === 'pharmacy_admin' || data.role === 'pharmacy') {
        router.push('/pharmacy/orders'); // Pharmacy Manager
      } else {
        router.push('/customer/browse'); // Regular Patient
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <Toaster position="top-center" />
      
      {/* Left Side (Visuals) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent to-primary opacity-90"></div>
        <div className="relative z-10 p-12 text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl mb-6">💊</div>
          <h2 className="text-5xl font-bold mb-6 italic tracking-tight">Medivo</h2>
          <p className="text-xl text-blue-100 max-w-md">
            Connecting patients to pharmacies in real-time.
          </p>
        </div>
      </div>

      {/* Right Side (Form) */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-accent transition mb-12 w-fit font-bold uppercase text-xs tracking-widest">
          <ChevronLeft size={16} /> Back to home
        </Link>

        <div className="w-full max-w-md mx-auto my-auto">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Sign In</h1>
            <p className="text-gray-500 font-medium">Enter your credentials to access the ecosystem.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Identifier</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 outline-none transition font-medium"
                  placeholder="abc@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Secret Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 outline-none transition font-medium"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-accent"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition shadow-2xl shadow-gray-200 flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Authorize <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="mt-10 text-center text-gray-500 font-medium">
            New patient?{' '}
            <Link href="/auth/register" className="text-accent font-black hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}