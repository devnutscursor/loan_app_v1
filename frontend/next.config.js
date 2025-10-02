/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'placeholderimage.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://loan-app-backend-1qkk.onrender.com/',
  },
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig
