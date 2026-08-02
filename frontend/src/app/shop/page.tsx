'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import ProductCard, { ProductProps } from '@/components/ui/ProductCard';

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('q') || '';

  const [products, setProducts] = useState<ProductProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  // Price range: pending (input) vs applied (trigger fetch)
  const [pendingPriceRange, setPendingPriceRange] = useState<[number, number]>([0, 50000000]);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>([0, 50000000]);
  const [priceRangeChanged, setPriceRangeChanged] = useState(false);

  const [sortBy, setSortBy] = useState('newest');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Sync state if URL changes
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Check if pending price differs from applied
  useEffect(() => {
    const changed = pendingPriceRange[0] !== appliedPriceRange[0] || pendingPriceRange[1] !== appliedPriceRange[1];
    setPriceRangeChanged(changed);
  }, [pendingPriceRange, appliedPriceRange]);

  // Mock data for filters
  const targetAudiences = [
    { id: 'NAM', name: 'Nam' },
    { id: 'NU', name: 'Nữ' },
    { id: 'UNISEX', name: 'Unisex' },
    { id: 'PHU_KIEN', name: 'Phụ kiện' }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setSuggestion(null);
      try {
        let data: ProductProps[] = [];
        let sourceDataForBrands: any[] = [];

        if (searchQuery) {
          const response = await api.get(`/products/search?keyword=${encodeURIComponent(searchQuery)}`);
          data = response.data.products;
          sourceDataForBrands = data;
          if (response.data.suggestion) {
            setSuggestion(response.data.suggestion);
          }
        } else {
          const response = await api.get('/products');
          data = response.data;
          sourceDataForBrands = data;
        }

        // Extract unique brands
        const uniqueBrands = Array.from(new Set(sourceDataForBrands.map((p: any) => p.brand?.id)))
          .filter(Boolean)
          .map(id => sourceDataForBrands.find((p: any) => p.brand?.id === id)?.brand);
        setBrands(uniqueBrands as any);

        // Extract unique colors
        const uniqueColors = Array.from(new Set(sourceDataForBrands.flatMap((p: any) => p.variants?.map((v: any) => v.colorVi) || []))).filter(Boolean);
        setColors(uniqueColors as string[]);

        // Category / Target Audience filtering
        if (selectedCategory) {
          data = data.filter(p => p.targetAudience === selectedCategory);
        }

        // Brand filtering
        if (selectedBrands.length > 0) {
          data = data.filter(p => p.brand && selectedBrands.includes(p.brand.id));
        }

        // Color filtering
        if (selectedColors.length > 0) {
          data = data.filter(p => p.variants && p.variants.some((v: any) => selectedColors.includes(v.colorVi)));
        }

        // Price filtering (using APPLIED price range)
        data = data.filter(p => p.basePrice >= appliedPriceRange[0] && p.basePrice <= appliedPriceRange[1]);

        // Sorting
        if (sortBy === 'newest') {
          data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === 'price-asc') {
          data.sort((a, b) => a.basePrice - b.basePrice);
        } else if (sortBy === 'price-desc') {
          data.sort((a, b) => b.basePrice - a.basePrice);
        } else if (sortBy === 'best-selling') {
          data.sort((a: any, b: any) => (b.soldQuantity || 0) - (a.soldQuantity || 0));
        }

        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  // Only appliedPriceRange triggers fetch (not pendingPriceRange)
  }, [searchQuery, selectedCategory, selectedBrands, selectedColors, appliedPriceRange, sortBy]);

  const handleApplyPriceFilter = () => {
    setAppliedPriceRange([...pendingPriceRange]);
    setPriceRangeChanged(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedBrands([]);
    setSelectedColors([]);
    setPendingPriceRange([0, 50000000]);
    setAppliedPriceRange([0, 50000000]);
    setPriceRangeChanged(false);
  };

  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-neutral-200 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            {searchQuery ? `KẾT QUẢ TÌM KIẾM: "${searchQuery}"` : 'TẤT CẢ SẢN PHẨM'}
          </h1>
          {suggestion && (
            <p className="text-orange-500 font-medium mb-2 text-lg">
              Có phải bạn muốn tìm: <a href={`/shop?q=${encodeURIComponent(suggestion)}`} className="font-bold underline">&quot;{suggestion}&quot;</a>?
            </p>
          )}
          <p className="text-neutral-500">Hiển thị {products.length} kết quả</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden flex items-center bg-neutral-100 px-4 py-2 rounded-full font-medium"
          >
            <Filter size={18} className="mr-2" /> Bộ lọc
          </button>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-neutral-100 border-none px-4 py-2 pr-10 rounded-full font-medium text-neutral-900 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="best-selling">Bán chạy</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Filter */}
        <AnimatePresence>
          {(isFilterOpen || (mounted && window.innerWidth >= 768)) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:w-64 flex-shrink-0 w-full"
            >
              <div className="space-y-8 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pb-4 pr-1">
                {/* Categories / Target Audience */}
                <div>
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Đối tượng</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`block text-left w-full transition-colors ${selectedCategory === '' ? 'text-orange-500 font-bold' : 'text-neutral-500 hover:text-black'}`}
                    >
                      Tất cả
                    </button>
                    {targetAudiences.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`block text-left w-full transition-colors ${selectedCategory === cat.id ? 'text-orange-500 font-bold' : 'text-neutral-500 hover:text-black'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div>
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Thương hiệu</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {brands.map(brand => (
                      <label key={brand.id} className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedBrands.includes(brand.id) ? 'bg-orange-500 border-orange-500' : 'border-neutral-300 group-hover:border-orange-500'}`}>
                          {selectedBrands.includes(brand.id) && <Check size={14} className="text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedBrands.includes(brand.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBrands([...selectedBrands, brand.id]);
                            } else {
                              setSelectedBrands(selectedBrands.filter(id => id !== brand.id));
                            }
                          }}
                        />
                        <span className={`transition-colors ${selectedBrands.includes(brand.id) ? 'font-bold text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`}>{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Màu sắc</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {colors.map(color => (
                      <label key={color} className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedColors.includes(color) ? 'bg-orange-500 border-orange-500' : 'border-neutral-300 group-hover:border-orange-500'}`}>
                          {selectedColors.includes(color) && <Check size={14} className="text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedColors.includes(color)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColors([...selectedColors, color]);
                            } else {
                              setSelectedColors(selectedColors.filter(c => c !== color));
                            }
                          }}
                        />
                        <span className={`transition-colors ${selectedColors.includes(color) ? 'font-bold text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`}>{color}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range - with Apply button */}
                <div>
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">Mức giá</h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="number"
                      placeholder="Từ"
                      value={pendingPriceRange[0] === 0 ? '' : pendingPriceRange[0]}
                      onChange={(e) => setPendingPriceRange([e.target.value ? parseInt(e.target.value) : 0, pendingPriceRange[1]])}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none focus:border-orange-500 text-sm"
                    />
                    <span className="text-neutral-500 flex-shrink-0">-</span>
                    <input
                      type="number"
                      placeholder="Đến"
                      value={pendingPriceRange[1] === 50000000 ? '' : pendingPriceRange[1]}
                      onChange={(e) => setPendingPriceRange([pendingPriceRange[0], e.target.value ? parseInt(e.target.value) : 50000000])}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none focus:border-orange-500 text-sm"
                    />
                  </div>
                  {/* Apply Price Filter Button */}
                  <button
                    onClick={handleApplyPriceFilter}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${priceRangeChanged
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30 animate-pulse'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                  >
                    <SlidersHorizontal size={16} />
                    Lọc kết quả
                  </button>
                  {appliedPriceRange[0] > 0 || appliedPriceRange[1] < 50000000 ? (
                    <p className="text-xs text-orange-500 mt-2 font-medium">
                      Đang lọc: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appliedPriceRange[0])} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appliedPriceRange[1])}
                    </p>
                  ) : null}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-neutral-50 rounded-3xl">
              <h3 className="text-2xl font-bold mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-neutral-500">Vui lòng thử thay đổi điều kiện lọc.</p>
              <button
                onClick={handleClearFilters}
                className="mt-6 px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-neutral-800 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
