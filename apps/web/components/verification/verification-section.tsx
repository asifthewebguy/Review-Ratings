'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from '@/i18n/navigation';
import { sendPhoneOtp, confirmPhoneOtp } from '@/lib/firebase';
import type { ConfirmationResult } from 'firebase/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type NidStatus = 'none' | 'pending' | 'approved' | 'rejected';

export function VerificationSection({ locale }: { locale: string }) {
  const { tokens, updateUser, user: storeUser, isAuthenticated } = useAuthStore();
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

  // NID state
  const [nidNumber, setNidNumber] = useState('');
  const [nidFrontData, setNidFrontData] = useState('');
  const [nidBackData, setNidBackData] = useState('');
  const [nidFrontPreview, setNidFrontPreview] = useState('');
  const [nidBackPreview, setNidBackPreview] = useState('');
  const [nidExtractedName, setNidExtractedName] = useState(storeUser?.nidExtractedName ?? '');
  const [nidExtractedDob, setNidExtractedDob] = useState(storeUser?.nidExtractedDob ?? '');
  const [nidExtractedAddress, setNidExtractedAddress] = useState(storeUser?.nidExtractedAddress ?? '');
  const [nidExtractedFather, setNidExtractedFather] = useState(storeUser?.nidExtractedFather ?? '');
  const [nidExtractedMother, setNidExtractedMother] = useState(storeUser?.nidExtractedMother ?? '');
  const [nidExtracting, setNidExtracting] = useState(false);
  const [nidLoading, setNidLoading] = useState(false);
  const [nidError, setNidError] = useState('');

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens?.accessToken}`,
    };
  }

  useEffect(() => {
    if (!isAuthenticated || !tokens?.accessToken) { router.replace('/'); setLoading(false); return; }
    fetch(`${API_URL}/api/v1/users/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUser(res.data);
          updateUser(res.data);
          setNidExtractedName((v) => v || res.data.nidExtractedName || '');
          setNidExtractedDob((v) => v || res.data.nidExtractedDob || '');
          setNidExtractedAddress((v) => v || res.data.nidExtractedAddress || '');
          setNidExtractedFather((v) => v || res.data.nidExtractedFather || '');
          setNidExtractedMother((v) => v || res.data.nidExtractedMother || '');
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
    } catch {
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
      const res = await fetch(`${API_URL}/api/v1/users/me/verify/phone`, {
        method: 'POST',
        headers: authHeaders(),
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
      const res = await fetch(`${API_URL}/api/v1/users/me/verify/email/request`, {
        method: 'POST',
        headers: authHeaders(),
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
      const res = await fetch(`${API_URL}/api/v1/users/me/verify/email/confirm`, {
        method: 'POST',
        headers: authHeaders(),
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

  // ── NID submission ──────────────────────────────────────

  async function handleNidFrontFile(data: string, preview: string) {
    setNidFrontData(data);
    setNidFrontPreview(preview);
    setNidExtracting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/users/me/verify/nid/extract`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ imageData: data }),
      }).then((r) => r.json());
      if (res.success) {
        if (res.data.nidNumber) setNidNumber(res.data.nidNumber);
        setNidExtractedName(res.data.name ?? '');
        setNidExtractedDob(res.data.dob ?? '');
        setNidExtractedAddress(res.data.address ?? '');
        setNidExtractedFather(res.data.father ?? '');
        setNidExtractedMother(res.data.mother ?? '');
      }
    } catch {
      // extraction failed silently — user can still fill manually
    } finally {
      setNidExtracting(false);
    }
  }

  async function handleNidSubmit() {
    setNidError('');
    if (!nidNumber || nidNumber.length < 10) {
      setNidError(isBn ? 'NID নম্বর সঠিকভাবে লিখুন (কমপক্ষে ১০ সংখ্যা)' : 'Enter a valid NID number (at least 10 digits)');
      return;
    }
    if (!nidFrontData) {
      setNidError(isBn ? 'NID কার্ডের সামনের ছবি বেছে নিন' : 'Please select the front image of your NID card');
      return;
    }
    setNidLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/users/me/verify/nid`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          nidNumber,
          nidDocUrl: nidFrontData,
          ...(nidBackData ? { nidDocUrlBack: nidBackData } : {}),
          ...(nidExtractedName ? { nidExtractedName } : {}),
          ...(nidExtractedDob ? { nidExtractedDob } : {}),
          ...(nidExtractedAddress ? { nidExtractedAddress } : {}),
          ...(nidExtractedFather ? { nidExtractedFather } : {}),
          ...(nidExtractedMother ? { nidExtractedMother } : {}),
        }),
      }).then((r) => r.json());
      if (res.success) {
        setUser((prev: any) => ({ ...prev, nidStatus: 'pending' }));
        updateUser({ nidStatus: 'pending' as NidStatus });
      } else {
        setNidError(res.error?.message ?? (isBn ? 'ত্রুটি হয়েছে' : 'An error occurred'));
      }
    } catch {
      setNidError(isBn ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setNidLoading(false);
    }
  }

  if (loading) {
    return <div className="rounded-xl border bg-background p-6 animate-pulse h-48" />;
  }

  const phoneVerified = !!user?.verifiedAt && !!user?.phone;
  const emailVerified = !!user?.emailVerifiedAt;
  const nidStatus: NidStatus = user?.nidStatus ?? 'none';

  return (
    <div className="rounded-xl border bg-background p-6 space-y-6">
      <h2 className="text-lg font-bold">{isBn ? 'পরিচয় যাচাই' : 'Identity Verification'}</h2>
      <p className="text-sm text-muted-foreground">
        {isBn
          ? 'রিভিউ জমা দিতে ফোন নম্বর ও জাতীয় পরিচয়পত্র (NID) যাচাই করা প্রয়োজন।'
          : 'Phone number and National ID verification are required before submitting reviews.'}
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

      {/* ── NID verification ── */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🪪</span>
            <span className="font-medium">{isBn ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)'}</span>
          </div>
          {nidStatus === 'approved' && (
            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ✓ {isBn ? 'যাচাইকৃত' : 'Verified'}
            </span>
          )}
          {nidStatus === 'pending' && (
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              ⏳ {isBn ? 'পর্যালোচনায় আছে' : 'Under Review'}
            </span>
          )}
          {nidStatus === 'rejected' && (
            <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full">
              ✗ {isBn ? 'প্রত্যাখ্যাত' : 'Rejected'}
            </span>
          )}
          {nidStatus === 'none' && (
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              {isBn ? 'জমা দিন' : 'Not submitted'}
            </span>
          )}
        </div>

        {nidStatus === 'approved' && (
          <p className="text-sm text-muted-foreground">
            {isBn ? 'আপনার জাতীয় পরিচয়পত্র যাচাই সম্পন্ন হয়েছে।' : 'Your National ID has been verified.'}
          </p>
        )}

        {nidStatus === 'pending' && (
          <p className="text-sm text-muted-foreground">
            {isBn
              ? 'আপনার NID পর্যালোচনাধীন আছে। অনুমোদনের পরে আপনি রিভিউ জমা দিতে পারবেন।'
              : 'Your NID is under review. You will be able to submit reviews once approved.'}
          </p>
        )}

        {nidStatus === 'rejected' && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              {isBn ? 'প্রত্যাখ্যানের কারণ: ' : 'Rejection reason: '}
              {user?.nidRejectedReason}
            </p>
            <p className="text-sm text-muted-foreground">
              {isBn ? 'স্পষ্ট ছবি সহ পুনরায় জমা দিন।' : 'Please resubmit with clearer photos.'}
            </p>
            <NidForm
              isBn={isBn}
              nidNumber={nidNumber} setNidNumber={setNidNumber}
              nidFrontData={nidFrontData} onFrontFile={handleNidFrontFile} nidFrontPreview={nidFrontPreview}
              nidBackData={nidBackData} setNidBackData={setNidBackData}
              nidBackPreview={nidBackPreview} setNidBackPreview={setNidBackPreview}
              nidExtractedName={nidExtractedName} setNidExtractedName={setNidExtractedName}
              nidExtractedDob={nidExtractedDob} setNidExtractedDob={setNidExtractedDob}
              nidExtractedAddress={nidExtractedAddress} setNidExtractedAddress={setNidExtractedAddress}
              nidExtractedFather={nidExtractedFather} setNidExtractedFather={setNidExtractedFather}
              nidExtractedMother={nidExtractedMother} setNidExtractedMother={setNidExtractedMother}
              nidExtracting={nidExtracting}
              nidError={nidError} nidLoading={nidLoading}
              onSubmit={handleNidSubmit}
            />
          </div>
        )}

        {nidStatus === 'none' && (
          <NidForm
            isBn={isBn}
            nidNumber={nidNumber} setNidNumber={setNidNumber}
            nidFrontData={nidFrontData} onFrontFile={handleNidFrontFile} nidFrontPreview={nidFrontPreview}
            nidBackData={nidBackData} setNidBackData={setNidBackData}
            nidBackPreview={nidBackPreview} setNidBackPreview={setNidBackPreview}
            nidExtractedName={nidExtractedName} setNidExtractedName={setNidExtractedName}
            nidExtractedDob={nidExtractedDob} setNidExtractedDob={setNidExtractedDob}
            nidExtractedAddress={nidExtractedAddress} setNidExtractedAddress={setNidExtractedAddress}
            nidExtractedFather={nidExtractedFather} setNidExtractedFather={setNidExtractedFather}
            nidExtractedMother={nidExtractedMother} setNidExtractedMother={setNidExtractedMother}
            nidExtracting={nidExtracting}
            nidError={nidError} nidLoading={nidLoading}
            onSubmit={handleNidSubmit}
          />
        )}
      </div>
    </div>
  );
}

function compressImage(file: File, maxWidth = 1024, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function NidImagePicker({
  label,
  preview,
  onFile,
}: {
  label: string;
  preview: string;
  onFile: (data: string, preview: string) => void;
}) {
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await compressImage(file);
    onFile(data, data);
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
      />
      {preview && (
        <img src={preview} alt={label} className="max-h-36 rounded border object-contain bg-muted" />
      )}
    </div>
  );
}

function NidForm({
  isBn, nidNumber, setNidNumber,
  nidFrontData, onFrontFile, nidFrontPreview,
  nidBackData, setNidBackData, nidBackPreview, setNidBackPreview,
  nidExtractedName, setNidExtractedName,
  nidExtractedDob, setNidExtractedDob,
  nidExtractedAddress, setNidExtractedAddress,
  nidExtractedFather, setNidExtractedFather,
  nidExtractedMother, setNidExtractedMother,
  nidExtracting, nidError, nidLoading, onSubmit,
}: {
  isBn: boolean;
  nidNumber: string; setNidNumber: (v: string) => void;
  nidFrontData: string; onFrontFile: (data: string, preview: string) => void; nidFrontPreview: string;
  nidBackData: string; setNidBackData: (v: string) => void;
  nidBackPreview: string; setNidBackPreview: (v: string) => void;
  nidExtractedName: string; setNidExtractedName: (v: string) => void;
  nidExtractedDob: string; setNidExtractedDob: (v: string) => void;
  nidExtractedAddress: string; setNidExtractedAddress: (v: string) => void;
  nidExtractedFather: string; setNidExtractedFather: (v: string) => void;
  nidExtractedMother: string; setNidExtractedMother: (v: string) => void;
  nidExtracting: boolean; nidError: string; nidLoading: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {isBn
          ? 'আপনার NID কার্ডের তথ্য ও ছবি জমা দিন। অ্যাডমিন যাচাই করবেন।'
          : 'Submit your NID card details and images for admin review.'}
      </p>

      <NidImagePicker
        label={isBn ? 'NID সামনের দিকের ছবি' : 'NID Front Image'}
        preview={nidFrontPreview}
        onFile={onFrontFile}
      />

      {nidExtracting && (
        <p className="text-xs text-primary animate-pulse">
          {isBn ? '🔍 তথ্য স্বয়ংক্রিয়ভাবে শনাক্ত হচ্ছে...' : '🔍 Scanning NID for auto-fill...'}
        </p>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          {isBn ? 'NID নম্বর' : 'NID Number'}
        </label>
        <input
          type="text"
          value={nidNumber}
          onChange={(e) => setNidNumber(e.target.value)}
          placeholder={isBn ? 'আপনার NID নম্বর (স্বয়ংক্রিয় বা ম্যানুয়াল)' : 'Your NID number (auto-filled or manual)'}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
        <p className="text-xs font-medium text-primary">
          {isBn ? 'NID থেকে স্বয়ংক্রিয়ভাবে শনাক্ত — যাচাই করুন' : 'Auto-detected from NID — please verify'}
        </p>
        <div className="space-y-1">
          <label className="block text-xs text-muted-foreground">{isBn ? 'নাম' : 'Name'}</label>
          <input type="text" value={nidExtractedName} onChange={(e) => setNidExtractedName(e.target.value)}
            placeholder={isBn ? 'নাম (স্বয়ংক্রিয় বা ম্যানুয়াল)' : 'Name (auto-filled or manual)'}
            className="w-full rounded border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-muted-foreground">{isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</label>
          <input type="text" value={nidExtractedDob} onChange={(e) => setNidExtractedDob(e.target.value)}
            placeholder="DD-MM-YYYY"
            className="w-full rounded border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-muted-foreground">{isBn ? 'পিতার নাম' : "Father's Name"}</label>
          <input type="text" value={nidExtractedFather} onChange={(e) => setNidExtractedFather(e.target.value)}
            placeholder={isBn ? 'পিতার নাম' : "Father's name"}
            className="w-full rounded border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-muted-foreground">{isBn ? 'মাতার নাম' : "Mother's Name"}</label>
          <input type="text" value={nidExtractedMother} onChange={(e) => setNidExtractedMother(e.target.value)}
            placeholder={isBn ? 'মাতার নাম' : "Mother's name"}
            className="w-full rounded border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-muted-foreground">{isBn ? 'ঠিকানা' : 'Address'}</label>
          <input type="text" value={nidExtractedAddress} onChange={(e) => setNidExtractedAddress(e.target.value)}
            placeholder={isBn ? 'ঠিকানা' : 'Address'}
            className="w-full rounded border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <NidImagePicker
        label={isBn ? 'NID পেছনের দিকের ছবি' : 'NID Back Image'}
        preview={nidBackPreview}
        onFile={(data, preview) => { setNidBackData(data); setNidBackPreview(preview); }}
      />

      {nidError && <p className="text-xs text-destructive">{nidError}</p>}
      <button
        onClick={onSubmit}
        disabled={nidLoading || nidExtracting || !nidFrontData}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {nidLoading ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...') : (isBn ? 'যাচাইয়ের জন্য জমা দিন' : 'Submit for Verification')}
      </button>
    </div>
  );
}
