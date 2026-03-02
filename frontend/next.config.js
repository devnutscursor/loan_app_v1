/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'placeholderimage.com' },
    ],
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
