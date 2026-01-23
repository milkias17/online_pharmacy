"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Home, Package, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Chapa appends ?status=success (or similar) or we rely on our order_id
  const status = searchParams.get('status'); // Chapa might send this
  const orderId = searchParams.get('order_id');

  // In a real app, you would verify the transaction with the backend here
  // by sending the tx_ref to your verification endpoint.
  
  const isSuccess = status !== 'failed'; // Simple check for now

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
        isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {isSuccess ? <CheckCircle size={48} /> : <XCircle size={48} />}
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
      </h1>
      
      <p className="text-gray-500 mb-8">
        {isSuccess 
          ? `Thank you for your purchase. Your order #${orderId} has been confirmed and sent to the pharmacy.`
          : 'Something went wrong with the transaction. Please try again.'}
      </p>

      <div className="flex justify-center gap-4">
        <Link 
          href="/customer/browse"
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
        >
          <Home size={18} /> Home
        </Link>
        
        {isSuccess && (
          <Link 
            href="/customer/orders"
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition shadow-lg shadow-gray-200"
          >
            <Package size={18} /> View Order
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-accent" />
        </div>
      }>
        <PaymentStatusContent />
      </Suspense>
    </div>
  );
}