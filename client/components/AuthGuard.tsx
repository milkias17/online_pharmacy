"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Zustand persistence hook to ensure store is hydrated
  const user = useAuthStore((state) => state.user);
  
  // We need a local state to track if we have checked persistence
  // This matches your Navbar's "isMounted" logic
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This forces a re-render after hydration prevents hydration mismatch
    useAuthStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Wait for store to load

    const isProtectedRoute = 
      pathname.startsWith("/customer") || 
      pathname.startsWith("/pharmacy") || 
      pathname.startsWith("/admin");

    const isAuthRoute = pathname === '/auth/login' || pathname === '/auth/register';

    // 1. CHECK: Protected Route + No User
    if (isProtectedRoute && !user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    } 
    
    // 2. CHECK: Auth Route + Logged In User (Redirect them away from login)
    if (isAuthRoute && user) {
        if (user.role === 'admin') router.replace('/admin/dashboard');
        else if (user.role === 'pharmacy') router.replace('/pharmacy/orders');
        else router.replace('/customer/browse');
    }

  }, [user, pathname, router, isHydrated]);

  // Don't render anything until we have confirmed identity
  if (!isHydrated) return null; 

  // If on protected route and no user, show nothing (while redirect happens)
  const isProtectedRoute = 
      pathname.startsWith("/customer") || 
      pathname.startsWith("/pharmacy") || 
      pathname.startsWith("/admin");
      
  if (isProtectedRoute && !user) return null;

  return <>{children}</>;
}