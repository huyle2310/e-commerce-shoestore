import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import { useEffect, useState } from 'react';

export default function Footer() {
  const { settings, fetchSettings } = useSiteSettingsStore();
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, [fetchSettings]);

  let quickLinks = [
    { nameVi: 'Cửa hàng', nameEn: 'Shop', path: '/shop' },
    { nameVi: 'Về chúng tôi', nameEn: 'About', path: '/about' },
    { nameVi: 'Liên hệ', nameEn: 'Contact', path: '/contact' },
    { nameVi: 'Blog / Tin tức', nameEn: 'Blog / News', path: '/blog' },
  ];

  if (settings?.footerMenuJson) {
    try {
      const parsed = JSON.parse(settings.footerMenuJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        quickLinks = parsed;
      }
    } catch (e) {
      console.error("Failed to parse footer menu", e);
    }
  }

  if (!mounted) return <footer className="bg-neutral-950 border-t border-neutral-800 text-neutral-400 pt-16 pb-8 min-h-[300px]" />;

  return (
    <footer className="bg-white border-t border-neutral-200 text-neutral-600 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="text-2xl font-black tracking-tighter text-neutral-900 inline-flex items-center uppercase">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-10 object-contain" />
              ) : (
                <>VANGUARD<span className="text-orange-500">.</span></>
              )}
            </Link>
            <p className="text-sm leading-relaxed text-neutral-500">
              {language === 'vi'
                ? (settings?.homeShortDescVi || 'Vanguard mang đến những bộ sưu tập giày thể thao đẳng cấp nhất, kết hợp giữa phong cách đường phố và hiệu suất tối đa.')
                : (settings?.homeShortDescEn || 'Vanguard brings the most premium sneaker collections, combining street style with maximum performance.')
              }
            </p>
            <div className="flex space-x-4">
              {settings?.socialLinks && settings.socialLinks.map((social: any, idx: number) => (
                <a key={idx} href={social.url || '#'} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors" title={social.platform}>
                  {social.platform ? social.platform.substring(0, 2).toUpperCase() : 'SN'}
                </a>
              ))}
              {(!settings?.socialLinks || settings.socialLinks.length === 0) && (
                <>
                  <a href="#" className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors">FB</a>
                  <a href="#" className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors">IG</a>
                  <a href="#" className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors">TW</a>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-neutral-900 font-mono text-xs tracking-widest uppercase mb-6 flex items-center gap-2 font-bold">
              <span className="w-1.5 h-1.5 bg-orange-500" />
              {language === 'vi' ? 'LIÊN KẾT NHANH' : 'QUICK LINKS'}
            </h3>
            <ul className="space-y-4 text-sm">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.path} className="hover:text-orange-400 transition-colors">
                    {language === 'vi' ? link.nameVi : link.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-neutral-900 font-mono text-xs tracking-widest uppercase mb-6 flex items-center gap-2 font-bold">
              <span className="w-1.5 h-1.5 bg-orange-500" />
              {language === 'vi' ? 'CHĂM SÓC KHÁCH HÀNG' : 'CUSTOMER CARE'}
            </h3>
            <ul className="space-y-4 text-sm">
              <li><Link href="/faq" className="hover:text-orange-400 transition-colors">{language === 'vi' ? 'Câu hỏi thường gặp' : 'FAQs'}</Link></li>
              <li><Link href="/shipping" className="hover:text-orange-400 transition-colors">{language === 'vi' ? 'Chính sách vận chuyển' : 'Shipping Policy'}</Link></li>
              <li><Link href="/returns" className="hover:text-orange-400 transition-colors">{language === 'vi' ? 'Chính sách đổi trả' : 'Returns Policy'}</Link></li>
              <li><Link href="/privacy" className="hover:text-orange-400 transition-colors">{language === 'vi' ? 'Bảo mật thông tin' : 'Privacy Policy'}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-neutral-900 font-mono text-xs tracking-widest uppercase mb-6 flex items-center gap-2 font-bold">
              <span className="w-1.5 h-1.5 bg-orange-500" />
              {language === 'vi' ? 'THÔNG TIN LIÊN HỆ' : 'CONTACT INFO'}
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <MapPin size={18} className="mr-3 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>{language === 'vi' ? (settings?.contactAddressVi) : (settings?.contactAddressEn)}</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-3 text-orange-500 flex-shrink-0" />
                <span>{settings?.contactPhone}</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-3 text-orange-500 flex-shrink-0" />
                <span>{settings?.contactEmail}</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-neutral-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Vanguard Store. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0 font-mono">
            <span className="font-bold text-neutral-400 hover:text-neutral-800 transition-colors">SEPAY</span>
            <span className="font-bold text-neutral-400 hover:text-neutral-800 transition-colors">MOMO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
