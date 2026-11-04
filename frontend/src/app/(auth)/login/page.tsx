'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { useLanguageStore } from '@/store/languageStore';
import vi from '@/i18n/vi.json';
import en from '@/i18n/en.json';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { language } = useLanguageStore();
  const t = language === 'vi' ? vi : en;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, id, email: userEmail, fullName, role } = response.data;

      login({ id, email: userEmail, fullName, role }, token);

      // Sync local cart
      const { useCartStore } = await import('@/store/cartStore');
      await useCartStore.getState().syncLocalCart();

      toast.success(t.auth.login.success);

      if (['ADMIN', 'SALES_STAFF', 'INVENTORY_STAFF'].includes(role)) {
        router.push('/admin');
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect');
        router.push(redirect || '/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t.auth.login.error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/google', { idToken: credentialResponse.credential });
      const { token, id, email: userEmail, fullName, role } = response.data;

      login({ id, email: userEmail, fullName, role }, token);

      const { useCartStore } = await import('@/store/cartStore');
      await useCartStore.getState().syncLocalCart();

      toast.success(t.auth.login.google_success);

      if (['ADMIN', 'SALES_STAFF', 'INVENTORY_STAFF'].includes(role)) {
        router.push('/admin');
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect');
        router.push(redirect || '/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t.auth.login.google_error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t.auth.login.forgot_empty_email);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/auth/forgot-password', { email });
      toast.success(t.auth.login.forgot_success);
      router.push(`/forgot-password?email=${encodeURIComponent(email)}&step=2`);
    } catch (err: any) {
      setError(err.response?.data || t.auth.login.forgot_error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-neutral-900 font-sans selection:bg-orange-500 selection:text-white">
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
            alt="Sneaker Showcase"
            className="object-cover w-full h-full opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </motion.div>

        <div className="absolute bottom-16 left-16 right-16">
          <motion.h2
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl font-bold tracking-tight mb-4"
          >
            Vanguard
          </motion.h2>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-neutral-400 text-lg max-w-md"
          >
            {t.auth.login.hero_desc}
          </motion.p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white border-l border-neutral-200">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <div className="text-[11px] font-mono tracking-widest text-orange-600 uppercase mb-2 font-bold">[ĐĂNG NHẬP HỆ THỐNG]</div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">{t.auth.login.title}</h1>
            <p className="text-neutral-500 text-sm mt-1">{t.auth.login.subtitle}</p>
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

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 ml-1">{t.auth.login.email}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-neutral-700">{t.auth.login.password}</label>
                <button type="button" onClick={handleForgotPassword} className="text-sm text-neutral-500 hover:text-orange-400 transition-colors">
                  {t.auth.login.forgot_password}
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center py-3.5 px-4 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-black focus:ring-4 focus:ring-neutral-900/20 transition-all disabled:opacity-70 overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    {t.auth.login.submit}
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="border-b border-neutral-200 w-1/5 lg:w-1/4"></span>
            <span className="text-xs text-center text-neutral-500 uppercase">{t.auth.login.or}</span>
            <span className="border-b border-neutral-200 w-1/5 lg:w-1/4"></span>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError(t.auth.login.google_error);
              }}
              theme="outline"
              shape="pill"
            />
          </div>

          <p className="mt-8 text-center text-neutral-400">
            {t.auth.login.no_account}{' '}
            <Link href="/register" className="font-semibold text-neutral-900 hover:text-orange-500 transition-colors">
              {t.auth.login.register_now}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
