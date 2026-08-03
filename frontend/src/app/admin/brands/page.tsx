'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Trash2, Search, X, Save, Upload, Trash } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit Modal State
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get('/brands');
      setBrands(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách thương hiệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleAddClick = () => {
    setEditingBrand({
      id: null,
      name: '',
      logoUrl: ''
    });
  };

  const handleEditClick = (brand: any) => {
    setEditingBrand({ ...brand });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thương hiệu này?")) return;
    try {
      await api.delete(`/brands/admin/${id}`);
      toast.success("Xóa thương hiệu thành công!");
      fetchBrands();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa thương hiệu này");
    }
  };

  const handleSaveBrand = async () => {
    if (!editingBrand.name) {
      toast.error("Tên thương hiệu không được để trống");
      return;
    }

    setIsSaving(true);
    try {
      if (editingBrand.id) {
        await api.put(`/brands/admin/${editingBrand.id}`, editingBrand);
        toast.success('Cập nhật thương hiệu thành công!');
      } else {
        await api.post(`/brands/admin`, editingBrand);
        toast.success('Thêm thương hiệu thành công!');
      }
      setEditingBrand(null);
      fetchBrands();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    const toastId = toast.loading("Đang tải ảnh lên...");
    try {
      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingBrand({ ...editingBrand, logoUrl: response.data.url });
      toast.success("Tải ảnh lên thành công!", { id: toastId });
    } catch (error) {
      toast.error("Lỗi khi tải ảnh lên", { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setEditingBrand({ ...editingBrand, logoUrl: '' });
  };

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Thương hiệu</h2>
          <p className="text-neutral-500">Xem, thêm, sửa, xóa các hãng giày</p>
        </div>
        <button onClick={handleAddClick} className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors flex items-center shadow-lg shadow-orange-500/20">
          <Plus size={20} className="mr-2" /> Thêm Thương hiệu
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm thương hiệu..." 
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
              <th className="p-4 font-medium rounded-tl-xl">ID</th>
              <th className="p-4 font-medium">Logo</th>
              <th className="p-4 font-medium">Tên thương hiệu</th>
              <th className="p-4 font-medium text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">Đang tải dữ liệu...</td>
              </tr>
            ) : filteredBrands.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">Không tìm thấy thương hiệu</td>
              </tr>
            ) : (
              filteredBrands.map(brand => (
                <tr key={brand.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4 text-neutral-500 font-medium">#{brand.id}</td>
                  <td className="p-4">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="w-16 h-16 object-contain bg-neutral-50 rounded-lg border p-1" />
                    ) : (
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400 text-xs text-center border">No Logo</div>
                    )}
                  </td>
                  <td className="p-4 font-bold text-neutral-900 text-lg">{brand.name}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditClick(brand)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDelete(brand.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {editingBrand && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingBrand.id ? `Chỉnh sửa: ${editingBrand.name}` : 'Thêm thương hiệu mới'}</h3>
              <button onClick={() => setEditingBrand(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">Tên thương hiệu *</label>
                <input 
                  type="text" 
                  value={editingBrand.name} 
                  onChange={e => setEditingBrand({...editingBrand, name: e.target.value})} 
                  className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none focus:border-orange-500" 
                  placeholder="VD: Nike, Adidas..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold">Logo</label>
                  <label className="flex items-center cursor-pointer text-orange-500 hover:text-orange-600 font-bold px-3 py-1.5 bg-orange-50 rounded-lg text-sm">
                    <Upload size={16} className="mr-1" /> Tải ảnh lên
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
                
                {editingBrand.logoUrl ? (
                  <div className="relative w-32 h-32 rounded-lg border-2 border-neutral-200 overflow-hidden bg-neutral-50 flex items-center justify-center p-2">
                    <img src={editingBrand.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    <button onClick={removeImage} className="absolute top-1 right-1 p-1.5 bg-white text-red-500 hover:bg-red-50 rounded-lg shadow-sm border border-neutral-200">
                      <Trash size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center text-neutral-400 bg-neutral-50">
                    Chưa có logo
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-neutral-100 flex justify-end gap-4 bg-neutral-50">
              <button onClick={() => setEditingBrand(null)} className="px-6 py-2.5 font-bold text-neutral-600 hover:bg-neutral-200 rounded-full transition-colors">Hủy bỏ</button>
              <button onClick={handleSaveBrand} disabled={isSaving} className="px-8 py-2.5 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition-colors flex items-center disabled:opacity-70">
                {isSaving ? 'Đang lưu...' : <><Save size={18} className="mr-2" /> Lưu</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
