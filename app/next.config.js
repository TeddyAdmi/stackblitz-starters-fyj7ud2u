/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Включает чистую статическую сборку (SPA)
  images: {
    unoptimized: true, // Отключает серверную оптимизацию картинок
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
