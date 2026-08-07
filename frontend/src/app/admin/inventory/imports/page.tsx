'use client';

import { useEffect, useState } from 'react';
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function ImportReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
                  <th className="p-4 font-semibold text-neutral-600">Người tạo</th>
                  <th className="p-4 font-semibold text-neutral-600">Số loại SP</th>
                  <th className="p-4 font-semibold text-neutral-600">Trạng thái</th>
                  <th className="p-4 font-semibold text-neutral-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-bold text-neutral-900">{receipt.referenceCode}</td>
                    <td className="p-4 text-neutral-600">{new Date(receipt.createdAt).toLocaleString('vi-VN')}</td>
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
                    <td className="p-4 flex items-center justify-end space-x-2">
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
    </div>
  );
}
