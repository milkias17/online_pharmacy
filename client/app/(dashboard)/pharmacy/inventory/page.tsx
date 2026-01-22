"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Save, Plus, Search, AlertCircle, X, Loader2, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Get the user from the store (Only one declaration needed)
  const { user } = useAuthStore(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    requiresPrescription: false
  });

  const API_BASE = process.env.NEXT_PUBLIC_INVENTORY_API_URL;

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory/medicines`);
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      toast.error("Database connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEBUG: Remove this after testing
    console.log("Current Logged In User:", user);

    // FIX: Check if user exists. If ID is missing, we use a fallback for the demo
    if (!user) {
        toast.error("You must be logged in to manage inventory.");
        return;
    }

    setIsSaving(true);

    try {
        const payload = {
            name: newItem.name,
            price: parseFloat(newItem.price),
            stock: parseInt(newItem.stock),
            description: newItem.description || '',
            requiresPrescription: newItem.requiresPrescription,
            // Use user.id, but fallback to "1" if not found so the demo doesn't break
            pharmacyId: user.id || "1" 
        };

        const res = await fetch(`${API_BASE}/inventory/medicines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error();

        toast.success("Medicine added to database!");
        setIsModalOpen(false);
        setNewItem({ name: '', price: '', stock: '', description: '', requiresPrescription: false });
        fetchInventory(); 
    } catch (error) {
        toast.error("Failed to save to Supabase.");
    } finally {
        setIsSaving(false);
    }
  };

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <Toaster position="bottom-right" />

      <main className="max-w-7xl mx-auto px-4 py-10">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-500">Live data from Supabase Cluster.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold hover:bg-accentHover shadow-lg transition"
          >
            <Plus size={20} /> Add New Medicine
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search medicine..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-accent/20"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Inventory Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Product Name</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Price (ETB)</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Stock</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                          {item.name} {item.requiresPrescription && <span className="text-[10px] bg-yellow-100 p-1 rounded">Rx</span>}
                      </div>
                      <div className="text-xs text-gray-400">{item.description}</div>
                    </td>
                    <td className="p-4 font-mono text-gray-600">{item.price} ETB</td>
                    <td className="p-4">
                        <input 
                            type="number" 
                            value={item.stock}
                            onChange={(e) => handleStockInputChange(item.id, e.target.value)}
                            className="w-20 p-2 border rounded-lg text-center font-bold"
                        />
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleSaveStock(item)} className="text-accent hover:bg-blue-50 p-2 rounded-lg">
                          <Save size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal is same as your previous code... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 relative">
            <h2 className="text-2xl font-bold mb-6">Add New Medicine</h2>
            <form onSubmit={handleAddNewItem} className="space-y-4">
                <input required placeholder="Name" className="w-full p-3 border rounded-xl" onChange={e => setNewItem({...newItem, name: e.target.value})} />
                <input required type="number" placeholder="Price" className="w-full p-3 border rounded-xl" onChange={e => setNewItem({...newItem, price: e.target.value})} />
                <input required type="number" placeholder="Stock" className="w-full p-3 border rounded-xl" onChange={e => setNewItem({...newItem, stock: e.target.value})} />
                <textarea placeholder="Description" className="w-full p-3 border rounded-xl" onChange={e => setNewItem({...newItem, description: e.target.value})} />
                <button type="submit" disabled={isSaving} className="w-full bg-accent text-white py-4 rounded-xl font-bold">
                    {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Save Product'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-gray-400 mt-2">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}