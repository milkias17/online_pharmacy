"use client";

import { useState, useEffect } from 'react';
import { DUMMY_MEDICINES } from '@/lib/mock-data';
import { useCartStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

// Configuration: How many items per page?
const ITEMS_PER_PAGE = 6;

export default function BrowsePage() {
  const addItem = useCartStore((state) => state.addItem);
  
  // === STATE ===
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false); // Fix hydration mismatch

  // Prevent Hydration errors with Zustand/Local storage
  useEffect(() => setIsClient(true), []);

  // === FILTER LOGIC ===
  const filteredMedicines = DUMMY_MEDICINES.filter((med) =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === PAGINATION LOGIC ===
  const totalPages = Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentMedicines = filteredMedicines.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle Add to Cart
  const handleAddToCart = (med: any) => {
    addItem({ ...med, quantity: 1 });
    toast.success(`Added ${med.name} to cart!`, {
      style: {
        border: '1px solid #4FD1C5',
        padding: '16px',
        color: '#1A202C',
      },
      iconTheme: {
        primary: '#4FD1C5',
        secondary: '#FFFAEE',
      },
    });
  };

  // Scroll to top when changing pages
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isClient) return null; // Prevent hydration flash

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <Toaster position="bottom-right" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* === HEADER & SEARCH === */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Medicines</h1>
          </div>

          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search medicines..."
              className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition duration-150 ease-in-out shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* === RESULTS INFO === */}
        <div className="mb-6 text-sm text-gray-500 font-medium">
          Showing {filteredMedicines.length > 0 ? startIndex + 1 : 0}-
          {Math.min(startIndex + ITEMS_PER_PAGE, filteredMedicines.length)} of {filteredMedicines.length} results
        </div>

        {/* === EMPTY STATE === */}
        {filteredMedicines.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No medicines found</h3>
            <p className="text-gray-500">Try adjusting your search terms.</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-accent font-bold hover:underline"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* === PRODUCT GRID === */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {currentMedicines.map((med) => (
              <div key={med.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                    {med.image}
                  </div>
                  {med.stock < 20 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                      Low Stock
                    </span>
                  )}
                </div>
                
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{med.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{med.description}</p>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                  <span className="text-2xl font-bold text-gray-900">${med.price.toFixed(2)}</span>
                  <button 
                    onClick={() => handleAddToCart(med)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-accent hover:text-white transition-all shadow-lg shadow-gray-200 active:scale-95"
                  >
                    <ShoppingCart size={18} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === PAGINATION CONTROLS === */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-full font-bold text-sm transition ${
                    currentPage === page
                      ? 'bg-accent text-white shadow-lg shadow-accent/30'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

      </main>
    </div>
  );
}