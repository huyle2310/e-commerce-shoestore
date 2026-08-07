'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PackageOpen } from 'lucide-react';
import api from '@/lib/axios';

interface ClearanceProduct {
  id: string;
  nameVi: string;
  clearanceNameVi?: string;
  slug: string;
  basePrice: number;
  images?: { imageUrl: string }[];
  clearanceBatches?: {
    id: string;
    clearancePrice: number;
    qualityPercentage: number;
    imageUrl?: string;
  }[];
}

export default function ClearancePage() {
  const [products, setProducts] = useState<ClearanceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClearance = async () => {
      try {
        const res = await api.get('/products/clearance');
        setProducts(res.data);
      } catch (err) {
        console.error("Failed to fetch clearance", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClearance();
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8 border-b border-neutral-200 pb-8">
        <PackageOpen size={40} className="text-orange-500" />
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">HÀNG XẢ KHO</h1>
          <p className="text-neutral-500">Mua giày chính hãng với giá siêu ưu đãi, số lượng có hạn!</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          <p className="text-lg">Hiện tại không có sản phẩm nào trong kho thanh lý.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => {
            const minPrice = product.clearanceBatches?.length
              ? Math.min(...product.clearanceBatches.map(b => b.clearancePrice || product.basePrice))
              : product.basePrice;
            const hasCustomImage = product.clearanceBatches?.find(b => b.imageUrl);
            const displayImage = hasCustomImage?.imageUrl || (product.images?.[0]?.imageUrl || '/placeholder.png');

            return (
              <Link href={`/shop/clearance/${product.slug}`} key={product.id} className="group cursor-pointer flex flex-col">
                <div className="relative aspect-square w-full bg-neutral-100 rounded-xl overflow-hidden mb-4">
                  <img src={displayImage} alt={product.nameVi} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded">THANH LÝ</div>
                  {hasCustomImage && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur">
                      Có ảnh thực tế
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 line-clamp-2 leading-tight mb-1 group-hover:text-orange-500 transition-colors">
                    {product.clearanceNameVi || product.nameVi}
                  </h3>
                  <div className="mt-auto pt-2 flex items-end gap-2">
                    <span className="font-bold text-orange-600 text-sm sm:text-lg">
                      Từ {fmt(minPrice)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
