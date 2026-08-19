'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useLanguageStore } from '@/store/languageStore';
import vi from '@/i18n/vi.json';
import en from '@/i18n/en.json';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = language === 'vi' ? vi : en;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.register.password_mismatch);
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      setSuccess("Mã OTP đã được gửi đến email của bạn");
      setTimeout(() => {
        setSuccess('');
        setStep(2);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null) || t.auth.register.error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/verify-registration', {
        email: formData.email,
        code: otp
      });

      setSuccess("Xác thực tài khoản thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null) || "Mã xác nhận không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAF9F6] text-neutral-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=2525&auto=format&fit=crop"
            alt="Sneaker Culture"
            className="object-cover w-full h-full opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </motion.div>

        <div className="absolute bottom-16 left-16 right-16">
          <motion.h2
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-neutral-50 text-5xl font-bold tracking-tight mb-4"
          >
            Join the Club.
          </motion.h2>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-neutral-400 text-lg max-w-md"
          >
            {t.auth.register.hero_desc}
          </motion.p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-[#FAF9F6] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md py-8"
        >
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3 tracking-tight">{t.auth.register.title}</h1>
            <p className="text-neutral-500">{t.auth.register.subtitle}</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
            >
              {success}
            </motion.div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 ml-1">{t.auth.register.fullname}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 ml-1">{t.auth.login.email}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 ml-1">{t.auth.register.phone}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
                      placeholder="0912345678"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 ml-1">{t.auth.login.password}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 ml-1">{t.auth.register.confirm_password}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative flex items-center justify-center py-3.5 px-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/20 transition-all disabled:opacity-70 overflow-hidden mt-6"
              >
                <span className="relative z-10 flex items-center">
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      {t.auth.register.submit}
                      <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 ml-1">Mã xác nhận (OTP)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="text"
                    name="otp"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900 tracking-widest text-lg"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-2 ml-1">Vui lòng kiểm tra email của bạn ({formData.email}) để lấy mã OTP gồm 6 chữ số.</p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full group relative flex items-center justify-center py-3.5 px-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/20 transition-all disabled:opacity-70 overflow-hidden mt-6"
              >
                <span className="relative z-10 flex items-center">
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      Xác nhận
                      <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                Quay lại
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-neutral-500">
            {t.auth.register.has_account}{' '}
            <Link href="/login" className="font-semibold text-neutral-900 hover:text-orange-500 transition-colors">
              {t.auth.register.login_now}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
