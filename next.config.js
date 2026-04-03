const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  images: {
    domains: [
      'cwewgkdzehckfrxlrbvh.supabase.co',
      'res.cloudinary.com',
      'localhost',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  swcMinify: true,
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
