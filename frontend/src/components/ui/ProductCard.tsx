import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ProductProps {
  id: string;
  nameVi: string;
  nameEn?: string;
  slug: string;
  descriptionVi?: string;
  descriptionEn?: string;
  basePrice: number;
  category?: { nameVi: string; slug: string };
  targetAudience?: string;
  brand?: { id: string; name: string };
  images?: { imageUrl: string; isPrimary: boolean }[];
  createdAt?: string;
  averageRating?: number;
  variants?: {
    stockQuantity: number;
    effectivePrice?: number | string;
    productStatus?: 'ACTIVE' | 'DISPOSED';
  }[];
  clearanceBatches?: {
    clearancePrice: number | string;
  }[];
}

export default function ProductCard({ product }: { product: ProductProps }) {
  const primaryImage = product.images?.find(img => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2370&auto=format&fit=crop';
  const nonPrimaryImages = product.images?.filter(img => img.imageUrl !== primaryImage) || [];
  const secondaryImage = nonPrimaryImages[0]?.imageUrl;
  const saleableVariants = product.variants || [];
  const validVariantPrices = saleableVariants
    .map(variant => Number(variant.effectivePrice))
    .filter(price => !isNaN(price) && price > 0);
    
  let lowestPrice = validVariantPrices.length > 0 
    ? Math.min(...validVariantPrices) 
    : product.basePrice;

  // Nếu có clearance batches, lấy giá xả kho thấp nhất
  if (product.clearanceBatches && product.clearanceBatches.length > 0) {
    const clearancePrices = product.clearanceBatches
      .map((batch: any) => Number(batch.clearancePrice))
      .filter(price => !isNaN(price) && price > 0);
      
    if (clearancePrices.length > 0) {
      lowestPrice = Math.min(...clearancePrices);
    }
  }

  const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(lowestPrice);

  const totalStock = product.variants
    ? saleableVariants.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0)
    : -1;
  const isOutOfStock = totalStock === 0;

  return (
    <div className={`group relative bg-white overflow-hidden border border-neutral-200 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 rounded-xl ${isOutOfStock ? 'opacity-60 grayscale-[50%]' : ''}`}>
      <Link href={`/shop/${product.slug}`} className="block relative aspect-square overflow-hidden bg-neutral-50 p-5">
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          {product.brand && (
            <span className="bg-white/90 backdrop-blur-xs text-neutral-800 text-[10px] font-mono tracking-widest px-2.5 py-1 uppercase border border-neutral-200 rounded-full font-bold shadow-xs">
              {product.brand.name}
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-xs">
            <span className="bg-neutral-900 text-white px-4 py-1.5 font-mono text-xs font-black tracking-widest uppercase rounded-full">
              HẾT HÀNG
            </span>
          </div>
        )}

        {/* Hover dark overlay - 40% opacity (giảm bớt để thấy ảnh thứ 2 rõ hơn) */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-400 z-10 " />

        {/* Subtle shadow for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent z-0"></div>

        <img
          src={primaryImage}
          alt={product.nameVi}
          className={`relative z-[5] w-full h-full object-contain transition-all duration-700 ease-out drop-shadow-2xl ${secondaryImage ? 'group-hover:opacity-0' : ''}`}
        />

        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.nameVi} - Alternate`}
            className="absolute inset-0 p-5 z-[6] w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out drop-shadow-2xl"
          />
        )}
      </Link>

      <div className="p-4 relative border-t border-neutral-100 bg-white">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-mono tracking-wider text-neutral-500 uppercase font-medium">
            {product.category?.nameVi || 'VANGUARD'}
          </p>
          <div className="flex items-center text-amber-500">
            <Star size={12} className="fill-current" />
            <span className="text-[11px] font-mono font-bold text-neutral-700 ml-1">
              {product.averageRating !== undefined && product.averageRating !== null
                ? product.averageRating.toFixed(1)
                : '5.0'}
            </span>
          </div>
        </div>

        <Link href={`/shop/${product.slug}`}>
          <h3 className="text-sm font-bold text-neutral-900 mb-2 truncate group-hover:text-orange-500 transition-colors uppercase tracking-tight">
            {product.nameVi}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100">
          <p className="text-base font-mono font-black text-neutral-900">
            {price}
          </p>
          <Link
            href={`/shop/${product.slug}`}
            className="w-8 h-8 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors"
            title="Xem chi tiết"
          >
            <ShoppingCart size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
