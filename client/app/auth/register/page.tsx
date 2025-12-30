"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Loader2, ChevronLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' 
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setIsLoading(true);
    try {
      // Logic: Sanitize the username (Replace spaces with _ and make lowercase)
      const sanitizedUsername = formData.username.trim().replace(/\s+/g, '_').toLowerCase();

      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: sanitizedUsername, // Use the sanitized version
          email: formData.email,
          password: formData.password,
          role: 'user'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show specific error if username is still invalid
        if (data.username) throw new Error("Name can only contain letters, numbers, and underscores.");
        throw new Error(data.detail || "Registration failed");
      }

      toast.success("Account created! Redirecting to login...");
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex bg-white font-sans">
      <Toaster position="top-center" />
      
      {/* Left Side - Visuals (Consistent with Login) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent to-primary opacity-90"></div>
        <div className="relative z-10 p-12 text-white max-w-lg text-left">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl border border-white/20">💊</div>
          <h2 className="text-6xl font-black mb-6 tracking-tighter italic leading-none">Medivo</h2>
          <p className="text-xl text-blue-50 leading-relaxed font-medium">
            Join the distributed network. Access verified inventory and manage your health instantly.
          </p>
        </div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-accent transition mb-12 w-fit font-bold uppercase text-[10px] tracking-[0.2em]">
          <ChevronLeft size={16} /> Back to home
        </Link>

        <div className="w-full max-w-md mx-auto my-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Create Account</h1>
            <p className="text-gray-500 font-medium">Register as a patient to start ordering.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                <input 
                  type="text" 
                  required
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 outline-none transition font-medium"
                  placeholder="e.g. Abebe Kebede"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                <input 
                  type="email" 
                  required
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 outline-none transition font-medium"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 outline-none transition font-medium"
                      placeholder="••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-4 text-gray-300 hover:text-accent"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Confirm</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 outline-none transition font-medium"
                      placeholder="••••••"
                    />
                  </div>
               </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-accentHover transition shadow-2xl shadow-accent/20 flex items-center justify-center gap-3 disabled:opacity-70 mt-6"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="mt-10 text-center text-gray-500 font-medium">
            Already registered?{' '}
            <Link href="/auth/login" className="text-accent font-black hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}