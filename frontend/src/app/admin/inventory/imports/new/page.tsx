'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';
import api from '@/lib/axios';

export default function NewImportReceiptPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await api.get('/products/admin/all');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchInitialData();
  }, []);

  const allVariants = products.flatMap(p => 
    p.variants.map((v: any) => ({ ...v, productName: p.nameVi }))
  );

  const filteredVariants = allVariants.filter(v => 
    v.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10); // show top 10 results

  const addItem = (variant: any) => {
    if (selectedItems.find(i => i.variantId === variant.id)) return;
    setSelectedItems([...selectedItems, {
      variantId: variant.id,
      productName: variant.productName,
      sku: variant.sku,
      color: variant.colorVi,
      size: variant.size,
      actualQuantity: 1,
      importPrice: 0
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newItems: any[] = [];
      const notFoundSkus: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 3) {
          const sku = parts[0].trim();
          const quantity = parseInt(parts[1].trim());
          const price = parseInt(parts[2].trim());

          if (isNaN(quantity) || isNaN(price)) continue;

          const variant = allVariants.find(v => v.sku.toLowerCase() === sku.toLowerCase());
          if (variant) {
            newItems.push({
              variantId: variant.id,
              productName: variant.productName,
              sku: variant.sku,
              color: variant.colorVi,
              size: variant.size,
              actualQuantity: quantity,
              importPrice: price
            });
          } else {
            notFoundSkus.push(sku);
          }
        }
      }

      if (newItems.length > 0) {
        const mergedItems = [...selectedItems];
        newItems.forEach(newItem => {
          const existingIdx = mergedItems.findIndex(i => i.variantId === newItem.variantId);
          if (existingIdx >= 0) {
            mergedItems[existingIdx].actualQuantity += newItem.actualQuantity;
            mergedItems[existingIdx].importPrice = newItem.importPrice;
          } else {
            mergedItems.push(newItem);
          }
        });
        setSelectedItems(mergedItems);
        
        let msg = `Đã thêm ${newItems.length} sản phẩm từ file.`;
        if (notFoundSkus.length > 0) {
          msg += `\nKhông tìm thấy các mã SKU trong hệ thống: ${notFoundSkus.join(', ')}`;
        }
        alert(msg);
      } else {
        if (notFoundSkus.length > 0) {
          alert(`Không tìm thấy mã SKU nào trong hệ thống!\nCác mã đã kiểm tra: ${notFoundSkus.join(', ')}`);
        } else {
          alert('Không tìm thấy dữ liệu hợp lệ trong file.\nVui lòng đảm bảo file CSV có định dạng: SKU, Số lượng, Giá nhập');
        }
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để nhập kho');
      return;
    }
    setSaving(true);
    try {
      await api.post('/inventory/receipts', {
        receiptType: 'IMPORT',
        note,
        items: selectedItems.map(item => ({
          variantId: item.variantId,
          actualQuantity: item.actualQuantity,
          importPrice: item.importPrice
        }))
      });
      alert('Đã tạo phiếu nhập chờ duyệt!');
      router.push('/admin/inventory/imports');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
      setSaving(false);
    }
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.actualQuantity * item.importPrice), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lập Phiếu Nhập Mới</h1>
          <p className="text-neutral-500 mt-1">Phiếu sẽ ở trạng thái chờ duyệt trước khi cộng vào tồn kho</p>
        </div>
        <div>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors">
            <Upload size={18} />
            Nhập từ CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <h3 className="font-bold text-lg mb-4">Danh sách sản phẩm nhập</h3>
            
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
                        <div className="text-xs text-neutral-500">{variant.sku} - {variant.colorVi} - Size: {variant.size}</div>
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
              {selectedItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg border border-neutral-200 bg-neutral-50 relative">
                  <div className="flex-1">
                    <div className="font-bold text-sm">{item.productName}</div>
                    <div className="text-xs text-neutral-500">{item.sku} - {item.color} - Size: {item.size}</div>
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-semibold text-neutral-500 mb-1 block">Số lượng</label>
                    <input type="number" min="1" value={item.actualQuantity} onChange={e => updateItem(index, 'actualQuantity', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md outline-none focus:border-orange-500 text-sm" />
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-semibold text-neutral-500 mb-1 block">Giá nhập (VNĐ)</label>
                    <input type="number" min="0" value={item.importPrice} onChange={e => updateItem(index, 'importPrice', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md outline-none focus:border-orange-500 text-sm" />
                  </div>
                  <div className="w-32 text-right">
                    <label className="text-xs font-semibold text-neutral-500 mb-1 block">Thành tiền</label>
                    <div className="font-bold text-sm pt-2">{(item.actualQuantity * item.importPrice).toLocaleString()} đ</div>
                  </div>
                  <button onClick={() => removeItem(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {selectedItems.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-500 text-sm">
                  Chưa có sản phẩm nào được chọn
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-neutral-200 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Thông tin Phiếu</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-2 text-sm">Ghi chú (Tùy chọn)</label>
                <textarea 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full h-24 p-3 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-orange-500 resize-none text-sm" 
                  placeholder="Ghi chú thêm về lô hàng này..."
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                <span className="font-semibold text-neutral-600">Tổng cộng:</span>
                <span className="text-xl font-black text-orange-500">{totalAmount.toLocaleString()} đ</span>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button onClick={() => router.back()} className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-lg hover:bg-neutral-200 transition-colors">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving || selectedItems.length === 0} className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu Phiếu'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
