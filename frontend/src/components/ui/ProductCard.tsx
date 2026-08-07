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
    effectivePrice?: number;
    productStatus?: 'ACTIVE' | 'DISPOSED';
  }[];
}

export default function ProductCard({ product }: { product: ProductProps }) {
  const primaryImage = product.images?.find(img => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2370&auto=format&fit=crop';
  const nonPrimaryImages = product.images?.filter(img => img.imageUrl !== primaryImage) || [];
  const secondaryImage = nonPrimaryImages[0]?.imageUrl;
  const saleableVariants = product.variants?.filter(variant => variant.productStatus !== 'DISPOSED') || [];
  const lowestEffectivePrice = saleableVariants
    .map(variant => variant.effectivePrice)
    .filter((price): price is number => typeof price === 'number')
    .reduce<number | undefined>((lowest, price) => lowest === undefined || price < lowest ? price : lowest, undefined);
  const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(lowestEffectivePrice ?? product.basePrice);

  const totalStock = product.variants
    ? saleableVariants.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0)
    : -1;
  const isOutOfStock = totalStock === 0;

  return (
    <div className={`group relative bg-white  overflow-hidden border border-neutral-100 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 ${isOutOfStock ? 'opacity-60 grayscale-[50%]' : ''}`}>
      <Link href={`/shop/${product.slug}`} className="block relative aspect-square overflow-hidden bg-neutral-100 p-6">
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {product.brand && (
            <span className="bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-fit">
              {product.brand.name}
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
            <span className="bg-black text-white px-6 py-2 rounded-full font-black text-lg tracking-widest uppercase transform -rotate-12 shadow-xl border-2 border-black/10">
              Đã hết
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
            className="absolute inset-0 p-6 z-[6] w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out drop-shadow-2xl"
          />
        )}
      </Link>

      <div className="p-6 relative">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-400">
            {product.category?.nameVi}
          </p>
          <div className="flex items-center text-yellow-400">
            <Star size={14} className="fill-current" />
            <span className="text-xs font-bold text-neutral-600 ml-1">
              {product.averageRating !== undefined && product.averageRating !== null
                ? product.averageRating.toFixed(1)
                : '0.0'}
            </span>
          </div>
        </div>

        <Link href={`/shop/${product.slug}`}>
          <h3 className="text-lg font-bold text-neutral-900 mb-2 truncate group-hover:text-orange-500 transition-colors">
            {product.nameVi}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xl font-black text-black">
            {price}
          </p>
          <Link
            href={`/shop/${product.slug}`}
            className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors transform group-hover:scale-110"
            title="Xem chi tiết sản phẩm"
          >
            <ShoppingCart size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
