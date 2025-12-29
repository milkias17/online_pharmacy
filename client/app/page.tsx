import Link from "next/link";
import { ArrowRight, ShieldCheck, Store, Clock, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* 1. Navbar */}
      <nav className="w-full py-6 px-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-accent/20">
            M
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            <span className="text-accent">Medivo</span>
          </span>
        </div>
        <div className="space-x-4">
          <Link href="/auth/login" className="text-gray-600 font-medium hover:text-primary transition">
            Pharmacist Login
          </Link>
          <Link
            href="/customer/browse"
            className="bg-black text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition shadow-lg"
          >
            Browse Meds
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-10 sm:mt-0">
        <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 max-w-4xl leading-tight">
          Search. Reserve. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
            Pick up in minutes.
          </span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">
          Don't waste time traveling from store to store. Find real-time medicine 
          availability in nearby pharmacies and reserve your order for instant pickup.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/customer/browse"
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accentHover text-white text-lg px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-xl shadow-accent/30"
          >
            Find Medicines <Search className="w-5 h-5" />
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-200 text-lg px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition"
          >
            Sign In
          </Link>
        </div>

        {/* 3. Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
          {/* Feature 1 */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Verified Stock</h3>
            <p className="text-gray-500 mt-2">
              Our distributed system aggregates real-time data from licensed pharmacies to ensure accuracy.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Skip the Queue</h3>
            <p className="text-gray-500 mt-2">
              Reserve your medicines online. Your order will be packed and ready before you even arrive.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Local Pickup</h3>
            <p className="text-gray-500 mt-2">
              Choose the nearest pharmacy with available stock and pick up your items at your convenience.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-50 mt-12">
        © 2025 Medivo. AASTU Distributed Systems Project.
      </footer>
    </div>
  );
}