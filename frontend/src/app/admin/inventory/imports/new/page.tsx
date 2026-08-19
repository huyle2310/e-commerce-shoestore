'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Search, Trash2, Upload, AlertCircle, Package } from 'lucide-react';
import api from '@/lib/axios';

// Types
type ImportVariantItem = {
  id: string; // unique local ID
  color: string;
  size: string;
  quantity: number | '';
  importPrice: number | '';
  supplierName?: string;
};

type ImportProductGroup = {
  productId: string;
  productName: string;
  productImage: string;
  brandName: string;
  availableVariants: any[];
  items: ImportVariantItem[];
};

export default function NewImportReceiptPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // State for the grouped items
  const [productGroups, setProductGroups] = useState<ImportProductGroup[]>([]);

  const [supplierName, setSupplierName] = useState('');
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

  const matchedProducts = products.filter(p =>
    p.nameVi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const matchedSkus = products.flatMap(p =>
    p.variants
      .filter((v: any) => v.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((v: any) => ({ product: p, matchedVariant: v }))
  );

  const displayProducts = matchedProducts.slice(0, 8);
  const displaySkus = matchedSkus.slice(0, 4);

  const addProductGroup = (product: any, prefillVariant?: any) => {
    const existingGroupIdx = productGroups.findIndex(g => g.productId === product.id);
    let newGroups = [...productGroups];

    if (existingGroupIdx >= 0) {
      if (prefillVariant) {
        const itemExists = newGroups[existingGroupIdx].items.some(
          i => i.color === prefillVariant.colorVi && i.size === prefillVariant.size
        );
        if (!itemExists) {
          newGroups[existingGroupIdx].items.push({
            id: Math.random().toString(36).substring(7),
            color: prefillVariant.colorVi,
            size: prefillVariant.size,
            quantity: 1,
            importPrice: prefillVariant.basePrice || 0
          });
        } else {
          alert('SKU này đã được chọn trong danh sách.');
        }
      }
    } else {
      const newGroup: ImportProductGroup = {
        productId: product.id,
        productName: product.nameVi,
        productImage: product.images?.find((img: any) => img.isPrimary)?.imageUrl || '',
        brandName: product.brand?.name || '',
        availableVariants: product.variants || [],
        items: prefillVariant ? [{
          id: Math.random().toString(36).substring(7),
          color: prefillVariant.colorVi,
          size: prefillVariant.size,
          quantity: 1,
          importPrice: prefillVariant.basePrice || 0,
          supplierName: ''
        }] : [{
          id: Math.random().toString(36).substring(7),
          color: '',
          size: '',
          quantity: 1,
          importPrice: 0,
          supplierName: ''
        }]
      };
      newGroups.push(newGroup);
    }

    setProductGroups(newGroups);
    setSearchTerm('');
  };

  const addVariantRow = (groupIndex: number) => {
    const newGroups = [...productGroups];
    newGroups[groupIndex].items.push({
      id: Math.random().toString(36).substring(7),
      color: '',
      size: '',
      quantity: 1,
      importPrice: 0,
      supplierName: ''
    });
    setProductGroups(newGroups);
  };

  const removeVariantRow = (groupIndex: number, itemIndex: number) => {
    const newGroups = [...productGroups];
    newGroups[groupIndex].items.splice(itemIndex, 1);
    if (newGroups[groupIndex].items.length === 0) {
      newGroups.splice(groupIndex, 1);
    }
    setProductGroups(newGroups);
  };

  const updateVariantRow = (groupIndex: number, itemIndex: number, field: string, value: any) => {
    const newGroups = [...productGroups];
    const item = newGroups[groupIndex].items[itemIndex];
    (item as any)[field] = value;

    if (field === 'color') {
      item.size = '';
    }
    setProductGroups(newGroups);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        let csvText = '';
        try {
          const decoder = new TextDecoder('utf-8', { fatal: true });
          csvText = decoder.decode(buffer);
        } catch (err) {
          alert("File CSV của bạn đang bị lỗi font (lưu sai định dạng). Vui lòng mở file bằng Excel, chọn File > Save As > tại mục Save as type, chọn 'CSV UTF-8 (Comma delimited)' rồi import lại nhé!");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const rows = csvText.split('\n').map(row => row.split(',').map(col => col.trim()));
        const dataRows = rows.slice(1).filter(r => r.length >= 4 && r[0]);

        if (dataRows.length === 0) {
          alert("File rỗng hoặc không đúng định dạng!");
          return;
        }

        if (dataRows[0].length >= 5 && dataRows[0][4]) {
          setSupplierName(dataRows[0][4]);
        }

        let newGroups = [...productGroups];
        let foundAny = false;
        let errors: string[] = [];

        for (const row of dataRows) {
          const sku = row[0];
          const productNameInCsv = row[1] || 'Không xác định';
          const quantityStr = row[2] ? String(row[2]).replace(/\D/g, '') : '';
          const quantity = parseInt(quantityStr, 10) || 1;
          const importPriceStr = row[3] ? String(row[3]).replace(/\D/g, '') : '';
          const importPrice = parseInt(importPriceStr, 10) || 0;
          const itemSupplier = row[4] || '';

          const matchedProduct = products.find(p => p.variants?.some((v: any) => v.sku === sku));
          if (matchedProduct) {
            foundAny = true;
            const matchedVariant = matchedProduct.variants.find((v: any) => v.sku === sku);

            const existingGroupIdx = newGroups.findIndex(g => g.productId === matchedProduct.id);
            if (existingGroupIdx >= 0) {
              const itemExists = newGroups[existingGroupIdx].items.some(
                (i: any) => i.color === matchedVariant.colorVi && i.size === matchedVariant.size
              );
              if (!itemExists) {
                newGroups[existingGroupIdx].items.push({
                  id: Math.random().toString(36).substring(7),
                  color: matchedVariant.colorVi,
                  size: matchedVariant.size,
                  quantity: quantity,
                  importPrice: importPrice,
                  supplierName: itemSupplier
                });
              }
            } else {
              newGroups.push({
                productId: matchedProduct.id,
                productName: matchedProduct.nameVi,
                productImage: matchedProduct.images?.find((img: any) => img.isPrimary)?.imageUrl || '',
                brandName: matchedProduct.brand?.name || '',
                availableVariants: matchedProduct.variants || [],
                items: [{
                  id: Math.random().toString(36).substring(7),
                  color: matchedVariant.colorVi,
                  size: matchedVariant.size,
                  quantity: quantity,
                  importPrice: importPrice,
                  supplierName: itemSupplier
                }]
              });
            }
          } else {
            errors.push(`Biến thể ${productNameInCsv} (${sku}) trong file không tồn tại`);
          }
        }

        if (errors.length > 0) {
          alert(`File có lỗi:\n- ${errors.join('\n- ')}\n\nVui lòng kiểm tra lại file và import lại.`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        if (foundAny) {
          setProductGroups(newGroups);
          alert("Đã import dữ liệu từ file CSV thành công!");
        } else {
          alert("Không tìm thấy sản phẩm nào trong hệ thống khớp với SKU trong file.");
        }
      } catch (err) {
        alert("Lỗi khi đọc file CSV");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSave = async () => {
    const payloadBySupplier: Record<string, any[]> = {};

    for (const group of productGroups) {
      for (const item of group.items) {
        const variant = group.availableVariants.find(v => v.colorVi === item.color && v.size === item.size);

        if (!variant || !item.quantity || item.quantity <= 0) {
          alert(`Vui lòng chọn màu, size hợp lệ và nhập số lượng cho tất cả các dòng của ${group.productName}.`);
          return;
        }

        const finalSupplier = item.supplierName?.trim() || supplierName.trim() || 'Chưa xác định';
        if (!payloadBySupplier[finalSupplier]) payloadBySupplier[finalSupplier] = [];

        const isDuplicate = payloadBySupplier[finalSupplier].some(pi => pi.variantId === variant.id);

        if (isDuplicate) {
          alert(`Sản phẩm ${group.productName} (${variant.sku}) bị trùng lặp ở nhà cung cấp "${finalSupplier}". Vui lòng gộp số lượng hoặc xóa dòng thừa.`);
          return;
        }

        payloadBySupplier[finalSupplier].push({
          variantId: variant.id,
          actualQuantity: item.quantity,
          importPrice: item.importPrice || 0
        });
      }
    }

    const suppliers = Object.keys(payloadBySupplier);
    if (suppliers.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm hợp lệ để nhập kho');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(suppliers.map(supp =>
        api.post('/inventory/receipts', {
          receiptType: 'IMPORT',
          note,
          supplierName: supp,
          items: payloadBySupplier[supp]
        })
      ));
      alert(`Đã tạo thành công ${suppliers.length} phiếu nhập chờ duyệt!`);
      router.push('/admin/inventory/imports');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
      setSaving(false);
    }
  };

  // Helper to calculate total
  let totalAmount = 0;
  productGroups.forEach(g => {
    g.items.forEach(i => {
      const qty = Number(i.quantity) || 0;
      const prc = Number(i.importPrice) || 0;
      totalAmount += qty * prc;
    });
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lập Phiếu Nhập Mới</h1>
        </div>
        <div className="flex items-center space-x-3">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 bg-neutral-100 text-neutral-700 px-5 py-2.5 rounded-lg font-bold hover:bg-neutral-200 transition-colors">
            <Upload size={20} />
            <span>Nhập từ CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">

            {/* Search Box */}
            <div className="relative mb-6 z-20">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  type="text"
                  placeholder="Nhập tên sản phẩm hoặc mã SKU để thêm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border-2 border-transparent focus:bg-white focus:border-orange-500 rounded-xl outline-none font-medium transition-all"
                />
              </div>

              {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-neutral-100 overflow-hidden max-h-[400px] overflow-y-auto">

                  {/* SKU Results */}
                  {displaySkus.length > 0 && (
                    <div className="p-2 border-b border-neutral-100">
                      <div className="text-xs font-bold text-neutral-400 uppercase px-3 py-2">Tìm theo SKU</div>
                      {displaySkus.map((skuMatch, idx) => (
                        <button
                          key={`sku-${idx}`}
                          onClick={() => addProductGroup(skuMatch.product, skuMatch.matchedVariant)}
                          className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-neutral-100 flex items-center justify-center shrink-0">
                              <Package size={16} className="text-neutral-400" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-neutral-900 group-hover:text-orange-600 transition-colors">{skuMatch.matchedVariant.sku}</div>
                              <div className="text-xs text-neutral-500">
                                {skuMatch.product.nameVi} • {skuMatch.matchedVariant.colorVi} • Size {skuMatch.matchedVariant.size}
                              </div>
                            </div>
                          </div>
                          <Plus size={18} className="text-neutral-300 group-hover:text-orange-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Product Name Results */}
                  {displayProducts.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-bold text-neutral-400 uppercase px-3 py-2">Tìm theo Tên Sản Phẩm</div>
                      {displayProducts.map((p, idx) => (
                        <button
                          key={`prod-${idx}`}
                          onClick={() => addProductGroup(p)}
                          className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            {p.images?.length > 0 ? (
                              <img src={p.images[0].imageUrl} alt="" className="w-10 h-10 rounded object-cover border border-neutral-200" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-neutral-100 flex items-center justify-center border border-neutral-200">?</div>
                            )}
                            <div>
                              <div className="font-bold text-sm text-neutral-900 group-hover:text-orange-600 transition-colors">{p.nameVi}</div>
                              <div className="text-xs text-neutral-500">{p.brand?.name || 'Không có thương hiệu'}</div>
                            </div>
                          </div>
                          <Plus size={18} className="text-neutral-300 group-hover:text-orange-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  {displaySkus.length === 0 && displayProducts.length === 0 && (
                    <div className="p-8 text-center text-neutral-500">
                      <Search size={24} className="mx-auto text-neutral-300 mb-2" />
                      <p>Không tìm thấy sản phẩm nào phù hợp</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Groups List */}
            <div className="space-y-6">
              {productGroups.map((group, gIdx) => {

                // Get unique colors for this product
                const uniqueColors = Array.from(new Set(group.availableVariants.map(v => v.colorVi))).filter(Boolean);

                return (
                  <div key={group.productId} className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                    {/* Product Header */}
                    <div className="bg-neutral-50 border-b border-neutral-200 p-4 flex items-center gap-4">
                      {group.productImage ? (
                        <img src={group.productImage} alt="" className="w-12 h-12 rounded bg-white object-cover border border-neutral-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-neutral-200 shrink-0"></div>
                      )}
                      <div>
                        <h3 className="font-bold text-neutral-900 leading-tight">{group.productName}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">{group.brandName}</p>
                      </div>
                    </div>

                    {/* Variant Rows */}
                    <div className="p-4 space-y-4">
                      {group.items.map((item, iIdx) => {
                        // Resolve available sizes based on selected color
                        const validVariantsForColor = group.availableVariants.filter(v => v.colorVi === item.color);
                        const availableSizes = Array.from(new Set(validVariantsForColor.map(v => v.size))).filter(Boolean);

                        // Check if a specific Variant is resolved
                        const resolvedVariant = group.availableVariants.find(v => v.colorVi === item.color && v.size === item.size);
                        const isValid = !!resolvedVariant;

                        // Identify if size dropdown should be disabled
                        const isSizeDisabled = !item.color || availableSizes.length === 0;
                        const sizePlaceholder = !item.color ? 'Chọn màu trước' : (availableSizes.length === 0 ? 'Không có size' : 'Chọn size');

                        return (
                          <div key={item.id} className="relative bg-white border border-neutral-200 rounded-lg p-4 group/row">
                            <button
                              onClick={() => removeVariantRow(gIdx, iIdx)}
                              className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border border-neutral-200 text-neutral-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors z-10 shadow-sm opacity-0 group-hover/row:opacity-100"
                              title="Xóa biến thể này"
                            >
                              <X size={14} />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              {/* Color Select */}
                              <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">Màu sắc</label>
                                <select
                                  value={item.color}
                                  onChange={e => updateVariantRow(gIdx, iIdx, 'color', e.target.value)}
                                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
                                >
                                  <option value="">Chọn màu</option>
                                  {uniqueColors.map((c, i) => (
                                    <option key={i} value={c as string}>{c as string}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Size Select */}
                              <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">Kích thước</label>
                                <select
                                  value={item.size}
                                  onChange={e => updateVariantRow(gIdx, iIdx, 'size', e.target.value)}
                                  disabled={isSizeDisabled}
                                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:bg-white disabled:opacity-60 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                                >
                                  <option value="">{sizePlaceholder}</option>
                                  {availableSizes.map((s, i) => (
                                    <option key={i} value={s as string}>{s as string}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Supplier Input */}
                              <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">Nhà cung cấp</label>
                                <input
                                  type="text"
                                  value={item.supplierName || ''}
                                  onChange={e => updateVariantRow(gIdx, iIdx, 'supplierName', e.target.value)}
                                  placeholder="Mặc định"
                                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
                                />
                              </div>
                            </div>

                            <div className="flex gap-4 items-end pt-4 border-t border-dashed border-neutral-100">
                              {/* Quantity */}
                              <div className="w-24">
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">Số lượng</label>
                                <input
                                  type="number" min="1"
                                  value={item.quantity}
                                  onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    updateVariantRow(gIdx, iIdx, 'quantity', val === '' ? '' : parseInt(val, 10));
                                  }}
                                  disabled={!isValid}
                                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:bg-white disabled:opacity-50 disabled:bg-neutral-100"
                                />
                              </div>

                              {/* Price */}
                              <div className="w-40">
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">Giá nhập (VNĐ)</label>
                                <input
                                  type="text"
                                  value={item.importPrice ? new Intl.NumberFormat('vi-VN').format(item.importPrice) : ''}
                                  onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    updateVariantRow(gIdx, iIdx, 'importPrice', val === '' ? '' : parseInt(val, 10));
                                  }}
                                  disabled={!isValid}
                                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:bg-white disabled:opacity-50 disabled:bg-neutral-100"
                                />
                              </div>

                              {/* Info/Total */}
                              <div className="flex-1 text-right">
                                {isValid ? (
                                  <>
                                    <div className="text-[11px] text-neutral-400 font-mono mb-1 leading-none">{resolvedVariant.sku}</div>
                                    <div className="text-orange-600 font-bold leading-none">
                                      {((Number(item.quantity) || 0) * (Number(item.importPrice) || 0)).toLocaleString()} đ
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-amber-600 font-medium flex items-center justify-end gap-1 pb-1">
                                    <AlertCircle size={14} /> Chọn đủ màu, size hợp lệ
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => addVariantRow(gIdx)}
                        className="w-full py-3 border-2 border-dashed border-neutral-200 text-neutral-500 font-semibold rounded-lg hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Plus size={16} /> Thêm biến thể
                      </button>
                    </div>
                  </div>
                );
              })}

              {productGroups.length === 0 && (
                <div className="text-center p-12 border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-500">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package size={24} className="text-neutral-300" />
                  </div>
                  <p className="font-medium text-neutral-600">Chưa có sản phẩm nào</p>
                  <p className="text-sm mt-1">Vui lòng sử dụng thanh tìm kiếm phía trên để chọn sản phẩm cần nhập</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-4 text-neutral-900">Thông tin Phiếu</h3>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-2 text-sm">Nhà cung cấp (Mặc định)</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-sm"
                  placeholder="Nhập tên nhà cung cấp..."
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-2 text-sm">Ghi chú (Tùy chọn)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full h-24 p-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors resize-none text-sm"
                  placeholder="Ghi chú thêm về lô hàng này..."
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                <span className="font-semibold text-neutral-600">Tổng cộng:</span>
                <span className="text-2xl font-black text-orange-500">{totalAmount.toLocaleString()} đ</span>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button onClick={() => router.back()} className="flex-1 py-3.5 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving || productGroups.length === 0} className="flex-1 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu Phiếu'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
