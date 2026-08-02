'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Search, Trash2 } from 'lucide-react';
import api from '@/lib/axios';

export default function NewAuditReceiptPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products/admin/all');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const allVariants = products.flatMap(p => 
    p.variants.map((v: any) => ({ ...v, productName: p.nameVi }))
  );

  const filteredVariants = allVariants.filter(v => 
    v.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const addItem = (variant: any) => {
    if (selectedItems.find(i => i.variantId === variant.id)) return;
    setSelectedItems([...selectedItems, {
      variantId: variant.id,
      productName: variant.productName,
      sku: variant.sku,
      color: variant.colorVi,
      size: variant.size,
      expectedQuantity: variant.stockQuantity,
      actualQuantity: variant.stockQuantity
    }]);
    setSearchTerm('');
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    newItems[index][field] = value;
    setSelectedItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để kiểm kê');
      return;
    }
    setSaving(true);
    try {
      await api.post('/inventory/receipts', {
        receiptType: 'AUDIT',
        note,
        items: selectedItems.map(item => ({
          variantId: item.variantId,
          expectedQuantity: item.expectedQuantity,
          actualQuantity: item.actualQuantity
        }))
      });
      alert('Đã tạo phiếu kiểm kê chờ duyệt!');
      router.push('/admin/inventory/audits');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lập Phiếu Kiểm Kê</h1>
          <p className="text-neutral-500 mt-1">Ghi nhận số lượng thực tế có trong kho để hệ thống tự động cân bằng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-neutral-200">
            <h3 className="font-bold text-lg mb-4">Danh sách kiểm đếm</h3>
            
            <div className="relative mb-6 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm theo tên hoặc mã SKU..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-orange-500"
                />
              </div>
              
              {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden max-h-60 overflow-y-auto">
                  {filteredVariants.map(variant => (
                    <button 
                      key={variant.id}
                      onClick={() => addItem(variant)}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-neutral-100 last:border-0 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-sm">{variant.productName}</div>
                        <div className="text-xs text-neutral-500">{variant.sku} - {variant.colorVi} - Size: {variant.size} (Tồn HT: {variant.stockQuantity})</div>
                      </div>
                      <Plus size={16} className="text-orange-500" />
                    </button>
                  ))}
                  {filteredVariants.length === 0 && (
                    <div className="p-4 text-center text-sm text-neutral-500">Không tìm thấy sản phẩm</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {selectedItems.map((item, index) => {
                const diff = item.actualQuantity - item.expectedQuantity;
                return (
                  <div key={index} className={`flex items-center gap-4 p-4 rounded-lg border ${diff !== 0 ? 'border-orange-300 bg-orange-50/30' : 'border-neutral-200 bg-neutral-50'} relative`}>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{item.productName}</div>
                      <div className="text-xs text-neutral-500">{item.sku} - {item.color} - Size: {item.size}</div>
                    </div>
                    <div className="w-24 text-center">
                      <label className="text-xs font-semibold text-neutral-500 mb-1 block">Hệ thống</label>
                      <div className="font-bold text-sm text-neutral-700 py-2">{item.expectedQuantity}</div>
                    </div>
                    <div className="w-24">
                      <label className="text-xs font-semibold text-blue-600 mb-1 block">Thực tế</label>
                      <input type="number" min="0" value={item.actualQuantity} onChange={e => updateItem(index, 'actualQuantity', parseInt(e.target.value) || 0)} className={`w-full px-3 py-2 bg-white border ${diff !== 0 ? 'border-orange-500 text-orange-600' : 'border-neutral-200'} rounded-md outline-none focus:border-blue-500 text-sm font-bold`} />
                    </div>
                    <div className="w-24 text-right pr-2">
                      <label className="text-xs font-semibold text-neutral-500 mb-1 block">Chênh lệch</label>
                      <div className={`font-bold text-sm pt-2 ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </div>
                    </div>
                    <button onClick={() => removeItem(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md">
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
              {selectedItems.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-500 text-sm">
                  Chưa có sản phẩm nào được chọn để kiểm kê
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Thông tin Phiếu</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-2 text-sm">Ghi chú nguyên nhân</label>
                <textarea 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full h-24 p-3 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-orange-500 resize-none text-sm" 
                  placeholder="Ghi chú nguyên nhân chênh lệch (nếu có)..."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button onClick={handleSave} disabled={saving || selectedItems.length === 0} className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Gửi Yêu Cầu Duyệt'}
              </button>
              <button onClick={() => router.back()} className="w-full py-3 bg-neutral-100 text-neutral-700 font-bold rounded-lg hover:bg-neutral-200 transition-colors">
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
