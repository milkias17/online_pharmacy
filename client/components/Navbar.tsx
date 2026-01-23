"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Package, LogIn } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const isPharmacy = pathname.includes('/pharmacy');

  const handleLogout = () => {
    // 1. Clear State
    logout();
    
    // 2. Clear Cache & History
    // 'replace' prevents adding a new entry, effectively overwriting the current page in history
    router.replace('/auth/login'); 
    
    // 3. Force Next.js to invalidate client-side cache so the "Back" button doesn't serve old data
    router.refresh(); 

    toast.success("Signed out successfully");
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* === LOGO === */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-lg">M</div>
            <Link href="/" className="text-xl font-bold text-gray-800 tracking-tight">
              <span className="text-accent">Medivo</span>
            </Link>
          </div>

          {/* === NAVIGATION LINKS === */}
          <div className="flex items-center space-x-6">
            
            {isMounted ? (
              <>
                {/* 1. GUEST VIEW */}
                {!user ? (
                  <Link 
                    href="/auth/login" 
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition shadow-lg shadow-gray-200"
                  >
                    <LogIn size={16} /> Sign In
                  </Link>
                ) : (
                  /* 2. LOGGED IN VIEW */
                  <>
                    {/* Role Specific Links */}
                    {isPharmacy || user.role === 'pharmacy' || user.role === 'pharmacy_admin' ? (
                      <>
                        <Link href="/pharmacy/orders" className={`text-sm font-bold transition ${pathname.includes('orders') ? 'text-accent' : 'text-gray-500 hover:text-gray-900'}`}>
                          Orders
                        </Link>
                        <Link href="/pharmacy/inventory" className={`text-sm font-bold transition ${pathname.includes('inventory') ? 'text-accent' : 'text-gray-500 hover:text-gray-900'}`}>
                          Inventory
                        </Link>
                      </>
                    ) : (
                      /* Customer Links */
                      <Link href="/customer/orders" className="flex items-center gap-2 text-gray-500 hover:text-accent font-medium transition">
                        <Package size={20} />
                        <span className="hidden sm:inline">My Orders</span>
                      </Link>
                    )}

                    {/* User Profile Snippet */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                      <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xs font-bold">
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-bold text-gray-600 max-w-[100px] truncate">
                        {user.name}
                      </span>
                    </div>

                    {/* Sign Out Button */}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-red-500 transition ml-2"
                      title="Sign Out"
                    >
                      <LogOut size={18} />
                      <span className="hidden sm:inline">Sign Out</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-24 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}