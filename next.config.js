/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    PORT: process.env.PORT || 3001
  },
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  images: { 
    unoptimized: true 
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig
