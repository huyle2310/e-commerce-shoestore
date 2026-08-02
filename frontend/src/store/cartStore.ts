import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';

export interface CartItem {
  id: string; // cart item ID
  variantId: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  stockQuantity?: number;
  totalPrice: number;
}

export interface CartState {
  items: CartItem[];
  buyNowItem: CartItem | null;
  totalAmount: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (variantId: string, quantity: number, localVariantDetails?: any) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  syncLocalCart: () => Promise<void>;
  clearLocalCart: () => void;
  setBuyNowItem: (item: CartItem | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      buyNowItem: null,
      totalAmount: 0,
      loading: false,

      setBuyNowItem: (item) => set({ buyNowItem: item }),

      fetchCart: async () => {
        set({ loading: true });
        try {
          const response = await api.get('/cart');
          set({ items: response.data.items || [], totalAmount: response.data.totalAmount || 0 });
        } catch (error) {
          console.error('Error fetching cart:', error);
        } finally {
          set({ loading: false });
        }
      },

      addToCart: async (variantId, quantity, localVariantDetails) => {
        const { useAuthStore } = await import('@/store/authStore');
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        if (isAuthenticated) {
          set({ loading: true });
          try {
            const response = await api.post(`/cart/items?variantId=${variantId}&quantity=${quantity}`, {});
            set({ items: response.data.items || [], totalAmount: response.data.totalAmount || 0 });
          } catch (error: any) {
            console.error('Error adding to cart:', error);
            throw new Error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
          } finally {
            set({ loading: false });
          }
        } else {
          // Local storage fallback for guests
          if (!localVariantDetails) {
             throw new Error('Thiếu thông tin sản phẩm để thêm vào giỏ hàng local');
          }
          const { items } = get();
          const existingItemIndex = items.findIndex(i => i.variantId === variantId);
          
          let newItems = [...items];
          if (existingItemIndex >= 0) {
            const existing = newItems[existingItemIndex];
            const newQty = existing.quantity + quantity;
            if (localVariantDetails.stockQuantity && newQty > localVariantDetails.stockQuantity) {
               throw new Error('Số lượng mua vượt quá số lượng tồn kho');
            }
            newItems[existingItemIndex] = {
              ...existing,
              quantity: newQty,
              totalPrice: existing.unitPrice * newQty
            };
          } else {
            if (localVariantDetails.stockQuantity && quantity > localVariantDetails.stockQuantity) {
               throw new Error('Số lượng mua vượt quá số lượng tồn kho');
            }
            const unitPrice = localVariantDetails.product.basePrice + (localVariantDetails.priceModifier || 0);
            newItems.push({
              id: 'local-' + Math.random().toString(36).substr(2, 9),
              variantId,
              sku: localVariantDetails.sku || '',
              productName: localVariantDetails.product.nameVi,
              color: localVariantDetails.colorVi,
              size: localVariantDetails.size,
              imageUrl: localVariantDetails.product.images?.[0]?.imageUrl || '',
              unitPrice,
              quantity,
              stockQuantity: localVariantDetails.stockQuantity,
              totalPrice: unitPrice * quantity
            });
          }
          
          const newTotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
          set({ items: newItems, totalAmount: newTotal });
        }
      },

      updateQuantity: async (itemId, quantity) => {
        const { useAuthStore } = await import('@/store/authStore');
        if (useAuthStore.getState().isAuthenticated) {
          set({ loading: true });
          try {
            const response = await api.put(`/cart/items/${itemId}?quantity=${quantity}`, {});
            set({ items: response.data.items || [], totalAmount: response.data.totalAmount || 0 });
          } catch (error: any) {
            console.error('Error updating quantity:', error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật số lượng');
          } finally {
            set({ loading: false });
          }
        } else {
          const { items } = get();
          const itemIndex = items.findIndex(i => i.id === itemId);
          if (itemIndex >= 0) {
             let newItems = [...items];
             if (quantity <= 0) {
               newItems.splice(itemIndex, 1);
             } else {
               const item = newItems[itemIndex];
               if (item.stockQuantity && quantity > item.stockQuantity) {
                  throw new Error('Số lượng mua vượt quá số lượng tồn kho');
               }
               newItems[itemIndex] = {
                 ...item,
                 quantity,
                 totalPrice: item.unitPrice * quantity
               };
             }
             const newTotal = newItems.reduce((sum, it) => sum + it.totalPrice, 0);
             set({ items: newItems, totalAmount: newTotal });
          }
        }
      },

      removeItem: async (itemId) => {
        const { useAuthStore } = await import('@/store/authStore');
        if (useAuthStore.getState().isAuthenticated) {
          set({ loading: true });
          try {
            const response = await api.delete(`/cart/items/${itemId}`);
            set({ items: response.data.items || [], totalAmount: response.data.totalAmount || 0 });
          } catch (error) {
            console.error('Error removing item:', error);
          } finally {
            set({ loading: false });
          }
        } else {
          const newItems = get().items.filter(i => i.id !== itemId);
          const newTotal = newItems.reduce((sum, it) => sum + it.totalPrice, 0);
          set({ items: newItems, totalAmount: newTotal });
        }
      },
      
      syncLocalCart: async () => {
         const { items } = get();
         const localItems = items.filter(i => i.id.startsWith('local-'));
         if (localItems.length > 0) {
            set({ loading: true });
            for (const item of localItems) {
               try {
                  await api.post(`/cart/items?variantId=${item.variantId}&quantity=${item.quantity}`, {});
               } catch (e) {
                  console.error('Failed to sync item:', item);
               }
            }
            // Fetch fresh cart from server
            try {
              const response = await api.get('/cart');
              set({ items: response.data.items || [], totalAmount: response.data.totalAmount || 0 });
            } catch (e) {}
            set({ loading: false });
         } else {
            await get().fetchCart();
         }
      },
      
      clearLocalCart: () => {
         set({ items: [], totalAmount: 0 });
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        items: state.items, 
        totalAmount: state.totalAmount 
      }), // Do NOT persist buyNowItem and loading state
    }
  )
);
