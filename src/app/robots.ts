import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://praxis-ai.health';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy', '/terms', '/compliance', '/login'],
        disallow: [
          '/clinical/',
          '/patient/',
          '/operations/',
          '/admin/',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
