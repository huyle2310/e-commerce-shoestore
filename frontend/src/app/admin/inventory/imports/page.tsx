'use client';

import { useEffect, useState } from 'react';
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function ImportReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/inventory/receipts?type=IMPORT');
      setReceipts(response.data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveReceipt = async (id: string) => {
    if (!confirm('Xác nhận hoàn tất phiếu nhập này? Tồn kho sẽ được cộng thêm tương ứng.')) return;
    try {
      await api.put(`/inventory/receipts/${id}/approve`);
      fetchReceipts();
      alert('Đã xác nhận phiếu nhập thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const cancelReceipt = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy phiếu nhập này?')) return;
    try {
      await api.put(`/inventory/receipts/${id}/cancel`);
      fetchReceipts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Phiếu nhập kho</h1>
        </div>
        <Link href="/admin/inventory/imports/new" className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-colors">
          <Plus size={20} />
          <span>Lập phiếu nhập</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-sm">
                  <th className="p-4 font-semibold text-neutral-600">Mã phiếu</th>
                  <th className="p-4 font-semibold text-neutral-600">Ngày tạo</th>
                  <th className="p-4 font-semibold text-neutral-600">Nhà cung cấp</th>
                  <th className="p-4 font-semibold text-neutral-600">Người tạo</th>
                  <th className="p-4 font-semibold text-neutral-600">Số loại SP</th>
                  <th className="p-4 font-semibold text-neutral-600">Trạng thái</th>
                  <th className="p-4 font-semibold text-neutral-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} onClick={() => setSelectedReceipt(receipt)} className="hover:bg-neutral-50 transition-colors cursor-pointer">
                    <td className="p-4 font-bold text-neutral-900">{receipt.referenceCode}</td>
                    <td className="p-4 text-neutral-600">{new Date(receipt.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="p-4 text-neutral-600">{receipt.supplierName || '---'}</td>
                    <td className="p-4 text-neutral-600">{receipt.createdBy}</td>
                    <td className="p-4 font-medium">{receipt.items?.length || 0} mục</td>
                    <td className="p-4">
                      {receipt.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-600 text-xs font-bold">Đã hoàn tất</span>
                      ) : receipt.status === 'CANCELLED' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-bold">Đã hủy</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-bold">Chờ duyệt</span>
                      )}
                    </td>
                    <td className="p-4 flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      {receipt.status === 'PENDING' && (
                        <>
                          <button onClick={() => approveReceipt(receipt.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Xác nhận nhập kho"><CheckCircle size={18} /></button>
                          <button onClick={() => cancelReceipt(receipt.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hủy phiếu"><XCircle size={18} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      Chưa có phiếu nhập nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Chi tiết phiếu nhập: {selectedReceipt.referenceCode}</h2>
                <p className="text-sm text-neutral-500 mt-1">Ngày tạo: {new Date(selectedReceipt.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="p-2 text-neutral-500 hover:bg-neutral-200 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Thông tin chung</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Người tạo:</span> {selectedReceipt.createdBy}</p>
                    <p><span className="font-medium">Nhà cung cấp:</span> {selectedReceipt.supplierName || '---'}</p>
                    <p>
                      <span className="font-medium">Trạng thái:</span> 
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                        selectedReceipt.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 
                        selectedReceipt.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {selectedReceipt.status === 'COMPLETED' ? 'Đã hoàn tất' : selectedReceipt.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ duyệt'}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Ghi chú</h3>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-50 p-3 rounded-lg border border-neutral-100 min-h-[80px]">
                    {selectedReceipt.note || 'Không có ghi chú'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Danh sách sản phẩm</h3>
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="p-3 font-semibold text-neutral-600">Sản phẩm</th>
                        <th className="p-3 font-semibold text-neutral-600 text-right">Số lượng</th>
                        <th className="p-3 font-semibold text-neutral-600 text-right">Giá nhập</th>
                        <th className="p-3 font-semibold text-neutral-600 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {selectedReceipt.items?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-neutral-50">
                          <td className="p-3">
                            <div className="font-medium text-neutral-900">{item.productName}</div>
                            <div className="text-xs text-neutral-500">{item.sku} • {item.color} • Size {item.size}</div>
                          </td>
                          <td className="p-3 text-right font-medium">{item.actualQuantity}</td>
                          <td className="p-3 text-right text-neutral-600">{item.importPrice?.toLocaleString()} đ</td>
                          <td className="p-3 text-right font-medium text-orange-600">
                            {((item.actualQuantity || 0) * (item.importPrice || 0)).toLocaleString()} đ
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-neutral-50 font-bold">
                        <td className="p-3 text-right" colSpan={3}>Tổng cộng:</td>
                        <td className="p-3 text-right text-orange-600">
                          {selectedReceipt.items?.reduce((sum: number, item: any) => sum + (item.actualQuantity * item.importPrice), 0).toLocaleString()} đ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {selectedReceipt.status === 'PENDING' && (
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end space-x-3">
                <button 
                  onClick={() => {
                    cancelReceipt(selectedReceipt.id);
                    setSelectedReceipt(null);
                  }} 
                  className="px-4 py-2 bg-white border border-neutral-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors"
                >
                  Hủy phiếu
                </button>
                <button 
                  onClick={() => {
                    approveReceipt(selectedReceipt.id);
                    setSelectedReceipt(null);
                  }} 
                  className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Xác nhận nhập kho
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
