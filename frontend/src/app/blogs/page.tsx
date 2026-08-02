'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, User } from 'lucide-react';
import api from '@/lib/axios';

export default function BlogsPage() {
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
            TIN TỨC & SỰ KIỆN
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-500 leading-relaxed"
          >
            Cập nhật những xu hướng thời trang mới nhất, các bộ sưu tập giới hạn và câu chuyện từ cộng đồng Vanguard.
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-100">
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">Chưa có bài viết nào</h3>
            <p className="text-neutral-500">Hãy quay lại sau để cập nhật những tin tức mới nhất.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <motion.article 
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-[2rem] overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <Link href={`/blogs/${blog.slug}`} className="block relative aspect-video overflow-hidden bg-neutral-100">
                  {blog.thumbnailUrl ? (
                    <img src={blog.thumbnailUrl} alt={blog.titleVi} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300 font-black text-2xl uppercase tracking-widest">Vanguard</div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                </Link>
                <div className="p-8">
                  <div className="flex items-center text-xs font-bold text-neutral-400 mb-4 uppercase tracking-wider space-x-4">
                    <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> {new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span className="flex items-center"><User size={14} className="mr-1.5" /> {blog.authorName}</span>
                  </div>
                  <Link href={`/blogs/${blog.slug}`}>
                    <h2 className="text-2xl font-black text-neutral-900 mb-4 line-clamp-2 hover:text-orange-500 transition-colors">{blog.titleVi}</h2>
                  </Link>
                  <p className="text-neutral-500 mb-6 line-clamp-3 leading-relaxed">
                    {/* Extract text from HTML content basic way for excerpt */}
                    {blog.contentVi.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ')}
                  </p>
                  <Link href={`/blogs/${blog.slug}`} className="inline-flex items-center font-bold text-orange-500 hover:text-orange-600 transition-colors group/link">
                    ĐỌC TIẾP <ArrowRight size={18} className="ml-2 group-hover/link:translate-x-2 transition-transform" />
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
