'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminGuard } from '@/components/admin/admin-guard';
import { AnalyticsPanel } from '@/components/admin/analytics-panel';
import { FlagQueue } from '@/components/admin/flag-queue';
import { ClaimQueue } from '@/components/admin/claim-queue';
import { NidQueue } from '@/components/admin/nid-queue';
import { UserManagement } from '@/components/admin/user-management';

interface AdminClientProps {
  locale: string;
}

export function AdminClient({ locale }: AdminClientProps) {
  const t = useTranslations('admin');
  const [activeTab, setActiveTab] = useState<'analytics' | 'flags' | 'claims' | 'nid' | 'users'>('analytics');

  const tabs = [
    { id: 'analytics' as const, label: t('analytics'), icon: '📊' },
    { id: 'flags' as const, label: t('flags'), icon: '🚩' },
    { id: 'claims' as const, label: t('claims'), icon: '📋' },
    { id: 'nid' as const, label: locale === 'bn' ? 'NID যাচাই' : 'NID Queue', icon: '🪪' },
    { id: 'users' as const, label: t('users'), icon: '👤' },
  ];

  return (
    <AdminGuard locale={locale} requiredRole="moderator">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

        {/* Tabs */}
        <div className="flex border-b mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'analytics' && <AnalyticsPanel locale={locale} />}
        {activeTab === 'flags' && <FlagQueue locale={locale} />}
        {activeTab === 'claims' && <ClaimQueue locale={locale} />}
        {activeTab === 'nid' && <NidQueue locale={locale} />}
        {activeTab === 'users' && <UserManagement locale={locale} />}
      </div>
    </AdminGuard>
  );
}
