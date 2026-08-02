'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, DollarSign, Users, Package, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const TOP_LIMIT = 10;

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
  const [mounted, setMounted] = useState(false);

  const token = useAuthStore(state => state.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !token) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const [statsRes, bestSellersRes] = await Promise.all([
          api.get(`/dashboard/stats?type=${filterType}`),
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
  }, [filterType, mounted, token]);

  const cards = [
    { title: 'Tổng Doanh Thu', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue), icon: <DollarSign size={24} />, color: 'bg-green-500', trend: stats.revenueTrend },
    { title: 'Đơn Hàng', value: stats.totalOrders.toString(), icon: <ShoppingBag size={24} />, color: 'bg-blue-500', trend: stats.ordersTrend },
    { title: 'Sản Phẩm', value: stats.totalProducts.toString(), icon: <Package size={24} />, color: 'bg-orange-500', trend: stats.productsTrend },
    { title: 'Khách Hàng', value: stats.customers.toString(), icon: <Users size={24} />, color: 'bg-purple-500', trend: stats.customersTrend },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-[50vh] text-neutral-500 font-medium text-lg">Đang tính toán số liệu thống kê...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header and Filter */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">Tổng quan Hệ thống</h1>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-neutral-200 text-neutral-700 py-2 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
        >
          <option value="day">7 ngày gần nhất</option>
          <option value="month">6 tháng gần nhất</option>
          <option value="year">5 năm gần nhất</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl text-white ${card.color}`}>
                {card.icon}
              </div>
              <span className="flex items-center text-sm font-bold text-green-500 bg-green-50 px-2.5 py-1 rounded-full">
                <TrendingUp size={14} className="mr-1" /> {card.trend}
              </span>
            </div>
            <h3 className="text-neutral-500 text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-2xl font-black text-neutral-900">{card.value}</p>
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
            Doanh thu {filterType === 'day' ? '7 ngày' : filterType === 'month' ? '6 tháng' : '5 năm'} qua
          </h3>
          <div className="h-80" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
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
            Đơn hàng {filterType === 'day' ? '7 ngày' : filterType === 'month' ? '6 tháng' : '5 năm'} qua
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
        <h3 className="text-lg font-bold mb-6">Biểu đồ Top Sản Phẩm Bán Chạy</h3>
        <div className="h-96" style={{ minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart
              data={[...bestSellers].sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0)).slice(0, TOP_LIMIT).map((p, i) => ({
                name: p.nameVi.length > 20 ? p.nameVi.substring(0, 20) + '...' : p.nameVi,
                'Chỉ số bán chạy': p.soldQuantity || 0
              }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f5" />
              <XAxis type="number" axisLine={false} tickLine={false} hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="Chỉ số bán chạy" fill="#f97316" radius={[0, 8, 8, 0]} barSize={24} />
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
                <th className="p-4 font-medium text-right rounded-tr-xl">Giá bán</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">Chưa có dữ liệu</td>
                </tr>
              ) : (
                [...bestSellers].sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0)).slice(0, TOP_LIMIT).map((product, index) => (
                  <tr key={product.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-bold text-neutral-400">{index + 1}</td>
                    <td className="p-4">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images.find((img: any) => img.isPrimary)?.imageUrl || product.images[0].imageUrl} alt={product.nameVi} className="w-12 h-12 object-cover rounded-xl" />
                      ) : (
                        <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-400">
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
