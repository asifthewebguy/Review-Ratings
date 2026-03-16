'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { AuthResponse } from '@review-ratings/shared';

type Step = 'phone' | 'otp';

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullPhone = `+880${phone.replace(/^0/, '')}`;

  async function handleRequestOtp() {
    setError('');
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('অনুগ্রহ করে সঠিক ফোন নম্বর দিন');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/otp/request', { phone: fullPhone });
      if (res.success) {
        setStep('otp');
      } else {
        setError(res.error?.message ?? 'কিছু একটা সমস্যা হয়েছে');
      }
    } catch {
      setError('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(code = otp) {
    setError('');
    if (code.length !== 6) {
      setError('OTP কোড ৬ সংখ্যার হতে হবে');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/otp/verify', {
        phone: fullPhone,
        code,
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.tokens);
        onSuccess?.();
        onClose();
      } else {
        setError(res.error?.message ?? 'OTP যাচাই ব্যর্থ হয়েছে');
      }
    } catch {
      setError('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    if (digits.length === 6) {
      handleVerifyOtp(digits);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl mx-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-1">{t('loginTitle')}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {step === 'phone' ? t('loginSubtitle') : t('otpSent')}
        </p>

        {step === 'phone' ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('phoneNumber')}</label>
              <div className="flex">
                <span className="flex items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                  +880
                </span>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 rounded-r-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={11}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleRequestOtp()}
                />
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button onClick={handleRequestOtp} loading={loading} size="lg" className="w-full">
              {t('verifyOtp')} →
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              label={t('enterOtp')}
              type="tel"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              autoFocus
              error={error}
            />

            <Button onClick={() => handleVerifyOtp()} loading={loading} size="lg" className="w-full">
              {t('verifyOtp')}
            </Button>

            <button
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="text-sm text-muted-foreground hover:text-foreground text-center"
            >
              ← {tCommon('cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
