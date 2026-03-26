/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'nedrug.mfds.go.kr' },
    ],
  },
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' }
    return config
  },
}

module.exports = nextConfig