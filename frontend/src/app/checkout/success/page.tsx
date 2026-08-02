'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Package, Home, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen pt-32 pb-16 bg-neutral-50 flex flex-col items-center">
      <div className="max-w-xl w-full bg-white p-10 rounded-3xl border border-neutral-100 text-center shadow-sm">
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-3xl font-black mb-4">Đặt hàng thành công!</h1>
        <p className="text-neutral-500 mb-8 text-lg">
          Cảm ơn bạn đã mua sắm tại Vanguard. Đơn hàng của bạn đang được xử lý.
        </p>

        {orderId && (
          <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 mb-8 inline-block w-full">
            <p className="text-sm text-neutral-500 mb-2 uppercase font-bold tracking-wider">Mã đơn hàng</p>
            <p className="text-2xl font-mono font-bold">{orderId}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <Link 
            href="/shop" 
            className="flex-1 flex items-center justify-center bg-black text-white font-bold py-4 px-6 rounded-full hover:bg-neutral-800 transition-colors"
          >
            <ShoppingBag size={20} className="mr-2" /> Tiếp tục mua sắm
          </Link>
          <Link 
            href="/" 
            className="flex-1 flex items-center justify-center bg-white border border-neutral-200 text-black font-bold py-4 px-6 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <Home size={20} className="mr-2" /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
