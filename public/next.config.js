/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors * 'self' https://*.pocketnet.app https://*.bastyon.com https://*.bastyon.app;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
