import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'КНБ PKOIN',
  description: 'dApp Игра',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* Подключаем официальный скрипт взаимодействия Bastyon */}
        <script src="https://pocketnet.app/js/vendor/pocketnet.js" async />
        
        {/* Принудительное авто-рукопожатие для контейнера */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('DOMContentLoaded', function() {
                if (window.parent && window.parent !== window) {
                  window.parent.postMessage({ type: 'app_ready', status: 'ready' }, '*');
                  window.parent.postMessage({ action: 'listening' }, '*');
                }
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
