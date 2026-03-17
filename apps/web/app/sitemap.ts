import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com';
const API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`;

async function getBusinessSlugs(): Promise<string[]> {
  try {
    // Fetch all active businesses (paginate through all pages)
    const slugs: string[] = [];
    let page = 1;
    while (true) {
      const res = await fetch(`${API_URL}/businesses?limit=50&page=${page}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const data = await res.json();
      const businesses: Array<{ slug: string }> = data.data ?? [];
      if (businesses.length === 0) break;
      slugs.push(...businesses.map((b) => b.slug));
      if (businesses.length < 50) break;
      page++;
    }
    return slugs;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getBusinessSlugs();
  const locales = ['bn', 'en'];

  const staticRoutes = ['', '/search', '/dashboard'].flatMap((route) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1.0 : 0.8,
    }))
  );

  const businessRoutes = slugs.flatMap((slug) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/business/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  return [...staticRoutes, ...businessRoutes];
}
