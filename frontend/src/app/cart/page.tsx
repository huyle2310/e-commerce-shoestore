'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Shield } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, totalAmount, loading, fetchCart, updateQuantity, removeItem, setBuyNowItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Clear buyNowItem if user navigates back to cart
    setBuyNowItem(null);

    // Only fetch from backend if authenticated. Otherwise, local cart from persist store is used.
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart, setBuyNowItem]);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black tracking-tight mb-8">GIỎ HÀNG</h1>

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100">
            <ShoppingBag size={48} className="mx-auto text-neutral-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
            <p className="text-neutral-500 mb-8">Sẽ đỡ trống trải hơn nếu bạn thêm sản phẩm vào đây.</p>
            <Link href="/shop" className="inline-block px-8 py-4 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors">
              Đến trang mua sắm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Cart Items */}
            <div className="lg:w-2/3 space-y-6">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex flex-col sm:flex-row bg-white p-6 rounded-3xl border border-neutral-100 gap-6 ${item.stockQuantity === 0 ? 'opacity-60' : ''}`}
                >
                  <div className="relative shrink-0">
                    <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.productName} className="w-24 h-24 object-cover rounded-2xl bg-neutral-100" />
                    {item.stockQuantity === 0 && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center rounded-2xl border border-red-500/20">
                        <span className="bg-neutral-400  text-white text-[12px] font-black tracking-wider px-2 py-1 ">ĐÃ HẾT</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-1">{item.productName}</h3>
                        <p className="text-sm text-neutral-500 mb-1">Màu: {item.color} | Size: {item.size}</p>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-orange-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)}</p>
                          {item.stockQuantity === 0 && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded text-center">Sản phẩm này tạm hết hàng</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <div className="flex items-center border border-neutral-200 rounded-full px-3 py-1 bg-neutral-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="text-neutral-500 hover:text-black disabled:opacity-50"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => {
                            const maxQty = item.stockQuantity !== undefined ? item.stockQuantity : Infinity;
                            updateQuantity(item.id, Math.min(item.quantity + 2, maxQty));
                          }}
                          disabled={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity}
                          className="text-neutral-500 hover:text-black disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="font-black text-lg">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white p-8 rounded-3xl border border-neutral-100 sticky top-28">
                <h3 className="text-2xl font-bold mb-6 border-b border-neutral-100 pb-4">Tóm tắt đơn hàng</h3>

                <div className="space-y-4 mb-6 text-neutral-600">
                  <div className="flex justify-between">
                    <span>Tạm tính ({items.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm)</span>
                    <span className="font-medium text-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí giao hàng</span>
                    <span className="font-medium text-black">Chưa tính</span>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-6 mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-lg">Tổng cộng</span>
                    <span className="font-black text-3xl text-orange-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                  </div>
                  <p className="text-xs text-neutral-400 text-right">Đã bao gồm VAT nếu có</p>
                </div>

                <button
                  onClick={() => {
                    router.push('/checkout');
                  }}
                  className="w-full flex items-center justify-center bg-black text-white font-bold text-lg py-4 rounded-full hover:bg-neutral-800 transition-all group"
                >
                  Thanh toán ngay <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-center text-xs text-neutral-400 mt-6 flex items-center justify-center">
                  <Shield size={14} className="mr-1" /> Thanh toán an toàn và bảo mật 100%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
