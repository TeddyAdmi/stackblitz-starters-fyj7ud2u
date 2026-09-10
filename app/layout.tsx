import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'КНБ PKOIN',
  description: 'Камень Ножницы Бумага dApp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* Моментальный handshake с Bastyon до загрузки React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function sendReady() {
                  try {
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'pocketnet_pong', status: 'listening' }, '*');
                      window.parent.postMessage({ type: 'app_ready', status: 'ready' }, '*');
                      window.parent.postMessage({ action: 'listening' }, '*');
                    }
                  } catch(e) {}
                }
                
                // Отправляем сразу при старте загрузки HTML
                sendReady();

                // Слушаем пинги от Bastyon
                window.addEventListener('message', function(event) {
                  if (event.data) {
                    sendReady();
                  }
                });

                // Повторяем каждые 100ms в течение первой секунды
                var interval = setInterval(sendReady, 100);
                setTimeout(function() { clearInterval(interval); }, 2000);
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
