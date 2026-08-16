'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import Link from 'next/link';
import { User, Phone, MapPin, Save, ShieldCheck, Camera, Key, Mail, CheckCircle2, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { isAuthenticated, user, updateUser, updateToken } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    streetAddress: '',
    avatarUrl: '',
    rankName: 'MEMBER'
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [selectedWard, setSelectedWard] = useState<any>(null);

  const [emailData, setEmailData] = useState({
    newEmail: '',
    otp: ''
  });
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile');
      return;
    }

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

    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const data = response.data;
        setFormData({
          fullName: data.fullName || '',
          phone: data.phone || '',
          address: data.address || '',
          streetAddress: data.address || '',
          avatarUrl: data.avatarUrl || '',
          rankName: data.rankName || 'MEMBER'
        });
      } catch (err) {
        toast.error('Không thể tải thông tin cá nhân');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (formData.address && provinces.length > 0 && !selectedProvince) {
      const parts = formData.address.split(', ').map(s => s.trim());
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
  }, [formData.address, provinces]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailData({ ...emailData, [e.target.name]: e.target.value });
  };

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 5MB');
      return;
    }

    try {
      const form = new FormData();
      form.append('file', file);

      const toastId = toast.loading('Đang tải ảnh lên...');
      const response = await api.post('/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const avatarUrl = response.data.url;
      setFormData(prev => ({ ...prev, avatarUrl }));
      toast.success('Tải ảnh thành công, vui lòng bấm Lưu thay đổi', { id: toastId });
    } catch (err) {
      toast.error('Tải ảnh thất bại');
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      let finalAddress = formData.address;
      if (formData.streetAddress || selectedProvince || selectedWard) {
        if (!selectedProvince || !selectedWard || !formData.streetAddress) {
          toast.error('Vui lòng chọn đầy đủ Tỉnh/Thành, Xã/Phường và nhập Tên đường để cập nhật địa chỉ mới');
          setSavingInfo(false);
          return;
        }
        const wardString = selectedWard ? `${selectedWard.name}, ` : '';
        finalAddress = `${formData.streetAddress}, ${wardString}${selectedProvince.name}`;
      }

      await api.put('/users/profile', { ...formData, address: finalAddress });
      updateUser({
        fullName: formData.fullName,
        avatarUrl: formData.avatarUrl
      });
      setFormData(prev => ({ ...prev, address: finalAddress, streetAddress: '' }));
      setSelectedProvince(null);
      setSelectedWard(null);
      setWards([]);
      toast.success('Cập nhật thông tin thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/users/profile/password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Đổi mật khẩu thành công!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailData.newEmail) {
      toast.error('Vui lòng nhập email mới');
      return;
    }
    setIsRequestingEmail(true);
    try {
      await api.post('/users/profile/email/request-change', { newEmail: emailData.newEmail });
      toast.success('Mã xác nhận (OTP) đã được gửi đến email mới của bạn.');
      setOtpSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu đổi email');
    } finally {
      setIsRequestingEmail(false);
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailData.otp) {
      toast.error('Vui lòng nhập mã OTP');
      return;
    }
    setIsConfirmingEmail(true);
    try {
      const response = await api.post('/users/profile/email/confirm-change', { otp: emailData.otp });

      if (response.data.token) {
        updateToken(response.data.token);
      }

      updateUser({ email: response.data.email });
      toast.success('Đổi email thành công!');
      setOtpSent(false);
      setEmailData({ newEmail: '', otp: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsConfirmingEmail(false);
    }
  };

  const getRoleDisplay = (role: string | undefined) => {
    if (!role) return '';
    switch (role) {
      case 'ADMIN': return 'Quản trị viên (Admin)';
      case 'STAFF': return 'Nhân viên';
      case 'CUSTOMER': return 'Khách hàng thành viên';
      default: return role;
    }
  };

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black tracking-tight mb-8">HỒ SƠ CÁ NHÂN</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left Column: Avatar & Basic Stats */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <div className="w-32 h-32 bg-neutral-200 rounded-full flex items-center justify-center font-bold text-4xl text-neutral-500 uppercase overflow-hidden border-4 border-white shadow-lg">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.fullName?.charAt(0) || 'U'
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full shadow-md hover:bg-orange-600 transition-colors"
                >
                  <Camera size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <h2 className="text-xl font-bold">{user?.fullName}</h2>
              <p className="text-neutral-500 text-sm mb-2">{user?.email}</p>
              <div className="flex space-x-2 mt-2 justify-center">
                <div className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
                  {getRoleDisplay(user?.role)}
                </div>
                <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">
                  Hạng: {formData.rankName}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-2">
              <Link href="/profile" className="font-bold flex items-center gap-2 text-black bg-neutral-100 p-3 rounded-lg">
                <User size={18} /> Thông tin cá nhân
              </Link>
              <Link href="/profile/vouchers" className="font-bold flex items-center gap-2 text-neutral-500 hover:bg-neutral-50 p-3 rounded-lg transition-colors">
                <Tag size={18} /> Kho Voucher
              </Link>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center"><ShieldCheck size={18} className="mr-2 text-green-500" /> Bảo mật tài khoản</h3>
              <p className="text-sm text-neutral-500 mb-4">Mật khẩu của bạn được mã hóa an toàn. Hãy đổi mật khẩu thường xuyên để bảo vệ tài khoản.</p>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="md:col-span-2 space-y-6">

            {/* 1. Profile Info Form */}
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 border-b border-neutral-100 pb-4">Thông tin cơ bản</h3>
              <form onSubmit={handleSaveInfo} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2 flex items-center">
                      <User size={16} className="mr-2" /> Họ và tên
                    </label>
                    <input
                      required
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2 flex items-center">
                      <Phone size={16} className="mr-2" /> Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 border border-neutral-200 p-4 rounded-lg bg-neutral-50">
                  <label className="block text-sm font-medium text-neutral-800 flex items-center">
                    <MapPin size={16} className="mr-2 text-orange-500" /> Cập nhật địa chỉ giao hàng
                  </label>
                  
                  {formData.address && (
                    <div className="text-sm text-neutral-600 mb-2 p-3 bg-white border border-neutral-200 rounded-lg">
                      <span className="font-bold">Địa chỉ hiện tại:</span> {formData.address}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Tỉnh/Thành phố</label>
                      <select 
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none text-sm" 
                        onChange={handleProvinceChange} 
                        value={selectedProvince ? selectedProvince.code : ""}
                      >
                        <option value="">-- Chọn Tỉnh/Thành phố --</option>
                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Xã/Phường, Quận/Huyện</label>
                      <select 
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none text-sm" 
                        onChange={handleWardChange} 
                        value={selectedWard ? selectedWard.code : ""} 
                        disabled={!selectedProvince}
                      >
                        <option value="">-- Chọn Xã/Phường, Quận/Huyện --</option>
                        {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Số nhà, Tên đường</label>
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleChange}
                      placeholder="Nhập số nhà, tên đường..."
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    />
                  </div>
                  <p className="text-xs text-neutral-400 italic">Để trống các trường này nếu bạn không muốn thay đổi địa chỉ giao hàng hiện tại.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="flex items-center justify-center px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-70"
                  >
                    {savingInfo ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : <><Save size={18} className="mr-2" /> Lưu thông tin</>}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Change Email Form */}
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 border-b border-neutral-100 pb-4">Đổi địa chỉ Email</h3>

              {!otpSent ? (
                <form onSubmit={handleRequestEmailChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2 flex items-center">
                      <Mail size={16} className="mr-2" /> Địa chỉ email mới
                    </label>
                    <input
                      required
                      type="email"
                      name="newEmail"
                      value={emailData.newEmail}
                      onChange={handleEmailChange}
                      placeholder="Nhập email mới..."
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isRequestingEmail}
                      className="flex items-center justify-center px-6 py-3 bg-neutral-200 text-neutral-800 font-bold rounded-lg hover:bg-neutral-300 transition-all disabled:opacity-70"
                    >
                      {isRequestingEmail ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-neutral-800"></div> : 'Gửi mã xác nhận (OTP)'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmEmailChange} className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-lg flex items-start mb-4">
                    <CheckCircle2 size={20} className="mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Mã OTP đã được gửi!</p>
                      <p className="text-xs mt-1">Vui lòng kiểm tra email của bạn để lấy mã gồm 6 chữ số.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2">Nhập mã OTP</label>
                    <input
                      required
                      type="text"
                      name="otp"
                      value={emailData.otp}
                      onChange={handleEmailChange}
                      placeholder="------"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none text-center font-bold tracking-[0.5em] text-xl"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-neutral-500 hover:text-black font-medium transition-colors">
                      Hủy đổi email
                    </button>
                    <button
                      type="submit"
                      disabled={isConfirmingEmail}
                      className="flex items-center justify-center px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-70"
                    >
                      {isConfirmingEmail ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Xác nhận đổi'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 3. Change Password Form */}
            <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 border-b border-neutral-100 pb-4">Đổi mật khẩu</h3>
              <form onSubmit={handleSavePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-2 flex items-center">
                    <Key size={16} className="mr-2" /> Mật khẩu hiện tại
                  </label>
                  <input
                    required
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2">Mật khẩu mới</label>
                    <input
                      required
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      minLength={6}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-2">Xác nhận mật khẩu mới</label>
                    <input
                      required
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      minLength={6}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex items-center justify-center px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-70"
                  >
                    {savingPassword ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
