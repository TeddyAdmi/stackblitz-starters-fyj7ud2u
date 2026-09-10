'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isBastyonConnected, setIsBastyonConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    // 1. Слушаем ping/запросы от родительского iFrame Bastyon
    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'pocketnet_ping' || event.data.action === 'ping')) {
        window.parent.postMessage({ type: 'pocketnet_pong', status: 'ready' }, '*');
      }
    };

    window.addEventListener('message', handleMessage);

    // 2. Отправляем сигнал готовности в Bastyon
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'app_ready', status: 'listening' }, '*');
        setIsBastyonConnected(true);
      }
    } catch (e) {
      console.error('Ошибка связи с Bastyon:', e);
    }

    // 3. Проверяем наличие объекта PKOIN/Bastyon в окне
    if (typeof window !== 'undefined' && (window as any).pocketnet) {
      setIsBastyonConnected(true);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Функция подключения кошелька PKOIN
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).pocketnet) {
      try {
        const address = await (window as any).pocketnet.getAccount();
        setUserAddress(address);
      } catch (err) {
        console.error('Не удалось получить адрес:', err);
      }
    } else {
      alert('Откройте приложение внутри клиента Bastyon/Pocketnet');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 text-center">
        <h1 className="text-3xl font-bold mb-4 text-amber-400">КНБ PKOIN</h1>
        <p className="text-slate-300 mb-6">
          Камень, Ножницы, Бумага в сети Pocketnet
        </p>

        {/* Статус подключения к Bastyon */}
        <div className="mb-6 p-3 rounded-lg bg-slate-700/50 text-sm">
          {isBastyonConnected ? (
            <span className="text-emerald-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Подключено к Bastyon
            </span>
          ) : (
            <span className="text-amber-300">
              Автономный режим (запустите в Bastyon)
            </span>
          )}
        </div>

        {/* Кнопка кошелька */}
        {userAddress ? (
          <div className="p-3 bg-emerald-950 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-mono break-all mb-6">
            Кошелек: {userAddress}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors mb-6"
          >
            Подключить кошелек PKOIN
          </button>
        )}

        {/* Игровые комнаты */}
        <div className="border-t border-slate-700 pt-4">
          <h2 className="text-lg font-semibold mb-3">Выберите комнату</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
              Free (0 PKOIN)
            </button>
            <button className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
              Bronze (1 PKOIN)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
