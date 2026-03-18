'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';

interface Category {
  id: string;
  nameEn: string;
  nameBn: string;
  slug: string;
}

interface Division {
  id: string;
  nameEn: string;
  nameBn: string;
}

interface District {
  id: string;
  nameEn: string;
  nameBn: string;
  divisionId: string;
}

interface Upazila {
  id: string;
  nameEn: string;
  nameBn: string;
  districtId: string;
}

interface CreateBusinessFormProps {
  locale: string;
}

const API_URL = '/api/v1';

export function CreateBusinessForm({ locale }: CreateBusinessFormProps) {
  const router = useRouter();
  const { isAuthenticated, tokens, openLoginModal } = useAuthStore();
  const t = useTranslations('business');
  const tc = useTranslations('common');

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [upazilaId, setUpazilaId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdSlug, setCreatedSlug] = useState('');

  // Load categories and divisions on mount
  useEffect(() => {
    async function loadInitialData() {
      const [catRes, divRes] = await Promise.all([
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/locations/divisions`),
      ]);
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.data ?? []);
      }
      if (divRes.ok) {
        const data = await divRes.json();
        setDivisions(data.data ?? []);
      }
    }
    loadInitialData();
  }, []);

  // Load districts when division changes
  useEffect(() => {
    if (!divisionId) {
      setDistricts([]);
      setDistrictId('');
      setUpazilas([]);
      setUpazilaId('');
      return;
    }
    async function loadDistricts() {
      const res = await fetch(`${API_URL}/locations/districts?division_id=${divisionId}`);
      if (res.ok) {
        const data = await res.json();
        setDistricts(data.data ?? []);
        setDistrictId('');
        setUpazilas([]);
        setUpazilaId('');
      }
    }
    loadDistricts();
  }, [divisionId]);

  // Load upazilas when district changes
  useEffect(() => {
    if (!districtId) {
      setUpazilas([]);
      setUpazilaId('');
      return;
    }
    async function loadUpazilas() {
      const res = await fetch(`${API_URL}/locations/upazilas?district_id=${districtId}`);
      if (res.ok) {
        const data = await res.json();
        setUpazilas(data.data ?? []);
        setUpazilaId('');
      }
    }
    loadUpazilas();
  }, [districtId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (!name.trim() || name.length < 2) {
      setError(locale === 'bn' ? 'ব্যবসার নাম কমপক্ষে ২ অক্ষর হতে হবে' : 'Business name must be at least 2 characters');
      return;
    }
    if (!categoryId) {
      setError(locale === 'bn' ? 'ক্যাটেগরি বেছে নিন' : 'Please select a category');
      return;
    }
    if (!districtId) {
      setError(locale === 'bn' ? 'জেলা বেছে নিন' : 'Please select a district');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const body: Record<string, string> = { name: name.trim(), categoryId, districtId };
      if (upazilaId) body.upazilaId = upazilaId;
      if (address.trim()) body.address = address.trim();
      if (phone.trim()) body.phone = phone.trim();
      if (website.trim()) body.website = website.trim();
      if (facebookUrl.trim()) body.facebookUrl = facebookUrl.trim();

      const res = await fetch(`${API_URL}/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? (locale === 'bn' ? 'ত্রুটি হয়েছে' : 'Failed to create business'));
        return;
      }

      setCreatedSlug(data.data.slug);
    } catch {
      setError(locale === 'bn' ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  }

  const isBn = locale === 'bn';

  if (createdSlug) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center text-green-800 space-y-4">
        <p className="text-3xl">✓</p>
        <p className="text-lg font-semibold">{t('createSuccess')}</p>
        <p className="text-sm text-green-700">{t('createSuccessDetail')}</p>
        <button
          onClick={() => router.push(`/${locale}/business/${createdSlug}`)}
          className="inline-block rounded-lg bg-green-700 px-6 py-2 text-white font-medium hover:bg-green-800 transition-colors"
        >
          {t('viewBusiness')}
        </button>
      </div>
    );
  }

  const selectClass =
    'w-full rounded-lg border border-border px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary';
  const inputClass =
    'w-full rounded-lg border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'block text-sm font-medium mb-2';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Business Name */}
      <div>
        <label className={labelClass}>{t('businessName')} *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('businessNamePlaceholder')}
          maxLength={200}
          className={inputClass}
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelClass}>{t('selectCategory')} *</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass}>
          <option value="">{t('selectCategory')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {isBn ? c.nameBn : c.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Division */}
      <div>
        <label className={labelClass}>{t('selectDivision')} *</label>
        <select value={divisionId} onChange={(e) => setDivisionId(e.target.value)} className={selectClass}>
          <option value="">{t('selectDivision')}</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {isBn ? d.nameBn : d.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <label className={labelClass}>{t('selectDistrict')} *</label>
        <select
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          disabled={!divisionId || districts.length === 0}
          className={selectClass}
        >
          <option value="">{t('selectDistrict')}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {isBn ? d.nameBn : d.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Upazila */}
      {upazilas.length > 0 && (
        <div>
          <label className={labelClass}>
            {t('selectUpazila')} <span className="text-muted-foreground font-normal">({t('optional')})</span>
          </label>
          <select value={upazilaId} onChange={(e) => setUpazilaId(e.target.value)} className={selectClass}>
            <option value="">{t('selectUpazila')}</option>
            {upazilas.map((u) => (
              <option key={u.id} value={u.id}>
                {isBn ? u.nameBn : u.nameEn}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Address */}
      <div>
        <label className={labelClass}>
          {t('businessAddress')} <span className="text-muted-foreground font-normal">({t('optional')})</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t('addressPlaceholder')}
          maxLength={500}
          className={inputClass}
        />
      </div>

      {/* Phone */}
      <div>
        <label className={labelClass}>
          {t('businessPhone')} <span className="text-muted-foreground font-normal">({t('optional')})</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('phonePlaceholder')}
          maxLength={20}
          className={inputClass}
        />
      </div>

      {/* Website */}
      <div>
        <label className={labelClass}>
          {t('businessWebsite')} <span className="text-muted-foreground font-normal">({t('optional')})</span>
        </label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder={t('websitePlaceholder')}
          className={inputClass}
        />
      </div>

      {/* Facebook */}
      <div>
        <label className={labelClass}>
          {t('facebookUrl')} <span className="text-muted-foreground font-normal">({t('optional')})</span>
        </label>
        <input
          type="url"
          value={facebookUrl}
          onChange={(e) => setFacebookUrl(e.target.value)}
          placeholder={t('facebookPlaceholder')}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {submitting ? t('creating') : t('createSubmit')}
      </button>
    </form>
  );
}
