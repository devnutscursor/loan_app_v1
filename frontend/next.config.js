/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'placeholderimage.com'],
  },
  env: {
    // Backend API base URL (no trailing slash). Set in .env / Vercel env.
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : ''),
  },
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig
