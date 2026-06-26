import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {
  images: {
    domains: [],
  },
};

export default withNextIntl(nextConfig);
