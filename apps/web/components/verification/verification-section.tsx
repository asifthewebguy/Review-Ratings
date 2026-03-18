'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from '@/i18n/navigation';
import { sendPhoneOtp, confirmPhoneOtp } from '@/lib/firebase';
import type { ConfirmationResult } from 'firebase/auth';

const API_URL = '';

export function VerificationSection({ locale }: { locale: string }) {
  const { tokens, updateUser, user: storeUser, isAuthenticated, refreshAccessToken } = useAuthStore();
  const router = useRouter();
  const isBn = locale === 'bn';

  const [user, setUser] = useState<any>(storeUser);
  const [loading, setLoading] = useState(true);

  // Phone verification state
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  // Email OTP state
  const [emailStep, setEmailStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState(storeUser?.email ?? '');
  const [emailCode, setEmailCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  function getAuthHeaders() {
    const tok = useAuthStore.getState().tokens?.accessToken;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tok}`,
    };
  }

  async function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
    const res = await fetch(url, { ...opts, headers: { ...getAuthHeaders(), ...(opts.headers as Record<string, string> ?? {}) } });
    if (res.status === 401) {
      const ok = await refreshAccessToken();
      if (ok) {
        return fetch(url, { ...opts, headers: { ...getAuthHeaders(), ...(opts.headers as Record<string, string> ?? {}) } });
      }
      router.replace('/');
    }
    return res;
  }

  useEffect(() => {
    if (!isAuthenticated || !tokens?.accessToken) { router.replace('/'); setLoading(false); return; }
    authFetch(`${API_URL}/api/v1/users/me`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUser(res.data);
          updateUser(res.data);
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Phone verification ──────────────────────────────────

  async function handlePhoneSendOtp() {
    setPhoneError(''); setPhoneSuccess('');
    const fullPhone = `+880${phone.replace(/^0/, '')}`;
    if (!/^\+8801[3-9]\d{8}$/.test(fullPhone)) {
      setPhoneError(isBn ? 'সঠিক বাংলাদেশি ফোন নম্বর দিন (+8801XXXXXXXXX)' : 'Enter a valid Bangladesh phone number');
      return;
    }
    setPhoneLoading(true);
    try {
      confirmationRef.current = await sendPhoneOtp(fullPhone, 'recaptcha-container');
      setPhoneStep('otp');
      setPhoneSuccess(isBn ? 'SMS-এ OTP কোড পাঠানো হয়েছে' : 'OTP sent via SMS');
    } catch (err) {
      console.error('OTP send error:', err);
      setPhoneError(isBn ? 'OTP পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to send OTP. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handlePhoneConfirmOtp() {
    setPhoneError(''); setPhoneSuccess('');
    if (phoneOtp.length !== 6 || !confirmationRef.current) {
      setPhoneError(isBn ? 'OTP কোড ৬ সংখ্যার হতে হবে' : 'OTP must be 6 digits');
      return;
    }
    setPhoneLoading(true);
    try {
      const idToken = await confirmPhoneOtp(confirmationRef.current, phoneOtp);
      const res = await authFetch(`${API_URL}/api/v1/users/me/verify/phone`, {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }).then((r) => r.json());
      if (res.success) {
        setUser(res.data);
        updateUser(res.data);
        setPhoneSuccess(isBn ? 'ফোন নম্বর যাচাই সম্পন্ন!' : 'Phone number verified!');
      } else {
        setPhoneError(res.error?.message ?? (isBn ? 'যাচাই ব্যর্থ হয়েছে' : 'Verification failed'));
      }
    } catch {
      setPhoneError(isBn ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setPhoneLoading(false);
    }
  }

  // ── Email verification ──────────────────────────────────

  async function handleEmailRequest() {
    setEmailError(''); setEmailSuccess('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(isBn ? 'সঠিক ইমেইল ঠিকানা দিন' : 'Enter a valid email address');
      return;
    }
    setEmailLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/v1/users/me/verify/email/request`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }).then((r) => r.json());
      if (res.success) {
        setEmailStep('otp');
        setEmailSuccess(isBn ? 'ইমেইলে যাচাই কোড পাঠানো হয়েছে' : 'Verification code sent to your email');
      } else {
        setEmailError(res.error?.message ?? (isBn ? 'ত্রুটি হয়েছে' : 'An error occurred'));
      }
    } catch {
      setEmailError(isBn ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleEmailConfirm() {
    setEmailError(''); setEmailSuccess('');
    if (emailCode.length !== 6) {
      setEmailError(isBn ? 'কোড ৬ সংখ্যার হতে হবে' : 'Code must be 6 digits');
      return;
    }
    setEmailLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/v1/users/me/verify/email/confirm`, {
        method: 'POST',
        body: JSON.stringify({ email, code: emailCode }),
      }).then((r) => r.json());
      if (res.success) {
        setUser(res.data);
        updateUser(res.data);
        setEmailSuccess(isBn ? 'ইমেইল যাচাই সম্পন্ন!' : 'Email verified successfully!');
      } else {
        setEmailError(res.error?.message ?? (isBn ? 'কোড সঠিক নয়' : 'Invalid code'));
      }
    } catch {
      setEmailError(isBn ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setEmailLoading(false);
    }
  }

  if (loading) {
    return <div className="rounded-xl border bg-background p-6 animate-pulse h-48" />;
  }

  const phoneVerified = !!user?.verifiedAt && !!user?.phone;
  const emailVerified = !!user?.emailVerifiedAt;

  return (
    <div className="rounded-xl border bg-background p-6 space-y-6">
      <h2 className="text-lg font-bold">{isBn ? 'পরিচয় যাচাই' : 'Identity Verification'}</h2>
      <p className="text-sm text-muted-foreground">
        {isBn
          ? 'রিভিউ জমা দিতে ফোন নম্বর ও ইমেইল যাচাই করা প্রয়োজন।'
          : 'Phone number and email verification are required before submitting reviews.'}
      </p>

      {/* invisible reCAPTCHA mount point for Firebase Phone Auth */}
      <div id="recaptcha-container" />

      {/* ── Phone verification ── */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <span className="font-medium">{isBn ? 'ফোন নম্বর যাচাই' : 'Phone Verification'}</span>
          </div>
          {phoneVerified ? (
            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ✓ {isBn ? 'যাচাইকৃত' : 'Verified'}
            </span>
          ) : (
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              {isBn ? 'যাচাই করুন' : 'Not verified'}
            </span>
          )}
        </div>

        {phoneVerified ? (
          <p className="text-sm text-muted-foreground">{user?.phone}</p>
        ) : phoneStep === 'input' ? (
          <div className="space-y-2">
            <div className="flex">
              <span className="flex items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                +880
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className="flex-1 rounded-r-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
            <button
              onClick={handlePhoneSendOtp}
              disabled={phoneLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {phoneLoading ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'OTP পাঠান' : 'Send OTP')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {phoneSuccess && <p className="text-xs text-green-600">{phoneSuccess}</p>}
            <input
              type="tel"
              value={phoneOtp}
              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handlePhoneConfirmOtp}
                disabled={phoneLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {phoneLoading ? (isBn ? 'যাচাই হচ্ছে...' : 'Verifying...') : (isBn ? 'যাচাই করুন' : 'Verify')}
              </button>
              <button
                onClick={() => { setPhoneStep('input'); setPhoneOtp(''); setPhoneError(''); setPhoneSuccess(''); }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isBn ? 'পুনরায়' : 'Resend'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Email verification ── */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✉️</span>
            <span className="font-medium">{isBn ? 'ইমেইল যাচাই' : 'Email Verification'}</span>
          </div>
          {emailVerified ? (
            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ✓ {isBn ? 'যাচাইকৃত' : 'Verified'}
            </span>
          ) : (
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              {isBn ? 'যাচাই করুন' : 'Not verified'}
            </span>
          )}
        </div>

        {emailVerified ? (
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        ) : emailStep === 'input' ? (
          <div className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isBn ? 'আপনার ইমেইল ঠিকানা' : 'Your email address'}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            {emailSuccess && <p className="text-xs text-green-600">{emailSuccess}</p>}
            <button
              onClick={handleEmailRequest}
              disabled={emailLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {emailLoading ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'কোড পাঠান' : 'Send Code')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {emailSuccess && <p className="text-xs text-green-600">{emailSuccess}</p>}
            <input
              type="tel"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleEmailConfirm}
                disabled={emailLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {emailLoading ? (isBn ? 'যাচাই হচ্ছে...' : 'Verifying...') : (isBn ? 'যাচাই করুন' : 'Verify')}
              </button>
              <button
                onClick={() => { setEmailStep('input'); setEmailCode(''); setEmailError(''); setEmailSuccess(''); }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isBn ? 'পুনরায়' : 'Resend'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
