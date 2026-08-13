'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Trash2, Search, Filter, X, Save, Upload, Star, Trash } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'clearance'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');

  // Data for selects
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick add variants state
  const [quickColor, setQuickColor] = useState('');
  const [quickSizes, setQuickSizes] = useState<string[]>([]);
  const predefinedSizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', 'FREESIZE'];

  const fetchProducts = async (tab: 'inventory' | 'clearance') => {
    try {
      setLoading(true);
      const url = tab === 'inventory' ? '/products/admin/all' : '/products/admin/clearance';
      const response = await api.get(url);
      setProducts(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(activeTab);
  }, [activeTab]);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(console.error);
    api.get('/brands').then(res => setBrands(res.data)).catch(console.error);
  }, []);

  const handleAddClick = () => {
    setEditingProduct({
      id: null, // null means it's a new product
      nameVi: '',
      descriptionVi: '',
      basePrice: 0,
      isActive: true,
      targetAudience: 'UNISEX',
      categoryId: '',
      brandId: '',
      images: [],
      variants: []
    });
    setQuickColor('');
    setQuickSizes([]);
  };

  const handleEditClick = async (slug: string) => {
    try {
      const response = await api.get(`/products/${slug}`);
      setEditingProduct(response.data);
    } catch (err) {
      toast.error('Không thể tải chi tiết sản phẩm');
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    // Validate
    const invalidVariants = editingProduct.variants?.some((v: any) => !v.size || v.size.trim() === '');
    if (invalidVariants) {
      toast.error('Tất cả các phiên bản bắt buộc phải nhập kích thước (Size)');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...editingProduct,
        categoryId: editingProduct.categoryId ? parseInt(editingProduct.categoryId) : (editingProduct.category?.id || null),
        brandId: editingProduct.brandId ? parseInt(editingProduct.brandId) : (editingProduct.brand?.id || null)
      };

      if (editingProduct.id) {
        await api.put(`/products/admin/${editingProduct.id}`, payload);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await api.post(`/products/admin`, payload);
        toast.success('Thêm sản phẩm thành công!');
      }
      setEditingProduct(null);
      fetchProducts(activeTab);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const newVariants = [...editingProduct.variants];
    newVariants[index][field] = value;
    
    if (field === 'colorVi' || field === 'size') {
      let prefix = 'SP';
      if (editingProduct.nameVi) {
        prefix = editingProduct.nameVi.split(' ').filter(Boolean).map((w: string) => w[0]).join('').toUpperCase().substring(0, 4);
      }
      const color = newVariants[index].colorVi || '';
      const size = newVariants[index].size || '';
      
      const toSkuCode = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim().replace(/\s+/g, '-').toUpperCase();
      const colorCode = toSkuCode(color);
      const sizeCode = toSkuCode(size);
      
      let newSku = `SKU-${prefix}`;
      if (colorCode) newSku += `-${colorCode}`;
      if (sizeCode) newSku += `-${sizeCode}`;
      
      newVariants[index].sku = newSku;
    }

    setEditingProduct({ ...editingProduct, variants: newVariants });
  };

  const handleToggleVisibility = async (product: any) => {
    const toastId = toast.loading('Đang cập nhật trạng thái...');
    try {
      const response = await api.get(`/products/${product.slug}`);
      const fullProduct = response.data;

      const payload = {
        ...fullProduct,
        isActive: activeTab === 'inventory' ? !fullProduct.isActive : fullProduct.isActive,
        isClearanceActive: activeTab === 'clearance' ? (fullProduct.isClearanceActive === false ? true : false) : fullProduct.isClearanceActive,
        categoryId: fullProduct.category?.id || null,
        brandId: fullProduct.brand?.id || null
      };

      await api.put(`/products/admin/${fullProduct.id}`, payload);
      toast.success('Cập nhật trạng thái thành công!', { id: toastId });
      fetchProducts(activeTab);
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi cập nhật', { id: toastId });
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm ${product.nameVi}?`)) return;
    const toastId = toast.loading('Đang xóa sản phẩm...');
    try {
      await api.delete(`/products/admin/${product.id}`);
      toast.success('Xóa sản phẩm thành công!', { id: toastId });
      fetchProducts(activeTab);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa', { id: toastId });
    }
  };

  const addVariant = () => {
    // Tự động tạo SKU gợi ý: SKU + Tên SP (chữ cái đầu)
    let prefix = 'SP';
    if (editingProduct.nameVi) {
      prefix = editingProduct.nameVi
        .split(' ')
        .filter(Boolean)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 4);
    }
    const defaultSku = `SKU-${prefix}`;

    setEditingProduct({
      ...editingProduct,
      variants: [...(editingProduct.variants || []), { sku: defaultSku, colorVi: '', colorEn: '', size: '', stockQuantity: 0, priceModifier: 0 }]
    });
  };

  const handleQuickAddVariants = () => {
    if (!quickColor.trim() || quickSizes.length === 0) {
      toast.error("Vui lòng nhập màu sắc và chọn ít nhất 1 size");
      return;
    }

    let prefix = 'SP';
    if (editingProduct.nameVi) {
      prefix = editingProduct.nameVi.split(' ').filter(Boolean).map((w: string) => w[0]).join('').toUpperCase().substring(0, 4);
    }

    const toSkuCode = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim().replace(/\s+/g, '-').toUpperCase();
    const colorCode = toSkuCode(quickColor);

    const newVariants = quickSizes.map(size => {
      const sizeCode = toSkuCode(size);
      return {
        sku: `SKU-${prefix}-${colorCode}-${sizeCode}`,
        colorVi: quickColor,
        colorEn: '',
        size: size,
        stockQuantity: 0, // Mặc định luôn là 0
        priceModifier: 0
      };
    });

    setEditingProduct({
      ...editingProduct,
      variants: [...(editingProduct.variants || []), ...newVariants]
    });

    // Reset quick add form
    setQuickColor('');
    setQuickSizes([]);
    toast.success(`Đã thêm ${newVariants.length} phiên bản`);
  };

  const removeVariant = (index: number) => {
    const newVariants = [...editingProduct.variants];
    newVariants.splice(index, 1);
    setEditingProduct({ ...editingProduct, variants: newVariants });
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
      const newImage = { imageUrl: response.data.url, isPrimary: (editingProduct.images?.length || 0) === 0 };
      setEditingProduct({
        ...editingProduct,
        images: [...(editingProduct.images || []), newImage]
      });
      toast.success("Tải ảnh lên thành công!", { id: toastId });
    } catch (error) {
      toast.error("Lỗi khi tải ảnh lên", { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...editingProduct.images];
    newImages.splice(index, 1);
    if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
      newImages[0].isPrimary = true;
    }
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const setPrimaryImage = (index: number) => {
    const newImages = editingProduct.images.map((img: any, i: number) => ({
      ...img,
      isPrimary: i === index
    }));
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const filteredProducts = products.filter(p => p.nameVi.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Sản phẩm</h2>
        </div>
        {activeTab === 'inventory' && (
          <button onClick={handleAddClick} className="bg-orange-500 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors flex items-center shadow-lg shadow-orange-500/20">
            <Plus size={20} className="mr-2" /> Thêm Sản phẩm
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 font-bold border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-orange-500 text-orange-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
        >
          Sản phẩm Kho Nhập
        </button>
        <button
          onClick={() => setActiveTab('clearance')}
          className={`px-6 py-3 font-bold border-b-2 transition-colors ${activeTab === 'clearance' ? 'border-orange-500 text-orange-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
        >
          Sản phẩm Thanh Lý
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
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
              <th className="p-4 font-medium rounded-tl-xl">Sản phẩm</th>
              <th className="p-4 font-medium">Danh mục</th>
              <th className="p-4 font-medium">Thương hiệu</th>
              <th className="p-4 font-medium">Đối tượng</th>
              <th className="p-4 font-medium">Giá bán</th>
              <th className="p-4 font-medium text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">Đang tải dữ liệu...</td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">Không tìm thấy sản phẩm</td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <img src={product.images?.find((i: any) => i.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || 'https://via.placeholder.com/50'} alt={product.nameVi} className="w-12 h-12 rounded-lg object-cover bg-neutral-100 border" />
                      <div>
                        <p className="font-bold text-neutral-900 line-clamp-1">{product.nameVi}</p>
                        <p className="text-sm text-neutral-500">SKU: {product.variants?.[0]?.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-600">{product.category?.nameVi || '--'}</td>
                  <td className="p-4 text-neutral-600">
                    <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-bold">{product.brand?.name || '--'}</span>
                  </td>
                  <td className="p-4 text-neutral-600">
                    {product.targetAudience === 'NAM' ? 'Nam' : product.targetAudience === 'NU' ? 'Nữ' : product.targetAudience === 'PHU_KIEN' ? 'Phụ kiện' : 'Unisex'}
                  </td>
                  <td className="p-4 font-bold text-neutral-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditClick(product.slug)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                        <Edit3 size={18} />
                      </button>
                      <label className="flex items-center cursor-pointer p-2 hover:bg-neutral-50 rounded-lg transition-colors" title={activeTab === 'clearance' ? (product.isClearanceActive !== false ? "Đang hiển thị thanh lý (Click để ẩn)" : "Đang ẩn thanh lý (Click để hiển thị)") : (product.isActive ? "Đang hiển thị (Click để ẩn)" : "Đang ẩn (Click để hiển thị)")}>
                        <input
                          type="checkbox"
                          checked={activeTab === 'clearance' ? product.isClearanceActive !== false : product.isActive}
                          onChange={() => handleToggleVisibility(product)}
                          className="w-5 h-5 text-orange-500 rounded cursor-pointer"
                        />
                      </label>
                      <button onClick={() => handleDeleteProduct(product)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa sản phẩm">
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
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-2xl font-bold">{editingProduct.id ? `Chỉnh sửa: ${editingProduct.nameVi}` : 'Thêm sản phẩm mới'}</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold mb-2">
                    {activeTab === 'clearance' ? 'Tên sản phẩm (Thanh lý)' : 'Tên sản phẩm (VI)'}
                  </label>
                  {activeTab === 'clearance' ? (
                    <input type="text" value={editingProduct.clearanceNameVi || ''} placeholder={`Gốc: ${editingProduct.nameVi}`} onChange={e => setEditingProduct({ ...editingProduct, clearanceNameVi: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none focus:border-orange-500" />
                  ) : (
                    <input type="text" value={editingProduct.nameVi} onChange={e => setEditingProduct({ ...editingProduct, nameVi: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none focus:border-orange-500" />
                  )}
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={`block text-sm font-bold mb-2 ${activeTab === 'clearance' ? 'text-neutral-400' : ''}`}>Giá cơ bản</label>
                  <input disabled={activeTab === 'clearance'} type="number" value={editingProduct.basePrice} onChange={e => setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) })} className={`w-full px-4 py-3 rounded-lg border border-neutral-200 outline-none focus:border-orange-500 ${activeTab === 'clearance' ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-neutral-50'}`} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={`block text-sm font-bold mb-2 ${activeTab === 'clearance' ? 'text-neutral-400' : ''}`}>Thương hiệu (Hãng){activeTab === 'clearance'}</label>
                  <select disabled={activeTab === 'clearance'} value={editingProduct.brandId || editingProduct.brand?.id || ''} onChange={e => setEditingProduct({ ...editingProduct, brandId: e.target.value })} className={`w-full px-4 py-3 rounded-lg border border-neutral-200 outline-none focus:border-orange-500 ${activeTab === 'clearance' ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-neutral-50'}`}>
                    <option value="">-- Chọn Hãng --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={`block text-sm font-bold mb-2 ${activeTab === 'clearance' ? 'text-neutral-400' : ''}`}>Danh mục{activeTab === 'clearance'}</label>
                  <select disabled={activeTab === 'clearance'} value={editingProduct.categoryId || editingProduct.category?.id || ''} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })} className={`w-full px-4 py-3 rounded-lg border border-neutral-200 outline-none focus:border-orange-500 ${activeTab === 'clearance' ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-neutral-50'}`}>
                    <option value="">-- Chọn Danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nameVi}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={`block text-sm font-bold mb-2 ${activeTab === 'clearance' ? 'text-neutral-400' : ''}`}>Đối tượng{activeTab === 'clearance'}</label>
                  <select disabled={activeTab === 'clearance'} value={editingProduct.targetAudience || 'UNISEX'} onChange={e => setEditingProduct({ ...editingProduct, targetAudience: e.target.value })} className={`w-full px-4 py-3 rounded-lg border border-neutral-200 outline-none focus:border-orange-500 ${activeTab === 'clearance' ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-neutral-50'}`}>
                    <option value="UNISEX">Unisex</option>
                    <option value="NAM">Nam</option>
                    <option value="NU">Nữ</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold mb-2">
                    {activeTab === 'clearance' ? 'Mô tả (Thanh lý)' : 'Mô tả (VI)'}
                  </label>
                  {activeTab === 'clearance' ? (
                    <textarea rows={3} value={editingProduct.clearanceDescriptionVi || ''} placeholder="Mô tả cho hàng thanh lý..." onChange={e => setEditingProduct({ ...editingProduct, clearanceDescriptionVi: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none focus:border-orange-500"></textarea>
                  ) : (
                    <textarea rows={3} value={editingProduct.descriptionVi} onChange={e => setEditingProduct({ ...editingProduct, descriptionVi: e.target.value })} className="w-full px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 outline-none focus:border-orange-500"></textarea>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-neutral-200 rounded-lg w-max hover:bg-neutral-50">
                    <input type="checkbox" checked={activeTab === 'clearance' ? editingProduct.isClearanceActive !== false : editingProduct.isActive} onChange={e => setEditingProduct({ ...editingProduct, [activeTab === 'clearance' ? 'isClearanceActive' : 'isActive']: e.target.checked })} className="w-5 h-5 text-orange-500 rounded" />
                    <span className="font-bold">Đang kích hoạt hiển thị {activeTab === 'clearance' ? 'thanh lý' : ''}</span>
                  </label>
                </div>
              </div>

              {/* Hình ảnh */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold">Hình ảnh Sản phẩm</h4>
                  <label className="flex items-center cursor-pointer text-orange-500 hover:text-orange-600 font-bold px-4 py-2 bg-orange-50 rounded-lg">
                    <Upload size={18} className="mr-2" /> Upload Ảnh
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {editingProduct.images?.map((img: any, index: number) => (
                    <div key={index} className={`relative w-32 h-32 flex-shrink-0 rounded-xl border-2 overflow-hidden ${img.isPrimary ? 'border-orange-500' : 'border-neutral-200'}`}>
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button onClick={() => setPrimaryImage(index)} title="Đặt làm ảnh chính" className={`p-2 rounded-full ${img.isPrimary ? 'bg-orange-500 text-white' : 'bg-white text-neutral-900 hover:bg-orange-100'}`}>
                          <Star size={16} className={img.isPrimary ? "fill-white" : ""} />
                        </button>
                        <button onClick={() => removeImage(index)} title="Xóa ảnh" className="p-2 bg-white text-red-500 hover:bg-red-50 rounded-full">
                          <Trash size={16} />
                        </button>
                      </div>
                      {img.isPrimary && <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Ảnh chính</div>}
                    </div>
                  ))}
                  {(!editingProduct.images || editingProduct.images.length === 0) && (
                    <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-neutral-300 rounded-xl text-neutral-400 font-medium">Chưa có hình ảnh nào</div>
                  )}
                </div>
              </div>

              {/* Variants */}
              {activeTab !== 'clearance' && (
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h4 className="text-xl font-bold">Các Phiên bản (Variants)</h4>
                    <button onClick={addVariant} className="flex items-center text-orange-500 hover:text-orange-600 font-bold px-4 py-2 bg-orange-50 rounded-lg whitespace-nowrap">
                      <Plus size={18} className="mr-1" /> Thêm 1 dòng trống
                    </button>
                  </div>

                  {/* Quick Add Variants Panel */}
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 mb-6">
                    <h5 className="font-bold text-sm mb-3">Tạo nhanh nhiều Size cho 1 Màu</h5>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                      <div className="w-full md:w-1/3">
                        <label className="block text-xs font-bold text-neutral-500 mb-1">Màu sắc (VD: Đen, Trắng)</label>
                        <input type="text" value={quickColor} onChange={e => setQuickColor(e.target.value)} className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-orange-500" placeholder="Nhập màu..." />
                      </div>
                      <div className="w-full md:w-2/3">
                        <label className="block text-xs font-bold text-neutral-500 mb-2">Tick chọn các Size:</label>
                        <div className="flex flex-wrap gap-2">
                          {predefinedSizes.map(sz => (
                            <label key={sz} className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${quickSizes.includes(sz) ? 'bg-orange-500 border-orange-500 text-white font-bold' : 'bg-white border-neutral-300 hover:border-orange-500 text-neutral-700'}`}>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={quickSizes.includes(sz)}
                                onChange={(e) => {
                                  if (e.target.checked) setQuickSizes([...quickSizes, sz]);
                                  else setQuickSizes(quickSizes.filter(s => s !== sz));
                                }}
                              />
                              {sz}
                            </label>
                          ))}
                        </div>
                      </div>
                      <button onClick={handleQuickAddVariants} className="px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap">
                        Tạo nhanh
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {editingProduct.variants?.map((variant: any, index: number) => (
                      <div key={index} className="grid grid-cols-12 gap-4 p-4 border border-neutral-200 rounded-lg items-center bg-neutral-50 relative">
                        <div className="col-span-3">
                          <label className="block text-xs font-bold text-neutral-500 mb-1">SKU</label>
                          <input type="text" value={variant.sku} onChange={e => handleVariantChange(index, 'sku', e.target.value)} className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-orange-500" />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Màu sắc (VI)</label>
                          <input type="text" value={variant.colorVi} onChange={e => handleVariantChange(index, 'colorVi', e.target.value)} className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-orange-500" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-red-500 mb-1">Size *</label>
                          <select required value={variant.size} onChange={e => handleVariantChange(index, 'size', e.target.value)} className={`w-full p-2 border ${!variant.size ? 'border-red-400 bg-red-50' : 'border-neutral-300'} rounded-lg outline-none focus:border-orange-500`}>
                            <option value="">Chọn Size</option>
                            {predefinedSizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Tồn kho</label>
                          <input type="number" disabled value={variant.stockQuantity || 0} title="Tồn kho chỉ được cộng khi nhập hàng" className="w-full p-2 border border-neutral-300 rounded-lg outline-none bg-neutral-100 text-neutral-500 cursor-not-allowed" />
                        </div>
                        <div className="col-span-2 flex justify-end mt-5">
                          <button onClick={() => removeVariant(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={20} /></button>
                        </div>
                      </div>
                    ))}
                    {(!editingProduct.variants || editingProduct.variants.length === 0) && (
                      <p className="text-center text-neutral-500 py-4">Chưa có phiên bản nào.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Clearance Batches (Xả kho) */}
              {editingProduct.id && editingProduct.clearanceBatches && editingProduct.clearanceBatches.length > 0 && (
                <div>
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Star size={24} className="text-orange-500 fill-orange-500" /> Hàng Thanh Lý
                  </h4>
                  <div className="space-y-4">
                    {editingProduct.clearanceBatches.map((batch: any, index: number) => (
                      <div key={index} className="grid grid-cols-12 gap-4 p-4 border border-orange-200 rounded-lg items-center bg-orange-50/30 relative">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Mã lô</label>
                          <p className="text-xs font-semibold truncate text-neutral-700" title={batch.batchCode}>{batch.batchCode}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Màu / Size</label>
                          <p className="text-sm font-medium">{batch.colorVi || '--'} / <span className="font-bold">{batch.size}</span></p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Tồn kho / Chất lượng</label>
                          <p className="text-sm"><span className="font-bold">{batch.quantity}</span> chiếc <span className="text-orange-600 font-bold ml-2">({batch.qualityPercentage}%)</span></p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-neutral-500 mb-1">Giá xả kho (VNĐ)</label>
                          <input type="number"
                            value={batch.clearancePrice || ''}
                            onChange={e => {
                              const newBatches = [...editingProduct.clearanceBatches];
                              newBatches[index].clearancePrice = Number(e.target.value);
                              setEditingProduct({ ...editingProduct, clearanceBatches: newBatches });
                            }}
                            className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-orange-500 bg-white" />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {batch.imageUrl ? (
                            <img src={batch.imageUrl} className="w-12 h-12 rounded-lg object-cover border-2 border-orange-200" alt="Ảnh xả kho" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center bg-white text-neutral-400">
                              <Upload size={16} />
                            </div>
                          )}
                        </div>
                        <div className="col-span-3 flex items-center gap-2">
                          <button onClick={async () => {
                            if (!batch.clearancePrice || batch.clearancePrice <= 0) {
                              toast.error('Vui lòng nhập giá hợp lệ'); return;
                            }
                            const toastId = toast.loading('Đang lưu giá...');
                            try {
                              await api.put(`/warehouse/batches/${batch.id}/clearance-price`, { clearancePrice: batch.clearancePrice });
                              toast.success('Lưu giá thành công!', { id: toastId });
                            } catch (e: any) {
                              toast.error(e.response?.data?.message || 'Lỗi khi lưu giá', { id: toastId });
                            }
                          }} className="text-xs font-bold bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm whitespace-nowrap">
                            Lưu giá
                          </button>

                          <label className="text-xs font-bold bg-white border border-neutral-200 text-neutral-700 px-3 py-2 rounded-lg text-center cursor-pointer hover:bg-neutral-50 transition-colors shadow-sm whitespace-nowrap">
                            Up ảnh thật
                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                              if (!e.target.files || e.target.files.length === 0) return;
                              const file = e.target.files[0];
                              const formData = new FormData();
                              formData.append('file', file);
                              const toastId = toast.loading('Đang tải ảnh...');
                              try {
                                const response = await api.post(`/warehouse/batches/${batch.id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                const newBatches = [...editingProduct.clearanceBatches];
                                newBatches[index].imageUrl = response.data.imageUrl;
                                setEditingProduct({ ...editingProduct, clearanceBatches: newBatches });
                                toast.success('Tải ảnh thành công!', { id: toastId });
                              } catch (err: any) {
                                toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh', { id: toastId });
                              }
                              e.target.value = ''; // Reset
                            }} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="p-6 border-t border-neutral-100 flex justify-end gap-4 bg-neutral-50">
              <button onClick={() => setEditingProduct(null)} className="px-6 py-3 font-bold text-neutral-600 hover:bg-neutral-200 rounded-full transition-colors">Hủy bỏ</button>
              <button onClick={handleSaveProduct} disabled={isSaving} className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition-colors flex items-center disabled:opacity-70">
                {isSaving ? 'Đang lưu...' : <><Save size={20} className="mr-2" /> Lưu Thay Đổi</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
