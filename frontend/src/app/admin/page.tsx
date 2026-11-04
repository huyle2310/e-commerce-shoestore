'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, DollarSign, Users, Package, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const TOP_LIMIT = 10; // Số lượng top sp

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    customers: 0,
    productsTrend: '+0%',
    ordersTrend: '+0%',
    revenueTrend: '+0%',
    customersTrend: '+0%',
    chartData: []
  });
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mounted, setMounted] = useState(false);

  const token = useAuthStore(state => state.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !token) return;

    const fetchStats = async () => {
      if (filterType === 'custom' && (!startDate || !endDate)) return;
      setLoading(true);
      try {
        let url = `/dashboard/stats?type=${filterType}`;
        if (filterType === 'custom' && startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const [statsRes, bestSellersRes] = await Promise.all([
          api.get(url),
          api.get(`/products/best-sellers?limit=${TOP_LIMIT}`)
        ]);
        setStats(statsRes.data);
        setBestSellers(bestSellersRes.data);
      } catch (err: any) {
        console.error("Error fetching admin stats", err);
        // Nếu 403 thì token có thể đã hết hạn - không crash UI
        if (err?.response?.status === 403 || err?.response?.status === 401) {
          console.warn('Không có quyền truy cập dashboard stats');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [filterType, startDate, endDate, mounted, token]);

  const cards = [
    { title: 'DOANH THU TỔNG', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue), icon: <DollarSign size={20} />, trend: stats.revenueTrend },
    { title: 'TỔNG ĐƠN HÀNG', value: stats.totalOrders.toString(), icon: <ShoppingBag size={20} />, trend: stats.ordersTrend },
    { title: 'SKU ĐANG HOẠT ĐỘNG', value: stats.totalProducts.toString(), icon: <Package size={20} />, trend: stats.productsTrend },
    { title: 'KHÁCH HÀNG ĐĂNG KÝ', value: stats.customers.toString(), icon: <Users size={20} />, trend: stats.customersTrend },
  ];

  if (loading && stats.chartData.length === 0) {
    return <div className="flex items-center justify-center h-[50vh] text-neutral-500 font-medium text-lg">Đang tính toán số liệu thống kê...</div>;
  }

  return (
    <div className="space-y-8 bg-[#F8F9FA] text-neutral-900 p-6 min-h-screen">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="text-[10px] font-mono text-orange-600 uppercase tracking-widest font-bold">[TỔNG QUAN HỆ THỐNG]</div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900 mt-1">BẢNG ĐIỀU KHIỂN TRUNG TÂM</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {filterType === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" max={endDate || new Date().toISOString().split('T')[0]} value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-neutral-200 text-neutral-700 py-2 px-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium" />
              <span className="font-medium text-neutral-500">-</span>
              <input type="date" min={startDate} max={new Date().toISOString().split('T')[0]} value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border border-neutral-200 text-neutral-700 py-2 px-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium" />
            </div>
          )}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 py-2 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          >
            <option value="day">7 ngày gần nhất</option>
            <option value="month">6 tháng gần nhất</option>
            <option value="year">5 năm gần nhất</option>
            <option value="custom">Tùy chọn</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-5 border border-neutral-200 rounded-2xl shadow-xs"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl border border-orange-100 bg-orange-50 text-orange-600">
                {card.icon}
              </div>
              <span className="flex items-center text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <TrendingUp size={12} className="mr-1" /> {card.trend}
              </span>
            </div>
            <h3 className="text-neutral-500 font-mono text-[11px] uppercase tracking-wider mb-1 font-semibold">{card.title}</h3>
            <p className="text-xl font-mono font-black text-neutral-900">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm"
        >
          <h3 className="text-lg font-bold mb-6">
            Doanh thu {filterType === 'custom' && startDate && endDate ? `từ ${startDate} đến ${endDate}` : (filterType === 'day' ? '7 ngày' : filterType === 'month' ? '6 tháng' : '5 năm') + ' qua'}
          </h3>
          <div className="h-80" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: unknown) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(typeof value === 'number' ? value : Number(value) || 0)}
                />
                <Bar dataKey="sales" name="Doanh thu" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm"
        >
          <h3 className="text-lg font-bold mb-6">
            Đơn hàng {filterType === 'custom' && startDate && endDate ? `từ ${startDate} đến ${endDate}` : (filterType === 'day' ? '7 ngày' : filterType === 'month' ? '6 tháng' : '5 năm') + ' qua'}
          </h3>
          <div className="h-80" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="orders" name="Đơn hàng" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Best Sellers Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm mt-8"
      >
        <h3 className="text-lg font-bold mb-6">Top Sản Phẩm Bán Chạy</h3>
        <div className="h-96" style={{ minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart
              data={[...bestSellers].sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0)).slice(0, TOP_LIMIT).map((p, i) => ({
                name: p.nameVi.length > 20 ? p.nameVi.substring(0, 20) + '...' : p.nameVi,
                'Đã bán': p.soldQuantity || 0
              }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f5" />
              <XAxis type="number" axisLine={false} tickLine={false} hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="Đã bán" fill="#f97316" radius={[0, 8, 8, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Best Sellers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm mt-8"
      >
        <h3 className="text-lg font-bold mb-6">Chi tiết Top {TOP_LIMIT} Sản Phẩm Bán Chạy Nhất</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm">
                <th className="p-4 font-medium rounded-tl-xl w-16">#</th>
                <th className="p-4 font-medium w-24">Ảnh</th>
                <th className="p-4 font-medium">Sản phẩm</th>
                <th className="p-4 font-medium">Danh mục</th>
                <th className="p-4 font-medium">Thương hiệu</th>
                <th className="p-4 font-medium text-center">Đã bán</th>
                <th className="p-4 font-medium text-right">Giá bán</th>
                <th className="p-4 font-medium text-right rounded-tr-xl">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500">Chưa có dữ liệu</td>
                </tr>
              ) : (
                [...bestSellers].sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0)).slice(0, TOP_LIMIT).map((product, index) => (
                  <tr key={product.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-bold text-neutral-400">{index + 1}</td>
                    <td className="p-4">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images.find((img: any) => img.isPrimary)?.imageUrl || product.images[0].imageUrl} alt={product.nameVi} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400">
                          <Package size={20} />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-neutral-900">{product.nameVi}</div>
                      <div className="text-xs text-neutral-500">{product.slug}</div>
                    </td>
                    <td className="p-4 text-sm text-neutral-500">{product.category?.nameVi || '-'}</td>
                    <td className="p-4 text-sm text-neutral-500">{product.brand?.name || '-'}</td>
                    <td className="p-4 text-center font-bold text-neutral-900">{product.soldQuantity || 0}</td>
                    <td className="p-4 text-right font-bold text-orange-500">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}
                    </td>
                    <td className="p-4 text-right font-black text-green-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice * (product.soldQuantity || 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
