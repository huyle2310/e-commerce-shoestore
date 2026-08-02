'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { Mail, Key, Lock, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguageStore } from '@/store/languageStore';
import vi from '@/i18n/vi.json';
import en from '@/i18n/en.json';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialEmail = searchParams.get('email') || '';
  const initialStep = parseInt(searchParams.get('step') || '1', 10);

  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { language } = useLanguageStore();
  const t = language === 'vi' ? vi : en;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success(t.auth.login.forgot_success);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data || t.auth.login.forgot_error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error(t.auth.forgot.code_length_error);
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-reset-code', { email, code });
      toast.success(t.auth.forgot.code_valid);
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data || t.auth.forgot.code_invalid);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t.auth.forgot.password_length);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t.auth.forgot.password_mismatch);
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      toast.success(t.auth.forgot.success);
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data || t.auth.forgot.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm relative">
        <button 
          onClick={() => step === 1 ? router.push('/login') : setStep(step - 1)}
          className="absolute top-8 left-8 text-neutral-400 hover:text-black transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="text-center mb-10 mt-6">
          <h1 className="text-3xl font-black tracking-tight mb-2">{t.auth.forgot.title}</h1>
          <p className="text-neutral-500">
            {step === 1 && t.auth.forgot.step1_desc}
            {step === 2 && t.auth.forgot.step2_desc}
            {step === 3 && t.auth.forgot.step3_desc}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">{t.auth.forgot.email}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ví dụ: email@gmail.com"
                  className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-70 group"
            >
              {loading ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div> : (
                <>{t.auth.forgot.continue} <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-center">{t.auth.forgot.verify_code}</label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  required
                  placeholder="000000"
                  className="w-full px-4 py-4 text-center text-3xl font-black tracking-[0.5em] bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full flex items-center justify-center bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-70 group"
            >
              {loading ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div> : (
                <>{t.auth.forgot.verify_submit} <ShieldCheck size={20} className="ml-2" /></>
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">{t.auth.forgot.new_password}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <Key size={20} />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">{t.auth.forgot.reenter_password}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-70"
            >
              {loading ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div> : t.auth.forgot.reset_submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
