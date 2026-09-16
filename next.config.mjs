/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'tassloco507.com' },
      { protocol: 'http', hostname: 'tassloco507.com' },
    ],
  },
};

export default nextConfig;
