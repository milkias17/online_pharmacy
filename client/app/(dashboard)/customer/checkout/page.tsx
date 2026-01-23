"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import { 
  CreditCard, ShieldCheck, ArrowRight, 
  Package, Info, Loader2, ChevronLeft 
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/endpoints';
import { useAuthStore } from '@/lib/store';

// 1. UPDATE INTERFACE to match your API response exactly
interface MedicineDetails {
  id: number;
  name: string;
  price: string | number; 
  stock: number;
  description: string;
  image?: string;
  // Your API returns "pharmacyId", but we keep others as fallback
  pharmacyId?: string | number; 
  pharmacy_id?: number; 
  pharmacy?: number;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const user = useAuthStore((state) => state.user);
  const paramMedId = searchParams.get('medId');
  
  const [medicine, setMedicine] = useState<MedicineDetails | null>(null);
  const [isLoadingMed, setIsLoadingMed] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // === FETCH MEDICINE DETAILS ===
  useEffect(() => {
    const fetchMedicineDetails = async () => {
      if (!paramMedId) return;
      try {
        setIsLoadingMed(true);
        const res = await fetch(ENDPOINTS.INVENTORY.GET_BY_ID(Number(paramMedId)));
        if (!res.ok) throw new Error("Could not fetch medicine details");
        const data = await res.json();
        setMedicine(data);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load item details.");
      } finally {
        setIsLoadingMed(false);
      }
    };
    
    // Only fetch if we have an ID
    if (paramMedId) {
        fetchMedicineDetails();
    }
  }, [paramMedId]);

  // === CALCULATIONS ===
  const unitPrice = medicine ? Number(medicine.price) : 0;
  const subtotal = unitPrice * quantity;
  const serviceFee = 10; 
  const total = subtotal + serviceFee;
  const maxStock = medicine ? medicine.stock : 0;

  // === HANDLERS ===
  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity < 1) return;
    if (newQuantity > maxStock) {
      toast.error(`Only ${maxStock} items available!`);
      return;
    }
    setQuantity(newQuantity);
  };

 const handleCheckout = async () => {
    // A. VALIDATE AUTH
    if (!user || !user.token) {
      toast.error("Session expired. Please login again.");
      router.push('/auth/login');
      return;
    }

    if (!medicine) return;

    // B. VALIDATE PHARMACY ID
    const rawPharmacyId = medicine.pharmacyId || medicine.pharmacy_id || medicine.pharmacy;
    if (!rawPharmacyId) {
      toast.error("System Error: Pharmacy ID missing.");
      return;
    }

    setIsProcessing(true);

    try {
      // ====================================================
      // STEP 1: CREATE ORDER (Order Service)
      // ====================================================
      const orderPayload = {
        user_id: Number(user.id),
        pharmacy_id: Number(rawPharmacyId),
        total_amount: total,
        items: [
          {
            medicine_id: medicine.id,
            quantity: quantity,
            medicine_name: medicine.name, 
            price: unitPrice 
          }
        ]
      };

      const orderRes = await fetch(ENDPOINTS.ORDERS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.detail || "Order creation failed.");
      }

      // CRITICAL: Ensure we get the ID correctly
      const orderId = orderData.id || orderData.order_id;
      
      if (!orderId) {
        console.error("Order Response:", orderData);
        throw new Error("Order created but no ID returned from server.");
      }

      toast.success("Order created! Processing payment...", { icon: '⏳' });

      // ====================================================
      // STEP 2: INITIATE PAYMENT (Payment Service)
      // ====================================================
      
      // Fix: Pass orderId inside the URL so we can read it on the success page
      const returnUrl = `${window.location.origin}/customer/payment-status?order_id=${orderId}`;

      const paymentPayload = {
        // --- ADDED THESE MISSING FIELDS ---
        user_id: Number(user.id),
        order_id: orderId,
        // ----------------------------------
        amount: total,
        email: user.email,
        first_name: user.name?.split(" ")[0] || "Guest",
        last_name: user.name?.split(" ")[1] || "User",
        return_url: returnUrl
      };

      console.log("Sending Payment Payload:", paymentPayload);

      const paymentRes = await fetch(ENDPOINTS.PAYMENT.CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        // Check if the backend sent a specific validation error
        if (paymentData.user_id) throw new Error(`Payment Error: User ID ${paymentData.user_id}`);
        throw new Error(paymentData.detail || "Payment initialization failed.");
      }
      
      if (paymentData.checkout_url) {
        window.location.href = paymentData.checkout_url;
      } else {
        throw new Error("Invalid payment URL received.");
      }

    } catch (err: any) {
      console.error("Checkout Error:", err);
      toast.error(err.message || "Checkout failed");
      setIsProcessing(false);
    }
  };
  if (!paramMedId) return null;
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-accent mb-6 transition-colors">
        <ChevronLeft size={20} /> Back
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Secure Checkout</h1>

      {isLoadingMed ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent" /></div>
      ) : !medicine ? (
        <div className="text-red-500">Item not found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Summary Section */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <h2 className="font-bold text-lg mb-4 flex gap-2"><Package className="text-accent"/> Order Details</h2>
                 <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl overflow-hidden">
                       {medicine.image ? <img src={medicine.image} alt={medicine.name} className="w-full h-full object-cover"/> : "💊"}
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">{medicine.name}</h3>
                        <p className="text-gray-500 text-sm">{medicine.description}</p>
                        <p className="text-accent font-bold mt-1">ETB {unitPrice.toFixed(2)}</p>
                    </div>
                 </div>
                 <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Quantity</span>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleQuantityChange(-1)} 
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full font-bold transition"
                        >-</button>
                        <span className="font-bold w-6 text-center">{quantity}</span>
                        <button 
                            onClick={() => handleQuantityChange(1)} 
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full font-bold transition"
                        >+</button>
                    </div>
                 </div>
              </div>
           </div>

           {/* Payment Section */}
           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg h-fit sticky top-24">
              <h2 className="font-bold text-lg mb-4">Payment Summary</h2>
              <div className="flex justify-between mb-2 text-gray-600"><span>Subtotal</span><span>ETB {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between mb-4 text-gray-600"><span>Service Fee</span><span>ETB {serviceFee.toFixed(2)}</span></div>
              <div className="border-t border-gray-100 my-4"></div>
              <div className="flex justify-between font-bold text-xl mb-6 text-gray-900"><span>Total</span><span>ETB {total.toFixed(2)}</span></div>
              
              <button 
                onClick={handleCheckout} 
                disabled={isProcessing}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-green-200 transition-all active:scale-95"
              >
                {isProcessing ? <Loader2 className="animate-spin"/> : <>Pay with Chapa <ArrowRight/></>}
              </button>
              <div className="mt-4 flex justify-center items-center gap-2 text-xs text-gray-400">
                <ShieldCheck size={14}/> Secure Encrypted Payment
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <Toaster position="bottom-right" />
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-accent w-10 h-10"/>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}