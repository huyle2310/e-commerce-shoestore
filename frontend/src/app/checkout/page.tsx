'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { MapPin, Phone, User, CreditCard, ArrowRight, ShieldCheck, Banknote, Ticket, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const { items: cartItems, buyNowItem, totalAmount: cartTotal, fetchCart, setBuyNowItem } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const items = buyNowItem ? [buyNowItem] : cartItems;
  const totalAmount = buyNowItem ? buyNowItem.totalPrice : cartTotal;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    streetAddress: '', // changed from shippingAddress
    orderNote: '',
    paymentMethod: 'COD'
  });

  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);
  const [error, setError] = useState('');

  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [userAddress, setUserAddress] = useState('');

  // Keep the preview aligned with the backend's delivery policy. The backend
  // remains the source of truth when the order is created.
  const provinceName = selectedProvince?.name || '';
  const shippingFee = provinceName.includes('Hồ Chí Minh') || provinceName.includes('HCM')
    ? 20000
    : 40000;

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [eligibleVouchers, setEligibleVouchers] = useState<any[]>([]);

  const finalAmount = Math.max(totalAmount + shippingFee - discountAmount, 0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      const fetchProfile = async () => {
        try {
          const response = await api.get('/users/profile');
          const data = response.data;
          setFormData(prev => ({
            ...prev,
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            streetAddress: data.address || ''
          }));
          if (data.address) {
            setUserAddress(data.address);
          }

          try {
            const [myVouchersRes, availableRes] = await Promise.all([
              api.get('/vouchers/my-vouchers'),
              api.get('/vouchers/available')
            ]);
            const combined = [...(myVouchersRes.data || []), ...(availableRes.data || [])];
            const uniqueVouchers = Array.from(new Map(combined.map((v: any) => [v.id, v])).values()) as any[];

            const now = new Date();
            const eligible = uniqueVouchers.filter(v => {
              const startDate = new Date(v.startDate);
              const endDate = new Date(v.endDate);
              return v.isActive && now >= startDate && now <= endDate && totalAmount >= (v.minOrderValue || 0) && (v.usageLimit ? v.usedCount < v.usageLimit : true);
            });
            setEligibleVouchers(eligible);
          } catch (e) {
            console.error("Error fetching vouchers", e);
          }
        } catch (error) {
          console.error("Error fetching profile", error);
        }
      };
      fetchProfile();
    }
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('https://provinces.open-api.vn/api/v2/');
        const data = await response.json();
        setProvinces(data);
      } catch (err) {
        console.error("Error fetching provinces", err);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (userAddress && provinces.length > 0) {
      const parts = userAddress.split(', ').map(s => s.trim());
      if (parts.length >= 2) {
        const provinceName = parts[parts.length - 1];
        let wardName = parts.length >= 3 ? parts[parts.length - 2] : '';
        const street = parts.slice(0, parts.length - (parts.length >= 3 ? 2 : 1)).join(', ');

        const matchedProvince = provinces.find(p => p.name === provinceName);
        if (matchedProvince) {
          setSelectedProvince(matchedProvince);
          setFormData(prev => ({ ...prev, streetAddress: street }));
          
          fetch(`https://provinces.open-api.vn/api/v2/p/${matchedProvince.code}?depth=2`)
            .then(res => res.json())
            .then(data => {
              if (data.wards) {
                setWards(data.wards);
                if (wardName) {
                  const matchedWard = data.wards.find((w: any) => w.name === wardName);
                  if (matchedWard) {
                    setSelectedWard(matchedWard);
                  }
                }
              }
            })
            .catch(err => console.error(err));
        }
      }
    }
  }, [userAddress, provinces]);

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = parseInt(e.target.value);
    const province = provinces.find(p => p.code === provinceCode);
    setSelectedProvince(province);
    setWards([]);
    setSelectedWard(null);
    if (provinceCode) {
      try {
        const response = await fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`);
        const data = await response.json();
        if (data.wards) setWards(data.wards);
      } catch (err) {
        console.error("Error fetching wards", err);
      }
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardCode = parseInt(e.target.value);
    const ward = wards.find(w => w.code === wardCode);
    setSelectedWard(ward);
  };



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    setCheckingVoucher(true);
    try {
      const response = await api.get(`/vouchers/check?code=${voucherCode}&orderTotal=${totalAmount}`);
      const v = response.data;
      setAppliedVoucher(v);

      let discount = 0;
      if (v.discountType === 'PERCENTAGE') {
        discount = totalAmount * (v.discountValue / 100);
        if (v.maxDiscountAmount && discount > v.maxDiscountAmount) {
          discount = v.maxDiscountAmount;
        }
      } else {
        discount = v.discountValue;
      }
      setDiscountAmount(discount);
      toast.success('Áp dụng mã giảm giá thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ');
      setAppliedVoucher(null);
      setDiscountAmount(0);
    } finally {
      setCheckingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherCode('');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    
    if (items.length === 0) {
      setError('Giỏ hàng trống');
      return;
    }

    if (!selectedProvince || (wards.length > 0 && !selectedWard) || !formData.streetAddress) {
      setError('Vui lòng điền đầy đủ địa chỉ giao hàng');
      return;
    }

    isSubmitting.current = true;
    setLoading(true);
    setError('');

    const wardString = selectedWard ? `${selectedWard.name}, ` : '';
    const fullShippingAddress = `${formData.streetAddress}, ${wardString}${selectedProvince.name}`;

    try {
      let response;
      if (isAuthenticated) {
        const submitData: any = {
          ...formData,
          shippingAddress: fullShippingAddress,
          province: selectedProvince.name,
          voucherCode: appliedVoucher ? appliedVoucher.code : undefined
        };
        // Nếu là mua ngay (buyNow), gửi kèm items để backend ưu tiên tạo đơn trực tiếp
        if (buyNowItem) {
          submitData.items = [{ variantId: buyNowItem.variantId, quantity: buyNowItem.quantity }];
        }
        response = await api.post('/orders', submitData);
        if (!buyNowItem) await fetchCart(); // Clear server cart state if it was a cart order
      } else {
        const submitData = {
          ...formData,
          shippingAddress: fullShippingAddress,
          province: selectedProvince.name,
          items: items.map(item => ({ variantId: item.variantId, quantity: item.quantity }))
        };
        response = await api.post('/orders/guest', submitData);
        if (!buyNowItem) useCartStore.getState().clearLocalCart(); // Clear local cart
      }

      // Xóa buyNowItem sau khi mua xong
      if (buyNowItem) {
        setBuyNowItem(null);
      }

      if (formData.paymentMethod === 'SEPAY') {
        // Use the server-calculated amount. It includes the authoritative
        // shipping fee, voucher discount, and any clearance pricing.
        router.push(`/checkout/sepay?orderId=${response.data.id}&amount=${response.data.finalAmount}`);
      } else {
        router.push(`/checkout/success?orderId=${response.data.id.split('-')[0].toUpperCase()}`);
      }
    } catch (err: any) {
      isSubmitting.current = false;
      setLoading(false);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
      toast.error('Đặt hàng thất bại');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Đơn hàng trống</h2>
        <button onClick={() => router.push('/shop')} className="px-6 hover:cursor-pointer py-3 bg-black text-white rounded-full">Mua sắm ngay</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black tracking-tight mb-8">THANH TOÁN</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Form */}
          <div className="lg:w-2/3">
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              {error && <div className="p-4 bg-red-100 text-red-600 rounded-lg font-medium">{error}</div>}

              <div className="bg-white p-8 rounded-3xl border border-neutral-100">
                <h2 className="text-xl font-bold mb-6 flex items-center"><User className="mr-2" /> Thông tin giao hàng</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2">Họ và tên người nhận</label>
                    <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2">Địa chỉ Email {(!isAuthenticated)}</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2">Số điện thoại liên hệ</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-500 mb-2">Tỉnh / Thành phố</label>
                      <select required className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" onChange={handleProvinceChange} value={selectedProvince ? selectedProvince.code : ""}>
                        <option value="" disabled>Chọn Tỉnh/Thành phố</option>
                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                      </select>
                    </div>
                    {wards.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-500 mb-2">Phường / Xã</label>
                        <select required className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" onChange={handleWardChange} value={selectedWard ? selectedWard.code : ""} disabled={!selectedProvince}>
                          <option value="" disabled>Chọn Phường/Xã</option>
                          {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2">Số nhà, Tên đường (Quận / Huyện nếu có)</label>
                    <input required type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange} placeholder="VD: 123 Nguyễn Văn Cừ, Quận 5" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2">Ghi chú đơn hàng (Tùy chọn)</label>
                    <textarea name="orderNote" value={formData.orderNote} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-neutral-100">
                <h2 className="text-xl font-bold mb-6 flex items-center"><CreditCard className="mr-2" /> Phương thức thanh toán</h2>
                <div className="space-y-4">
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                    <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} className="hidden" />
                    <Banknote size={24} className={formData.paymentMethod === 'COD' ? 'text-orange-500' : 'text-neutral-400'} />
                    <div className="ml-4">
                      <span className="block font-bold">Thanh toán khi nhận hàng (COD)</span>
                      <span className="text-sm text-neutral-500">Thanh toán bằng tiền mặt khi đơn hàng được giao đến</span>
                    </div>
                  </label>
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'SEPAY' ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                    <input type="radio" name="paymentMethod" value="SEPAY" checked={formData.paymentMethod === 'SEPAY'} onChange={handleChange} className="hidden" />
                    <CreditCard size={24} className={formData.paymentMethod === 'SEPAY' ? 'text-orange-500' : 'text-neutral-400'} />
                    <div className="ml-4">
                      <span className="block font-bold">Chuyển khoản Ngân hàng (Mã QR)</span>
                      <span className="text-sm text-neutral-500">Quét mã QR bằng App Ngân hàng hoặc MoMo. Hệ thống duyệt tự động.</span>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 sticky top-28">
              <h3 className="text-xl font-bold mb-6">Đơn hàng của bạn</h3>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex items-start">
                      <div className="relative">
                        <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.productName} className="w-16 h-16 object-cover rounded-lg bg-neutral-100" />
                        <span className="absolute -top-2 -right-2 bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                      </div>
                      <div className="ml-3">
                        <p className="font-bold line-clamp-2">{item.productName}</p>
                        <p className="text-neutral-500">{item.size} / {item.color}</p>
                      </div>
                    </div>
                    <span className="font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 text-neutral-600 text-sm border-t border-neutral-100 pt-6">
                {isAuthenticated ? (
                  <div className="mb-4">
                    <p className="text-sm font-bold mb-2 flex items-center text-black"><Ticket size={16} className="mr-1" /> Mã giảm giá</p>

                    {eligibleVouchers.length > 0 && !appliedVoucher && (
                      <div className="mb-3">
                        <select
                          className="w-full px-4 py-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-md outline-none focus:border-orange-500 font-medium"
                          onChange={(e) => {
                            setVoucherCode(e.target.value);
                          }}
                          value={voucherCode}
                        >
                          <option value="">-- Chọn mã giảm giá có sẵn --</option>
                          {eligibleVouchers.map(v => (
                            <option key={v.id} value={v.code}>
                              {v.code} - Giảm {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discountValue)} (Đơn tối thiểu {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.minOrderValue || 0)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã..."
                        className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-orange-500 uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={!voucherCode || checkingVoucher}
                        className="px-4 py-2 bg-black text-white rounded-lg font-bold disabled:opacity-50"
                      >
                        Áp dụng
                      </button>
                    </div>
                    {appliedVoucher && (
                      <div className="mt-2 text-sm text-green-600 font-medium flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                        <span>Đã áp dụng mã <b>{appliedVoucher.code}</b></span>
                        <button type="button" onClick={removeVoucher} className="text-neutral-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-sm font-medium text-center">
                    Vui lòng <a href="/login?redirect=/checkout" className="underline font-bold">đăng nhập</a> để nhận các ưu đãi
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-100 pt-4">
                  <span>Tạm tính</span>
                  <span className="font-medium text-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hàng</span>
                  <span className="font-medium text-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-orange-500 font-medium">
                    <span>Giảm giá</span>
                    <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 pt-6 mb-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-lg">Tổng cộng</span>
                  <span className="font-black text-3xl text-orange-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full flex items-center justify-center bg-black text-white font-bold text-lg py-4 rounded-full hover:bg-neutral-800 transition-all group disabled:opacity-70"
              >
                {loading ? 'Đang xử lý...' : (
                  <>Hoàn tất đặt hàng <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>

              <p className="text-center text-xs text-neutral-400 mt-6 flex items-center justify-center">
                <ShieldCheck size={14} className="mr-1 text-green-500" /> Thông tin của bạn được bảo mật tuyệt đối
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
