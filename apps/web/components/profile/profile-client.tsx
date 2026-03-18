'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { VerificationSection } from '@/components/verification/verification-section';
import { ReviewCard } from '@/components/review-card';

const API_URL = '/api/v1';

interface ProfileClientProps {
  locale: string;
}

export function ProfileClient({ locale }: ProfileClientProps) {
  const t = useTranslations('profile');
  const { isAuthenticated, tokens, user, updateUser, refreshAccessToken } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'verification' | 'reviews'>('account');

  // Edit form state
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [saveError, setSaveError] = useState('');

  // Reviews tab state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
      setAvatarUrl(user.avatarUrl ?? '');
    }
  }, [user]);

  async function authFetch(url: string, options?: RequestInit) {
    const tok = () => useAuthStore.getState().tokens?.accessToken;
    let res = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    });
    if (res.status === 401) {
      const ok = await refreshAccessToken();
      if (!ok) { router.replace('/'); return res; }
      res = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
      });
    }
    return res;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveState('saving');
    setSaveError('');
    try {
      const res = await authFetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(displayName ? { displayName } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error?.message ?? 'Failed to save');
        setSaveState('idle');
        return;
      }
      updateUser(data.data);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveError('Network error');
      setSaveState('idle');
    }
  }

  async function fetchReviews(page: number) {
    setReviewsLoading(true);
    try {
      const res = await authFetch(`${API_URL}/users/me/reviews?page=${page}&limit=10`);
      const data = await res.json();
      setReviews(data.data?.items ?? []);
      setReviewsTotalPages(data.data?.totalPages ?? 1);
    } finally {
      setReviewsLoading(false);
    }
  }

  function handleTabChange(tab: 'account' | 'verification' | 'reviews') {
    setActiveTab(tab);
    if (tab === 'reviews' && reviews.length === 0) {
      fetchReviews(1);
    }
  }

  function handlePageChange(newPage: number) {
    setReviewsPage(newPage);
    fetchReviews(newPage);
  }

  if (!mounted) return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-center text-muted-foreground">
      {locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
    </div>
  );
  if (!isAuthenticated || !user) return null;

  // Avatar: image or initials
  const initials = (user.displayName ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  const tabs = [
    { id: 'account' as const, label: t('account') },
    { id: 'verification' as const, label: t('verification') },
    { id: 'reviews' as const, label: t('myReviews') },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      {/* Tab bar */}
      <div className="flex border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Account Tab ─────────────────────────────────── */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold overflow-hidden shrink-0 border">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">{user.displayName}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>

          {/* Account info badges */}
          <div className="rounded-xl border bg-background p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('trustLevel')}</span>
              <span className="text-sm font-medium">{user.trustLevel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('memberSince')}</span>
              <span className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('phoneVerified')}</span>
              {user.verifiedAt ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 rounded-full px-2 py-0.5">
                  ✓ {user.phone}
                </span>
              ) : (
                <button
                  onClick={() => handleTabChange('verification')}
                  className="text-xs text-primary underline"
                >
                  {t('goVerify')}
                </button>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('emailVerified')}</span>
              {user.emailVerifiedAt ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 rounded-full px-2 py-0.5">
                  ✓ {user.email}
                </span>
              ) : (
                <button
                  onClick={() => handleTabChange('verification')}
                  className="text-xs text-primary underline"
                >
                  {t('goVerify')}
                </button>
              )}
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="rounded-xl border bg-background p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('displayName')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('avatarUrl')}</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder={t('avatarUrlPlaceholder')}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <button
              type="submit"
              disabled={saveState === 'saving'}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saveState === 'saving' ? t('saving') : saveState === 'saved' ? t('saved') : t('saveChanges')}
            </button>
          </form>
        </div>
      )}

      {/* ── Verification Tab ─────────────────────────────── */}
      {activeTab === 'verification' && (
        <VerificationSection locale={locale} />
      )}

      {/* ── My Reviews Tab ───────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviewsLoading ? (
            <p className="text-center text-muted-foreground py-8">{locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</p>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">{t('noReviews')}</p>
              <Link href="/search" className="text-sm text-primary underline">
                {t('browseBusinesses')}
              </Link>
            </div>
          ) : (
            <>
              {reviews.map((review) => (
                <div key={review.id} className="space-y-1">
                  {review.business && (
                    <Link
                      href={`/business/${review.business.slug}`}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors ml-1"
                    >
                      {review.business.name} →
                    </Link>
                  )}
                  <ReviewCard
                    review={{
                      ...review,
                      user: {
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl ?? null,
                        trustLevel: user.trustLevel,
                      },
                    }}
                    locale={locale}
                  />
                </div>
              ))}

              {/* Pagination */}
              {reviewsTotalPages > 1 && (
                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={() => handlePageChange(reviewsPage - 1)}
                    disabled={reviewsPage <= 1}
                    className="px-4 py-2 text-sm rounded-lg border disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    {locale === 'bn' ? 'আগে' : 'Previous'}
                  </button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    {reviewsPage} / {reviewsTotalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(reviewsPage + 1)}
                    disabled={reviewsPage >= reviewsTotalPages}
                    className="px-4 py-2 text-sm rounded-lg border disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    {locale === 'bn' ? 'পরে' : 'Next'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
