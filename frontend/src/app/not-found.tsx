'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-[12rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-600 mb-4"
        >
          404
        </motion.h1>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold mb-6 tracking-tight"
        >
          Không tìm thấy trang
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-neutral-400 mb-12 max-w-md mx-auto"
        >
          Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không thể truy cập.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button onClick={() => window.history.back()} className="px-8 py-4 bg-neutral-900 text-white rounded-full font-bold hover:bg-neutral-800 transition-colors flex items-center w-full sm:w-auto justify-center">
            <ArrowLeft size={20} className="mr-2" /> Quay lại
          </button>
          <Link href="/" className="px-8 py-4 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center w-full sm:w-auto justify-center">
            <Home size={20} className="mr-2" /> Về trang chủ
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
