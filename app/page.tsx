'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isBastyonReady, setIsBastyonReady] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    // 1. Рукопожатие с Bastyon dApp Container
    const handleBastyonHandshake = (event: MessageEvent) => {
      // Проверяем наличие данных в событии
      if (!event.data) return;

      // Bastyon пингует iframe при инициализации
      if (
        event.data.type === 'pocketnet_ping' || 
        event.data.action === 'ping' ||
        event.data === 'ping'
      ) {
        // Отвечаем клиенту Bastyon, что окно готово и слушатель активен
        window.parent.postMessage({ type: 'pocketnet_pong', status: 'listening' }, '*');
        setIsBastyonReady(true);
      }
    };

    window.addEventListener('message', handleBastyonHandshake);

    // 2. Явное уведомление контейнера Bastyon о готовности (app_ready)
    const notifyBastyon = () => {
      try {
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'app_ready', status: 'ready' }, '*');
          window.parent.postMessage({ action: 'listening' }, '*');
        }
      } catch (e) {
        console.error('Ошибка отправки сообщения в Bastyon:', e);
      }
    };

    // Отправляем сигнал с небольшой задержкой для гарантии монтирования DOM
    notifyBastyon();
    const timer = setTimeout(notifyBastyon, 500);

    return () => {
      window.removeEventListener('message', handleBastyonHandshake);
      clearTimeout(timer);
    };
  }, []);

  // Функция запроса адреса кошелька
  const connectWallet = async () => {
    const pn = (window as any).pocketnet || (window as any).pkoin;
    
    if (pn && typeof pn.getAccount === 'function') {
      try {
        const address = await pn.getAccount();
        setUserAddress(address);
      } catch (err) {
        console.error('Ошибка получения аккаунта:', err);
      }
    } else {
      alert('Запустите dApp внутри клиента Bastyon');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 text-center">
        <h1 className="text-3xl font-bold mb-2 text-amber-400">КНБ PKOIN</h1>
        <p className="text-slate-400 text-sm mb-6">Камень, Ножницы, Бумага</p>

        {/* Статус Bastyon */}
        <div className="mb-6 p-3 rounded-lg bg-slate-700/50 text-xs font-mono">
          {isBastyonReady ? (
            <span className="text-emerald-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Bastyon SDK: Соединение установлено
            </span>
          ) : (
            <span className="text-amber-400">
              Ожидание сигнала от Bastyon...
            </span>
          )}
        </div>

        {/* Кошелек */}
        {userAddress ? (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-mono break-all mb-6">
            Кошелек: {userAddress}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors mb-6 shadow-lg"
          >
            Подключить кошелек PKOIN
          </button>
        )}

        {/* Комнаты */}
        <div className="border-t border-slate-700 pt-4">
          <h2 className="text-sm font-semibold mb-3 text-slate-300">Игровые комнаты</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-700/60 rounded-lg text-xs font-medium border border-slate-600">
              Free Room
            </div>
            <div className="p-3 bg-slate-700/60 rounded-lg text-xs font-medium border border-slate-600">
              Bronze (1 PKOIN)
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
