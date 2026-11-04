'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Home, Package, ShieldCheck, Truck, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

export default function ClearanceProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingBatchId, setAddingBatchId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const router = useRouter();
  const fetchCart = useCartStore(state => state.fetchCart);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/clearance/${slug}`);
        setProduct(res.data);
        if (res.data.images && res.data.images.length > 0) {
          setSelectedImage(res.data.images[0].imageUrl);
        }
      } catch (err) {
        console.error("Failed to fetch clearance product", err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleQuantityChange = (batchId: string, delta: number, max: number) => {
    setQuantities(prev => {
      const current = prev[batchId] || 1;
      const next = Math.max(1, Math.min(max, current + delta));
      return { ...prev, [batchId]: next };
    });
  };

  const handleAddToCart = async (batch: any) => {
    const { token, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }
    setAddingBatchId(batch.id);
    try {
      await api.post(`/cart/items`, null, {
        params: {
          variantId: batch.variantId,
          quantity: quantities[batch.id] || 1,
          inventoryBatchId: batch.id
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      // Trigger cart update event to update cart icon count
      await fetchCart();
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingBatchId(null);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-24 pb-16 text-center text-neutral-500 min-h-[50vh] flex items-center justify-center">
        <p className="text-xl">Không tìm thấy sản phẩm xả kho.</p>
      </div>
    );
  }

  const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex text-sm text-neutral-500 mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="hover:text-black transition-colors">Trang chủ</Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight size={14} className="mx-1" />
              <Link href="/shop/clearance" className="hover:text-black transition-colors">Xả kho</Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight size={14} className="mx-1" />
              <span className="text-neutral-900 font-medium line-clamp-1">{product.clearanceNameVi || product.nameVi}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Global Product Images */}
        <div className="lg:col-span-5">
          <div className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center">
            <img src={hoveredImage || selectedImage || product.images?.[0]?.imageUrl || '/placeholder.png'} alt={product.clearanceNameVi || product.nameVi} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images?.map((img: any, i: number) => (
              <button 
                key={i} 
                onClick={() => setSelectedImage(img.imageUrl)}
                onMouseEnter={() => setHoveredImage(img.imageUrl)}
                onMouseLeave={() => setHoveredImage(null)}
                className={`aspect-square bg-neutral-100 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img.imageUrl ? 'border-orange-500' : 'border-transparent hover:border-neutral-300'}`}
              >
                <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info & Batches */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="inline-flex items-center bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold mb-4 w-fit">
            <Package className="w-4 h-4 mr-1" /> HÀNG THANH LÝ
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 mb-4">{product.clearanceNameVi || product.nameVi}</h1>
          <p className="text-neutral-500 mb-6">{product.clearanceDescriptionVi || product.descriptionVi}</p>

          <div className="mb-8 border-b border-neutral-200 pb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Các lô hàng đang thanh lý:</h3>

            </div>

            {product.clearanceBatches && product.clearanceBatches.length > 0 ? (
              <div className="space-y-4">
                {[...product.clearanceBatches]
                  .sort((a, b) => {
                    const timeA = new Date(a.importDate || 0).getTime();
                    const timeB = new Date(b.importDate || 0).getTime();
                    return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
                  })
                  .map((batch: any) => (
                    <div 
                      key={batch.id} 
                      onClick={() => { if (batch.imageUrl) setSelectedImage(batch.imageUrl) }}
                      className="border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 relative overflow-hidden group hover:border-orange-500 transition-colors bg-white cursor-pointer"
                    >
                      {/* Batch Image */}
                      {batch.imageUrl ? (
                        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                          <img src={batch.imageUrl} alt="Ảnh thực tế" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs text-center p-2">

                        </div>
                      )}

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg">{batch.colorVi} - Size {batch.size}</span>
                            <span className="bg-neutral-800 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">{batch.qualityPercentage}% Mới</span>
                          </div>
                          <p className="text-sm text-neutral-500 mb-2">Tồn kho: <span className="font-bold text-neutral-800">{batch.quantity}</span> sản phẩm</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto gap-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-orange-600">{fmt(batch.clearancePrice || product.basePrice)}</span>
                            <span className="text-sm text-neutral-400 line-through">{fmt(product.basePrice)}</span>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Quantity Selector */}
                            <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 h-10">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleQuantityChange(batch.id, -1, batch.quantity); }}
                                className="w-10 h-full flex items-center justify-center hover:bg-neutral-200 transition-colors text-lg"
                                disabled={batch.quantity <= 0}
                              >-</button>
                              <div className="w-10 text-center font-bold text-sm flex items-center justify-center">
                                {batch.quantity > 0 ? (quantities[batch.id] || 1) : 0}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleQuantityChange(batch.id, 1, batch.quantity); }}
                                className="w-10 h-full flex items-center justify-center hover:bg-neutral-200 transition-colors text-lg"
                                disabled={batch.quantity <= 0}
                              >+</button>
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(batch); }}
                              disabled={addingBatchId === batch.id || batch.quantity <= 0}
                              className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors h-10"
                            >
                              {addingBatchId === batch.id ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              ) : (
                                <><ShoppingCart size={18} /> Thêm vào giỏ</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-neutral-500">Sản phẩm này đã hết hàng thanh lý.</p>
            )}
          </div>



        </div>
      </div>
    </div>
  );
}
