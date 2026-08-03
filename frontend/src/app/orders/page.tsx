'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { Package, Clock, CheckCircle2, Truck, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        // Sort orders by newest first
        const sortedOrders = response.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(sortedOrders);
      } catch (error) {
        console.error("Error fetching orders", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, router]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    try {
      await api.put(`/orders/${orderId}/cancel`);
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, orderStatus: 'CANCELLED' } : o));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể hủy đơn hàng');
    }
  };

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'PENDING': return { label: 'Chờ xác nhận', color: 'text-yellow-600 bg-yellow-50', icon: <Clock size={16} className="mr-1.5" /> };
      case 'SHIPPING': return { label: 'Đang giao hàng', color: 'text-blue-600 bg-blue-50', icon: <Truck size={16} className="mr-1.5" /> };
      case 'DELIVERED': return { label: 'Đã giao hàng', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 size={16} className="mr-1.5" /> };
      case 'CANCELLED': return { label: 'Đã hủy', color: 'text-red-600 bg-red-50', icon: <Package size={16} className="mr-1.5" /> };
      default: return { label: status, color: 'text-neutral-600 bg-neutral-50', icon: <Package size={16} className="mr-1.5" /> };
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-green-50 border border-green-200 rounded-3xl flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-4">
              <Check size={32} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Đặt hàng thành công!</h2>
            <p className="text-green-600">Cảm ơn bạn đã mua sắm tại Vanguard. Đơn hàng của bạn đang được xử lý.</p>
          </motion.div>
        )}

        <h1 className="text-4xl font-black tracking-tight mb-8">ĐƠN HÀNG CỦA TÔI</h1>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100">
            <Package size={48} className="mx-auto text-neutral-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Bạn chưa có đơn hàng nào</h2>
            <p className="text-neutral-500 mb-8">Hãy mua sắm để định hình phong cách cùng Vanguard nhé.</p>
            <button onClick={() => router.push('/shop')} className="px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-neutral-800 transition-colors">
              Bắt đầu mua sắm
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.orderStatus);
              return (
                <div key={order.id} className="bg-white rounded-3xl border border-neutral-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-100 flex flex-wrap justify-between items-center gap-4 bg-neutral-50/50">
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Mã đơn hàng</p>
                      <p className="font-bold font-mono">#{order.id.split('-')[0].toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Ngày đặt</p>
                      <p className="font-bold">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Tổng tiền</p>
                      <p className="font-bold text-orange-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.finalAmount)}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Link href={`/shop/${item.slug || ''}`} className="w-16 h-16 bg-neutral-100 rounded-lg mr-4 flex-shrink-0 flex items-center justify-center overflow-hidden border border-neutral-200 block">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-neutral-400 font-medium">Image</span>
                              )}
                            </Link>
                            <div>
                              <Link href={`/shop/${item.slug || ''}`}>
                                <p className="font-bold line-clamp-1 hover:text-orange-500 transition-colors">{item.productName}</p>
                              </Link>
                              <p className="text-sm text-neutral-500 mt-1">Màu: {item.color} | Size: {item.size} | SL: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-bold ml-4 whitespace-nowrap">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}</p>
                        </div>
                      ))}
                    </div>
                    {order.orderStatus === 'PENDING' && order.paymentStatus !== 'PAID' && (
                      <div className="mt-6 pt-6 border-t border-neutral-100 flex justify-end">
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-6 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          Hủy đơn hàng
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
