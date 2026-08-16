'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import api from '@/lib/axios';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { useLanguageStore } from '@/store/languageStore';

interface ProductDetailProps {
  id: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  basePrice: number;
  category?: { nameVi: string };
  brand?: { name: string };
  images: { imageUrl: string; isPrimary: boolean }[];
  variants: {
    id: string;
    size: string;
    colorVi: string;
    stockQuantity: number;
    priceModifier: number;
    effectivePrice?: number;
    originalPrice?: number;
    warehouseType?: 'INVENTORY' | 'CLEARANCE';
    productStatus?: 'ACTIVE' | 'DISPOSED';
  }[];
  averageRating: number;
  totalReviews: number;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { settings } = useSiteSettingsStore();
  const { language } = useLanguageStore();
  const [product, setProduct] = useState<ProductDetailProps | null>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quantityError, setQuantityError] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const { isAuthenticated, user } = useAuthStore();

  const { addToCart } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${slug}`);
        setProduct(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedImage(response.data.images[0].imageUrl);
        }
        if (response.data.variants && response.data.variants.length > 0) {
          const saleableVariants = response.data.variants
            .filter((variant: ProductDetailProps['variants'][number]) => variant.productStatus !== 'DISPOSED');
          const defaultVariant = saleableVariants.find(
            (variant: ProductDetailProps['variants'][number]) => variant.stockQuantity > 0
          ) || saleableVariants[0];
          if (defaultVariant) {
            setSelectedColor(defaultVariant.colorVi || '');
            setSelectedSize(defaultVariant.size);
          }
        }

        // Fetch reviews
        try {
          const reviewsResponse = await api.get(`/products/${response.data.id}/reviews`);
          setReviews(reviewsResponse.data);
        } catch (e) {
          console.error("Error fetching reviews", e);
        }

        // Fetch similar products
        try {
          const similarResponse = await api.get(`/products/${response.data.id}/similar`);
          setSimilarProducts(similarResponse.data);
        } catch (e) {
          console.error("Error fetching similar products", e);
        }

      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

  // Tự động điền lại đánh giá cũ nếu user đã từng đánh giá
  useEffect(() => {
    if (isAuthenticated && user && reviews.length > 0 && !hasSubmitted) {
      const myReview = reviews.find(r => r.userId === user.id);
      if (myReview) {
        setNewRating(myReview.rating);
        setNewComment(myReview.comment);
      }
    }
  }, [isAuthenticated, user, reviews, hasSubmitted]);

  const handleAddToCart = async () => {
    if (colors.length > 0 && !selectedColor) {
      setError('Vui lòng chọn màu sắc');
      return;
    }
    if (!selectedSize) {
      setError('Vui lòng chọn kích thước');
      return;
    }

    const variant = product?.variants.find(v =>
      v.productStatus !== 'DISPOSED' &&
      v.size === selectedSize &&
      (colors.length === 0 || v.colorVi === selectedColor)
    );

    if (!variant) {
      setError('Sản phẩm với phân loại này không khả dụng');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      await addToCart(variant.id, quantity, { ...variant, product });
      setSuccess('Đã thêm sản phẩm vào giỏ hàng!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setAdding(false);
    }
  };

  // Validate and add to cart, then redirect to checkout
  const handleBuyNow = async () => {
    if (colors.length > 0 && !selectedColor) {
      setError('Vui lòng chọn màu sắc');
      return;
    }
    if (!selectedSize) {
      setError('Vui lòng chọn kích thước');
      return;
    }
    const colorsArr = Array.from(new Set(product?.variants?.map(v => v.colorVi).filter(Boolean) || [])) as string[];
    const variant = product?.variants?.find(v =>
      v.productStatus !== 'DISPOSED' &&
      v.size === selectedSize && (colorsArr.length === 0 || v.colorVi === selectedColor)
    );
    if (!variant) {
      setError('Sản phẩm với phân loại này không khả dụng');
      return;
    }
    setBuyingNow(true);
    setError('');
    
    // Instead of adding to cart, set it as buyNowItem
    const buyNowItem = {
      id: 'buynow-' + Date.now(),
      variantId: variant.id,
      productName: product?.nameVi || '',
      color: variant.colorVi,
      size: variant.size,
      imageUrl: selectedImage || '',
      unitPrice: variant.effectivePrice ?? (product?.basePrice || 0) + (variant.priceModifier || 0),
      quantity: quantity,
      stockQuantity: variant.stockQuantity,
      totalPrice: (variant.effectivePrice ?? (product?.basePrice || 0) + (variant.priceModifier || 0)) * quantity,
      sku: variant.id // Adding sku to fix TS error
    };
    
    useCartStore.getState().setBuyNowItem(buyNowItem);
    router.push('/checkout');
  };

  // Handle manual quantity input with validation
  const handleQuantityInput = (value: string) => {
    if (value === '') {
      setQuantity(1);
      setQuantityError('');
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
      setQuantityError('Số lượng phải là số nguyên lớn hơn 0');
      return;
    }
    // Find the variant matching current color + size selection
    const colorsArr = Array.from(new Set(product?.variants?.map(v => v.colorVi).filter(Boolean) || [])) as string[];
    const currentVariant = product?.variants?.find(v =>
      v.productStatus !== 'DISPOSED' &&
      v.size === selectedSize && (colorsArr.length === 0 || v.colorVi === selectedColor)
    );
    if (currentVariant && num > currentVariant.stockQuantity) {
      setQuantityError(`Chỉ còn ${currentVariant.stockQuantity} sản phẩm trong kho`);
      setQuantity(currentVariant.stockQuantity);
      return;
    }
    setQuantityError('');
    setQuantity(num);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setReviewError('Vui lòng đăng nhập để đánh giá');
      return;
    }
    if (newRating === 0) {
      setReviewError('Vui lòng chọn số sao đánh giá');
      return;
    }
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const response = await api.post(`/products/${product?.id}/reviews`, {
        rating: newRating,
        comment: newComment
      });
      const newReview = response.data;
      setReviews(prev => {
        const index = prev.findIndex(r => r.id === newReview.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = newReview;
          // Đẩy review vừa sửa lên đầu
          return [newReview, ...updated.filter(r => r.id !== newReview.id)];
        }
        return [newReview, ...prev];
      });
      setHasSubmitted(true);
      setNewComment('');
      setNewRating(0);
      setReviewSuccess('Cảm ơn bạn đã đánh giá sản phẩm!');
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center text-2xl font-bold">Không tìm thấy sản phẩm</div>;
  }

  const saleableVariants = product.variants?.filter(variant => variant.productStatus !== 'DISPOSED') || [];
  const colors = Array.from(new Set(saleableVariants.map(v => v.colorVi).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(saleableVariants.map(v => v.size))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const checkColorAvailable = (color: string) => {
    if (!selectedSize) return true;
    const variant = saleableVariants.find(v => v.size === selectedSize && v.colorVi === color);
    return variant ? variant.stockQuantity > 0 : false;
  };

  const checkSizeAvailable = (size: string) => {
    if (!selectedColor && colors.length > 0) return true;
    if (colors.length === 0) {
      const variant = saleableVariants.find(v => v.size === size);
      return variant ? variant.stockQuantity > 0 : false;
    }
    const variant = saleableVariants.find(v => v.colorVi === selectedColor && v.size === size);
    return variant ? variant.stockQuantity > 0 : false;
  };

  const currentVariant = saleableVariants.find(v =>
    v.size === selectedSize && (colors.length === 0 || v.colorVi === selectedColor)
  );
  const currentPrice = currentVariant?.effectivePrice ?? product.basePrice;
  const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice);
  const originalPrice = currentVariant?.originalPrice;
  const isClearance = currentVariant?.warehouseType === 'CLEARANCE'
    && originalPrice !== undefined
    && originalPrice > currentPrice;

  return (
    <div className="pt-24 pb-16 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex text-sm text-neutral-500 mb-8 font-medium">
          <a href="/" className="hover:text-orange-500">Trang chủ</a>
          <span className="mx-2">/</span>
          <a href="/shop" className="hover:text-orange-500">Cửa hàng</a>
          <span className="mx-2">/</span>
          <span className="text-black">{product.nameVi}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 lg:items-start">
          {/* Images Section */}
          <div className="flex flex-col-reverse lg:flex-row gap-4 lg:items-start">
            {/* Thumbnails (Left on desktop, Bottom on mobile) */}
            {product.images && product.images.length > 1 && (
              <div className="flex lg:flex-col space-x-4 lg:space-x-0 lg:space-y-4 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px] pb-2 lg:pb-0 lg:w-28 flex-shrink-0 hide-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img.imageUrl)}
                    className={`w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-neutral-100 flex-shrink-0 border-2 overflow-hidden transition-all ${selectedImage === img.imageUrl ? 'border-orange-500' : 'border-transparent hover:border-neutral-300'}`}
                  >
                    <img src={img.imageUrl} alt="" className="w-full h-full object-contain mix-blend-multiply p-2" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 w-full bg-neutral-100 rounded-3xl aspect-square overflow-hidden relative flex items-center justify-center p-8"
            >
              <img src={selectedImage || 'https://via.placeholder.com/800'} alt={product.nameVi} className="w-full h-full object-contain mix-blend-multiply" />
            </motion.div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col pt-4">
            {product.brand && (
              <span className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-2">
                {product.brand.name}
              </span>
            )}
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">{product.nameVi}</h1>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className={i < Math.round(product.averageRating || 0) ? "fill-current" : "text-neutral-300"} />
                ))}
              </div>
              <span className="text-neutral-500 text-sm font-medium">{product.averageRating?.toFixed(1) || "0.0"} / 5 ({product.totalReviews || 0} Đánh giá)</span>
            </div>

            <div className="mb-8">
              <p className="text-3xl font-bold">{price}</p>
              {isClearance && originalPrice !== undefined && (
                <p className="mt-1 text-sm font-medium text-neutral-400 line-through">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
                </p>
              )}
            </div>

            <div 
              className="text-neutral-600 mb-8 leading-relaxed line-clamp-4 prose prose-sm prose-neutral max-w-none whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: language === 'vi' ? (product.descriptionVi?.replace(/&nbsp;/g, ' ') || '') : ((product.descriptionEn || product.descriptionVi)?.replace(/&nbsp;/g, ' ') || '') }}
            />

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Chọn Màu Sắc</h3>
                <div className="flex flex-wrap gap-3">
                  {colors.map(color => {
                    const isAvailable = checkColorAvailable(color);
                    return (
                      <button
                        key={color}
                        disabled={!isAvailable}
                        onClick={() => {
                          if (selectedColor === color) {
                            setSelectedColor('');
                          } else {
                            setSelectedColor(color);
                          }
                          setQuantity(1);
                        }}
                        className={`px-6 py-2 rounded-lg font-bold transition-all border-2 ${
                          !isAvailable 
                            ? 'opacity-40 cursor-not-allowed border-transparent bg-neutral-100 text-neutral-400'
                            : selectedColor === color 
                              ? 'border-black text-black' 
                              : 'border-transparent bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider">Chọn Kích Thước</h3>
                  {currentVariant && (
                    <span className="text-sm font-medium text-orange-500">Kho: {currentVariant.stockQuantity}</span>
                  )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {sizes.map(size => {
                    const isAvailable = checkSizeAvailable(size);
                    return (
                      <button
                        key={size}
                        disabled={!isAvailable}
                        onClick={() => {
                          if (selectedSize === size) {
                            setSelectedSize('');
                          } else {
                            setSelectedSize(size);
                          }
                          setQuantity(1); // Reset quantity when changing size
                        }}
                        className={`py-3 rounded-lg font-bold transition-all ${
                          !isAvailable
                            ? 'opacity-40 cursor-not-allowed bg-neutral-100 text-neutral-400'
                            : selectedSize === size 
                              ? 'bg-black text-white' 
                              : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Số lượng</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-neutral-100 rounded-full overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200 font-bold transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityInput(e.target.value)}
                    min={1}
                    className="w-14 h-10 bg-transparent border-none text-center font-bold text-lg outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => {
                      if (currentVariant && quantity < currentVariant.stockQuantity) {
                        setQuantity(Math.min(quantity + 1, currentVariant.stockQuantity));
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200 font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
                {currentVariant && (
                  <span className="text-sm text-neutral-500">
                    Còn <span className="font-bold text-neutral-800">{currentVariant.stockQuantity}</span> sản phẩm
                  </span>
                )}
              </div>
              {quantityError && <p className="text-red-500 text-sm mt-2 font-medium">{quantityError}</p>}
            </div>

            {error && <p className="text-red-500 mb-4 font-medium">{error}</p>}
            {success && <p className="text-green-500 mb-4 font-medium">{success}</p>}

            {/* Actions */}
            <div className="flex flex-col gap-3 mb-10 mt-auto">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={adding || buyingNow || !currentVariant || currentVariant.stockQuantity === 0}
                  className="flex-1 bg-black text-white font-bold text-lg py-4 rounded-full hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center disabled:opacity-70"
                >
                  {adding ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div> : <><ShoppingCart size={20} className="mr-2" /> Thêm vào giỏ</>}
                </button>
                <button className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0">
                  <Heart size={22} />
                </button>
              </div>
              {/* Mua ngay button */}
              <button
                onClick={handleBuyNow}
                disabled={adding || buyingNow || !currentVariant || currentVariant.stockQuantity === 0}
                className="w-full bg-orange-500 text-white font-bold text-lg py-4 rounded-full hover:bg-neutral-800 transition-all flex items-center justify-center disabled:opacity-70 shadow-lg"
              >
                {buyingNow ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    Mua ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-20 pt-8 border-t border-neutral-200">
          <div className="flex flex-wrap justify-center gap-4 lg:gap-8 border-b border-neutral-100 mb-8">
            <button 
              onClick={() => setActiveTab('description')} 
              className={`pb-4 font-bold transition-all ${activeTab === 'description' ? 'border-b-2 border-red-500 text-black' : 'text-neutral-400 hover:text-black'}`}
            >
              {language === 'vi' ? 'Mô tả sản phẩm' : 'Product Description'}
            </button>
            <button 
              onClick={() => setActiveTab('shipping')} 
              className={`pb-4 font-bold transition-all ${activeTab === 'shipping' ? 'border-b-2 border-red-500 text-black' : 'text-neutral-400 hover:text-black'}`}
            >
              {language === 'vi' ? 'Chính Sách Giao Hàng' : 'Shipping Policy'}
            </button>
            <button 
              onClick={() => setActiveTab('return')} 
              className={`pb-4 font-bold transition-all ${activeTab === 'return' ? 'border-b-2 border-red-500 text-black' : 'text-neutral-400 hover:text-black'}`}
            >
              {language === 'vi' ? 'Chính Sách Đổi Trả & Bảo Hành' : 'Return & Warranty Policy'}
            </button>
          </div>
          
          <div className="max-w-4xl mx-auto px-4">
            {activeTab === 'description' && (
              <div 
                className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: language === 'vi' ? (product.descriptionVi?.replace(/&nbsp;/g, ' ') || '') : ((product.descriptionEn || product.descriptionVi)?.replace(/&nbsp;/g, ' ') || '') }}
              />
            )}
            {activeTab === 'shipping' && (
              <div 
                className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: language === 'vi' 
                  ? (settings?.shippingPolicyVi && settings.shippingPolicyVi !== '<p><br></p>' ? settings.shippingPolicyVi.replace(/&nbsp;/g, ' ') : 'Chưa cập nhật chính sách giao hàng.') 
                  : (settings?.shippingPolicyEn && settings.shippingPolicyEn !== '<p><br></p>' ? settings.shippingPolicyEn.replace(/&nbsp;/g, ' ') : (settings?.shippingPolicyVi && settings.shippingPolicyVi !== '<p><br></p>' ? settings.shippingPolicyVi.replace(/&nbsp;/g, ' ') : 'Shipping policy not updated.')) }}
              />
            )}
            {activeTab === 'return' && (
              <div 
                className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: language === 'vi' 
                  ? (settings?.returnPolicyVi && settings.returnPolicyVi !== '<p><br></p>' ? settings.returnPolicyVi.replace(/&nbsp;/g, ' ') : 'Chưa cập nhật chính sách đổi trả và bảo hành.') 
                  : (settings?.returnPolicyEn && settings.returnPolicyEn !== '<p><br></p>' ? settings.returnPolicyEn.replace(/&nbsp;/g, ' ') : (settings?.returnPolicyVi && settings.returnPolicyVi !== '<p><br></p>' ? settings.returnPolicyVi.replace(/&nbsp;/g, ' ') : 'Return & warranty policy not updated.')) }}
              />
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 pt-16 border-t border-neutral-200">
          <h2 className="text-3xl font-black mb-10">Đánh giá khách hàng</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Review Form */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-50 p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6">Gửi đánh giá của bạn</h3>
                {reviewError && <p className="text-red-500 mb-4 font-medium text-sm">{reviewError}</p>}
                {reviewSuccess && <p className="text-green-500 mb-4 font-medium text-sm">{reviewSuccess}</p>}

                {isAuthenticated ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Đánh giá của bạn</label>
                      <div className="flex space-x-2" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            className={star <= (hoverRating || newRating) ? "text-yellow-400" : "text-neutral-300 transition-colors"}
                          >
                            <Star size={28} className="fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Nhận xét</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        required
                        rows={4}
                        placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-70 flex justify-center items-center"
                    >
                      {reviewLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Gửi đánh giá'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 bg-white rounded-lg border border-neutral-200">
                    <p className="text-neutral-500 mb-4">Vui lòng đăng nhập để gửi đánh giá</p>
                    <button onClick={() => router.push(`/login?redirect=/shop/${slug}`)} className="px-6 py-2 bg-black text-white font-bold rounded-lg">Đăng nhập</button>
                  </div>
                )}
              </div>
            </div>

            {/* Review List */}
            <div className="lg:col-span-2 space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-3xl text-neutral-500">
                  Chưa có đánh giá nào cho sản phẩm này.
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm flex items-start space-x-4">
                    <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center font-bold text-xl text-neutral-500 shrink-0 uppercase">
                      {review.userFullName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{review.userFullName}</h4>
                          <div className="flex text-yellow-400 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-neutral-300"} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-neutral-400">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-neutral-600 mt-3">{review.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-20 pt-16 border-t border-neutral-200">
            <h2 className="text-3xl font-black mb-10">Sản phẩm tương tự</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map((p) => (
                <div key={p.id} className="group cursor-pointer" onClick={() => router.push(`/shop/${p.slug}`)}>
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-neutral-100 mb-4">
                    <img
                      src={p.images && p.images.length > 0 ? p.images[0].imageUrl : 'https://via.placeholder.com/400'}
                      alt={p.nameVi}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate">{p.nameVi}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.basePrice)}
                    </span>
                    <div className="flex items-center text-yellow-400 text-sm">
                      <Star size={14} className="fill-current mr-1" />
                      <span className="text-neutral-600 font-medium">{p.averageRating?.toFixed(1) || "0.0"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
