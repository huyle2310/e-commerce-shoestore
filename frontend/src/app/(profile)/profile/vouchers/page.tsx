'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import Link from 'next/link';
import { User, ShieldCheck, Tag, Copy, CheckCircle2, Ticket, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VouchersPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [rankName, setRankName] = useState('MEMBER');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile/vouchers');
      return;
    }

    const fetchData = async () => {
      try {
        const profileRes = await api.get('/users/profile');
        setRankName(profileRes.data.rankName || 'MEMBER');

        const [availableRes, myVouchersRes] = await Promise.all([
          api.get('/vouchers/available'),
          api.get('/vouchers/my-vouchers')
        ]);
        
        setAvailableVouchers(Array.isArray(availableRes.data) ? availableRes.data : []);
        setMyVouchers(Array.isArray(myVouchersRes.data) ? myVouchersRes.data : []);
      } catch (err) {
        toast.error('Không thể tải dữ liệu voucher');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router]);

  const handleClaimVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã voucher');
      return;
    }
    setClaiming(true);
    try {
      await api.post(`/vouchers/claim?code=${voucherCode.trim()}`);
      toast.success('Lưu mã thành công!');
      setVoucherCode('');
      // Reload vouchers
      const [availableRes, myVouchersRes] = await Promise.all([
        api.get('/vouchers/available'),
        api.get('/vouchers/my-vouchers')
      ]);
      setAvailableVouchers(Array.isArray(availableRes.data) ? availableRes.data : []);
      setMyVouchers(Array.isArray(myVouchersRes.data) ? myVouchersRes.data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện');
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimVoucherFromList = async (code: string) => {
    try {
      await api.post(`/vouchers/claim?code=${code}`);
      toast.success('Lưu mã thành công!');
      const [availableRes, myVouchersRes] = await Promise.all([
        api.get('/vouchers/available'),
        api.get('/vouchers/my-vouchers')
      ]);
      setAvailableVouchers(Array.isArray(availableRes.data) ? availableRes.data : []);
      setMyVouchers(Array.isArray(myVouchersRes.data) ? myVouchersRes.data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black tracking-tight mb-8">KHO VOUCHER</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-neutral-200 rounded-full flex items-center justify-center font-bold text-3xl text-neutral-500 uppercase overflow-hidden border-4 border-white shadow-lg mb-4">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <h2 className="text-xl font-bold">{user?.fullName}</h2>
              <div className="flex space-x-2 mt-2 justify-center">
                <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">
                  Hạng: {rankName}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-2">
              <Link href="/profile" className="font-bold flex items-center gap-2 text-neutral-500 hover:bg-neutral-50 p-3 rounded-lg transition-colors">
                <User size={18} /> Thông tin cá nhân
              </Link>
              <Link href="/profile/vouchers" className="font-bold flex items-center gap-2 text-black bg-neutral-100 p-3 rounded-lg">
                <Tag size={18} /> Kho Voucher
              </Link>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="md:col-span-2 space-y-6">
            
            {/* 1. Claim Voucher Form */}
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Plus size={20} className="mr-2 text-orange-500" /> Nhập mã khuyến mãi
              </h3>
              <form onSubmit={handleClaimVoucher} className="flex gap-4">
                <input 
                  type="text" 
                  value={voucherCode} 
                  onChange={(e) => setVoucherCode(e.target.value)} 
                  placeholder="Nhập mã giảm giá..."
                  className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none uppercase font-bold tracking-wide" 
                />
                <button 
                  type="submit" 
                  disabled={claiming}
                  className="px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-70 flex-shrink-0"
                >
                  {claiming ? 'Đang xử lý...' : 'Lưu mã'}
                </button>
              </form>
            </div>

            {/* 2. My Vouchers */}
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 border-b border-neutral-100 pb-4 flex items-center">
                <Ticket size={20} className="mr-2 text-green-500" /> Mã giảm giá của tôi
              </h3>
              
              {myVouchers.length === 0 ? (
                <div className="text-center py-8 bg-neutral-50 rounded-xl">
                  <Ticket size={32} className="mx-auto text-neutral-300 mb-3" />
                  <p className="text-neutral-500 font-medium">Bạn chưa có mã giảm giá nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myVouchers.map((v: any) => {
                    const daysLeft = Math.ceil((new Date(v.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div
                        key={v.id}
                        className="relative overflow-hidden rounded-xl border-2 border-solid border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-black text-lg text-green-700 tracking-wider">{v.code}</span>
                            </div>
                            <p className="text-sm font-bold text-neutral-800 mb-1">
                              {v.discountType === 'PERCENTAGE'
                                ? `Giảm ${v.discountValue}%`
                                : `Giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discountValue)}`}
                              {v.maxDiscountAmount && (
                                <span className="text-xs font-normal text-neutral-500"> (tối đa {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.maxDiscountAmount)})</span>
                              )}
                            </p>
                            {v.minOrderValue > 0 && (
                              <p className="text-xs text-neutral-500">Đơn tối thiểu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.minOrderValue)}</p>
                            )}
                            <p className={`text-xs font-medium mt-1 ${daysLeft <= 3 ? 'text-red-500' : 'text-neutral-500'}`}>
                              HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(v.code);
                              toast.success('Đã sao chép mã!');
                            }}
                            className="flex-shrink-0 flex flex-col items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors"
                            title="Sao chép mã"
                          >
                            <Copy size={16} />
                            <span className="text-xs font-bold">Copy</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Available Vouchers */}
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 border-b border-neutral-100 pb-4 flex items-center">
                <Tag size={20} className="mr-2 text-orange-500" /> Mã giảm giá có thể nhận
              </h3>
              
              {availableVouchers.length === 0 ? (
                <div className="text-center py-8 bg-neutral-50 rounded-xl">
                  <Tag size={32} className="mx-auto text-neutral-300 mb-3" />
                  <p className="text-neutral-500 font-medium">Hiện không có mã giảm giá mới nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableVouchers.map((v: any) => {
                    const isClaimed = myVouchers.some(mv => mv.id === v.id);
                    return (
                      <div
                        key={v.id}
                        className={`relative overflow-hidden rounded-xl border-2 border-dashed ${isClaimed ? 'border-neutral-200 bg-neutral-50 opacity-70' : 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50'} p-4`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-black text-lg ${isClaimed ? 'text-neutral-500' : 'text-orange-600'} tracking-wider`}>{v.code}</span>
                            </div>
                            <p className="text-sm font-bold text-neutral-800 mb-1">
                              {v.discountType === 'PERCENTAGE'
                                ? `Giảm ${v.discountValue}%`
                                : `Giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discountValue)}`}
                            </p>
                            {v.minOrderValue > 0 && (
                              <p className="text-xs text-neutral-500">Đơn tối thiểu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.minOrderValue)}</p>
                            )}
                            {v.requiredRank && (
                              <p className="text-xs text-yellow-600 font-medium mt-1">🏅 Hạng: {v.requiredRank}</p>
                            )}
                          </div>
                          {!isClaimed ? (
                            <button
                              onClick={() => handleClaimVoucherFromList(v.code)}
                              className="flex-shrink-0 flex flex-col items-center gap-1 bg-black hover:bg-neutral-800 text-white px-3 py-2 rounded-lg transition-colors"
                              title="Lưu mã"
                            >
                              <Plus size={16} />
                              <span className="text-xs font-bold">Lưu</span>
                            </button>
                          ) : (
                            <div className="flex-shrink-0 flex flex-col items-center gap-1 bg-neutral-200 text-neutral-500 px-3 py-2 rounded-lg">
                              <CheckCircle2 size={16} />
                              <span className="text-xs font-bold">Đã lưu</span>
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
        </div>
      </div>
    </div>
  );
}
