'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { useLanguageStore } from '@/store/languageStore';
import vi from '@/i18n/vi.json';
import en from '@/i18n/en.json';

export default function ContactPage() {
  const { settings, fetchSettings } = useSiteSettingsStore();
  const { language } = useLanguageStore();
  const t = language === 'vi' ? vi : en;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, [fetchSettings]);

  const contactAddress = mounted ? (language === 'vi' ? settings?.contactAddressVi : settings?.contactAddressEn) : '';
  const contactPhone = mounted ? settings?.contactPhone : '';
  const contactEmail = mounted ? settings?.contactEmail : '';

  return (
    <div className="pt-24 pb-16 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase"
          >
            {t.contact.page_title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-500 leading-relaxed"
          >
            {t.contact.page_subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl font-black mb-8">{t.contact.info_title}</h2>
              <div className="space-y-6">
                <div className="flex items-start group">
                  <div className="w-14 h-14 bg-white border border-neutral-200 rounded-2xl flex items-center justify-center mr-6 group-hover:border-orange-500 group-hover:text-orange-500 transition-colors flex-shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{t.contact.headquarters}</h3>
                    <p className="text-neutral-500 leading-relaxed">{contactAddress || '123 Đường Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP. Hồ Chí Minh'}</p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="w-14 h-14 bg-white border border-neutral-200 rounded-2xl flex items-center justify-center mr-6 group-hover:border-orange-500 group-hover:text-orange-500 transition-colors flex-shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{t.contact.phone}</h3>
                    <p className="text-neutral-500 leading-relaxed">{contactPhone}</p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="w-14 h-14 bg-white border border-neutral-200 rounded-2xl flex items-center justify-center mr-6 group-hover:border-orange-500 group-hover:text-orange-500 transition-colors flex-shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{t.contact.email_label}</h3>
                    <p className="text-neutral-500 leading-relaxed">{contactEmail || 'support@vanguard.vn'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-orange-50 border border-orange-100 rounded-2xl">
                <p className="text-orange-800 font-medium leading-relaxed">
                  {t.contact.wholesale_note}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full h-full min-h-[400px] rounded-[2.5rem] overflow-hidden border border-neutral-200 shadow-xl shadow-neutral-200/50"
          >
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '400px' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(contactAddress || '123 Đường Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP. Hồ Chí Minh')}&output=embed`}
            ></iframe>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
