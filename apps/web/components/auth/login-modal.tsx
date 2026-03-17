'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  signInWithProvider,
  googleProvider,
  appleProvider,
  facebookProvider,
  twitterProvider,
  githubProvider,
} from '@/lib/firebase';
import type { AuthResponse } from '@review-ratings/shared';

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const PROVIDERS = [
  { id: 'google', label: 'Google', provider: googleProvider, icon: '🔵' },
  { id: 'facebook', label: 'Facebook', provider: facebookProvider, icon: '🟦' },
  { id: 'apple', label: 'Apple', provider: appleProvider, icon: '🍎' },
  { id: 'twitter', label: 'X (Twitter)', provider: twitterProvider, icon: '🐦' },
  { id: 'github', label: 'GitHub', provider: githubProvider, icon: '🐙' },
] as const;

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const t = useTranslations('auth');
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleSocialLogin(providerId: string, provider: typeof PROVIDERS[number]['provider']) {
    setError('');
    setLoadingProvider(providerId);
    try {
      const idToken = await signInWithProvider(provider);
      const res = await api.post<AuthResponse>('/auth/firebase/verify', { idToken });
      if (res.success && res.data) {
        setAuth(res.data.user, res.data.tokens);
        onSuccess?.();
        onClose();
      } else {
        setError(res.error?.message ?? 'লগইন ব্যর্থ হয়েছে');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('popup-closed')) return;
      setError('লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoadingProvider(null);
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
        <p className="text-sm text-muted-foreground mb-6">{t('loginSubtitle')}</p>

        <div className="flex flex-col gap-3">
          {PROVIDERS.map(({ id, label, provider, icon }) => (
            <button
              key={id}
              onClick={() => handleSocialLogin(id, provider)}
              disabled={loadingProvider !== null}
              className="flex items-center gap-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
            >
              <span className="text-lg w-6 text-center">{icon}</span>
              <span className="flex-1 text-left">
                {loadingProvider === id ? '...' : label} দিয়ে লগইন করুন
              </span>
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-xs text-destructive text-center">{error}</p>}

        <p className="mt-6 text-xs text-muted-foreground text-center">
          লগইন করলে আমাদের শর্তাবলী ও গোপনীয়তা নীতিতে সম্মতি প্রদান করা হয়।
        </p>
      </div>
    </div>
  );
}
