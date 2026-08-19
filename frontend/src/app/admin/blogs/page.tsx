'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/axios';

// Dynamically import ReactQuill to avoid SSR issues
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

import ImageUpload from '@/components/ui/ImageUpload';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState<any>({
    titleVi: '', titleEn: '', slug: '', thumbnailUrl: '', contentVi: '', contentEn: '',
    shortDescriptionVi: '', shortDescriptionEn: '', tags: '', isFeatured: false, isPublished: false,
    seoTitleVi: '', seoTitleEn: '', seoDescriptionVi: '', seoDescriptionEn: '', publishedAt: null
  });

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/blogs/admin/all');
      setBlogs(response.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching blogs", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSave = async () => {
    try {
      if (!formData.titleVi || !formData.slug || !formData.contentVi) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
        return;
      }

      const payload = {
        ...formData,
        titleEn: formData.titleEn || formData.titleVi,
        contentEn: formData.contentEn || formData.contentVi,
        shortDescriptionEn: formData.shortDescriptionEn || formData.shortDescriptionVi
      };

      if (editingId) {
        await api.put(`/blogs/${editingId}`, payload);
      } else {
        await api.post('/blogs', payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        titleVi: '', titleEn: '', slug: '', thumbnailUrl: '', contentVi: '', contentEn: '',
        shortDescriptionVi: '', shortDescriptionEn: '', tags: '', isFeatured: false, isPublished: false,
        seoTitleVi: '', seoTitleEn: '', seoDescriptionVi: '', seoDescriptionEn: '', publishedAt: null
      });
      fetchBlogs();
    } catch (error: any) {
      console.error("Error saving blog", error);
      alert("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (blog: any) => {
    setEditingId(blog.id);
    setFormData({
      titleVi: blog.titleVi || '', titleEn: blog.titleEn || '', slug: blog.slug || '',
      thumbnailUrl: blog.thumbnailUrl || '', contentVi: blog.contentVi || '', contentEn: blog.contentEn || '',
      shortDescriptionVi: blog.shortDescriptionVi || '', shortDescriptionEn: blog.shortDescriptionEn || '',
      tags: blog.tags || '', isFeatured: blog.isFeatured || false, isPublished: blog.isPublished || false,
      seoTitleVi: blog.seoTitleVi || '', seoTitleEn: blog.seoTitleEn || '',
      seoDescriptionVi: blog.seoDescriptionVi || '', seoDescriptionEn: blog.seoDescriptionEn || '',
      publishedAt: blog.publishedAt || null
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await api.delete(`/blogs/${id}`);
        fetchBlogs();
      } catch (error) {
        console.error("Error deleting blog", error);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Bài viết</h2>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              titleVi: '', titleEn: '', slug: '', thumbnailUrl: '', contentVi: '', contentEn: '',
              shortDescriptionVi: '', shortDescriptionEn: '', tags: '', isFeatured: false, isPublished: false,
              seoTitleVi: '', seoTitleEn: '', seoDescriptionVi: '', seoDescriptionEn: '', publishedAt: null
            });
            setIsModalOpen(true);
          }}
          className="bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-neutral-800 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" /> Tạo Bài viết
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-sm">
              <th className="p-4 font-medium rounded-tl-xl w-20">Ảnh</th>
              <th className="p-4 font-medium">Tiêu đề</th>
              <th className="p-4 font-medium">Tags</th>
              <th className="p-4  px-12 text-center font-medium">Trạng thái</th>
              <th className="p-4 font-medium text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Đang tải dữ liệu...</td></tr>
            ) : blogs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Chưa có bài viết nào</td></tr>
            ) : (
              blogs.map(blog => (
                <tr key={blog.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4">
                    {blog.thumbnailUrl ? (
                      <img src={blog.thumbnailUrl} alt={blog.titleVi} className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400"><ImageIcon size={24} /></div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-neutral-900">{blog.titleVi}</div>
                    <div className="text-xs text-neutral-500">{blog.slug}</div>
                  </td>
                  <td className="p-4 text-sm text-neutral-500">{blog.tags || '-'}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      {blog.isPublished ? (
                        <span className="px-3 text-center w-full py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Đã xuất bản</span>
                      ) : (
                        <span className="px-3 text-center w-full py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-bold">Bản nháp</span>
                      )}
                      {blog.isFeatured && (
                        <span className="px-3 text-center w-full py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Nổi bật</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(blog)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(blog.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[0.4rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">{editingId ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Tiêu đề bài viết *</label>
                  <input
                    type="text"
                    value={formData.titleVi}
                    onChange={(e) => setFormData({ ...formData, titleVi: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Đường dẫn (Slug) *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Link Ảnh Thumbnail</label>
                  <ImageUpload value={formData.thumbnailUrl} onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })} />
                  {formData.thumbnailUrl && <img src={formData.thumbnailUrl} className="mt-3 h-20 rounded-lg object-cover" />}
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Thể loại (Tags)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="thời trang, giày, thể thao..."
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <p className="text-xs text-neutral-500 mt-2">Phân cách bởi dấu phẩy</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Mô tả ngắn (VI)</label>
                  <div className="bg-white rounded-lg overflow-hidden border border-neutral-200">
                    {mounted && <ReactQuill theme="snow" value={formData.shortDescriptionVi || ''} onChange={val => setFormData({ ...formData, shortDescriptionVi: val })} className="h-32 mb-10" />}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Mô tả ngắn (EN)</label>
                  <div className="bg-white rounded-lg overflow-hidden border border-neutral-200">
                    {mounted && <ReactQuill theme="snow" value={formData.shortDescriptionEn || ''} onChange={val => setFormData({ ...formData, shortDescriptionEn: val })} className="h-32 mb-10" />}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Nội dung bài viết *</label>
                <div className="bg-white rounded-lg overflow-hidden border border-neutral-200">
                  {mounted && <ReactQuill
                    theme="snow"
                    value={formData.contentVi || ''}
                    onChange={(content) => setFormData({ ...formData, contentVi: content })}
                    className="h-64"
                  />}
                </div>
              </div>

              <div className="flex items-center pt-10 gap-8">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="publish"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 mr-3"
                  />
                  <label htmlFor="publish" className="font-bold cursor-pointer">Xuất bản bài viết</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 mr-3"
                  />
                  <label htmlFor="featured" className="font-bold cursor-pointer text-orange-600">Bài viết nổi bật</label>
                </div>
              </div>

              {/* SEO Options */}
              <div className="pt-6 border-t border-neutral-100">
                <h4 className="font-bold text-lg mb-4 text-neutral-800">Cấu hình SEO</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-neutral-900 mb-2">Meta Title (VI)</label>
                    <input
                      type="text"
                      value={formData.seoTitleVi || ''}
                      onChange={(e) => setFormData({ ...formData, seoTitleVi: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-900 mb-2">Meta Title (EN)</label>
                    <input
                      type="text"
                      value={formData.seoTitleEn || ''}
                      onChange={(e) => setFormData({ ...formData, seoTitleEn: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-neutral-900 mb-2">Meta Description (VI)</label>
                    <textarea
                      value={formData.seoDescriptionVi || ''}
                      onChange={(e) => setFormData({ ...formData, seoDescriptionVi: e.target.value })}
                      className="w-full h-24 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-900 mb-2">Meta Description (EN)</label>
                    <textarea
                      value={formData.seoDescriptionEn || ''}
                      onChange={(e) => setFormData({ ...formData, seoDescriptionEn: e.target.value })}
                      className="w-full h-24 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="mt-10 flex justify-end gap-4 border-t border-neutral-100 pt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 border border-neutral-200 rounded-full font-bold hover:bg-neutral-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
              >
                Lưu bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
