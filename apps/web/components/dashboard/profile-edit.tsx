'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';

interface Business {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  facebookUrl?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
}

const API_URL = '/api/v1';

export function ProfileEdit({ business, locale }: { business: Business; locale: string }) {
  const t = useTranslations('dashboard');
  const { tokens } = useAuthStore();
  const [form, setForm] = useState({
    name: business.name,
    description: business.description ?? '',
    phone: business.phone ?? '',
    website: business.website ?? '',
    facebookUrl: business.facebookUrl ?? '',
    address: business.address ?? '',
    logoUrl: business.logoUrl ?? '',
    coverUrl: business.coverUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/businesses/${business.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          phone: form.phone || null,
          website: form.website || null,
          facebookUrl: form.facebookUrl || null,
          address: form.address || null,
          logoUrl: form.logoUrl || null,
          coverUrl: form.coverUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? 'Error saving');
        return;
      }
      setSaved(true);
    } catch {
      setError(locale === 'bn' ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setSaving(false);
    }
  }

  const isBn = locale === 'bn';
  const fields: Array<{ key: keyof typeof form; label: string; placeholder: string; type?: string }> = [
    { key: 'name', label: isBn ? 'ব্যবসার নাম' : 'Business Name', placeholder: '' },
    { key: 'description', label: isBn ? 'বিবরণ' : 'Description', placeholder: isBn ? 'আপনার ব্যবসার বিবরণ' : 'Describe your business' },
    { key: 'phone', label: isBn ? 'ফোন' : 'Phone', placeholder: '+8801XXXXXXXXX' },
    { key: 'website', label: isBn ? 'ওয়েবসাইট' : 'Website', placeholder: 'https://', type: 'url' },
    { key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/', type: 'url' },
    { key: 'address', label: isBn ? 'ঠিকানা' : 'Address', placeholder: '' },
    { key: 'logoUrl', label: isBn ? 'লোগো URL' : 'Logo URL', placeholder: 'https://', type: 'url' },
    { key: 'coverUrl', label: isBn ? 'কভার URL' : 'Cover Image URL', placeholder: 'https://', type: 'url' },
  ];

  return (
    <div className="rounded-xl border bg-background p-6">
      <h3 className="font-bold text-lg mb-4">{t('editProfile')}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ key, label, placeholder, type }) => (
            <div key={key} className={key === 'description' || key === 'address' ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              {key === 'description' ? (
                <textarea
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              ) : (
                <input
                  type={type ?? 'text'}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? t('saving') : t('saveProfile')}
          </button>
          {saved && <span className="text-sm text-green-600">✓ {t('profileSaved')}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </div>
  );
}
