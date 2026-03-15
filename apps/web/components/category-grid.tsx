'use client';

import { Link } from '@/i18n/navigation';

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  icon: string | null;
}

interface CategoryGridProps {
  categories: Category[];
  locale: string;
}

// Fallback categories shown when API is unavailable
const FALLBACK_CATEGORIES: Category[] = [
  { id: '1', slug: 'ecommerce', nameEn: 'E-Commerce', nameBn: 'ই-কমার্স', icon: '🛒' },
  { id: '2', slug: 'fcommerce', nameEn: 'F-Commerce', nameBn: 'এফ-কমার্স', icon: '📱' },
  { id: '3', slug: 'restaurants', nameEn: 'Restaurants', nameBn: 'রেস্তোরাঁ', icon: '🍽️' },
  { id: '4', slug: 'food-delivery', nameEn: 'Food Delivery', nameBn: 'ফুড ডেলিভারি', icon: '🚚' },
  { id: '5', slug: 'banks', nameEn: 'Banks', nameBn: 'ব্যাংক', icon: '🏦' },
  { id: '6', slug: 'mfs', nameEn: 'MFS', nameBn: 'মোবাইল ব্যাংকিং', icon: '💰' },
  { id: '7', slug: 'hospitals', nameEn: 'Hospitals', nameBn: 'হাসপাতাল', icon: '🏥' },
  { id: '8', slug: 'diagnostics', nameEn: 'Diagnostics', nameBn: 'ডায়াগনস্টিক', icon: '🔬' },
  { id: '9', slug: 'pharmacies', nameEn: 'Pharmacies', nameBn: 'ফার্মেসি', icon: '💊' },
];

export function CategoryGrid({ categories, locale }: CategoryGridProps) {
  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {displayCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/search?category=${cat.slug}`}
          className="flex flex-col items-center gap-3 rounded-xl border bg-background p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">
            {cat.icon ?? '🏢'}
          </span>
          <span className="text-sm font-medium text-center leading-tight">
            {locale === 'bn' ? cat.nameBn : cat.nameEn}
          </span>
        </Link>
      ))}
    </div>
  );
}
