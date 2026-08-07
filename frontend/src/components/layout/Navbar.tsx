'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, User, Menu, X, LogOut, Package, Globe, Search, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from '@/lib/translations';
import api from '@/lib/axios';

interface NavLink {
  nameVi: string;
  nameEn: string;
  path: string;
  hasDropdown?: boolean;
  dropdownType?: 'categories' | 'brands' | 'custom' | 'categories_brands';
  children?: { nameVi: string; nameEn: string; path: string }[];
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchMobileOpen, setIsSearchMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownData, setDropdownData] = useState<{ categories: any[]; brands: any[] }>({ categories: [], brands: [] });
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { settings, fetchSettings, setPreviewSettings } = useSiteSettingsStore();
  const { language, setLanguage } = useLanguageStore();
  const { items } = useCartStore();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const t = useTranslation(language);
  const [mounted, setMounted] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchMobileOpen(false);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  // Avoid hydration mismatch for Zustand
  useEffect(() => {
    setMounted(true);
    fetchSettings();
    // Pre-fetch dropdown data
    const loadDropdownData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: [] })),
          api.get('/brands').catch(() => ({ data: [] }))
        ]);
        setDropdownData({
          categories: Array.isArray(catRes.data) ? catRes.data : [],
          brands: Array.isArray(brandRes.data) ? brandRes.data : []
        });
      } catch (e) {
        // silent fail
      }
    };
    loadDropdownData();
  }, [fetchSettings]);

  // Live Preview Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_SETTINGS') {
        setPreviewSettings(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setPreviewSettings]);

  // Search autocomplete debounce
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchInput = useCallback(async (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!value.trim() || value.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const res = await api.get(`/products/search?keyword=${encodeURIComponent(value.trim())}`);
        const products = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        setSearchSuggestions(products.slice(0, 6));
        setShowSuggestions(true);
      } catch {
        setSearchSuggestions([]);
      } finally {
        setSuggestionLoading(false);
      }
    }, 300);
  }, []);

  // Click outside search to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Read dynamic menu from settings, fallback to hardcoded
  let navLinks: NavLink[] = [
    { nameVi: 'Trang chủ', nameEn: 'Home', path: '/' },
    { nameVi: 'Cửa hàng', nameEn: 'Shop', path: '/shop', hasDropdown: true, dropdownType: 'categories' },
    { nameVi: 'Xả kho', nameEn: 'Clearance', path: '/shop/clearance' },
    { nameVi: 'Về chúng tôi', nameEn: 'About', path: '/about' },
    { nameVi: 'Liên hệ', nameEn: 'Contact', path: '/contact' },
  ];

  if (settings?.headerMenuJson) {
    try {
      const parsed = JSON.parse(settings.headerMenuJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        navLinks = parsed;
      }
    } catch (e) {
      console.error("Failed to parse header menu", e);
    }
  }

  const handleMouseEnterLink = (link: NavLink) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    if (link.hasDropdown || link.children?.length) {
      setActiveDropdown(link.path);
    } else {
      setActiveDropdown(null);
    }
  };

  const handleMouseLeaveNav = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const handleMouseEnterDropdown = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
  };

  const getDropdownItems = (link: NavLink) => {
    // Custom: dùng children array có type 'item' | 'section'
    if (link.dropdownType === 'custom' && link.children && link.children.length > 0) {
      return link.children;
    }
    // Legacy: children array không có type (trước đây)
    if (link.children && link.children.length > 0 && !link.dropdownType) {
      return link.children;
    }
    if (link.dropdownType === 'categories' && dropdownData.categories.length > 0) {
      return [
        { type: 'item', nameVi: 'Hàng xả kho', nameEn: 'Clearance', path: '/shop/clearance' },
        ...dropdownData.categories.map((c: any) => ({
          type: 'item',
          nameVi: c.nameVi || c.name || c.nameEn,
          nameEn: c.nameEn || c.name || c.nameVi,
          path: `/shop?category=${c.slug || c.id}`
        }))
      ];
    }
    if (link.dropdownType === 'brands' && dropdownData.brands.length > 0) {
      return dropdownData.brands.map((b: any) => ({
        type: 'item',
        nameVi: b.nameVi || b.name || b.nameEn,
        nameEn: b.nameEn || b.name || b.nameVi,
        path: `/shop?brand=${b.name || b.slug || b.id}`
      }));
    }
    if (link.dropdownType === 'categories_brands') {
      const items: any[] = [];
      if (dropdownData.categories.length > 0) {
        items.push({ type: 'section', labelVi: 'Danh mục', labelEn: 'Categories' });
        items.push({ type: 'item', nameVi: 'Hàng xả kho', nameEn: 'Clearance', path: '/shop/clearance' });
        items.push(...dropdownData.categories.map((c: any) => ({
          type: 'item',
          nameVi: c.nameVi || c.name || c.nameEn,
          nameEn: c.nameEn || c.name || c.nameVi,
          path: `/shop?category=${c.slug || c.id}`
        })));
      }
      if (dropdownData.brands.length > 0) {
        items.push({ type: 'section', labelVi: 'Thương hiệu', labelEn: 'Brands' });
        items.push(...dropdownData.brands.map((b: any) => ({
          type: 'item',
          nameVi: b.nameVi || b.name || b.nameEn,
          nameEn: b.nameEn || b.name || b.nameVi,
          path: `/shop?brand=${b.slug || b.name || b.id}`
        })));
      }
      return items;
    }

    return [];
  };

  return (
    <nav className="fixed w-full z-50 top-0 bg-[#0C0C0C] backdrop-blur-md border-b border-[FAF9F6]-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center mt-2">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-14 object-contain" />
              ) : (
                <span className="text-3xl font-bold tracking-tighter text-white">VANGUARD<span className="text-white">.</span></span>
              )}
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center " onMouseLeave={handleMouseLeaveNav}>
            {navLinks.map((link) => {
              const dropdownItems = getDropdownItems(link);
              const hasDropdown = link.hasDropdown || (link.children && link.children.length > 0);

              let columns: any[][] = [];
              if (link.dropdownType === 'custom' || link.dropdownType === 'categories_brands') {
                let currentCol: any[] = [];
                dropdownItems.forEach((item: any) => {
                  if (item.type === 'section' && currentCol.length > 0) {
                    columns.push(currentCol);
                    currentCol = [item];
                  } else {
                    currentCol.push(item);
                  }
                });
                if (currentCol.length > 0) columns.push(currentCol);
              } else {
                columns = [dropdownItems.slice(0, 20)];
              }

              const numCols = columns.length;
              const dropdownWidthClass = numCols >= 2 ? (numCols >= 3 ? 'w-auto min-w-[48rem]' : 'w-auto min-w-[32rem]') : 'w-56';

              return (
                <div key={link.path} className="relative" onMouseEnter={() => handleMouseEnterLink(link)}>
                  <Link
                    href={link.path}
                    onClick={(e) => {
                      if (pathname === link.path) {
                        e.preventDefault();
                        window.location.href = link.path;
                      }
                    }}
                    className={`group relative flex items-center py-1 text-base font-medium transition-colors hover:text-orange-500 ${pathname === link.path || pathname?.startsWith(link.path + '/') && link.path !== '/' ? 'text-orange-500' : 'text-neutral-200'}`}
                  >
                    {language === 'vi' ? link.nameVi : link.nameEn}
                    {hasDropdown && dropdownItems.length > 0 && (
                      <ChevronDown size={14} className={`ml-1 transition-transform ${activeDropdown === link.path ? 'rotate-180' : ''}`} />
                    )}
                    <span className={`absolute left-0 bottom-0 h-[2px] bg-orange-500 transition-all duration-300 ${pathname === link.path || pathname?.startsWith(link.path + '/') && link.path !== '/' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {activeDropdown === link.path && dropdownItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute top-full left-0 mt-2 ${dropdownWidthClass} bg-neutral-100 rounded-xl border border-neutral-200 shadow-xl overflow-hidden`}
                        onMouseEnter={handleMouseEnterDropdown}
                        onMouseLeave={handleMouseLeaveNav}
                      >
                        <div className={`p-2 ${numCols > 1 ? 'flex gap-4' : ''}`}>
                          {/* Header "Tất cả" chỉ hiện với loại tự động (không phải custom) */}
                          {link.dropdownType !== 'custom' && (
                            <div className="flex-shrink-0 min-w-max mb-1">
                              <Link
                                href={link.path}
                                className="flex items-center px-4 py-2.5 text-sm font-bold text-orange-500 hover:bg-neutral-100 rounded-lg whitespace-nowrap"
                                onClick={() => setActiveDropdown(null)}
                              >
                                {language === 'vi' ? `Tất cả ${link.nameVi.toLowerCase()}` : `All ${link.nameEn.toLowerCase()}`}
                              </Link>
                              <div className="border-t border-neutral-100 my-1 mx-2" />
                            </div>
                          )}

                          {columns.map((col, cIdx) => (
                            <div key={cIdx} className={`flex flex-col ${numCols > 1 ? 'flex-1 min-w-[12rem]' : 'w-full'}`}>
                              {col.map((item: any, idx: number) => {
                                // Section header / divider
                                if (item.type === 'section') {
                                  return (
                                    <div key={idx}>
                                      {idx > 0 && numCols === 1 && <div className="border-t border-neutral-100 my-1" />}
                                      {(item.labelVi || item.labelEn) && (
                                        <p className="px-3 pt-2 pb-1 text-sm font-bold text-neutral-500 uppercase tracking-widest">
                                          {language === 'vi' ? item.labelVi : (item.labelEn || item.labelVi)}
                                        </p>
                                      )}
                                    </div>
                                  );
                                }
                                // Regular item link
                                return (
                                  <Link
                                    key={idx}
                                    href={item.path || '#'}
                                    className="flex items-center px-3 py-2.5 text-base text-neutral-600 hover:bg-neutral-100 hover:text-orange-500 rounded-lg transition-colors"
                                    onClick={() => setActiveDropdown(null)}
                                  >
                                    {language === 'vi' ? (item.nameVi || item.nameEn) : (item.nameEn || item.nameVi)}
                                  </Link>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search Bar with Autocomplete */}
            <div ref={searchRef} className="relative flex items-center">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={language === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                  className="bg-neutral-100 border border-transparent text-neutral-900 placeholder:text-neutral-500 text-base rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-500 w-48 transition-all focus:w-64"
                />
                <Search size={16} className="absolute left-3 text-neutral-400" />
              </form>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden z-50"
                  >
                    {suggestionLoading ? (
                      <div className="p-4 text-center text-neutral-400 text-sm">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-orange-500 mx-auto" />
                      </div>
                    ) : searchSuggestions.length > 0 ? (
                      <div className="p-2">
                        <p className="px-3 py-1.5 text-sm font-bold text-neutral-500 uppercase tracking-wider">Gợi ý sản phẩm</p>
                        {searchSuggestions.map((product: any) => {
                          const img = product.images?.find((i: any) => i.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl;
                          return (
                            <Link
                              key={product.id}
                              href={`/shop/${product.slug}`}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-100 rounded-lg transition-colors"
                              onClick={() => { setShowSuggestions(false); setSearchQuery(''); }}
                            >
                              {img && (
                                <img src={img} alt={product.nameVi} className="w-10 h-10 rounded-lg object-cover bg-neutral-100 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-medium text-neutral-900 truncate">{language === 'vi' ? product.nameVi : (product.nameEn || product.nameVi)}</p>
                                <p className="text-sm text-orange-500 font-bold">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                        <div className="border-t border-neutral-100 mt-1 pt-1">
                          <button
                            onClick={handleSearch}
                            className="w-full px-3 py-2.5 text-base text-orange-500 hover:bg-neutral-100 rounded-lg text-left transition-colors font-medium"
                          >
                            Xem tất cả kết quả cho &quot;{searchQuery}&quot; →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-neutral-500 text-base">Không tìm thấy sản phẩm</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="flex items-center text-base font-medium text-neutral-100 hover:text-orange-500 transition-colors"
            >
              <Globe size={18} className="mr-1" /> {language.toUpperCase()}
            </button>

            <Link href="/cart" className="relative text-neutral-100 hover:text-orange-500 transition-colors">
              <ShoppingCart size={22} />
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{mounted ? cartCount : 0}</span>
            </Link>

            {mounted && isAuthenticated ? (
              <div className="relative group cursor-pointer">
                <div className="flex items-center space-x-2 text-neutral-100 hover:text-orange-500 transition-colors">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-neutral-200" />
                  ) : (
                    <User size={22} />
                  )}
                  <span className="text-sm font-medium">{user?.fullName?.split(' ').pop()}</span>
                </div>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-neutral-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 overflow-hidden">
                  {user?.role && ['ADMIN', 'SALES_STAFF', 'INVENTORY_STAFF'].includes(user.role) && (
                    <Link href="/admin" className="block px-4 py-3 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-orange-500">
                      Trang quản trị
                    </Link>
                  )}
                  <Link href="/profile" className="flex items-center px-4 py-3 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-orange-500">
                    <User size={16} className="mr-2" /> Hồ sơ cá nhân
                  </Link>
                  <Link href="/orders" className="flex items-center px-4 py-3 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-orange-500">
                    <Package size={16} className="mr-2" /> Đơn hàng của tôi
                  </Link>
                  <button
                    onClick={async () => {
                      try { await api.post('/auth/logout', {}, { withCredentials: true }); } catch (e) { }
                      logout();
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={16} className="mr-2" /> {t('logout')}
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-white bg-neutral-700 px-5 py-2.5 rounded-full hover:bg-orange-600 transition-colors">
                {mounted ? t('login') : 'Đăng nhập'}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsSearchMobileOpen(!isSearchMobileOpen)}
              className="text-neutral-600 hover:text-orange-500 focus:outline-none mr-4"
            >
              <Search size={22} />
            </button>
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="text-sm font-medium text-neutral-600 hover:text-orange-500 mr-4 transition-colors"
            >
              {language.toUpperCase()}
            </button>

            <Link href="/cart" className="relative mr-4 text-neutral-600 hover:text-orange-500 transition-colors">
              <ShoppingCart size={22} />
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{mounted ? cartCount : 0}</span>
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-neutral-600 hover:text-orange-500 focus:outline-none transition-colors"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar with Autocomplete */}
        <AnimatePresence>
          {isSearchMobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden pb-4"
            >
              <form onSubmit={handleSearch} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder={language === 'vi' ? 'Tìm kiếm sản phẩm...' : 'Search products...'}
                  className="w-full bg-neutral-100 border border-transparent text-neutral-900 placeholder:text-neutral-500 text-sm rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-500 transition-all"
                  autoFocus
                />
                <Search size={18} className="absolute left-4 text-neutral-500" />
              </form>
              {searchSuggestions.length > 0 && searchQuery.length >= 2 && (
                <div className="mt-2 bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-lg">
                  {searchSuggestions.map((product: any) => (
                    <Link
                      key={product.id}
                      href={`/shop/${product.slug}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                      onClick={() => { setShowSuggestions(false); setSearchQuery(''); setIsSearchMobileOpen(false); }}
                    >
                      <span className="text-sm text-neutral-900 truncate">{language === 'vi' ? product.nameVi : (product.nameEn || product.nameVi)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-neutral-200 overflow-hidden shadow-lg"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={(e) => {
                    setIsOpen(false);
                    if (pathname === link.path) {
                      e.preventDefault();
                      window.location.href = link.path;
                    }
                  }}
                  className={`block px-3 py-4 text-lg font-medium rounded-md transition-colors ${pathname === link.path ? 'text-orange-500 bg-orange-50' : 'text-neutral-600 hover:bg-neutral-50 hover:text-orange-500'}`}
                >
                  {language === 'vi' ? link.nameVi : link.nameEn}
                </Link>
              ))}

              <div className="mt-6 pt-6 border-t border-neutral-200">
                {mounted && isAuthenticated ? (
                  <>
                    <div className="px-3 mb-4 text-neutral-500 text-base">Xin chào, <span className="text-neutral-900 font-bold">{user?.fullName}</span></div>
                    {user?.role && ['ADMIN', 'SALES_STAFF', 'INVENTORY_STAFF'].includes(user.role) && (
                      <Link href="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-orange-500 rounded-md transition-colors">
                        Trang quản trị
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-orange-500 rounded-md transition-colors">
                      Hồ sơ cá nhân
                    </Link>
                    <Link href="/orders" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-orange-500 rounded-md transition-colors">
                      Đơn hàng của tôi
                    </Link>
                    <button
                      onClick={async () => {
                        try { await api.post('/auth/logout', {}, { withCredentials: true }); } catch (e) { }
                        logout();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-3 text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                    >
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-orange-500 transition-colors">
                    {mounted ? t('login') : 'Đăng nhập'}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
