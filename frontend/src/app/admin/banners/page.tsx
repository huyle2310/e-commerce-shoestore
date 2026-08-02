'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/axios';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titleVi: '', titleEn: '', imageUrl: '', targetUrl: '', position: 'HOME_HERO', isActive: true
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await api.get('/banners/admin/all');
      setBanners(response.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching banners", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ titleVi: '', titleEn: '', imageUrl: '', targetUrl: '', position: 'HOME_HERO', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (banner: any) => {
    setEditingId(banner.id);
    setFormData({
      titleVi: banner.titleVi || '',
      titleEn: banner.titleEn || '',
      imageUrl: banner.imageUrl || '',
      targetUrl: banner.targetUrl || '',
      position: banner.position || 'HOME_HERO',
      isActive: banner.isActive
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.titleVi || !formData.imageUrl) {
        alert("Vui lòng điền đầy đủ tiêu đề và link ảnh!");
        return;
      }
      
      const payload = {
        ...formData,
        titleEn: formData.titleEn || formData.titleVi
      };

      if (editingId) {
        await api.put(`/banners/${editingId}`, payload);
      } else {
        await api.post('/banners', payload);
      }
      
      setIsModalOpen(false);
      fetchBanners();
    } catch (error: any) {
      console.error("Error saving banner", error);
      alert("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa banner này?')) {
      try {
        await api.delete(`/banners/${id}`);
        fetchBanners();
      } catch (error) {
        console.error("Error deleting banner", error);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Banner</h2>
          <p className="text-neutral-500">Thêm và quản lý các banner quảng cáo trên trang web</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-neutral-800 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" /> Thêm Banner
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-sm">
              <th className="p-4 font-medium rounded-tl-xl w-32">Hình ảnh</th>
              <th className="p-4 font-medium">Tiêu đề</th>
              <th className="p-4 font-medium">Vị trí</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-500">Đang tải dữ liệu...</td></tr>
            ) : banners.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-500">Chưa có banner nào</td></tr>
            ) : (
              banners.map(banner => (
                <tr key={banner.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4">
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.titleVi} className="w-24 h-12 object-cover rounded-xl" />
                    ) : (
                      <div className="w-24 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-400"><ImageIcon size={20} /></div>
                    )}
                  </td>
                  <td className="p-4 font-bold text-neutral-900">{banner.titleVi}</td>
                  <td className="p-4 text-sm text-neutral-500">{banner.position === 'HOME_HERO' ? 'Trang chủ (Hero)' : 'Trang chủ (Cạnh)'}</td>
                  <td className="p-4">
                    {banner.isActive ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Đang hiển thị</span>
                    ) : (
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-bold">Đã ẩn</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(banner)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">{editingId ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Tiêu đề (VI) *</label>
                <input 
                  type="text" 
                  value={formData.titleVi}
                  onChange={(e) => setFormData({...formData, titleVi: e.target.value})}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                  placeholder="Nhập tiêu đề banner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Link Ảnh *</label>
                <input 
                  type="text" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                />
                {formData.imageUrl && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-neutral-200">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-auto max-h-48 object-cover" onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh';
                    }}/>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Đường dẫn khi click (Tùy chọn)</label>
                <input 
                  type="text" 
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({...formData, targetUrl: e.target.value})}
                  placeholder="/products/123"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Vị trí</label>
                <select 
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="HOME_HERO">Trang chủ (Hero Slider lớn)</option>
                  <option value="HOME_SIDE">Trang chủ (Banner nhỏ bên cạnh)</option>
                </select>
              </div>

              <div className="flex items-center pt-4">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 mr-3"
                />
                <label htmlFor="active" className="font-bold cursor-pointer">Hiển thị banner này trên trang web</label>
              </div>
            </div>

            <div className="mt-10 flex justify-end gap-4 border-t border-neutral-100 pt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 border border-neutral-200 rounded-full font-bold hover:bg-neutral-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
              >
                Lưu Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
