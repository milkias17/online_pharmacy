"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import Navbar from '@/components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Search, ChevronLeft, ChevronRight, CreditCard, 
  Loader2, AlertCircle, FileWarning, ShieldAlert 
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/endpoints';
import { useAuthStore } from '@/lib/store'; // Import Auth Store

// Configuration: How many items per page?
const ITEMS_PER_PAGE = 6;

interface Medicine {
  id: number | string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  requiresPrescription?: boolean; 
}

export default function BrowsePage() {
  const router = useRouter();
  const pathname = usePathname(); // Get current path for redirect
  const user = useAuthStore((state) => state.user); // Check if user exists

  // === STATE ===
  const [medicines, setMedicines] = useState<Medicine[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [showRxModal, setShowRxModal] = useState(false);
  const [selectedRxMed, setSelectedRxMed] = useState<Medicine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  // === DATA FETCHING ===
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(ENDPOINTS.INVENTORY.GET_ALL);

        if (!response.ok) {
          throw new Error(`Failed to fetch medicines (Status: ${response.status})`);
        }

        const data = await response.json();
        const medicineList = Array.isArray(data) ? data : (data.results || []);
        setMedicines(medicineList);
      } catch (err: any) {
        console.error("Error fetching medicines:", err);
        setError(err.message || 'Something went wrong connecting to the database.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isClient) {
      fetchMedicines();
    }
  }, [isClient]);

  // === FILTER & PAGINATION ===
  const filteredMedicines = medicines.filter((med) =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentMedicines = filteredMedicines.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // === CLICK HANDLER: PRE-CHECK ===
  const handleBuyClick = (med: Medicine) => {
    // 1. CHECK LOGIN STATUS
    if (!user) {
      toast.error("Please log in to purchase medicines.", {
        icon: '🔒',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      // Redirect to Login with a return URL
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. CHECK PRESCRIPTION
    if (med.requiresPrescription) {
      setSelectedRxMed(med);
      setShowRxModal(true);
    } else {
      processOrder(med);
    }
  };

  // === PROCESS & REDIRECT LOGIC ===
  const processOrder = async (med: Medicine) => {
    setProcessingId(med.id);
    setShowRxModal(false); 

    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success(`Availability Confirmed! Redirecting...`, {
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

    setTimeout(() => {
      router.push(`/customer/checkout?medId=${med.id}&price=${med.price}&name=${encodeURIComponent(med.name)}`);
    }, 800);
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-surface relative">
      <Navbar />
      <Toaster position="bottom-right" />

      {/* === RX WARNING MODAL === */}
      {showRxModal && selectedRxMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-red-600 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <ShieldAlert size={32} />
              <h2 className="text-xl font-bold">Prescription Required</h2>
            </div>
            
            <p className="text-gray-700 font-medium mb-2">
              You are attempting to purchase <span className="font-bold text-gray-900">{selectedRxMed.name}</span>.
            </p>
            
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-800 mb-6">
              <ul className="list-disc pl-4 space-y-2">
                <li>You <strong>MUST</strong> present a valid doctor's prescription upon delivery/pickup.</li>
                <li className="font-bold">If you do not have a prescription, you will NOT receive the medicine.</li>
                <li className="font-bold">The cost of the medicine is NON-REFUNDABLE in this case.</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowRxModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => processOrder(selectedRxMed)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-200 transition"
              >
                I Understand, Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* === HEADER & SEARCH === */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Medicines</h1>
            <p className="text-gray-500 mt-1">Select a medicine to purchase instantly.</p>
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

        {/* === LOADING STATE === */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
            <p className="text-gray-500">Loading inventory...</p>
          </div>
        )}

        {/* === ERROR STATE === */}
        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600">
            <AlertCircle className="h-10 w-10 mx-auto mb-2" />
            <h3 className="font-bold text-lg">Unable to load medicines</h3>
            <p className="text-sm opacity-80">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-semibold transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* === CONTENT === */}
        {!isLoading && !error && (
          <>
            <div className="mb-6 text-sm text-gray-500 font-medium">
              Showing {filteredMedicines.length > 0 ? startIndex + 1 : 0}-
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredMedicines.length)} of {filteredMedicines.length} results
            </div>

            {filteredMedicines.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No medicines found</h3>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-accent font-bold hover:underline"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {currentMedicines.map((med) => (
                  <div key={med.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col h-full relative overflow-hidden">
                    
                    {/* PRESCRIPTION WARNING BADGE */}
                    {med.requiresPrescription && (
                      <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                        <FileWarning size={12} /> Rx Required
                      </div>
                    )}

                    {/* Image & Stock Badge */}
                    <div className="flex justify-between items-start mb-4 mt-2">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition overflow-hidden">
                        {med.image ? med.image : '💊'}
                      </div>
                      
                      {med.stock === 0 ? (
                        <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
                          Out of Stock
                        </span>
                      ) : med.stock < 20 ? (
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse border border-orange-200">
                          Low Stock: {med.stock} left
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                          In Stock
                        </span>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{med.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{med.description}</p>
                        
                        {med.requiresPrescription && (
                           <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
                             <AlertCircle size={12} /> Prescription check on delivery
                           </p>
                        )}
                    </div>
                    
                    {/* Action Bar */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                      <span className="text-2xl font-bold text-gray-900">ETB {Number(med.price).toFixed(2)}</span>
                      
                      <button 
                        onClick={() => handleBuyClick(med)}
                        disabled={processingId === med.id || med.stock === 0}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg active:scale-95
                          ${processingId === med.id 
                            ? 'bg-gray-100 text-gray-400 cursor-wait' 
                            : med.stock === 0
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                              : 'bg-gray-900 text-white hover:bg-accent hover:text-white shadow-gray-200'
                          }
                        `}
                      >
                        {processingId === med.id ? (
                          <>
                            <Loader2 size={18} className="animate-spin" /> Checking..
                          </>
                        ) : med.stock === 0 ? (
                          <>Sold Out</>
                        ) : (
                          <>
                            <CreditCard size={18} /> Buy Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
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
          </>
        )}
      </main>
    </div>
  );
}