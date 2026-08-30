import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ktzexport.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin', '/*/admin',
        '/buyer/dashboard', '/*/buyer/dashboard',
        '/buyer/login', '/*/buyer/login',
        '/supplier/dashboard', '/*/supplier/dashboard',
        '/supplier/login', '/*/supplier/login',
        '/login', '/*/login',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
