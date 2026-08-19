'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Search, X, Save } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddClick = () => {
    setEditingCategory({
      id: null,
      nameVi: '',
      nameEn: '',
      slug: ''
    });
  };

  const handleEditClick = (category: any) => {
    setEditingCategory({ ...category });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      await api.delete(`/categories/admin/${id}`);
      toast.success("Xóa danh mục thành công!");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa danh mục này");
    }
  };

  const generateSlug = (text: string) => {
    return text.toString().toLowerCase()
      .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
      .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
      .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
      .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
      .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
      .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
      .replace(/đ/gi, 'd')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleNameChange = (val: string) => {
    setEditingCategory((prev: any) => ({
      ...prev,
      nameVi: val,
      slug: !prev.id ? generateSlug(val) : prev.slug // auto generate slug only for new
    }));
  };

  const handleSaveCategory = async () => {
    if (!editingCategory.nameVi || !editingCategory.slug) {
      toast.error("Tên danh mục và Slug không được để trống");
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory.id) {
        await api.put(`/categories/admin/${editingCategory.id}`, editingCategory);
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await api.post(`/categories/admin`, editingCategory);
        toast.success('Thêm danh mục thành công!');
      }
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = categories.filter(c => c.nameVi.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Danh mục</h2>
          <p className="text-neutral-500">Phân loại sản phẩm</p>
        </div>
        <button onClick={handleAddClick} className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors flex items-center shadow-lg shadow-orange-500/20">
          <Plus size={20} className="mr-2" /> Thêm Danh mục
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
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
              <th className="p-4 font-medium">Tên Tiếng Việt</th>
              <th className="p-4 font-medium">Tên Tiếng Anh</th>
              {/* <th className="p-4 font-medium">Ngày tạo</th> */}
              <th className="p-4 font-medium">Đường dẫn (Slug)</th>
              <th className="p-4 font-medium text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">Đang tải dữ liệu...</td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">Không tìm thấy danh mục</td>
              </tr>
            ) : (
              filteredCategories.map(cat => (
                <tr key={cat.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4 text-neutral-500 font-medium">#{cat.id}</td>
                  <td className="p-4 font-bold text-neutral-900 text-lg">{cat.nameVi}</td>
                  <td className="p-4 text-neutral-600">{cat.nameEn || '--'}</td>
                  {/* <td className="p-4 text-neutral-600">{new Date(cat.createdAt).toLocaleString('vi-VN')}</td> */}

                  <td className="p-4">
                    <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-lg text-sm">{cat.slug}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditClick(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
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
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingCategory.id ? `Chỉnh sửa: ${editingCategory.nameVi}` : 'Thêm danh mục mới'}</h3>
              <button onClick={() => setEditingCategory(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Tên Tiếng Việt *</label>
                <input
                  type="text"
                  value={editingCategory.nameVi}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none focus:border-orange-500"
                  placeholder="VD: Giày thể thao..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Tên Tiếng Anh</label>
                <input
                  type="text"
                  value={editingCategory.nameEn}
                  onChange={e => setEditingCategory({ ...editingCategory, nameEn: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none focus:border-orange-500"
                  placeholder="VD: Sneakers..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Đường dẫn (Slug) *</label>
                <input
                  type="text"
                  value={editingCategory.slug}
                  onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none focus:border-orange-500"
                  placeholder="VD: giay-the-thao"
                />
                <p className="text-xs text-neutral-500 mt-2">Slug tự tạo dựa trên tên tiếng Việt, dùng cho đường dẫn URL (chỉ chữ thường và dấu gạch ngang).</p>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 flex justify-end gap-4 bg-neutral-50">
              <button onClick={() => setEditingCategory(null)} className="px-6 py-2.5 font-bold text-neutral-600 hover:bg-neutral-200 rounded-full transition-colors">Hủy bỏ</button>
              <button onClick={handleSaveCategory} disabled={isSaving} className="px-8 py-2.5 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition-colors flex items-center disabled:opacity-70">
                {isSaving ? 'Đang lưu...' : <><Save size={18} className="mr-2" /> Lưu</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
