"use client";

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/lib/store';
import Navbar from '@/components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';
import { ENDPOINTS } from '@/lib/endpoints';
import { apiRequest } from '@/lib/api-client';

interface Medicine {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  pharmacyId: string;
  requiresPrescription: boolean;
}

const ITEMS_PER_PAGE = 6;

export default function BrowsePage() {
  const addItem = useCartStore((state) => state.addItem);
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    const url = searchTerm 
      ? ENDPOINTS.INVENTORY.SEARCH(searchTerm) 
      : ENDPOINTS.INVENTORY.GET_ALL;
    
    const data = await apiRequest<Medicine[]>(url);
    
    if (data) {
      setMedicines(data);
    } else {
      setMedicines([]); 
    }
    setLoading(false);
  }, [searchTerm]);

  useEffect(() => {
    setIsClient(true);
    fetchMedicines();
  }, [fetchMedicines]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(medicines.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentMedicines = medicines.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleAddToCart = (med: Medicine) => {
    if (med.stock <= 0) {
      toast.error("Item out of stock");
      return;
    }

    addItem({
      id: med.id.toString(),
      name: med.name,
      price: med.price,
      quantity: 1,
      image: "💊", 
    });

    if (med.requiresPrescription) {
      toast.success(`${med.name} added. Note: Prescription required at checkout!`, {
        icon: '📝',
        duration: 4000
      });
    } else {
      toast.success(`Added ${med.name} to cart!`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <Toaster position="bottom-right" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pharmacy Inventory</h1>
            <p className="text-gray-500">Browse and order medicines</p>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by medicine name..."
              className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/50 outline-none transition shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
            <p className="text-gray-500 font-medium">Loading medicines...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-500 font-medium">
              Showing {medicines.length > 0 ? startIndex + 1 : 0}-
              {Math.min(startIndex + ITEMS_PER_PAGE, medicines.length)} of {medicines.length} results
            </div>

            {medicines.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No medicines found</h3>
                <p className="text-gray-500">We couldn't find any medicine matching your search.</p>
              </div>
            ) : (
              /* PRODUCT GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {currentMedicines.map((med) => (
                  <div key={med.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl">
                        💊
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {med.requiresPrescription && (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-100 flex items-center gap-1">
                            <AlertCircle size={12} /> PRESCRIPTION REQ.
                          </span>
                        )}
                        {med.stock < 10 && med.stock > 0 && (
                          <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-md animate-pulse">
                            LOW STOCK ({med.stock})
                          </span>
                        )}
                        {med.stock <= 0 && (
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md">
                            OUT OF STOCK
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{med.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{med.description || "No description available."}</p>
                        <p className="text-xs text-gray-400 mt-2">Pharmacy ID: {med.pharmacyId}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                      <span className="text-2xl font-bold text-gray-900">
                        {med.price.toLocaleString()} <span className="text-sm font-medium">Br.</span>
                      </span>
                      <button 
                        onClick={() => handleAddToCart(med)}
                        disabled={med.stock <= 0}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95 ${
                          med.stock <= 0 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-900 text-white hover:bg-accent'
                        }`}
                      >
                        <ShoppingCart size={18} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
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
                  className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}