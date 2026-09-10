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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function reply() {
                  try {
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'pocketnet_pong', status: 'listening' }, '*');
                      window.parent.postMessage({ type: 'app_ready', status: 'ready' }, '*');
                      window.parent.postMessage({ action: 'listening' }, '*');
                    }
                  } catch(e) {}
                }
                reply();
                window.addEventListener('message', reply);
                var i = setInterval(reply, 50);
                setTimeout(function() { clearInterval(i); }, 3000);
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
