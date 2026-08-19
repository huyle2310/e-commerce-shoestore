'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, User } from 'lucide-react';
import api from '@/lib/axios';
import { useLanguageStore } from '@/store/languageStore';
import { useTranslation } from '@/lib/translations';

export default function BlogsPage() {
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get('/blogs'); // Fetch published blogs
        setBlogs(response.data);
      } catch (error) {
        console.error("Error fetching blogs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="pt-24 pb-16 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase"
          >
            {t('newsAndEvents')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-500 leading-relaxed"
          >
            {t('newsSubtitle')}
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-100">
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">{t('noBlogsYet')}</h3>
            <p className="text-neutral-500">{t('checkBackLater')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-neutral-100 hover:shadow-xl transition-all duration-300"
              >
                <Link href={`/blogs/${blog.slug}`} className="relative h-64 overflow-hidden bg-neutral-100">
                  {blog.thumbnailUrl ? (
                    <img src={blog.thumbnailUrl} alt={language === 'vi' ? blog.titleVi : (blog.titleEn || blog.titleVi)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">No Image</div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-neutral-900">
                    {blog.category}
                  </div>
                </Link>

                <div className="flex flex-col flex-1 p-8">
                  <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                    <div className="flex items-center gap-1.5"><Calendar size={16} />{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('vi-VN')}</div>
                    <div className="flex items-center gap-1.5"><User size={16} />{blog.author}</div>
                  </div>

                  <Link href={`/blogs/${blog.slug}`}>
                    <h2 className="text-2xl font-black text-neutral-900 mb-4 line-clamp-2 hover:text-orange-500 transition-colors">{language === 'vi' ? blog.titleVi : (blog.titleEn || blog.titleVi)}</h2>
                  </Link>

                  <p className="text-neutral-600 mb-8 line-clamp-3 leading-relaxed flex-1">
                    {language === 'vi' ? blog.summaryVi : (blog.summaryEn || blog.summaryVi)}
                  </p>
                  <Link href={`/blogs/${blog.slug}`} className="inline-flex items-center font-bold text-orange-500 hover:text-orange-600 transition-colors group/link">
                    {t('readMore')} <ArrowRight size={18} className="ml-2 group-hover/link:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
