import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingRoot: __dirname,
  async redirects() {
    // "About" now lives on the landing page (PRD section 3).
    return [{ source: '/about', destination: '/#about', permanent: true }];
  },
  turbopack: {
    root: __dirname,
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
