'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import api from '@/lib/axios';
import ProductCard, { ProductProps } from '@/components/ui/ProductCard';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/translations';

export default function HomePage() {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  const { settings, fetchSettings } = useSiteSettingsStore();
  const { language } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();
  const t = useTranslation(language);

  useEffect(() => {
    fetchSettings();
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products/best-sellers?limit=4');
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        const response = await api.get('/products/recommendations');
        setRecommendedProducts(response.data.slice(0, 4));
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoadingRecs(false);
      }
    };

    const fetchBanners = async () => {
      try {
        const response = await api.get('/banners');
        const heroBanners = response.data.filter((b: any) => b.position === 'HOME_HERO');
        setBanners(heroBanners);
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };

    fetchProducts();
    fetchRecommendations();
    fetchBanners();
  }, [fetchSettings]);

  // Determine which banners to use
  const carouselBanners = banners.length > 0
    ? banners.map((b: any) => ({ url: b.imageUrl, link: b.targetUrl || b.link || '' }))
    : (settings?.homeBanners || []);

  const intervalMs = settings?.bannerIntervalMs || 5000;

  // Auto slider - pauses on hover
  const goNext = useCallback(() => {
    if (carouselBanners.length <= 1) return;
    setCurrentBannerIndex(prev => (prev + 1) % carouselBanners.length);
  }, [carouselBanners.length]);

  const goPrev = useCallback(() => {
    if (carouselBanners.length <= 1) return;
    setCurrentBannerIndex(prev => (prev - 1 + carouselBanners.length) % carouselBanners.length);
  }, [carouselBanners.length]);

  useEffect(() => {
    if (carouselBanners.length <= 1 || isHoveringCarousel) return;
    const interval = setInterval(goNext, intervalMs);
    return () => clearInterval(interval);
  }, [carouselBanners.length, isHoveringCarousel, intervalMs, goNext]);

  const currentBanner = carouselBanners[currentBannerIndex];
  const showHero = !settings?.homeHeroTitleVi?.startsWith('[HIDDEN]');

  return (
    <div className="min-h-screen bg-white selection:bg-orange-500 selection:text-white">

      {/* ─── CAROUSEL HERO ─────────────────────────────────────────────── */}
      {carouselBanners.length > 0 ? (
        <section
          className="relative w-full h-[85vh] max-h-[900px] min-h-[600px] overflow-hidden bg-neutral-950"
          onMouseEnter={() => setIsHoveringCarousel(true)}
          onMouseLeave={() => setIsHoveringCarousel(false)}
        >
          {/* Slides - hiệu ứng trượt ngang */}
            <div className="absolute inset-0 overflow-hidden">
              <AnimatePresence initial={false} custom={currentBannerIndex} mode="popLayout">
                <motion.div
                  key={currentBannerIndex}
                  custom={currentBannerIndex}
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute inset-0"
                >
                  {currentBanner?.link ? (
                    <Link href={currentBanner.link} className="w-full h-full block">
                      <img
                        src={currentBanner?.url || currentBanner?.imageUrl}
                        alt={`Banner ${currentBannerIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  ) : (
                    <img
                      src={currentBanner?.url || currentBanner?.imageUrl}
                      alt={`Banner ${currentBannerIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {showHero && (
              <>
                {/* Gradient block - mở rộng thêm để che phủ text */}
                <div
                  className="absolute inset-y-0 left-0 w-[90%] md:w-[80%] z-[5] pointer-events-none"
                  style={{ background: 'linear-gradient(to right, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 30%, rgba(0, 0, 0, 0.5) 70%, rgba(0, 0, 0, 0) 100%)' }}
                />

                {/* Hero text overlay */}
                <div className="absolute inset-0 flex items-center z-10 pt-20">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="max-w-2xl text-white"
                    >
                      <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-8 border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        <span className="text-sm font-medium tracking-wide uppercase">
                          {language === 'vi' ? 'Bộ sưu tập mới' : 'New Collection'}
                        </span>
                      </div>
                      <h1
                        className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: language === 'vi'
                            ? (settings?.homeHeroTitleVi?.replace('[HIDDEN]', '') || 'ĐỊNH HÌNH \n <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">PHONG CÁCH</span>\n CỦA BẠN.')
                            : (settings?.homeHeroTitleEn?.replace('[HIDDEN]', '') || 'DEFINE \n YOUR <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">STYLE</span>.')
                        }}
                      />
                      <div
                        className="text-lg text-neutral-300 mb-10 leading-relaxed max-w-xl"
                        dangerouslySetInnerHTML={{ __html: language === 'vi' ? (settings?.homeShortDescVi || 'Khám phá những mẫu giày thể thao cao cấp nhất.') : (settings?.homeShortDescEn || 'Discover our premium sneakers collection.') }}
                      />
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/shop" className="group flex items-center justify-center bg-white text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-neutral-200 transition-all">
                          {t('buyNow')}
                          <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/about" className="flex items-center justify-center bg-transparent border border-white/20 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-white/10 transition-all">
                          {language === 'vi' ? 'Khám Phá Vanguard' : 'Explore Vanguard'}
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </>
            )}

            {/* Arrow Navigation */}
            {carouselBanners.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-all"
                  aria-label="Previous banner"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-all"
                  aria-label="Next banner"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Dot Indicators */}
            {carouselBanners.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                {carouselBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'bg-orange-500 w-8 h-2.5' : 'bg-white/40 w-2.5 h-2.5 hover:bg-white/70'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Progress bar */}
            {carouselBanners.length > 1 && !isHoveringCarousel && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
                <motion.div
                  key={`progress-${currentBannerIndex}`}
                  className="h-full bg-orange-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: intervalMs / 1000, ease: 'linear' }}
                />
              </div>
            )}
          </section>
        ) : (
          /* Fallback hero khi chưa có banner */
        <section className="relative h-[85vh] max-h-[900px] min-h-[600px] flex items-center pt-20 overflow-hidden bg-neutral-950 text-white">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
              <div className="absolute inset-0 bg-gradient-to-l from-orange-500/20 to-transparent blur-3xl"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black tracking-tighter text-white/5 whitespace-nowrap z-0 pointer-events-none select-none">
              VANGUARD
            </div>
            {showHero && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-2xl"
                >
                  <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-8 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    <span className="text-sm font-medium tracking-wide uppercase">
                      {language === 'vi' ? 'Bộ sưu tập mới' : 'New Collection'}
                    </span>
                  </div>
                  <h1
                    className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 whitespace-pre-line"
                    dangerouslySetInnerHTML={{
                      __html: language === 'vi'
                        ? (settings?.homeHeroTitleVi?.replace('[HIDDEN]', '') || 'ĐỊNH HÌNH \n <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">PHONG CÁCH</span> CỦA BẠN.')
                        : (settings?.homeHeroTitleEn?.replace('[HIDDEN]', '') || 'DEFINE \n YOUR <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">STYLE</span>.')
                    }}
                  />
                  <div
                    className="text-lg text-neutral-400 mb-10 leading-relaxed max-w-xl"
                    dangerouslySetInnerHTML={{ __html: language === 'vi' ? (settings?.homeShortDescVi || 'Khám phá những mẫu giày thể thao cao cấp nhất.') : (settings?.homeShortDescEn || 'Discover our premium sneakers collection.') }}
                  />
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/shop" className="group flex items-center justify-center bg-white text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-neutral-200 transition-all">
                      {t('buyNow')}
                      <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/about" className="flex items-center justify-center bg-transparent border border-white/20 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-white/10 transition-all">
                      {language === 'vi' ? 'Khám Phá Vanguard' : 'Explore Vanguard'}
                    </Link>
                  </div>
                </motion.div>
              </div>
            )}
          </section>
      )}

      {/* Marquee Features */}
      {settings?.homeServices && settings.homeServices.length > 0 && (
        <div className="bg-orange-500 py-4 overflow-hidden flex whitespace-nowrap">
          <div className="animate-[marquee_20s_linear_infinite] flex items-center space-x-12 text-black font-bold tracking-widest uppercase text-sm">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-12">
                {settings.homeServices!.map((service: any, idx: number) => (
                  <span key={idx} className="flex items-center">
                    {service.iconUrl ? <img src={service.iconUrl} className="w-5 h-5 mr-2" alt="icon" /> : <Zap size={16} className="mr-2" />}
                    {language === 'vi' ? service.titleVi : service.titleEn}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {settings?.homeCategories && settings.homeCategories.length > 0 && (
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-4">
                {language === 'vi' ? (settings?.homeCategoriesTitleVi || 'MUA THEO DANH MỤC') : (settings?.homeCategoriesTitleEn || 'SHOP BY CATEGORY')}
              </h2>
              <p className="text-neutral-500 text-lg">
                {language === 'vi' ? (settings?.homeCategoriesSubtitleVi || 'Tìm kiếm phong cách phù hợp với bạn') : (settings?.homeCategoriesSubtitleEn || 'Find the right style for you')}
              </p>
            </div>
            <Link href="/shop" className="hidden md:flex items-center text-orange-500 font-bold hover:text-orange-600 group">
              {t('seeAll')} <ChevronRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {settings.homeCategories.map((cat: any, idx: number) => (
              <Link key={idx} href={cat.link || '#'} className="group relative h-[400px] rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                <img src={cat.imageUrl} alt={cat.titleVi} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute bottom-8 left-8 z-20">
                  <h3 className="text-3xl font-black text-white mb-2">{language === 'vi' ? cat.titleVi : cat.titleEn}</h3>
                  <span className="inline-flex items-center text-white font-medium group-hover:text-orange-400 transition-colors">
                    {language === 'vi' ? 'Khám phá' : 'Explore'} <ArrowRight size={16} className="ml-2" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-24 bg-neutral-50 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight mb-4">
              {language === 'vi' ? (settings?.homeFeaturedTitleVi || 'SẢN PHẨM NỔI BẬT') : (settings?.homeFeaturedTitleEn || 'FEATURED PRODUCTS')}
            </h2>
            <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
              {language === 'vi'
                ? (settings?.homeFeaturedSubtitleVi || 'Những mẫu giày được săn đón nhất trong mùa này.')
                : (settings?.homeFeaturedSubtitleEn || 'The most sought-after shoes of the season.')}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Link href="/shop" className="inline-flex items-center justify-center bg-black text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-neutral-800 transition-all">
              {t('seeAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      {isAuthenticated && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-16">
              <div className="w-12 h-1 bg-orange-500 mr-6 hidden md:block"></div>
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">
                  {language === 'vi' ? 'DÀNH RIÊNG CHO BẠN' : 'RECOMMENDED FOR YOU'}
                </h2>
                <p className="text-neutral-500 text-lg">
                  {language === 'vi'
                    ? 'Gợi ý sản phẩm dựa trên sở thích và lịch sử mua sắm của bạn.'
                    : 'Product recommendations based on your preferences and purchase history.'}
                </p>
              </div>
            </div>

            {loadingRecs ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : recommendedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {recommendedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-500 py-12">
                {language === 'vi' ? 'Chưa có gợi ý nào.' : 'No recommendations available.'}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
