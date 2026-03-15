import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('home.heroSubtitle')}
          </p>

          {/* Search Bar */}
          <div className="mt-10 flex max-w-xl mx-auto">
            <input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              className="flex-1 rounded-l-lg border border-r-0 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="rounded-r-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              {t('common.search')}
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-center mb-10">
            {t('home.browseCategories')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Category cards will be populated dynamically */}
            <CategoryPlaceholder />
          </div>
        </div>
      </section>
    </div>
  );
}

function CategoryPlaceholder() {
  const categories = [
    { icon: '🛒', nameEn: 'E-Commerce', nameBn: 'ই-কমার্স' },
    { icon: '📱', nameEn: 'F-Commerce', nameBn: 'এফ-কমার্স' },
    { icon: '🍽️', nameEn: 'Restaurants', nameBn: 'রেস্তোরাঁ' },
    { icon: '🚚', nameEn: 'Food Delivery', nameBn: 'ফুড ডেলিভারি' },
    { icon: '🏦', nameEn: 'Banks', nameBn: 'ব্যাংক' },
    { icon: '💰', nameEn: 'MFS', nameBn: 'মোবাইল ব্যাংকিং' },
    { icon: '🏥', nameEn: 'Hospitals', nameBn: 'হাসপাতাল' },
    { icon: '🔬', nameEn: 'Diagnostics', nameBn: 'ডায়াগনস্টিক' },
    { icon: '💊', nameEn: 'Pharmacies', nameBn: 'ফার্মেসি' },
  ];

  return (
    <>
      {categories.map((cat) => (
        <div
          key={cat.nameEn}
          className="flex flex-col items-center gap-2 rounded-lg border bg-background p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <span className="text-3xl">{cat.icon}</span>
          <span className="text-sm font-medium text-center">{cat.nameBn}</span>
        </div>
      ))}
    </>
  );
}
