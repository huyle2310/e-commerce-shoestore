import { create } from 'zustand';
import api from '@/lib/axios';

export interface SiteSettings {
  logoUrl?: string;
  homeShortDescVi?: string;
  homeShortDescEn?: string;
  homeBannersJson?: string;
  homeFeaturedImagesJson?: string;
  aboutTitleVi?: string;
  aboutTitleEn?: string;
  aboutSloganVi?: string;
  aboutSloganEn?: string;
  aboutContentVi?: string;
  aboutContentEn?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddressVi?: string;
  contactAddressEn?: string;
  socialLinksJson?: string;

  homeHeroTitleVi?: string;
  homeHeroTitleEn?: string;
  homeServicesJson?: string;
  homeCategoriesTitleVi?: string;
  homeCategoriesTitleEn?: string;
  homeCategoriesSubtitleVi?: string;
  homeCategoriesSubtitleEn?: string;
  homeCategoriesJson?: string;
  homeFeaturedTitleVi?: string;
  homeFeaturedTitleEn?: string;
  homeFeaturedSubtitleVi?: string;
  homeFeaturedSubtitleEn?: string;
  headerMenuJson?: string;
  footerMenuJson?: string;
  bannerIntervalMs?: number;

  // Parsed versions
  homeBanners?: any[];
  homeFeaturedImages?: any[];
  socialLinks?: any[];
  homeServices?: any[];
  homeCategories?: any[];
  headerMenu?: any[];
  footerMenu?: any[];
}

interface SiteSettingsState {
  settings: SiteSettings | null;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: SiteSettings) => Promise<void>;
  setPreviewSettings: (previewData: SiteSettings) => void;
}

export const useSiteSettingsStore = create<SiteSettingsState>((set) => ({
  settings: null,
  loading: false,
  fetchSettings: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/settings/site');
      const data = response.data;
      if (data) {
        try { data.homeBanners = JSON.parse(data.homeBannersJson || '[]'); } catch (e) { data.homeBanners = []; }
        try { data.homeFeaturedImages = JSON.parse(data.homeFeaturedImagesJson || '[]'); } catch (e) { data.homeFeaturedImages = []; }
        try { data.socialLinks = JSON.parse(data.socialLinksJson || '[]'); } catch (e) { data.socialLinks = []; }
        try { data.homeServices = JSON.parse(data.homeServicesJson || '[]'); } catch (e) { data.homeServices = []; }
        try { data.homeCategories = JSON.parse(data.homeCategoriesJson || '[]'); } catch (e) { data.homeCategories = []; }
        try { data.headerMenu = JSON.parse(data.headerMenuJson || '[]'); } catch (e) { data.headerMenu = []; }
        try { data.footerMenu = JSON.parse(data.footerMenuJson || '[]'); } catch (e) { data.footerMenu = []; }
      }
      set({ settings: data, loading: false });
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
      set({ loading: false });
    }
  },
  updateSettings: async (newSettings) => {
    try {
      const response = await api.put('/settings/site', newSettings);
      set({ settings: response.data });
    } catch (error) {
      console.error('Failed to update site settings:', error);
      throw error;
    }
  },
  setPreviewSettings: (previewData) => {
    set({ settings: previewData });
  }
}));
