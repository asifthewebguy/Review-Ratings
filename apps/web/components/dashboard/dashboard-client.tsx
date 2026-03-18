'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RatingTrend } from '@/components/dashboard/rating-trend';
import { ProfileEdit } from '@/components/dashboard/profile-edit';
import { ReviewCard } from '@/components/review-card';
import { ResponseForm } from '@/components/response-form';
import { Link, useRouter } from '@/i18n/navigation';

const API_URL = '/api/v1';

interface DashboardClientProps {
  locale: string;
}

export function DashboardClient({ locale }: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const tb = useTranslations('business');
  const { isAuthenticated, tokens, user, refreshAccessToken } = useAuthStore();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'profile'>('overview');

  const isBn = locale === 'bn';

  const isVerified = Boolean(user?.phone);

  useEffect(() => {
    if (!isAuthenticated || !tokens?.accessToken) {
      setLoading(false);
      return;
    }
    if (!isVerified) {
      router.replace('/profile');
      return;
    }
    fetchBusinesses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, tokens, isVerified]);

  async function authFetch(url: string) {
    const tok = () => useAuthStore.getState().tokens?.accessToken;
    let res = await fetch(url, { headers: { Authorization: `Bearer ${tok()}` } });
    if (res.status === 401) {
      const ok = await refreshAccessToken();
      if (!ok) { router.replace('/'); return res; }
      res = await fetch(url, { headers: { Authorization: `Bearer ${tok()}` } });
    }
    return res;
  }

  async function fetchBusinesses() {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/users/me/businesses`);
      const data = await res.json();
      const biz = data.data ?? [];
      setBusinesses(biz);
      if (biz.length > 0) {
        setSelectedBusiness(biz[0]);
        fetchBusinessData(biz[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchBusinessData(businessId: string) {
    const [statsRes, reviewsRes] = await Promise.all([
      authFetch(`${API_URL}/businesses/${businessId}/stats`),
      fetch(`${API_URL}/businesses/${businessId}/reviews?limit=10`),
    ]);
    const [statsData, reviewsData] = await Promise.all([statsRes.json(), reviewsRes.json()]);
    setStats(statsData.data);
    setReviews(reviewsData.data ?? []);
  }

  function selectBusiness(biz: any) {
    setSelectedBusiness(biz);
    setStats(null);
    setReviews([]);
    fetchBusinessData(biz.id);
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-xl font-bold mb-2">{isBn ? 'লগইন প্রয়োজন' : 'Login Required'}</h1>
        <p className="text-muted-foreground">{isBn ? 'ড্যাশবোর্ড দেখতে লগইন করুন' : 'Please login to access the dashboard'}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-muted-foreground">
        {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">🏢</p>
        <h1 className="text-xl font-bold mb-2">{t('noClaimed')}</h1>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            {t('claimNow')}
          </Link>
          <Link href="/businesses/new" className="inline-block rounded-lg border border-primary px-6 py-3 text-primary font-medium hover:bg-primary/10 transition-colors">
            {tb('addBusiness')}
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: t('overview') },
    { id: 'reviews' as const, label: t('recentReviews') },
    { id: 'profile' as const, label: t('editProfile') },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      {/* Business selector */}
      {businesses.length > 1 && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
          {businesses.map((biz) => (
            <button
              key={biz.id}
              onClick={() => selectBusiness(biz)}
              className={`shrink-0 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${selectedBusiness?.id === biz.id ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/50'}`}
            >
              {biz.name}
            </button>
          ))}
        </div>
      )}

      {selectedBusiness && (
        <>
          {/* Business name header */}
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border bg-background">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-xl overflow-hidden shrink-0">
              {selectedBusiness.logoUrl ? (
                <img src={selectedBusiness.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                '🏢'
              )}
            </div>
            <div>
              <h2 className="font-bold">{selectedBusiness.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedBusiness.category?.nameEn}</p>
            </div>
            <Link
              href={`/business/${selectedBusiness.slug}`}
              className="ml-auto text-sm text-primary hover:underline"
            >
              {isBn ? 'পাবলিক প্রোফাইল →' : 'Public Profile →'}
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <StatsCards stats={stats} locale={locale} />
              <RatingTrend trend={stats.trend ?? []} locale={locale} />
            </div>
          )}

          {activeTab === 'overview' && !stats && (
            <div className="text-center text-muted-foreground py-8">{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{isBn ? 'কোনো রিভিউ নেই' : 'No reviews yet'}</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="space-y-3">
                    <ReviewCard review={review} locale={locale} />
                    {!review.response && (
                      <div className="ml-4 pl-4 border-l-2 border-muted">
                        <p className="text-xs font-medium text-muted-foreground mb-2">{t('respond')}</p>
                        <ResponseForm reviewId={review.id} locale={locale} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <ProfileEdit business={selectedBusiness} locale={locale} />
          )}
        </>
      )}
    </div>
  );
}
