'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, ClipboardCheck, ArrowRightLeft, Trash2, RotateCcw,
  ChevronDown, ChevronRight, X, AlertTriangle, CheckCircle, Package, Settings2
} from 'lucide-react';
import api from '@/lib/axios';

// ============================================================
// Types
// ============================================================
interface InventoryBatchResponse {
  id: string; // Batch ID
  batchCode: string;
  quantity: number;
  warehouseType: string;
  productStatus: string;
  variantId: string;
  sku: string;
  colorVi: string;
  size: string;
  productNameVi: string;
  primaryImageUrl?: string;
  basePrice: number;
  priceModifier: number;
  qualityPercentage?: number;
  conditionNote?: string;
  importDate?: string;
  importPrice?: number;
}

interface GroupedProduct {
  productNameVi: string;
  primaryImageUrl?: string;
  totalQuantity: number;
  batches: InventoryBatchResponse[];
}

// ============================================================
// Utility helpers
// ============================================================
const fmt = (n?: number) =>
  n != null ? n.toLocaleString('vi-VN') + 'đ' : '—';

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleString('vi-VN') : '—';

function QualityBadge({ value }: { value?: number }) {
  if (value == null) return <span className="text-neutral-400 text-xs">Chưa kiểm kê</span>;
  const color =
    value >= 95 ? 'bg-emerald-100 text-emerald-700' :
      value >= 80 ? 'bg-amber-100 text-amber-700' :
        'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {value}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle size={11} /> Hoạt động</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold"><X size={11} /> Tiêu hủy</span>;
}

// ============================================================
// Modals
// ============================================================

function AdjustModal({ batch, onClose, onSuccess }: {
  batch: InventoryBatchResponse; onClose: () => void; onSuccess: () => void;
}) {
  const [splits, setSplits] = useState<{ id: string; quantity: number; quality: number }[]>([]);
  const [currentQtyStr, setCurrentQtyStr] = useState('');
  const [baseQuality, setBaseQuality] = useState(batch.qualityPercentage ?? 100);
  const [loading, setLoading] = useState(false);

  const remainingQty = batch.quantity - splits.reduce((acc, curr) => acc + curr.quantity, 0);

  const addSplit = () => {
    const qty = Number(currentQtyStr);
    if (!qty || qty <= 0) { alert('Vui lòng nhập số lượng hợp lệ'); return; }
    if (qty > remainingQty) { alert(`Số lượng không được vượt quá tồn kho còn lại (${remainingQty})`); return; }

    setSplits([...splits, {
      id: Math.random().toString(36).substring(7),
      quantity: qty,
      quality: batch.qualityPercentage ?? 100
    }]);
    setCurrentQtyStr('');
  };

  const removeSplit = (id: string) => {
    setSplits(splits.filter(s => s.id !== id));
  };

  const updateSplitQuality = (id: string, quality: number) => {
    setSplits(splits.map(s => s.id === id ? { ...s, quality } : s));
  };

  const submit = async () => {
    const isBaseQualityChanged = remainingQty > 0 && baseQuality !== batch.qualityPercentage;
    if (splits.length === 0 && !isBaseQualityChanged) {
      alert('Vui lòng điều chỉnh chất lượng nhóm gốc hoặc tách nhóm mới.');
      return;
    }

    setLoading(true);
    try {
      // Execute all splits sequentially
      for (const split of splits) {
        await api.put(`/warehouse/batches/${batch.id}/adjust`, {
          qualityPercentage: split.quality,
          quantity: split.quantity
        });
      }

      // Adjust remaining quantity if quality changed
      if (isBaseQualityChanged) {
        await api.put(`/warehouse/batches/${batch.id}/adjust`, {
          qualityPercentage: baseQuality,
          quantity: remainingQty
        });
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Có lỗi xảy ra trong quá trình điều chỉnh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-neutral-800 p-5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Settings2 size={20} /> Điều chỉnh Chất lượng
              </h2>
              <p className="text-purple-200 text-sm mt-0.5">{batch.batchCode}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-semibold text-neutral-700">Tồn kho gốc</span>
              <span className="font-bold text-neutral-900">{remainingQty} đôi</span>
            </div>
            {remainingQty > 0 ? (
              <div>
                <label className="flex justify-between text-sm font-medium text-neutral-600 mb-2">
                  <span>Thiết lập chất lượng:</span>
                  <span className="text-blue-600 font-bold">{baseQuality}%</span>
                </label>
                <input
                  type="range" min={0} max={100} value={baseQuality}
                  onChange={e => setBaseQuality(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-neutral-400 mt-1">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">Đã tách hết toàn bộ số lượng.</p>
            )}
          </div>

          {/* Danh sách các nhóm đã tách */}
          {splits.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-neutral-700">Các nhóm đã tách để điều chỉnh:</h3>
              {splits.map((split, index) => (
                <div key={split.id} className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl flex flex-col gap-3 relative">
                  <button
                    onClick={() => removeSplit(split.id)}
                    className="absolute top-2 right-2 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="font-semibold text-purple-700 text-sm">
                    Nhóm {index + 1}: <span className="text-xl">{split.quantity}</span> đôi
                  </div>
                  <div>
                    <label className="flex justify-between text-sm font-semibold text-neutral-700 mb-2">
                      <span>Chất lượng mới:</span>
                      <span className="text-purple-600">{split.quality}%</span>
                    </label>
                    <input
                      type="range" min={0} max={100} value={split.quality}
                      onChange={e => updateSplitQuality(split.id, Number(e.target.value))}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-neutral-400 mt-1">
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form tách nhóm mới */}
          {remainingQty > 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Số lượng cần điều chỉnh (Tồn kho còn lại: {remainingQty})
              </label>
              <div className="flex gap-2">
                <input
                  type="number" max={remainingQty} min={1} value={currentQtyStr}
                  onChange={e => setCurrentQtyStr(e.target.value)}
                  placeholder="Nhập số lượng..."
                  className="flex-1 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={addSplit}
                  className="px-5 py-2.5 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Tách
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium">
              Đã tách toàn bộ số lượng trong lô hàng này.
            </div>
          )}


        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50 transition-colors">
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={loading || (splits.length === 0 && (remainingQty === 0 || baseQuality === batch.qualityPercentage))}
            className="flex-1 py-2.5 rounded bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-20 transition-colors"
          >
            {loading ? 'Đang xử lý...' : `Lưu tất cả`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClearanceModal({ batch, onClose, onSuccess }: {
  batch: InventoryBatchResponse; onClose: () => void; onSuccess: () => void;
}) {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(batch.quantity);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!price || !quantity) { alert('Vui lòng nhập đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      await api.post(`/warehouse/batches/${batch.id}/clearance`, {
        clearancePrice: Number(price),
        quantity: Number(quantity)
      });
      alert('Đã chuyển thành công lô hàng sang kho thanh lý!');
      onSuccess();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <ArrowRightLeft size={20} /> Thanh lý Lô Hàng
              </h2>
              <p className="text-amber-100 text-sm mt-0.5">{batch.batchCode} – {batch.sku}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-neutral-50 rounded-xl px-4 py-3 flex justify-between text-sm border border-neutral-100">
            <span className="text-neutral-500">Tồn kho hiện tại</span>
            <span className="font-bold text-neutral-700">{batch.quantity} đôi</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Số lượng muốn thanh lý <span className="text-red-500">*</span>
            </label>
            <input
              type="number" max={batch.quantity} min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))}
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {quantity < batch.quantity && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Hệ thống sẽ tự động TÁCH LÔ (Split Batch) phần thanh lý.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Giá thanh lý <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={price ? new Intl.NumberFormat('vi-VN').format(Number(price)) : ''}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPrice(val);
                }}
                placeholder="VD: 1.690.000"
                className="w-full border border-neutral-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">đ</span>
            </div>
          </div>

        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50 transition-colors">
            Hủy
          </button>
          <button
            onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận Thanh lý'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DisposeModal({ batch, onClose, onSuccess }: {
  batch: InventoryBatchResponse; onClose: () => void; onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) { alert('Vui lòng nhập lý do tiêu hủy'); return; }
    if (!confirm(`Xác nhận tiêu hủy Lô "${batch.batchCode}"?\nHành động này không thể hoàn tác.`)) return;
    setLoading(true);
    try {
      await api.post(`/warehouse/batches/${batch.id}/dispose`, { disposedReason: reason });
      onSuccess();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Trash2 size={20} /> Tiêu hủy Lô Hàng
              </h2>
              <p className="text-red-200 text-sm mt-0.5">{batch.batchCode}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">


          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Lý do tiêu hủy <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4} value={reason} onChange={e => setReason(e.target.value)}
              placeholder="VD: Hư hỏng nặng, không thể sửa chữa..."
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50">
            Hủy bỏ
          </button>
          <button
            onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Đang xử lý...' : '⚠️ Xác nhận Tiêu hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function InventoryWarehousePage() {
  const [batches, setBatches] = useState<InventoryBatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'alpha' | 'oldest' | 'newest'>('alpha');

  // Expanded rows (Variant ID)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Modals
  const [adjustTarget, setAdjustTarget] = useState<InventoryBatchResponse | null>(null);
  const [clearanceTarget, setClearanceTarget] = useState<InventoryBatchResponse | null>(null);
  const [disposeTarget, setDisposeTarget] = useState<InventoryBatchResponse | null>(null);

  const handleRestore = async (batch: InventoryBatchResponse) => {
    if (!confirm(`Xác nhận phục hồi lô hàng "${batch.batchCode}" về kho nhập?`)) return;
    try {
      await api.post(`/warehouse/batches/${batch.id}/restore`);
      fetchBatches(true);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const fetchBatches = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('productStatus', statusFilter);
      // Fetch all inventory batches
      const res = await api.get(`/warehouse/inventory?${params}`);
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // Group batches into Products
  const productMap = new Map<string, GroupedProduct>();

  for (const b of batches) {
    const key = b.productNameVi || 'Unknown';
    if (!productMap.has(key)) {
      productMap.set(key, {
        productNameVi: key,
        primaryImageUrl: b.primaryImageUrl,
        totalQuantity: 0,
        batches: []
      });
    }
    const grp = productMap.get(key)!;
    grp.batches.push(b);
    if (b.productStatus === 'ACTIVE') {
      grp.totalQuantity += b.quantity;
    }
  }

  // Convert map to array and filter by search
  const displayGroups = Array.from(productMap.values()).filter(g =>
    g.productNameVi.toLowerCase().includes(search.toLowerCase()) ||
    g.batches.some(b => b.sku.toLowerCase().includes(search.toLowerCase())) ||
    g.batches.some(b => b.batchCode.toLowerCase().includes(search.toLowerCase()))
  );

  displayGroups.forEach(g => {
    g.batches.sort((a, b) => {
      const timeA = new Date(a.importDate || 0).getTime();
      const timeB = new Date(b.importDate || 0).getTime();
      if (sortOrder === 'alpha') return timeB - timeA; // inner batches still sort by newest if alpha
      return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
    });
  });

  displayGroups.sort((a, b) => {
    if (sortOrder === 'alpha') {
      return (a.productNameVi || '').localeCompare(b.productNameVi || '');
    }
    if (!a.batches.length) return 1;
    if (!b.batches.length) return -1;
    const timeA = new Date(a.batches[0].importDate || 0).getTime();
    const timeB = new Date(b.batches[0].importDate || 0).getTime();
    return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
  });

  const toggleExpand = (variantId: string) => {
    setExpanded(prev => ({ ...prev, [variantId]: !prev[variantId] }));
  };

  const totalActiveBatches = batches.filter(b => b.productStatus === 'ACTIVE').length;
  const totalDisposedBatches = batches.filter(b => b.productStatus === 'DISPOSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Kho Nhập (Inventory)</h1>
        <p className="text-neutral-500 mt-1">Quản lý các lô hàng nhập kho, kiểm kê chất lượng và thanh lý</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng số Lô', value: batches.length, color: 'bg-blue-500', textColor: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Lô Đang hoạt động', value: totalActiveBatches, color: 'bg-emerald-500', textColor: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Lô Đã tiêu hủy', value: totalDisposedBatches, color: 'bg-red-500', textColor: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-white`}>
            <p className="text-sm text-neutral-500 font-medium">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text" placeholder="Tìm tên sản phẩm, SKU, Mã lô..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="">Tất cả trạng thái Lô</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="DISPOSED">Đã tiêu hủy</option>
          </select>

          <select
            value={sortOrder} onChange={e => setSortOrder(e.target.value as 'alpha' | 'oldest' | 'newest')}
            className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="alpha">Tên A-Z</option>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>

          {(statusFilter || search || sortOrder !== 'alpha') && (
            <button
              onClick={() => { setStatusFilter(''); setSearch(''); setSortOrder('alpha'); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 border border-neutral-200 rounded-xl"
            >
              <X size={14} /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* TreeTable */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">Đang tải dữ liệu lô hàng...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-5 py-4 font-semibold text-neutral-600 w-10"></th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Sản phẩm</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Tồn kho</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Ngày nhập</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Giá nhập</th>
                  {/* <th className="px-5 py-4 font-semibold text-neutral-600">Version</th> */}
                  <th className="px-5 py-4 font-semibold text-neutral-600">Chất lượng</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Trạng thái</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayGroups.map(grp => (
                  <React.Fragment key={grp.productNameVi}>
                    {/* Parent Row (Product) */}
                    <tr
                      className="hover:bg-neutral-50 transition-colors cursor-pointer bg-white"
                      onClick={() => toggleExpand(grp.productNameVi)}
                    >
                      <td className="px-5 py-4 text-neutral-400">
                        {expanded[grp.productNameVi] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {grp.primaryImageUrl ? (
                            <img src={grp.primaryImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-neutral-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs border border-neutral-200">?</div>
                          )}
                          <div>
                            <p className="font-semibold text-neutral-900">{grp.productNameVi}</p>
                            <p className="text-neutral-500 text-xs mt-0.5">
                              {grp.batches.length} Lô hàng
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-neutral-900">
                        {grp.totalQuantity} <span className="text-xs font-normal text-neutral-500">đôi (Active)</span>
                      </td>
                      <td className="px-5 py-4 text-neutral-400 text-xs" colSpan={3}>
                      </td>
                      <td className="px-5 py-4 text-right" colSpan={2}>
                        {/* Parent row has no actions */}
                      </td>
                    </tr>

                    {/* Child Rows (Batches) */}
                    {expanded[grp.productNameVi] && grp.batches.map((batch, idx) => (
                      <tr key={batch.id} className={`bg-neutral-50/50 ${idx === grp.batches.length - 1 ? 'border-b-2 border-neutral-200' : ''}`}>
                        <td className="px-5 py-3"></td>
                        <td className="px-5 py-3">
                          <div className="pl-4">
                            <div className="font-semibold text-neutral-800 text-sm">{batch.sku}</div>

                            <div className="text-xs text-neutral-500">{batch.colorVi} • Size {batch.size}</div>

                            <div className="mt-1 flex items-center gap-1">
                              <Package size={12} className="text-neutral-400" />
                              <code className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {batch.batchCode}
                              </code>
                            </div>

                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-neutral-800 pl-4">{batch.quantity}</td>
                        <td className="px-5 py-3 text-neutral-600">{fmtDate(batch.importDate)}</td>
                        <td className="px-5 py-3 text-neutral-600">{fmt(batch.importPrice)}</td>
                        {/* <td className="px-5 py-3 text-neutral-600">{batch.version}</td> */}
                        <td className="px-5 py-3">
                          <QualityBadge value={batch.qualityPercentage} />
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={batch.productStatus} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {batch.quantity > 0 && batch.productStatus === 'ACTIVE' ? (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setAdjustTarget(batch); }}
                                  title="Điều chỉnh & Tách/Gộp lô"
                                  className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                >
                                  <Settings2 size={16} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setClearanceTarget(batch); }}
                                  title="Thanh lý"
                                  className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                >
                                  <ArrowRightLeft size={16} />
                                </button>
                              </>
                            ) : (
                              <span className="p-1.5 text-neutral-300"><Settings2 size={16} /></span>
                            )}
                            {batch.productStatus === 'ACTIVE' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDisposeTarget(batch); }}
                                title="Tiêu hủy"
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            {batch.productStatus === 'DISPOSED' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRestore(batch); }}
                                title="Phục hồi về kho"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {displayGroups.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-neutral-400">
                      Không có dữ liệu phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {adjustTarget && (
        <AdjustModal
          batch={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={() => fetchBatches(true)}
        />
      )}
      {clearanceTarget && (
        <ClearanceModal
          batch={clearanceTarget}
          onClose={() => setClearanceTarget(null)}
          onSuccess={() => fetchBatches(true)}
        />
      )}
      {disposeTarget && (
        <DisposeModal
          batch={disposeTarget}
          onClose={() => setDisposeTarget(null)}
          onSuccess={() => fetchBatches(true)}
        />
      )}
    </div>
  );
}
