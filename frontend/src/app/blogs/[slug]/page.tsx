'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, Share2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import 'react-quill-new/dist/quill.snow.css'; // Import quill styles for content rendering

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await api.get(`/blogs/${slug}`);
        setBlog(response.data);

        // Update SEO metadata dynamically
        const fetchedBlog = response.data;
        document.title = fetchedBlog.seoTitleVi || `${fetchedBlog.titleVi} - Vanguard`;
        if (fetchedBlog.seoDescriptionVi) {
          let metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', fetchedBlog.seoDescriptionVi);
          } else {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            metaDesc.setAttribute('content', fetchedBlog.seoDescriptionVi);
            document.head.appendChild(metaDesc);
          }
        }
      } catch (error) {
        console.error("Error fetching blog", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBlog();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><div className="animate-spin  h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>;
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 text-center px-4">
        <h1 className="text-4xl font-black mb-4">Bài viết không tồn tại</h1>
        <p className="text-neutral-500 mb-8">Xin lỗi, bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ.</p>
        <Link href="/blogs" className="px-6 py-3 bg-black text-white font-bold rounded-full">Quay lại Tin tức</Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 bg-white min-h-screen selection:bg-orange-500 selection:text-white">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link href="/blogs" className="inline-flex items-center text-sm font-bold text-neutral-500 hover:text-black mb-10 transition-colors uppercase tracking-wider">
          <ArrowLeft size={16} className="mr-2" /> VỀ TRANG TIN TỨC
        </Link>

        {/* Header */}
        <header className="mb-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-neutral-900 mb-8 leading-tight"
          >
            {blog.titleVi}
          </motion.h1>

          {blog.shortDescriptionVi && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-xl  text-neutral-500 mb-8 max-w-none mx-auto prose prose-neutral text-center [&_*]:!whitespace-normal [&_*]:!break-words"
              dangerouslySetInnerHTML={{ __html: blog.shortDescriptionVi }}
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center space-x-6 text-sm font-bold text-neutral-500 uppercase tracking-wider"
          >
            <span className="flex items-center"><User size={16} className="mr-2" /> {blog.authorName}</span>
            <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
            <span className="flex items-center"><Calendar size={16} className="mr-2" /> {new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
          </motion.div>
        </header>

        {/* Thumbnail */}
        {blog.thumbnailUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full aspect-[21/9] rounded-[0.5rem] overflow-hidden mb-8 shadow-[0.2rem]"
          >
            <img src={blog.thumbnailUrl} alt={blog.titleVi} className="w-full h-full object-cover" />
          </motion.div>
        )}
        <hr className="border-neutral-400 w-full mb-5" />
        {/* Content (Rendered HTML from Quill) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="prose prose-lg prose-neutral max-w-none prose-headings:font-black prose-a:text-orange-500 hover:prose-a:text-orange-600 ql-editor"
          style={{ lineHeight: 'calc(1.75rem + 0.2rem)' }}
          dangerouslySetInnerHTML={{ __html: blog.contentVi }}
        />

        {/* Footer actions */}
        <div className="mt-20 pt-10 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-4">
            <span className="font-bold uppercase tracking-wider text-sm text-neutral-500">Tags:</span>
            <div className="flex gap-4 flex-wrap">
              {blog.tags ? (
                blog.tags.split(',').map((tag: string, index: number) => (
                  <span key={index} className="px-4 py-2 bg-neutral-100 rounded-full text-xs font-bold uppercase text-neutral-500 hover:bg-neutral-200 cursor-pointer">
                    {tag.trim()}
                  </span>
                ))
              ) : (
                <span className="px-4 py-2 bg-neutral-100 rounded-full text-xs font-bold uppercase text-neutral-500 hover:bg-neutral-200 cursor-pointer">
                  NEWS
                </span>
              )}
            </div>
          </div>

        </div>
      </article>
    </div>
  );
}
