'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, EyeOff, LayoutTemplate } from 'lucide-react';
import api from '@/lib/axios';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import ImageUpload from '@/components/ui/ImageUpload';

function SiteSettingsContent() {
  const { settings, fetchSettings, loading } = useSiteSettingsStore();

  const [activeTab, setActiveTab] = useState('home');
  const [formData, setFormData] = useState<any>({
    logoUrl: '',
    homeShortDescVi: '', homeShortDescEn: '',
    homeHeroTitleVi: '', homeHeroTitleEn: '',
    homeCategoriesTitleVi: '', homeCategoriesTitleEn: '',
    homeCategoriesSubtitleVi: '', homeCategoriesSubtitleEn: '',
    homeFeaturedTitleVi: '', homeFeaturedTitleEn: '',
    homeFeaturedSubtitleVi: '', homeFeaturedSubtitleEn: '',
    homeBanners: [], homeFeaturedImages: [],
    homeServices: [], homeCategories: [],
    headerMenu: [], footerMenu: [],
    aboutTitleVi: '', aboutTitleEn: '',
    aboutSloganVi: '', aboutSloganEn: '',
    aboutContentVi: '', aboutContentEn: '',
    contactPhone: '', contactEmail: '',
    contactAddressVi: '', contactAddressEn: '',
    socialLinks: [],
    bannerIntervalMs: 5000
  });

  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      let hb = [], hfi = [], sl = [], hs = [], hc = [], hm = [], fm = [];
      try { hb = settings.homeBannersJson ? JSON.parse(settings.homeBannersJson) : []; } catch (e) { }
      try { hfi = settings.homeFeaturedImagesJson ? JSON.parse(settings.homeFeaturedImagesJson) : []; } catch (e) { }
      try { sl = settings.socialLinksJson ? JSON.parse(settings.socialLinksJson) : []; } catch (e) { }
      try { hs = settings.homeServicesJson ? JSON.parse(settings.homeServicesJson) : []; } catch (e) { }
      try { hc = settings.homeCategoriesJson ? JSON.parse(settings.homeCategoriesJson) : []; } catch (e) { }
      try { hm = settings.headerMenuJson ? JSON.parse(settings.headerMenuJson) : []; } catch (e) { }
      try { fm = settings.footerMenuJson ? JSON.parse(settings.footerMenuJson) : []; } catch (e) { }

      setFormData({
        ...settings,
        logoUrl: settings.logoUrl || '',
        homeShortDescVi: settings.homeShortDescVi || '',
        homeShortDescEn: settings.homeShortDescEn || '',
        homeHeroTitleVi: settings.homeHeroTitleVi || '',
        homeHeroTitleEn: settings.homeHeroTitleEn || '',
        homeCategoriesTitleVi: settings.homeCategoriesTitleVi || '',
        homeCategoriesTitleEn: settings.homeCategoriesTitleEn || '',
        homeCategoriesSubtitleVi: settings.homeCategoriesSubtitleVi || '',
        homeCategoriesSubtitleEn: settings.homeCategoriesSubtitleEn || '',
        homeFeaturedTitleVi: settings.homeFeaturedTitleVi || '',
        homeFeaturedTitleEn: settings.homeFeaturedTitleEn || '',
        homeFeaturedSubtitleVi: settings.homeFeaturedSubtitleVi || '',
        homeFeaturedSubtitleEn: settings.homeFeaturedSubtitleEn || '',
        aboutTitleVi: settings.aboutTitleVi || '',
        aboutTitleEn: settings.aboutTitleEn || '',
        aboutSloganVi: settings.aboutSloganVi || '',
        aboutSloganEn: settings.aboutSloganEn || '',
        aboutContentVi: settings.aboutContentVi || '',
        aboutContentEn: settings.aboutContentEn || '',
        contactPhone: settings.contactPhone || '',
        contactEmail: settings.contactEmail || '',
        contactAddressVi: settings.contactAddressVi || '',
        contactAddressEn: settings.contactAddressEn || '',
        homeBanners: hb || [],
        homeFeaturedImages: hfi || [],
        socialLinks: sl || [],
        homeServices: hs || [],
        homeCategories: hc || [],
        headerMenu: hm || [],
        footerMenu: fm || [],
        bannerIntervalMs: settings.bannerIntervalMs || 5000
      });
    }
  }, [settings]);

  // Live Preview Sync
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow && mounted) {
      const payload = {
        ...formData,
        homeBannersJson: JSON.stringify(formData.homeBanners),
        homeFeaturedImagesJson: JSON.stringify(formData.homeFeaturedImages),
        socialLinksJson: JSON.stringify(formData.socialLinks),
        homeServicesJson: JSON.stringify(formData.homeServices),
        homeCategoriesJson: JSON.stringify(formData.homeCategories),
        headerMenuJson: JSON.stringify(formData.headerMenu),
        footerMenuJson: JSON.stringify(formData.footerMenu)
      };

      iframeRef.current.contentWindow.postMessage(
        { type: 'PREVIEW_SETTINGS', payload },
        '*'
      );
    }
  }, [formData, mounted, showPreview]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        homeBannersJson: JSON.stringify(formData.homeBanners),
        homeFeaturedImagesJson: JSON.stringify(formData.homeFeaturedImages),
        socialLinksJson: JSON.stringify(formData.socialLinks),
        homeServicesJson: JSON.stringify(formData.homeServices),
        homeCategoriesJson: JSON.stringify(formData.homeCategories),
        headerMenuJson: JSON.stringify(formData.headerMenu),
        footerMenuJson: JSON.stringify(formData.footerMenu)
      };
      await api.put('/settings/site', payload);
      alert('Đã lưu cấu hình thành công!');
      fetchSettings(); // refresh global store
    } catch (error) {
      console.error('Error saving settings', error);
      alert('Có lỗi xảy ra khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  // Generic Array Handlers
  const handleArrayChange = (field: string, index: number, key: string, value: any) => {
    const newArray = [...formData[field]];
    newArray[index][key] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: string, defaultItem: any) => {
    setFormData({ ...formData, [field]: [...formData[field], defaultItem] });
  };

  const removeArrayItem = (field: string, index: number) => {
    const newArray = [...formData[field]];
    newArray.splice(index, 1);
    setFormData({ ...formData, [field]: newArray });
  };

  const moveArrayItem = (field: string, index: number, direction: number) => {
    const newArray = [...formData[field]];
    if (index + direction < 0 || index + direction >= newArray.length) return;
    const temp = newArray[index];
    newArray[index] = newArray[index + direction];
    newArray[index + direction] = temp;
    setFormData({ ...formData, [field]: newArray });
  };

  if (loading && !settings) return <div className="p-8">Đang tải cấu hình...</div>;

  const previewUrl = activeTab === 'about' ? '/about' : activeTab === 'contact' ? '/contact' : '/';

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-neutral-100 overflow-hidden -m-8">

      {/* Editor Panel */}
      <div className={`flex flex-col bg-white border-r border-neutral-200 transition-all duration-300 ${showPreview ? 'w-1/2' : 'w-full'}`}>
        <div className="flex justify-between items-center p-6 border-b border-neutral-100 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center"><LayoutTemplate size={24} className="mr-2 text-orange-500" /> Quản lý Nội dung</h2>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium transition-colors"
          >
            {showPreview ? <><EyeOff size={18} /> <span>Đóng Preview</span></> : <><Eye size={18} /> <span>Xem trước</span></>}
          </button>
        </div>

        <div className="flex px-6 pt-4 space-x-2 border-b border-neutral-100 overflow-x-auto flex-shrink-0">
          {['home', 'services', 'menu', 'about', 'contact'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === t ? 'border-orange-500 text-orange-500' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
            >
              {t === 'home' ? 'Trang chủ' : t === 'services' ? 'Cam kết (Marquee)' : t === 'menu' ? 'Thanh Menu' : t === 'about' ? 'Giới thiệu' : 'Liên hệ'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative pb-32">
          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                <label className="block font-bold text-neutral-900 mb-2">Logo Website URL</label>
                <ImageUpload value={formData.logoUrl} onChange={(url) => setFormData({ ...formData, logoUrl: url })} />
              </div>

              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 space-y-4">
                <h3 className="font-bold text-lg border-b border-neutral-200 pb-2">Khu vực Hero</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Tiêu đề chính (VI)</label>
                    <input type="text" value={formData.homeHeroTitleVi} onChange={e => setFormData({ ...formData, homeHeroTitleVi: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Tiêu đề chính (EN)</label>
                    <input type="text" value={formData.homeHeroTitleEn} onChange={e => setFormData({ ...formData, homeHeroTitleEn: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Mô tả ngắn (VI)</label>
                    <textarea value={formData.homeShortDescVi || ''} onChange={e => setFormData({ ...formData, homeShortDescVi: e.target.value })} className="w-full h-24 p-4 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500 resize-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Mô tả ngắn (EN)</label>
                    <textarea value={formData.homeShortDescEn || ''} onChange={e => setFormData({ ...formData, homeShortDescEn: e.target.value })} className="w-full h-24 p-4 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500 resize-none" />
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Danh sách Ảnh Banners Hero</h3>
                  <button onClick={() => addArrayItem('homeBanners', { url: '', link: '' })} className="text-sm font-bold bg-neutral-900 text-white px-3 py-1.5 rounded-md flex items-center hover:bg-neutral-800"><Plus size={16} className="mr-1" /> Thêm Ảnh</button>
                </div>
                {/* Banner interval setting */}
                <div className="mb-4 flex items-center gap-4 bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <div className="flex-1">
                    <label className="block font-bold text-neutral-700 mb-1 text-sm">⏱ Thời gian hiển thị mỗi ảnh (giây)</label>
                    <p className="text-xs text-neutral-500 mb-2">Carousel tự động chuyển ảnh sau khoảng thời gian này (dừng khi hover)</p>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      step={0.5}
                      value={formData.bannerIntervalMs ? formData.bannerIntervalMs / 1000 : 5}
                      onChange={e => setFormData({ ...formData, bannerIntervalMs: Math.round(parseFloat(e.target.value) * 1000) })}
                      className="w-32 px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500"
                    />
                    <span className="ml-2 text-sm text-neutral-500">giây</span>
                  </div>
                </div>
                {formData.homeBanners.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
                    <div className="flex-1 space-y-3">
                      <ImageUpload value={item.url} onChange={(url) => handleArrayChange('homeBanners', idx, 'url', url)} />
                      <input type="text" value={item.link} onChange={e => handleArrayChange('homeBanners', idx, 'link', e.target.value)} placeholder="Link khi click (Tùy chọn)" className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                    </div>
                    {item.url && <img src={item.url} className="w-20 h-20 object-cover rounded-lg border border-neutral-100" />}
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveArrayItem('homeBanners', idx, -1)} disabled={idx === 0} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowUp size={16} /></button>
                      <button onClick={() => moveArrayItem('homeBanners', idx, 1)} disabled={idx === formData.homeBanners.length - 1} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowDown size={16} /></button>
                      <button onClick={() => removeArrayItem('homeBanners', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg mt-2"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 space-y-4">
                <h3 className="font-bold text-lg border-b border-neutral-200 pb-2">Khu vực Danh Mục</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Tiêu đề (VI)</label>
                    <input type="text" value={formData.homeCategoriesTitleVi} onChange={e => setFormData({ ...formData, homeCategoriesTitleVi: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Tiêu đề (EN)</label>
                    <input type="text" value={formData.homeCategoriesTitleEn} onChange={e => setFormData({ ...formData, homeCategoriesTitleEn: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Phụ đề (VI)</label>
                    <input type="text" value={formData.homeCategoriesSubtitleVi} onChange={e => setFormData({ ...formData, homeCategoriesSubtitleVi: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Phụ đề (EN)</label>
                    <input type="text" value={formData.homeCategoriesSubtitleEn} onChange={e => setFormData({ ...formData, homeCategoriesSubtitleEn: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Danh mục Hình Ảnh</h3>
                  <button onClick={() => addArrayItem('homeCategories', { titleVi: '', titleEn: '', link: '', imageUrl: '' })} className="text-sm font-bold bg-neutral-900 text-white px-3 py-1.5 rounded-md flex items-center hover:bg-neutral-800"><Plus size={16} className="mr-1" /> Thêm Danh Mục</button>
                </div>
                {formData.homeCategories.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={item.titleVi} onChange={e => handleArrayChange('homeCategories', idx, 'titleVi', e.target.value)} placeholder="Tên danh mục (VI)" className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                        <input type="text" value={item.titleEn} onChange={e => handleArrayChange('homeCategories', idx, 'titleEn', e.target.value)} placeholder="Tên danh mục (EN)" className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                      </div>
                      <input type="text" value={item.link} onChange={e => handleArrayChange('homeCategories', idx, 'link', e.target.value)} placeholder="Link (/shop?category=...)" className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                      <ImageUpload value={item.imageUrl} onChange={(url) => handleArrayChange('homeCategories', idx, 'imageUrl', url)} />
                    </div>
                    {item.imageUrl && <img src={item.imageUrl} className="w-20 h-20 object-cover rounded-lg border border-neutral-100" />}
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveArrayItem('homeCategories', idx, -1)} disabled={idx === 0} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowUp size={16} /></button>
                      <button onClick={() => moveArrayItem('homeCategories', idx, 1)} disabled={idx === formData.homeCategories.length - 1} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowDown size={16} /></button>
                      <button onClick={() => removeArrayItem('homeCategories', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg mt-2"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 space-y-4">
                <h3 className="font-bold text-lg border-b border-neutral-200 pb-2">Khu vực Nổi Bật</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Tiêu đề (VI)</label>
                    <input type="text" value={formData.homeFeaturedTitleVi} onChange={e => setFormData({ ...formData, homeFeaturedTitleVi: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Tiêu đề (EN)</label>
                    <input type="text" value={formData.homeFeaturedTitleEn} onChange={e => setFormData({ ...formData, homeFeaturedTitleEn: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Phụ đề (VI)</label>
                    <input type="text" value={formData.homeFeaturedSubtitleVi} onChange={e => setFormData({ ...formData, homeFeaturedSubtitleVi: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Phụ đề (EN)</label>
                    <input type="text" value={formData.homeFeaturedSubtitleEn} onChange={e => setFormData({ ...formData, homeFeaturedSubtitleEn: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Dịch vụ / Cam kết (Thanh chạy ngang)</h3>
                  <button onClick={() => addArrayItem('homeServices', { titleVi: '', titleEn: '', iconUrl: '' })} className="text-sm font-bold bg-neutral-900 text-white px-3 py-1.5 rounded-md flex items-center hover:bg-neutral-800"><Plus size={16} className="mr-1" /> Thêm Cam Kết</button>
                </div>
                {formData.homeServices.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={item.titleVi} onChange={e => handleArrayChange('homeServices', idx, 'titleVi', e.target.value)} placeholder="Tên cam kết (VI)" className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                        <input type="text" value={item.titleEn} onChange={e => handleArrayChange('homeServices', idx, 'titleEn', e.target.value)} placeholder="Tên cam kết (EN)" className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                      </div>
                      <ImageUpload value={item.iconUrl} onChange={(url) => handleArrayChange('homeServices', idx, 'iconUrl', url)} />
                    </div>
                    {item.iconUrl && <img src={item.iconUrl} className="w-12 h-12 object-contain rounded-lg bg-neutral-100 p-1" />}
                    <button onClick={() => removeArrayItem('homeServices', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header Menu Array */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Menu Trang chủ (Header)</h3>
                    <p className="text-xs text-neutral-500 mt-1">Cài đặt dropdown cho mục "Cửa hàng" bằng cách chọn loại dropdown</p>
                  </div>
                  <button onClick={() => addArrayItem('headerMenu', { nameVi: '', nameEn: '', path: '', hasDropdown: false, dropdownType: '' })} className="text-sm font-bold bg-neutral-900 text-white px-3 py-1.5 rounded-md flex items-center hover:bg-neutral-800"><Plus size={16} className="mr-1" /> Thêm Menu</button>
                </div>
                {formData.headerMenu.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-neutral-200 mb-2 shadow-sm space-y-2">
                    <div className="flex gap-3 items-center">
                      <input type="text" value={item.nameVi} onChange={e => handleArrayChange('headerMenu', idx, 'nameVi', e.target.value)} placeholder="Tên (VI)" className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                      <input type="text" value={item.nameEn} onChange={e => handleArrayChange('headerMenu', idx, 'nameEn', e.target.value)} placeholder="Tên (EN)" className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                      <input type="text" value={item.path} onChange={e => handleArrayChange('headerMenu', idx, 'path', e.target.value)} placeholder="Đường dẫn (VD: /shop)" className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                      <div className="flex gap-1">
                        <button onClick={() => moveArrayItem('headerMenu', idx, -1)} disabled={idx === 0} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowUp size={16} /></button>
                        <button onClick={() => moveArrayItem('headerMenu', idx, 1)} disabled={idx === formData.headerMenu.length - 1} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowDown size={16} /></button>
                        <button onClick={() => removeArrayItem('headerMenu', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {/* Dropdown settings */}
                    <div className="flex items-center gap-3 pl-1 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.hasDropdown || false}
                          onChange={e => handleArrayChange('headerMenu', idx, 'hasDropdown', e.target.checked)}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <span className="text-xs font-medium text-neutral-600">Có dropdown</span>
                      </label>
                      {item.hasDropdown && (
                        <select
                          value={item.dropdownType || ''}
                          onChange={e => {
                            handleArrayChange('headerMenu', idx, 'dropdownType', e.target.value);
                            // Khởi tạo children nếu chuyển sang custom
                            if (e.target.value === 'custom' && !item.children?.length) {
                              handleArrayChange('headerMenu', idx, 'children', []);
                            }
                          }}
                          className="px-3 py-1.5 border border-neutral-200 rounded-lg outline-none text-xs focus:border-orange-500"
                        >
                          <option value="">-- Chọn loại dropdown --</option>
                          <option value="categories">Danh mục sản phẩm (tự động)</option>
                          <option value="brands">Thương hiệu (tự động)</option>
                          <option value="categories_brands">Cả danh mục và thương hiệu (tự động)</option>
                          <option value="custom">Tự nhập thủ công</option>
                        </select>
                      )}
                    </div>

                    {/* Custom dropdown editor */}
                    {item.hasDropdown && item.dropdownType === 'custom' && (
                      <div className="ml-1 mt-2 border border-orange-100 rounded-xl bg-orange-50/50 p-3 space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Mục trong dropdown</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const children = [...(item.children || [])];
                                children.push({ type: 'item', nameVi: '', nameEn: '', path: '' });
                                handleArrayChange('headerMenu', idx, 'children', children);
                              }}
                              className="text-xs font-bold bg-neutral-900 text-white px-2 py-1 rounded-md flex items-center hover:bg-neutral-800"
                            >
                              <Plus size={12} className="mr-1" /> Thêm mục
                            </button>
                            <button
                              onClick={() => {
                                const children = [...(item.children || [])];
                                children.push({ type: 'section', labelVi: '', labelEn: '' });
                                handleArrayChange('headerMenu', idx, 'children', children);
                              }}
                              className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-md flex items-center hover:bg-orange-200"
                            >
                              <Plus size={12} className="mr-1" /> Thêm tiêu đề nhóm
                            </button>
                          </div>
                        </div>

                        {(item.children || []).length === 0 && (
                          <p className="text-xs text-neutral-400 text-center py-3">Chưa có mục nào. Thêm mục hoặc tiêu đề nhóm.</p>
                        )}

                        {(item.children || []).map((child: any, cIdx: number) => {
                          const updateChild = (field: string, value: string) => {
                            const children = [...(item.children || [])];
                            children[cIdx] = { ...children[cIdx], [field]: value };
                            handleArrayChange('headerMenu', idx, 'children', children);
                          };
                          const removeChild = () => {
                            const children = (item.children || []).filter((_: any, i: number) => i !== cIdx);
                            handleArrayChange('headerMenu', idx, 'children', children);
                          };
                          const moveChild = (dir: number) => {
                            const children = [...(item.children || [])];
                            const newIdx = cIdx + dir;
                            if (newIdx < 0 || newIdx >= children.length) return;
                            [children[cIdx], children[newIdx]] = [children[newIdx], children[cIdx]];
                            handleArrayChange('headerMenu', idx, 'children', children);
                          };

                          if (child.type === 'section') {
                            return (
                              <div key={cIdx} className="flex gap-2 items-center bg-white border border-dashed border-orange-300 rounded-lg p-2">
                                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded flex-shrink-0">NHÓM</span>
                                <input
                                  type="text"
                                  value={child.labelVi || ''}
                                  onChange={e => updateChild('labelVi', e.target.value)}
                                  placeholder="Tiêu đề nhóm (VI)"
                                  className="flex-1 px-2 py-1 border border-neutral-200 rounded-md text-xs outline-none focus:border-orange-500"
                                />
                                <input
                                  type="text"
                                  value={child.labelEn || ''}
                                  onChange={e => updateChild('labelEn', e.target.value)}
                                  placeholder="Tiêu đề nhóm (EN)"
                                  className="flex-1 px-2 py-1 border border-neutral-200 rounded-md text-xs outline-none focus:border-orange-500"
                                />
                                <button onClick={() => moveChild(-1)} disabled={cIdx === 0} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowUp size={12} /></button>
                                <button onClick={() => moveChild(1)} disabled={cIdx === (item.children || []).length - 1} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowDown size={12} /></button>
                                <button onClick={removeChild} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                              </div>
                            );
                          }

                          return (
                            <div key={cIdx} className="flex gap-2 items-center bg-white border border-neutral-200 rounded-lg p-2">
                              <span className="text-xs font-medium text-neutral-400 bg-neutral-50 px-2 py-1 rounded flex-shrink-0">MỤC</span>
                              <input
                                type="text"
                                value={child.nameVi || ''}
                                onChange={e => updateChild('nameVi', e.target.value)}
                                placeholder="Tên (VI)"
                                className="flex-1 px-2 py-1 border border-neutral-200 rounded-md text-xs outline-none focus:border-orange-500"
                              />
                              <input
                                type="text"
                                value={child.nameEn || ''}
                                onChange={e => updateChild('nameEn', e.target.value)}
                                placeholder="Tên (EN)"
                                className="flex-1 px-2 py-1 border border-neutral-200 rounded-md text-xs outline-none focus:border-orange-500"
                              />
                              <input
                                type="text"
                                value={child.path || ''}
                                onChange={e => updateChild('path', e.target.value)}
                                placeholder="Link (VD: /shop?q=nike)"
                                className="flex-1 px-2 py-1 border border-neutral-200 rounded-md text-xs outline-none focus:border-orange-500"
                              />
                              <button onClick={() => moveChild(-1)} disabled={cIdx === 0} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowUp size={12} /></button>
                              <button onClick={() => moveChild(1)} disabled={cIdx === (item.children || []).length - 1} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowDown size={12} /></button>
                              <button onClick={removeChild} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer Menu Array */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Liên kết nhanh (Footer)</h3>
                  <button onClick={() => addArrayItem('footerMenu', { nameVi: '', nameEn: '', path: '' })} className="text-sm font-bold bg-neutral-900 text-white px-3 py-1.5 rounded-md flex items-center hover:bg-neutral-800"><Plus size={16} className="mr-1" /> Thêm Liên kết</button>
                </div>
                {formData.footerMenu.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-neutral-200 mb-2 shadow-sm">
                    <input type="text" value={item.nameVi} onChange={e => handleArrayChange('footerMenu', idx, 'nameVi', e.target.value)} placeholder="Tên (VI)" className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                    <input type="text" value={item.nameEn} onChange={e => handleArrayChange('footerMenu', idx, 'nameEn', e.target.value)} placeholder="Tên (EN)" className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                    <input type="text" value={item.path} onChange={e => handleArrayChange('footerMenu', idx, 'path', e.target.value)} placeholder="Đường dẫn (VD: /contact)" className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                    <div className="flex gap-1">
                      <button onClick={() => moveArrayItem('footerMenu', idx, -1)} disabled={idx === 0} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowUp size={16} /></button>
                      <button onClick={() => moveArrayItem('footerMenu', idx, 1)} disabled={idx === formData.footerMenu.length - 1} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30"><ArrowDown size={16} /></button>
                      <button onClick={() => removeArrayItem('footerMenu', idx)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Tiêu đề (VI)</label>
                    <input type="text" value={formData.aboutTitleVi} onChange={e => setFormData({ ...formData, aboutTitleVi: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Tiêu đề (EN)</label>
                    <input type="text" value={formData.aboutTitleEn} onChange={e => setFormData({ ...formData, aboutTitleEn: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Nội dung chi tiết (VI)</label>
                    <textarea value={formData.aboutContentVi || ''} onChange={e => setFormData({ ...formData, aboutContentVi: e.target.value })} className="w-full h-64 p-4 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500 resize-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-2 text-sm">Nội dung chi tiết (EN)</label>
                    <textarea value={formData.aboutContentEn || ''} onChange={e => setFormData({ ...formData, aboutContentEn: e.target.value })} className="w-full h-64 p-4 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500 resize-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-2 text-sm">Số điện thoại Hotline</label>
                  <input type="text" value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-2 text-sm">Email Hỗ trợ</label>
                  <input type="text" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-2 text-sm">Địa chỉ Cửa hàng (VI)</label>
                  <input type="text" value={formData.contactAddressVi} onChange={e => setFormData({ ...formData, contactAddressVi: e.target.value })} placeholder="Địa chỉ hiển thị trên Google Maps" className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-2 text-sm">Địa chỉ Cửa hàng (EN)</label>
                  <input type="text" value={formData.contactAddressEn} onChange={e => setFormData({ ...formData, contactAddressEn: e.target.value })} className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-orange-500" />
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Mạng xã hội</h3>
                  <button onClick={() => addArrayItem('socialLinks', { platform: 'Facebook', url: '' })} className="text-sm font-bold bg-neutral-900 text-white px-3 py-1.5 rounded-md flex items-center hover:bg-neutral-800"><Plus size={16} className="mr-1" /> Thêm Link</button>
                </div>
                {formData.socialLinks.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center bg-white p-3 rounded-xl border border-neutral-200 mb-2 shadow-sm">
                    <select value={item.platform} onChange={e => handleArrayChange('socialLinks', idx, 'platform', e.target.value)} className="w-40 px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none text-sm font-medium focus:border-orange-500">
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Tiktok">Tiktok</option>
                      <option value="Youtube">Youtube</option>
                      <option value="Twitter">Twitter</option>
                    </select>
                    <input type="text" value={item.url} onChange={e => handleArrayChange('socialLinks', idx, 'url', e.target.value)} placeholder="https://" className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none text-sm focus:border-orange-500" />
                    <button onClick={() => removeArrayItem('socialLinks', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button Container at bottom of Editor */}
          <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-end">
            <button
              onClick={handleSave} disabled={saving}
              className="flex items-center justify-center space-x-2 bg-black text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-70 w-full md:w-auto"
            >
              <Save size={20} />
              <span>{saving ? 'Đang lưu...' : 'Lưu cập nhật'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      {showPreview && (
        <div className="w-1/2 bg-neutral-200 flex flex-col relative border-l border-neutral-300">
          <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
            LIVE PREVIEW
          </div>
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-none bg-white"
            title="Live Preview"
          />
        </div>
      )}
    </div>
  );
}

export default function SiteSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div></div>}>
      <SiteSettingsContent />
    </Suspense>
  );
}
