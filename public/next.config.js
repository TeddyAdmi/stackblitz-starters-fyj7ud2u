/** @type {import('next').NextConfig} */
const nextConfig = {
  // Разрешаем встраивание сайта в любые iframe и удаляем жесткие заголовки безопасности
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
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
