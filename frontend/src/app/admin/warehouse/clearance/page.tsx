'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, ClipboardCheck, Trash2, X, AlertTriangle,
  CheckCircle, ChevronDown, ChevronRight, Package, ImagePlus, RotateCcw
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
  clearancePrice?: number;

  imageUrl?: string;
}

interface GroupedVariant {
  variantId: string;
  sku: string;
  productNameVi: string;
  colorVi: string;
  size: string;
  primaryImageUrl?: string;
  basePrice: number;
  priceModifier: number;
  totalQuantity: number;
  batches: InventoryBatchResponse[];
}

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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {value}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle size={11} /> Đang bán</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold"><X size={11} /> Tiêu hủy</span>;
}

// ============================================================
// Modals
// ============================================================
function ClearancePriceModal({ batch, onClose, onSuccess }: {
  batch: InventoryBatchResponse; onClose: () => void; onSuccess: () => void;
}) {
  const [priceStr, setPriceStr] = useState(batch.clearancePrice?.toString() || '');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const price = Number(priceStr);
    if (!price || price <= 0) { alert('Vui lòng nhập giá xả kho hợp lệ'); return; }

    setLoading(true);
    try {
      await api.put(`/warehouse/batches/${batch.id}/clearance-price`, {
        clearancePrice: price
      });
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
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                Thiết lập Giá Xả Kho
              </h2>
              <p className="text-orange-100 text-sm mt-0.5">{batch.batchCode}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-800">
            Giá gốc: <strong>{fmt(batch.basePrice + (batch.priceModifier || 0))}</strong>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Giá xả kho (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min={1} value={priceStr}
              onChange={e => setPriceStr(e.target.value)}
              placeholder="VD: 500000"
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50">Hủy</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 disabled:opacity-50">
            {loading ? 'Đang lưu...' : 'Lưu giá'}
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
    if (!confirm(`Xác nhận tiêu hủy lô ${batch.batchCode}?`)) return;
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

          <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Lý do tiêu hủy..."
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50">Hủy</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Đang xử lý...' : '⚠️ Tiêu hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Page: Kho Thanh lý
// ============================================================
export default function ClearanceWarehousePage() {
  const [batches, setBatches] = useState<InventoryBatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [priceTarget, setPriceTarget] = useState<InventoryBatchResponse | null>(null);
  const [disposeTarget, setDisposeTarget] = useState<InventoryBatchResponse | null>(null);
  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});

  const handleRevertClearance = async (batchId: string) => {
    if (!confirm('Xác nhận chuyển lô hàng này từ kho thanh lý về lại kho nhập?')) return;
    try {
      await api.post(`/warehouse/batches/${batchId}/revert-clearance`);
      fetchBatches();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleRestore = async (batch: InventoryBatchResponse) => {
    if (!confirm(`Xác nhận phục hồi lô hàng "${batch.batchCode}" về kho nhập?`)) return;
    try {
      await api.post(`/warehouse/batches/${batch.id}/restore`);
      fetchBatches();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('productStatus', statusFilter);
      const res = await api.get(`/warehouse/clearance?${params}`);
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const handleUploadImage = (batchId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          setUploadingIds(prev => ({ ...prev, [batchId]: true }));
          const formData = new FormData();
          formData.append('file', file);
          await api.post(`/warehouse/batches/${batchId}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          fetchBatches();
        } catch (err) {
          alert('Upload ảnh thất bại');
        } finally {
          setUploadingIds(prev => ({ ...prev, [batchId]: false }));
        }
      }
    };
    input.click();
  };

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const groupedVariants: GroupedVariant[] = [];
  const variantMap = new Map<string, GroupedVariant>();

  for (const b of batches) {
    if (!variantMap.has(b.variantId)) {
      variantMap.set(b.variantId, {
        variantId: b.variantId,
        sku: b.sku,
        productNameVi: b.productNameVi,
        colorVi: b.colorVi,
        size: b.size,
        primaryImageUrl: b.primaryImageUrl,
        basePrice: b.basePrice,
        priceModifier: b.priceModifier,
        totalQuantity: 0,
        batches: []
      });
    }
    const grp = variantMap.get(b.variantId)!;
    grp.batches.push(b);
    if (b.productStatus === 'ACTIVE') {
      grp.totalQuantity += b.quantity;
    }
  }

  const displayGroups = Array.from(variantMap.values()).filter(g =>
    g.sku?.toLowerCase().includes(search.toLowerCase()) ||
    g.productNameVi?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (variantId: string) => {
    setExpanded(prev => ({ ...prev, [variantId]: !prev[variantId] }));
  };

  const stats = {
    total: batches.length,
    active: batches.filter(v => v.productStatus === 'ACTIVE').length,
    disposed: batches.filter(v => v.productStatus === 'DISPOSED').length,
    avgDiscount: (() => {
      const active = batches.filter(v => v.clearancePrice && v.basePrice && v.productStatus === 'ACTIVE');
      if (!active.length) return null;
      const avg = active.reduce((sum, v) => {
        const orig = v.basePrice + (v.priceModifier || 0);
        return sum + ((orig - v.clearancePrice!) / orig) * 100;
      }, 0) / active.length;
      return Math.round(avg);
    })(),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Kho Thanh lý</h1>
        <p className="text-neutral-500 mt-1">Quản lý các lô hàng xả kho, hiển thị trên trang Xả Kho</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng số Lô', value: stats.total, textColor: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Đang bán', value: stats.active, textColor: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Đã tiêu hủy', value: stats.disposed, textColor: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-white`}>
            <p className="text-sm text-neutral-500 font-medium">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text" placeholder="Tìm SKU, tên sản phẩm..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="DISPOSED">Đã tiêu hủy</option>
          </select>
          {(statusFilter || search) && (
            <button onClick={() => { setStatusFilter(''); setSearch(''); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 border border-neutral-200 rounded-xl">
              <X size={14} /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">Đang tải dữ liệu lô hàng thanh lý...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-5 py-4 font-semibold text-neutral-600 w-10"></th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Sản phẩm / Lô hàng</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Ngày nhập</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Tồn kho</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Giá gốc</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Giá thanh lý</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Chất lượng</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600">Trạng thái</th>
                  <th className="px-5 py-4 font-semibold text-neutral-600 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayGroups.map(grp => (
                  <React.Fragment key={grp.variantId}>
                    {/* Parent Row */}
                    <tr
                      className="hover:bg-neutral-50 transition-colors cursor-pointer bg-white"
                      onClick={() => toggleExpand(grp.variantId)}
                    >
                      <td className="px-5 py-4 text-neutral-400">
                        {expanded[grp.variantId] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
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
                              {grp.sku} • {grp.colorVi} • Size {grp.size}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-neutral-400 text-xs text-center">—</td>
                      <td className="px-5 py-4 font-bold text-neutral-900">
                        {grp.totalQuantity} <span className="text-xs font-normal text-neutral-500">đôi (Active)</span>
                      </td>
                      <td className="px-5 py-4 text-neutral-400 line-through text-xs">
                        {fmt(grp.basePrice + (grp.priceModifier || 0))}
                      </td>
                      <td className="px-5 py-4 text-neutral-400 text-xs" colSpan={3}>
                        {grp.batches.length} Lô hàng
                      </td>
                      <td className="px-5 py-4 text-right" colSpan={1}></td>
                    </tr>

                    {/* Child Rows */}
                    {expanded[grp.variantId] && grp.batches.map((batch, idx) => {
                      const origPrice = grp.basePrice + (grp.priceModifier || 0);
                      const discount = batch.clearancePrice
                        ? Math.round(((origPrice - batch.clearancePrice) / origPrice) * 100)
                        : null;

                      return (
                        <tr key={batch.id} className={`bg-neutral-50/50 ${idx === grp.batches.length - 1 ? 'border-b-2 border-neutral-200' : ''}`}>
                          <td className="px-5 py-3"></td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2 pl-4">
                              <Package size={14} className="text-neutral-400" />
                              <code className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                {batch.batchCode}
                              </code>

                            </div>

                          </td>
                          <td className="px-5 py-3 text-neutral-500 text-xs">{fmtDate(batch.importDate)}</td>
                          <td className="px-5 py-3 font-semibold text-neutral-800 pl-4">{batch.quantity}</td>
                          <td className="px-5 py-3"></td>
                          <td className="px-5 py-3">
                            <div>
                              <p className="font-bold text-orange-600">{fmt(batch.clearancePrice)}</p>
                              {discount != null && discount > 0 && (
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">-{discount}%</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3"><QualityBadge value={batch.qualityPercentage} /></td>
                          <td className="px-5 py-3"><StatusBadge status={batch.productStatus} /></td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {batch.quantity > 0 && batch.productStatus === 'ACTIVE' && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleRevertClearance(batch.id); }} title="Chuyển về kho nhập"
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                                    <RotateCcw size={16} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setDisposeTarget(batch); }} title="Tiêu hủy"
                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </>
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
                      );
                    })}
                  </React.Fragment>
                ))}
                {displayGroups.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-neutral-400">
                      Không có dữ liệu phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {priceTarget && (
        <ClearancePriceModal batch={priceTarget} onClose={() => setPriceTarget(null)} onSuccess={fetchBatches} />
      )}
      {disposeTarget && (
        <DisposeModal batch={disposeTarget} onClose={() => setDisposeTarget(null)} onSuccess={fetchBatches} />
      )}
    </div>
  );
}
