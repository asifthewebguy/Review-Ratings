'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';

interface Category {
  id: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  icon: string | null;
}

interface AddProductFormProps {
  businessId: string;
  locale: string;
  onSuccess: (product: any) => void;
  onCancel: () => void;
}

const API_URL = '/api/v1';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export function AddProductForm({ businessId, locale, onSuccess, onCancel }: AddProductFormProps) {
  const t = useTranslations('products');
  const isBn = locale === 'bn';
  const { tokens } = useAuthStore();

  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [slugOverride, setSlugOverride] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/products/product-categories`)
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => {});
  }, []);

  const autoSlug = generateSlug(name);
  const effectiveSlug = slugOverride || autoSlug;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.length < 2) {
      setError(isBn ? 'পণ্যের নাম দিন' : 'Product name is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          businessId,
          name,
          nameBn: nameBn || undefined,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          slug: slugOverride || undefined,
          categoryId: categoryId || undefined,
          tags: tags.length ? tags : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? (isBn ? 'ত্রুটি হয়েছে' : 'An error occurred'));
        return;
      }
      onSuccess(data.data);
    } catch {
      setError(isBn ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className="bg-background rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('addProduct')}</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('productName')} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t('productNameBn')}</label>
            <input
              type="text"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              maxLength={200}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t('category')}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {isBn ? c.nameBn : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t('productDescription')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t('productImage')}</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t('productImagePlaceholder')}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t('tags')}</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={t('tagsPlaceholder')}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {name.length >= 2 && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">{t('slugPreview')}</label>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground">/product/</span>
                <input
                  type="text"
                  value={slugOverride || autoSlug}
                  onChange={(e) => setSlugOverride(e.target.value)}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border py-2 text-sm hover:bg-muted transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || name.length < 2}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {submitting ? t('submitting') : t('submitProduct')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
