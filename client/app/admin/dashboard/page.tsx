"use client";

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Building2, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle,
  LogOut,
  Settings,
  Bell,
  Search
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Protect the route
  if (!user || user.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-500">You do not have permission to view this command center.</p>
          <button onClick={() => router.push('/auth/login')} className="mt-4 text-accent font-bold">Back to Login</button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Patients', value: '1,284', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Verified Pharmacies', value: '42', icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'System Health', value: '99.9%', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Monthly Revenue', value: '$12,450', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold">M</div>
            <span className="text-xl font-black tracking-tighter italic">Medivo</span>
          </div>
          
          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 p-3 bg-accent/20 text-accent rounded-xl font-bold transition">
              <Activity size={20} /> Overview
            </a>
            <a href="#" className="flex items-center gap-3 p-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition">
              <Building2 size={20} /> Pharmacies
            </a>
            <a href="#" className="flex items-center gap-3 p-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition">
              <Users size={20} /> Users
            </a>
            <a href="#" className="flex items-center gap-3 p-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition">
              <ShieldCheck size={20} /> Verifications
            </a>
            <a href="#" className="flex items-center gap-3 p-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition">
              <Settings size={20} /> System Config
            </a>
          </nav>
        </div>

        <div className="mt-auto p-8">
          <button 
            onClick={() => { logout(); router.push('/auth/login'); }}
            className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition font-medium"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 ml-64 p-10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Overview</h1>
            <p className="text-gray-500 font-medium">Welcome back, Super Admin.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input placeholder="Search records..." className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon size={24} />
              </div>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* System Activity & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Pharmacy Requests */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Pending Pharmacy Approvals</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((id) => (
                <div key={id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">🏥</div>
                    <div>
                      <p className="font-bold text-gray-900">City Central Pharmacy #{id}</p>
                      <p className="text-xs text-gray-500 font-medium italic">License: LIC-2024-00{id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition">Approve</button>
                    <button className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition">Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition flex items-center justify-between">
                Export System Report <TrendingUp size={16} />
              </button>
              <button className="w-full text-left p-4 bg-accent text-white rounded-2xl font-bold text-sm hover:bg-accentHover transition flex items-center justify-between">
                Broadcast System Alert <Bell size={16} />
              </button>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">System Identity</p>
                <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-xs font-bold">A</div>
                    <div>
                        <p className="text-xs font-bold text-gray-900">{user?.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Root Administrator</p>
                    </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}