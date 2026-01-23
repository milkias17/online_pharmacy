import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// =========================================================
// 1. AUTH STORE (Persisted)
// =========================================================

interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'customer' | 'pharmacy' | 'pharmacy_admin' | 'admin';
  token: string; // We store the token here now
}

interface UserState {
  user: User | null;
  login: (userData: Omit<User, 'token'>, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,

      login: (userData, token) => {
        // We combine the user data and token into one object
        set({ 
          user: { ...userData, token } 
        });
      },

      logout: () => {
        set({ user: null });
      },
    }),
    {
      name: 'medivo-auth-storage', // Unique name in localStorage
      storage: createJSONStorage(() => localStorage), // Use browser localStorage
      skipHydration: true, // Important for Next.js to prevent HTML mismatch errors
    }
  )
);

// =========================================================
// 2. CART STORE (Persisted)
// =========================================================

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => set((state) => {
        const existing = state.items.find(i => i.id === newItem.id);
        if (existing) {
          // If item exists, increase quantity
          return {
            items: state.items.map(i => 
              i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          };
        }
        // If new, add to array
        return { items: [...state.items, newItem] };
      }),

      removeItem: (id) => set((state) => ({ 
        items: state.items.filter(i => i.id !== id) 
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(i => 
          i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
        )
      })),

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'medivo-cart-storage', // Unique name for cart
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);