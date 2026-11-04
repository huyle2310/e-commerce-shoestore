'use client';

import { useState, useEffect } from 'react';
import { Search, Edit3, CheckCircle2, XCircle, Clock, Truck, Eye, User, CreditCard, Package } from 'lucide-react';
import api from '@/lib/axios';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL'); // ALL, PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/admin/all');
      setOrders(response.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === 'CANCELLED') {
      setOrderToCancel(orderId);
      return;
    }

    executeStatusUpdate(orderId, newStatus);
  };

  const executeStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await api.put(`/orders/${orderId}/status?status=${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await api.put(`/orders/${orderId}/payment-status?status=${status}`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: status });
      }
    } catch (error) {
      console.error("Error updating payment status", error);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center w-fit"><Clock size={14} className="mr-1" /> Chờ xác nhận</span>;
      case 'CONFIRMED': return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center w-fit"><Package size={14} className="mr-1" /> Chờ xuất kho</span>;
      case 'SHIPPING': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center w-fit"><Truck size={14} className="mr-1" /> Đang giao hàng</span>;
      case 'DELIVERED': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center w-fit"><CheckCircle2 size={14} className="mr-1" /> Đã giao hàng</span>;
      case 'CANCELLED': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center w-fit"><XCircle size={14} className="mr-1" /> Đã hủy</span>;
      default: return <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-bold w-fit">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Quản lý Đơn hàng</h2>
      </div>

      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 xl:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ xác nhận' },
            { id: 'CONFIRMED', label: 'Chờ xuất kho' },
            { id: 'SHIPPING', label: 'Đang giao' },
            { id: 'DELIVERED', label: 'Đã giao' },
            { id: 'CANCELLED', label: 'Đã hủy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã ĐH, SĐT, Tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm w-full xl:w-72"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-sm">
              <th className="p-4 font-medium rounded-tl-xl">Mã đơn hàng</th>
              <th className="p-4 font-medium">Khách hàng</th>
              <th className="p-4 font-medium">Ngày đặt</th>
              <th className="p-4 font-medium">Cập nhật cuối</th>
              <th className="p-4 font-medium">Tổng tiền</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500">Đang tải dữ liệu...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500">Không có đơn hàng nào</td>
              </tr>
            ) : (
              orders.filter(o => {
                const matchTab = activeTab === 'ALL' || o.orderStatus === activeTab;
                if (!matchTab) return false;
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                const matchPhone = o.phone && o.phone.includes(query);
                const matchId = o.id && o.id.toLowerCase().includes(query);
                const matchName = o.fullName && o.fullName.toLowerCase().includes(query);
                return matchPhone || matchId || matchName;
              }).map(order => (
                <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sm">#{order.id.split('-')[0].toUpperCase()}</td>
                  <td className="p-4">
                    <p className="font-bold">{order.fullName}</p>
                    <p className="text-xs text-neutral-500">{order.phone}</p>
                  </td>
                  <td className="p-4 text-sm text-neutral-600">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-4 text-sm text-neutral-600">
                    {new Date(order.updatedAt || order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="p-4 font-bold text-orange-500">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.finalAmount)}
                  </td>
                  <td className="p-4 flex flex-col gap-1 items-start">
                    {getStatusBadge(order.orderStatus)}
                    {order.orderStatus === 'CANCELLED' && order.paymentStatus === 'PAID' && (
                      <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] uppercase tracking-wider font-bold shadow-sm">
                        CẦN HOÀN TIỀN
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-neutral-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      {order.orderStatus === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'SHIPPING')}
                          disabled={updating === order.id}
                          className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap flex items-center"
                          title="Xác nhận xuất kho"
                        >
                          <Package size={14} className="mr-1" /> Xuất kho
                        </button>
                      )}
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        disabled={updating === order.id || order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED'}
                        className="text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-50"
                      >
                        <option value="PENDING">Chờ xác nhận</option>
                        <option value="CONFIRMED">Chờ xuất kho</option>
                        <option value="SHIPPING">Đang giao</option>
                        <option value="DELIVERED">Đã giao</option>
                        <option value="CANCELLED">Hủy đơn</option>
                      </select>
                      {updating === order.id && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-orange-500"></div>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Hủy đơn hàng?</h3>
            <p className="text-neutral-500 text-center mb-6">Bạn có chắc chắn muốn hủy đơn hàng #{orderToCancel.split('-')[0].toUpperCase()} không? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setOrderToCancel(null)}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
              >
                Không, quay lại
              </button>
              <button
                onClick={() => {
                  executeStatusUpdate(orderToCancel, 'CANCELLED');
                  setOrderToCancel(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <div>
                <h3 className="text-xl font-bold">Chi tiết đơn hàng #{selectedOrder.id.split('-')[0].toUpperCase()}</h3>
                <p className="text-sm text-neutral-500 mt-1">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <h4 className="font-bold mb-3 text-neutral-800 flex items-center"><User size={16} className="mr-2" /> Thông tin khách hàng</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-500">Họ tên:</span> <span className="font-medium">{selectedOrder.fullName}</span></p>
                    <p><span className="text-neutral-500">Điện thoại:</span> <span className="font-medium">{selectedOrder.phone}</span></p>
                    <p><span className="text-neutral-500">Địa chỉ:</span> <span className="font-medium">{selectedOrder.shippingAddress}</span></p>
                    {selectedOrder.orderNote && <p><span className="text-neutral-500">Ghi chú:</span> <span className="font-medium">{selectedOrder.orderNote}</span></p>}
                  </div>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <h4 className="font-bold mb-3 text-neutral-800 flex items-center"><CreditCard size={16} className="mr-2" /> Thông tin thanh toán</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-500">Phương thức:</span> <span className="font-medium">{selectedOrder.paymentMethod}</span></p>
                    <p><span className="text-neutral-500">Trạng thái TT:</span> <span className={`font-bold ${selectedOrder.paymentStatus === 'PAID' && selectedOrder.orderStatus === 'CANCELLED' ? 'text-red-600' :
                        selectedOrder.paymentStatus === 'PAID' ? 'text-green-600' :
                          selectedOrder.paymentStatus === 'REFUNDED' ? 'text-blue-600' : 'text-yellow-600'
                      }`}>
                      {selectedOrder.paymentStatus === 'PAID' && selectedOrder.orderStatus === 'CANCELLED' ? 'Đã thanh toán (Cần hoàn tiền)' :
                        selectedOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' :
                          selectedOrder.paymentStatus === 'REFUNDED' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}
                    </span></p>
                    <p><span className="text-neutral-500">Trạng thái ĐH:</span> <span className="mt-1 block">{getStatusBadge(selectedOrder.orderStatus)}</span></p>
                  </div>
                </div>
              </div>

              {selectedOrder.orderStatus === 'CANCELLED' && (selectedOrder.paymentStatus === 'PAID' || selectedOrder.paymentStatus === 'REFUNDED') && (
                <div className={`mb-6 p-4 border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${selectedOrder.paymentStatus === 'PAID' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-start gap-3">
                    {selectedOrder.paymentStatus === 'PAID' ? (
                      <XCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    ) : (
                      <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
                    )}
                    <div>
                      <h4 className={`font-bold ${selectedOrder.paymentStatus === 'PAID' ? 'text-red-800' : 'text-green-800'}`}>
                        {selectedOrder.paymentStatus === 'PAID' ? 'Cần hoàn tiền cho khách hàng' : 'Đã hoàn tiền cho khách hàng'}
                      </h4>
                      <p className={`text-sm mt-1 ${selectedOrder.paymentStatus === 'PAID' ? 'text-red-700' : 'text-green-700'}`}>
                        Đơn hàng này đã được chuyển khoản thành công nhưng đã bị hủy.
                        {selectedOrder.paymentStatus === 'PAID' && ' Vui lòng liên hệ khách hàng để nhận thông tin STK và chuyển khoản hoàn tiền thủ công.'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 w-full sm:w-auto relative">
                    {updating === selectedOrder.id && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div>
                      </div>
                    )}
                    <select
                      value={selectedOrder.paymentStatus}
                      onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                      disabled={updating === selectedOrder.id}
                      className={`w-full sm:w-auto px-4 py-2 ${selectedOrder.paymentStatus === 'PAID' ? 'border-1 border-neutral-300 bg-neutral-300 hover:bg-neutral-400 text-black' : 'bg-green-600 hover:bg-green-700 text-white'} text-sm font-bold rounded-lg transition-colors disabled:opacity-50 appearance-none cursor-pointer outline-none ${updating === selectedOrder.id ? 'pr-8' : ''}`}
                    >
                      <option value="PAID" className="bg-white text-black">Chưa xử lý</option>
                      <option value="REFUNDED" className="bg-white text-black">Đã hoàn tiền</option>
                    </select>
                  </div>
                </div>
              )}

              <h4 className="font-bold mb-4 text-lg">Danh sách sản phẩm</h4>
              <div className="space-y-4">
                {selectedOrder.items && selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-xl hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white border border-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 bg-neutral-100">No Img</div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold line-clamp-1">{item.productName}</p>
                        <p className="text-sm text-neutral-500 mt-0.5">Màu: {item.color} | Size: {item.size}</p>
                        <p className="text-sm font-medium mt-1">SL: {item.quantity} x {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)}</p>
                      </div>
                    </div>
                    <p className="font-bold text-orange-500 whitespace-nowrap ml-4">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-neutral-100 pt-6 space-y-3">
                <div className="flex justify-between text-neutral-600 text-sm">
                  <span>Tạm tính</span>
                  <span className="font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.totalAmount || selectedOrder.finalAmount)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-orange-500 text-sm">
                    <span>Giảm giá</span>
                    <span className="font-medium">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg mt-4 pt-4 border-t border-neutral-100">
                  <span className="font-bold">Tổng cộng</span>
                  <span className="font-black text-orange-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.finalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-black text-white font-bold rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
