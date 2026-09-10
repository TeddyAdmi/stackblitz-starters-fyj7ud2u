/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
          // Разрешаем Bastyon встраивать сайт в iFrame
          { key: 'Content-Security-Policy', value: "frame-ancestors *;" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
