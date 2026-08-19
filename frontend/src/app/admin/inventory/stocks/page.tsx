'use client';

import { useEffect, useState } from 'react';
import { Package, Search, AlertCircle, Copy } from 'lucide-react';
import api from '@/lib/axios';

export default function InventoryStocksPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/admin/all');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .map(p => {
      if (showOutOfStockOnly) {
        const outOfStockVariants = p.variants.filter((v: any) => v.stockQuantity === 0);
        if (outOfStockVariants.length === 0) return null;
        return { ...p, variants: outOfStockVariants };
      }
      return p;
    })
    .filter(p => p !== null)
    .filter((p: any) =>
      p.nameVi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tồn kho hiện tại</h1>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer text-sm text-neutral-600 hover:text-neutral-900">
            <input
              type="checkbox"
              checked={showOutOfStockOnly}
              onChange={(e) => setShowOutOfStockOnly(e.target.checked)}
              className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
            />
            <span>Chỉ hiển thị hết hàng</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-lg outline-none focus:border-orange-500 min-w-[300px]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-sm">
                  <th className="p-4 font-semibold text-neutral-600">Sản phẩm</th>
                  <th className="p-4 font-semibold text-neutral-600">Phân loại (Màu sắc)</th>
                  <th className="p-4 font-semibold text-neutral-600">Size</th>
                  <th className="p-4 font-semibold text-neutral-600">Mã SKU</th>
                  <th className="p-4 font-semibold text-neutral-600 text-right">Tồn kho</th>
                  <th className="p-4 font-semibold text-neutral-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {filteredProducts.map((product) => (
                  product.variants.map((variant: any, index: number) => (
                    <tr key={variant.id} className="hover:bg-neutral-50 transition-colors">
                      {index === 0 && (
                        <td className="p-4 align-top" rowSpan={product.variants.length}>
                          <div className="flex items-center space-x-3">
                            <img src={product.images?.[0]?.imageUrl || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-lg object-cover bg-neutral-100" alt="" />
                            <span className="font-bold text-neutral-900">{product.nameVi}</span>
                          </div>
                        </td>
                      )}
                      <td className="p-4 text-neutral-600">{variant.colorVi}</td>
                      <td className="p-4 font-medium">{variant.size}</td>
                      <td className="p-4 text-neutral-500">
                        <div className="flex items-center space-x-2">
                          <span>{variant.sku}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(variant.sku);
                              alert('Đã copy mã SKU: ' + variant.sku);
                            }}
                            className="text-neutral-400 hover:text-orange-500 transition-colors p-1 rounded hover:bg-orange-50"
                            title="Copy SKU"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-right text-neutral-900">
                        {variant.stockQuantity}
                      </td>
                      <td className="p-4">
                        {variant.stockQuantity === 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-bold">Hết hàng</span>
                        ) : variant.stockQuantity < 10 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 text-orange-600 text-xs font-bold">Sắp hết</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-600 text-xs font-bold">Còn hàng</span>
                        )}
                      </td>
                    </tr>
                  ))
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      Không tìm thấy sản phẩm nào phù hợp.
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
