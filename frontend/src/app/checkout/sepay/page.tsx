'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, QrCode, CreditCard, ChevronLeft } from 'lucide-react';
import api from '@/lib/axios';

export default function SePayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount') || '0';
  const shortOrderId = orderId ? orderId.split('-')[0].toUpperCase() : '';
  
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [bankAcc, setBankAcc] = useState('');
  const [bankName, setBankName] = useState('');
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/checkout');
      return;
    }

    const fetchConfig = async () => {
      try {
        const res = await api.get('/payment/sepay/config');
        setBankAcc(res.data.bankAcc);
        setBankName(res.data.bankName);
      } catch (error) {
        console.error("Error fetching SePay config", error);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId, router]);

  // Polling payment status
  useEffect(() => {
    if (!orderId || paymentSuccess) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/payment/sepay/status?orderId=${orderId}`);
        if (res.data && res.data.paymentStatus === 'PAID') {
          setPaymentSuccess(true);
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/checkout/success?orderId=${shortOrderId}`);
          }, 3000);
        }
      } catch (error) {
        console.error("Error polling payment status", error);
      }
    }, 3000); // Poll every 3s

    return () => clearInterval(interval);
  }, [orderId, paymentSuccess, router, shortOrderId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!orderId) return null;

  const qrUrl = `https://img.vietqr.io/image/${bankName}-${bankAcc}-compact2.png?amount=${amount}&addInfo=${shortOrderId}&accountName=PAYMENT`;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-8 pb-16 flex justify-center items-center px-4 font-sans">
      <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-neutral-200">
        
        {/* Left Side - Info */}
        <div className="md:w-1/2 p-8 bg-neutral-900 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-8">
              <span className="font-black text-2xl tracking-tight">Thanh toán tự động</span>
            </div>
            
            <h2 className="text-xl font-bold mb-6 text-neutral-300">Chuyển khoản qua Mã QR</h2>
            
            <div className="space-y-4">
              <div className="border-b border-neutral-700/50 pb-4">
                <p className="text-neutral-400 text-sm mb-1">Mã đơn hàng</p>
                <p className="font-mono font-bold text-lg text-orange-400">#{shortOrderId}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-sm mb-1">Số tiền thanh toán</p>
                <p className="font-black text-3xl text-orange-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseInt(amount))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-sm text-neutral-400 flex items-center">
            <ShieldCheck size={18} className="mr-2 text-green-500" />
            Hệ thống xác nhận tự động trong 3 giây
          </div>
        </div>

        {/* Right Side - Action */}
        <div className="md:w-1/2 p-8 bg-white relative">
          <button onClick={() => router.back()} className="absolute top-6 left-6 text-neutral-400 hover:text-black flex items-center text-sm font-medium transition-colors">
            <ChevronLeft size={16} /> Hủy giao dịch
          </button>

          <div className="mt-12 flex flex-col items-center justify-center h-full text-center">
            {loadingConfig ? (
              <div className="flex flex-col items-center text-neutral-400">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p>Đang tạo mã QR...</p>
              </div>
            ) : paymentSuccess ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck size={48} className="text-green-500" />
                </div>
                <h3 className="font-bold text-2xl mb-2 text-green-600">Thanh toán thành công!</h3>
                <p className="text-neutral-500 text-sm mb-6">Đang tự động chuyển hướng về trang mua hàng...</p>
                <Loader2 size={24} className="text-green-500 animate-spin" />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                <div className="bg-white border border-neutral-200 p-2 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  {bankAcc ? (
                    <img src={qrUrl} alt="Mã QR Thanh toán" className="w-48 h-48 object-contain" />
                  ) : (
                    <div className="w-48 h-48 bg-neutral-100 flex items-center justify-center text-center text-sm text-neutral-400 p-4 rounded-lg">
                      Lỗi: Chưa cấu hình số tài khoản nhận tiền
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-xl mb-2 text-neutral-800">Mở App Ngân hàng quét QR</h3>
                <p className="text-neutral-500 text-sm mb-6 max-w-xs">Giao dịch sẽ được duyệt ngay lập tức khi bạn chuyển khoản thành công.</p>
                
                <div className="flex items-center text-red-500 font-bold bg-red-50 px-4 py-2 rounded-full">
                  <ClockIcon size={18} className="mr-2" /> Hết hạn sau: {formatTime(timeLeft)}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

function ClockIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
