'use client';

import { useState } from 'react';

export default function Home() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Функция подключения кошелька PKOIN внутри Bastyon
  const connectWallet = async () => {
    setLoading(true);
    try {
      // Обращаемся к провайдеру Bastyon/Pocketnet в окне браузера
      const pn = (window as any).pocketnet || (window as any).pkoin;

      if (pn && typeof pn.getAccount === 'function') {
        const address = await pn.getAccount();
        setUserAddress(address);
      } else if ((window as any).parent && (window as any).parent.pocketnet) {
        // Запросить адрес через родительский iframe
        const address = await (window as any).parent.pocketnet.getAccount();
        setUserAddress(address);
      } else {
        alert('Пожалуйста, откройте игру внутри приложения Bastyon / Pocketnet');
      }
    } catch (err) {
      console.error('Ошибка подключения кошелька:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900 text-white">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur rounded-2xl p-6 shadow-2xl border border-slate-700 text-center">
        
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-amber-400 tracking-wide mb-1">
            КНБ PKOIN
          </h1>
          <p className="text-slate-400 text-xs uppercase tracking-wider">
            Камень • Ножницы • Бумага dApp
          </p>
        </div>

        {/* Блок подключения кошелька */}
        {userAddress ? (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl">
            <p className="text-emerald-400 text-xs font-semibold uppercase mb-1">
              Кошелек подключен
            </p>
            <p className="text-emerald-200 text-xs font-mono break-all bg-emerald-900/40 p-2 rounded border border-emerald-800/50">
              {userAddress}
            </p>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 mb-6"
          >
            {loading ? 'Подключение...' : 'Подключить кошелек PKOIN'}
          </button>
        )}

        {/* Игровые комнаты */}
        <div className="border-t border-slate-700/80 pt-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 text-left">
            Выберите ставку:
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-amber-400/50 rounded-xl text-left transition-all group">
              <span className="block text-xs text-slate-400 mb-1">Тренировка</span>
              <span className="block text-sm font-bold text-amber-400 group-hover:scale-105 transition-transform">
                0 PKOIN
              </span>
            </button>

            <button className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-amber-400/50 rounded-xl text-left transition-all group">
              <span className="block text-xs text-slate-400 mb-1">Дуэль</span>
              <span className="block text-sm font-bold text-amber-400 group-hover:scale-105 transition-transform">
                1 PKOIN
              </span>
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
