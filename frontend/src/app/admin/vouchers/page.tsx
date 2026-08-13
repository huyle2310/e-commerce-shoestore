'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Search, X, Save, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import ImageUpload from '@/components/ui/ImageUpload';
import { useAuthStore } from '@/store/authStore';

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [mounted, setMounted] = useState(false);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vouchers/admin');
      setVouchers(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted || !token) return;
    fetchVouchers();
  }, [mounted, token]);

  const handleAddClick = () => {
    setEditingVoucher({
      id: null,
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      minOrderValue: 0,
      maxDiscountAmount: 0,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      usageLimit: 100,
      isActive: true,
      requiredRank: '',
      imageUrl: ''
    });
  };

  const handleEditClick = (voucher: any) => {
    setEditingVoucher({
      ...voucher,
      startDate: new Date(voucher.startDate).toISOString().slice(0, 16),
      endDate: new Date(voucher.endDate).toISOString().slice(0, 16)
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) return;
    try {
      await api.delete(`/vouchers/admin/${id}`);
      toast.success("Xóa thành công!");
      fetchVouchers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa mã này");
    }
  };

  const handleSaveVoucher = async () => {
    if (!editingVoucher.code) {
      toast.error("Vui lòng nhập mã Voucher");
      return;
    }

    if (new Date(editingVoucher.startDate) >= new Date(editingVoucher.endDate)) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }

    // Ensure numbers
    const payload = {
      ...editingVoucher,
      discountValue: Number(editingVoucher.discountValue),
      minOrderValue: Number(editingVoucher.minOrderValue),
      maxDiscountAmount: editingVoucher.maxDiscountAmount ? Number(editingVoucher.maxDiscountAmount) : null,
      usageLimit: editingVoucher.usageLimit ? Number(editingVoucher.usageLimit) : null,
      requiredRank: editingVoucher.requiredRank || null
    };

    setIsSaving(true);
    try {
      if (editingVoucher.id) {
        await api.put(`/vouchers/admin/${editingVoucher.id}`, payload);
        toast.success('Cập nhật thành công!');
      } else {
        await api.post(`/vouchers/admin`, payload);
        toast.success('Thêm thành công!');
      }
      setEditingVoucher(null);
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVouchers = vouchers.filter(v => v.code.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Mã giảm giá (Voucher)</h2>
          <p className="text-neutral-500">Tạo mã khuyến mãi cho khách hàng</p>
        </div>
        <button onClick={handleAddClick} className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors flex items-center shadow-lg shadow-orange-500/20">
          <Plus size={20} className="mr-2" /> Thêm Voucher
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Tìm mã giảm giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-sm">
              <th className="p-4 font-medium rounded-tl-xl">Mã Voucher</th>
              <th className="p-4 font-medium">Ảnh</th>
              <th className="p-4 font-medium">Giảm giá</th>
              <th className="p-4 font-medium">Hạn sử dụng</th>
              <th className="p-4 font-medium">Đã dùng</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center">Đang tải...</td></tr>
            ) : filteredVouchers.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center">Không tìm thấy mã giảm giá</td></tr>
            ) : (
              filteredVouchers.map(v => {
                const isExpired = new Date(v.endDate) < new Date();
                return (
                  <tr key={v.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                    <td className="p-4 font-bold text-lg text-orange-500">{v.code}</td>
                    <td className="p-4">
                      {v.imageUrl ? (
                        <img src={v.imageUrl} alt={v.code} className="w-12 h-12 object-cover rounded-lg border border-neutral-100" />
                      ) : (
                        <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium">
                      {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discountValue)}`}
                    </td>
                    <td className="p-4 text-sm">
                      {new Date(v.startDate).toLocaleDateString('vi-VN')} - {new Date(v.endDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 font-medium">
                      {v.usedCount} {v.usageLimit ? `/ ${v.usageLimit}` : ''}
                    </td>
                    <td className="p-4">
                      {v.isActive && !isExpired ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold">Hoạt động</span>
                      ) : isExpired ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-bold">Hết hạn</span>
                      ) : (
                        <span className="px-3 py-1 bg-neutral-200 text-neutral-700 rounded-lg text-sm font-bold">Vô hiệu</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleEditClick(v)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingVoucher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingVoucher.id ? 'Sửa Mã giảm giá' : 'Thêm Mã giảm giá'}</h3>
              <button onClick={() => setEditingVoucher(null)} className="p-2 hover:bg-neutral-100 rounded-full"><X size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">Mã code *</label>
                  <input type="text" value={editingVoucher.code} onChange={e => setEditingVoucher({ ...editingVoucher, code: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none font-bold" placeholder="Mã voucher..." />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end mb-2">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={editingVoucher.isActive} onChange={e => setEditingVoucher({ ...editingVoucher, isActive: e.target.checked })} />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${editingVoucher.isActive ? 'bg-orange-500' : 'bg-neutral-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${editingVoucher.isActive ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-bold">Cho phép hoạt động</div>
                  </label>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">Loại giảm giá</label>
                  <select value={editingVoucher.discountType} onChange={e => setEditingVoucher({ ...editingVoucher, discountType: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none">
                    <option value="PERCENTAGE">Theo phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Tiền mặt (VNĐ)</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">Mức giảm *</label>
                  <input type="number" value={editingVoucher.discountValue} onChange={e => setEditingVoucher({ ...editingVoucher, discountValue: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none" />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">Đơn hàng tối thiểu (VNĐ)</label>
                  <input type="number" value={editingVoucher.minOrderValue} onChange={e => setEditingVoucher({ ...editingVoucher, minOrderValue: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">Giảm tối đa (VNĐ) <span className="font-normal text-neutral-400">- Tùy chọn</span></label>
                  <input type="number" value={editingVoucher.maxDiscountAmount || ''} onChange={e => setEditingVoucher({ ...editingVoucher, maxDiscountAmount: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none" placeholder="Để trống nếu không giới hạn" />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">Ngày bắt đầu *</label>
                  <input type="datetime-local" value={editingVoucher.startDate} onChange={e => setEditingVoucher({ ...editingVoucher, startDate: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">Ngày kết thúc *</label>
                  <input type="datetime-local" value={editingVoucher.endDate} onChange={e => setEditingVoucher({ ...editingVoucher, endDate: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none" />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">Hạng thành viên yêu cầu <span className="font-normal text-neutral-400">- Tùy chọn</span></label>
                  <select value={editingVoucher.requiredRank || ''} onChange={e => setEditingVoucher({ ...editingVoucher, requiredRank: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none">
                    <option value="">Không yêu cầu (Tất cả)</option>
                    <option value="VÀNG">Hạng Vàng trở lên</option>
                    <option value="KIM CƯƠNG">Hạng Kim Cương trở lên</option>
                    <option value="TINH ANH">Hạng Tinh Anh</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">Giới hạn số lượt dùng <span className="font-normal text-neutral-400">- Tùy chọn</span></label>
                  <input type="number" value={editingVoucher.usageLimit || ''} onChange={e => setEditingVoucher({ ...editingVoucher, usageLimit: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none" placeholder="Để trống nếu không giới hạn" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold mb-2">Ảnh voucher <span className="font-normal text-neutral-400">- Tùy chọn</span></label>

                  <ImageUpload
                    value={editingVoucher.imageUrl || ''}
                    onChange={(url) => setEditingVoucher({ ...editingVoucher, imageUrl: url })}
                  />
                  {editingVoucher.imageUrl && (
                    <img src={editingVoucher.imageUrl} alt="Preview" className="mt-3 w-full max-h-40 object-cover rounded-lg border border-neutral-200" />
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 flex justify-end gap-4 bg-neutral-50">
              <button onClick={() => setEditingVoucher(null)} className="px-6 py-2.5 font-bold text-neutral-600 hover:bg-neutral-200 rounded-full transition-colors">Hủy</button>
              <button onClick={handleSaveVoucher} disabled={isSaving} className="px-8 py-2.5 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition-colors flex items-center disabled:opacity-70">
                {isSaving ? 'Đang lưu...' : <><Save size={18} className="mr-2" /> Lưu</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
