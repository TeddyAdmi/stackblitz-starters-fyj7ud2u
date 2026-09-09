'use client';

import { useState, useRef, useEffect } from 'react';

type Choice = 'rock' | 'scissors' | 'paper';

const choices: Choice[] = ['rock', 'scissors', 'paper'];
const choiceIcons = { rock: '✊', scissors: '✌️', paper: '✋' };
const choiceNames = { rock: 'Камень', scissors: 'Ножницы', paper: 'Бумага' };

interface MatchHistory {
  id: number;
  player: string;
  choice: Choice;
  result: 'Победа' | 'Поражение' | 'Ничья';
  amount: string;
  roomName: string;
}

interface ActiveBet {
  roomId: number;
  betVal: number;
  timestamp: number;
  choice: Choice;
}

interface RoomStats {
  online: number;
  matches24h: number;
  pool24h: number;
}

// Web Audio API генератор звуков
const playSound = (type: 'select' | 'win' | 'lose' | 'draw' | 'shake' | 'tx') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'select') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'shake') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'tx') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
      });
    } else if (type === 'lose') {
      const notes = [300, 260, 220, 180];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.25);
      });
    } else if (type === 'draw') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Автономный режим
  }
};

export default function Home() {
  const [activeRoom, setActiveRoom] = useState<number>(0);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [botChoice, setBotChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isProcessingTx, setIsProcessingTx] = useState<boolean>(false);
  const [shakeCount, setShakeCount] = useState<number>(3);

  const [pendingBet, setPendingBet] = useState<ActiveBet | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(86400);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [pkoinBalance, setPkoinBalance] = useState<number>(100.0);

  // Живая статистика по комнатам
  const [roomStats, setRoomStats] = useState<Record<number, RoomStats>>({
    1: { online: 24, matches24h: 312, pool24h: 0 },
    2: { online: 12, matches24h: 184, pool24h: 18.4 },
    3: { online: 18, matches24h: 96, pool24h: 48.0 },
    4: { online: 8, matches24h: 64, pool24h: 64.0 },
    5: { online: 5, matches24h: 42, pool24h: 84.0 },
    6: { online: 9, matches24h: 38, pool24h: 114.0 },
    7: { online: 4, matches24h: 21, pool24h: 84.0 },
    8: { online: 6, matches24h: 15, pool24h: 75.0 },
    9: { online: 3, matches24h: 9, pool24h: 90.0 },
    10: { online: 2, matches24h: 5, pool24h: 250.0 },
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Симуляция Live обновления онлайна и матчей
  useEffect(() => {
    const interval = setInterval(() => {
      const randomRoomId = Math.floor(Math.random() * 10) + 1;
      const deltaOnline = Math.floor(Math.random() * 3) - 1;

      setRoomStats((prev) => {
        const current = prev[randomRoomId];
        const newOnline = Math.max(1, current.online + deltaOnline);
        const isMatchFinished = Math.random() > 0.5;
        const newMatches = isMatchFinished ? current.matches24h + 1 : current.matches24h;

        return {
          ...prev,
          [randomRoomId]: {
            ...current,
            online: newOnline,
            matches24h: newMatches,
            pool24h: parseFloat((newMatches * (randomRoomId === 1 ? 0 : [0, 0.1, 0.5, 1, 2, 3, 4, 5, 10, 50][randomRoomId - 1])).toFixed(1)),
          },
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Конфетти при победе
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const colors = ['#10B981', '#6366F1', '#FBBF24', '#EC4899', '#3B82F6'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeParticles = 0;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.alpha -= 0.015;

        if (p.alpha > 0) {
          activeParticles++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      if (activeParticles > 0) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
  };

  // Таймер возврат 24ч
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pendingBet && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (pendingBet && timeLeft <= 0) {
      handleCancelBet(true);
    }
    return () => clearInterval(timer);
  }, [pendingBet, timeLeft]);

  const handleConnectWallet = () => {
    if (!isConnected) {
      setIsConnected(true);
      setWalletAddress('P' + Math.random().toString(36).substring(2, 10).toUpperCase() + '...pk');
      playSound('tx');
    } else {
      setIsConnected(false);
      setWalletAddress('');
    }
  };

  const [history, setHistory] = useState<MatchHistory[]>([
    { id: 10, player: 'Вы', choice: 'rock', result: 'Победа', amount: 'FREE', roomName: 'Free' },
    { id: 9, player: 'Alex_Bastion', choice: 'paper', result: 'Победа', amount: '+0.19 PKOIN', roomName: 'Bronze' },
    { id: 8, player: 'Crypto_King', choice: 'scissors', result: 'Поражение', amount: '-0.50 PKOIN', roomName: 'Silver' },
    { id: 7, player: 'Satoshi_N', choice: 'rock', result: 'Победа', amount: 'FREE', roomName: 'Free' },
    { id: 6, player: 'Whale_777', choice: 'paper', result: 'Ничья', amount: '0.00 PKOIN', roomName: 'Gold' },
  ]);

  const rooms = [
    { id: 1, title: 'Free', desc: 'Бесплатная тренировка', price: 'БЕСПЛАТНО', betVal: 0.0, tag: 'FREE' },
    { id: 2, title: 'Bronze', desc: 'Новички PvP', price: '0.1 PKOIN', betVal: 0.1, tag: 'СТАВКА' },
    { id: 3, title: 'Silver', desc: 'Любительский зал', price: '0.5 PKOIN', betVal: 0.5, tag: 'СТАВКА' },
    { id: 4, title: 'Gold', desc: 'Быстрая дуэль', price: '1.0 PKOIN', betVal: 1.0, tag: 'СТАВКА' },
    { id: 5, title: 'Pro', desc: 'Зал средних ставок', price: '2.0 PKOIN', betVal: 2.0, tag: 'СТАВКА' },
    { id: 6, title: 'Platinum', desc: 'Битва профессионалов', price: '3.0 PKOIN', betVal: 3.0, tag: 'СТАВКА' },
    { id: 7, title: 'Diamond', desc: 'Арена хайроллеров', price: '4.0 PKOIN', betVal: 4.0, tag: 'СТАВКА' },
    { id: 8, title: 'Elite', desc: 'Тигр зал', price: '5.0 PKOIN', betVal: 5.0, tag: 'СТАВКА' },
    { id: 9, title: 'Legend', desc: 'Суперлига PKOIN', price: '10.0 PKOIN', betVal: 10.0, tag: 'СТАВКА' },
    { id: 10, title: 'Royal', desc: 'Гранд-Финал', price: '50.0 PKOIN', betVal: 50.0, tag: 'СТАВКА' },
  ];

  const currentRoom = rooms.find((r) => r.id === activeRoom) || rooms[0];

  const getWinAmount = (betVal: number) => {
    if (betVal === 0) return 'Опыт (FREE)';
    const totalBank = betVal * 2;
    const winAmount = totalBank * 0.95;
    return `${winAmount.toFixed(2)} PKOIN`;
  };

  const playGame = (choice: Choice) => {
    if (isPlaying || isProcessingTx || pendingBet) return;

    if (currentRoom.betVal > 0 && pkoinBalance < currentRoom.betVal) {
      alert('Недостаточно PKOIN на балансе!');
      return;
    }

    setIsProcessingTx(true);
    playSound('select');

    setTimeout(() => {
      setIsProcessingTx(false);

      if (currentRoom.betVal > 0) {
        setPkoinBalance((prev) => parseFloat((prev - currentRoom.betVal).toFixed(2)));
        playSound('tx');

        setPendingBet({
          roomId: currentRoom.id,
          betVal: currentRoom.betVal,
          timestamp: Date.now(),
          choice,
        });
        setTimeLeft(86400);
      } else {
        startMatch(choice);
      }
    }, 800);
  };

  const startMatch = (choice: Choice) => {
    setIsPlaying(true);
    setPlayerChoice(null);
    setBotChoice(null);
    setResult(null);
    setShakeCount(3);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      setShakeCount(count);
      playSound('shake');
      if (count <= 0) {
        clearInterval(interval);
        finishGame(choice);
      }
    }, 450);
  };

  const handleSimulateOpponent = () => {
    if (!pendingBet) return;
    const choice = pendingBet.choice;
    setPendingBet(null);
    startMatch(choice);
  };

  const handleCancelBet = (auto = false) => {
    if (!pendingBet) return;
    const refund = pendingBet.betVal;
    setPkoinBalance((prev) => parseFloat((prev + refund).toFixed(2)));
    playSound('tx');
    setPendingBet(null);
    alert(auto ? `⏰ 24 часа истекли! Ставка ${refund} PKOIN возвращена на ваш баланс.` : `Ставка ${refund} PKOIN успешно отменена и возвращена.`);
  };

  const finishGame = (choice: Choice) => {
    const randomBotChoice = choices[Math.floor(Math.random() * choices.length)];
    setPlayerChoice(choice);
    setBotChoice(randomBotChoice);
    setIsPlaying(false);

    let gameResult: 'Победа' | 'Поражение' | 'Ничья';
    let rewardChange = 0;

    if (choice === randomBotChoice) {
      gameResult = 'Ничья';
      setResult(currentRoom.betVal === 0 ? 'Ничья в тренировке!' : 'Ничья! Ставка возвращена');
      rewardChange = currentRoom.betVal;
      playSound('draw');
    } else if (
      (choice === 'rock' && randomBotChoice === 'scissors') ||
      (choice === 'scissors' && randomBotChoice === 'paper') ||
      (choice === 'paper' && randomBotChoice === 'rock')
    ) {
      gameResult = 'Победа';
      rewardChange = currentRoom.betVal * 2 * 0.95;
      setResult(currentRoom.betVal === 0 ? 'Победа в тренировке!' : `Победа! +${rewardChange.toFixed(2)} PKOIN`);
      playSound('win');
      triggerConfetti();
    } else {
      gameResult = 'Поражение';
      rewardChange = 0;
      setResult(currentRoom.betVal === 0 ? 'Поражение в тренировке!' : `Поражение -${currentRoom.betVal.toFixed(2)} PKOIN`);
      playSound('lose');
    }

    if (rewardChange > 0 && currentRoom.betVal > 0) {
      setPkoinBalance((prev) => parseFloat((prev + rewardChange).toFixed(2)));
    }

    let amountStr = 'FREE';
    if (currentRoom.betVal > 0) {
      amountStr = gameResult === 'Победа' 
        ? `+${rewardChange.toFixed(2)} PKOIN` 
        : gameResult === 'Поражение' 
        ? `-${currentRoom.betVal.toFixed(2)} PKOIN` 
        : `0.00 PKOIN`;
    }

    const newEntry: MatchHistory = {
      id: Date.now(),
      player: isConnected ? 'Вы (Bastion)' : 'Вы (Игрок)',
      choice,
      result: gameResult,
      amount: amountStr,
      roomName: currentRoom.title,
    };

    setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fontStyle = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    letterSpacing: '-0.02em',
  };

  const TransactionHistoryList = ({ title = 'История транзакций' }: { title?: string }) => (
    <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '20px', border: '1px solid #1F2937' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#E5E7EB', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {history.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#0B0F19', borderRadius: '10px', fontSize: '13px', border: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>{choiceIcons[item.choice]}</span>
              <div>
                <span style={{ color: '#E5E7EB', fontWeight: '600', display: 'block' }}>{item.player}</span>
                <span style={{ color: '#6B7280', fontSize: '11px' }}>{item.roomName}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backgroundColor: item.result === 'Победа' ? '#065F46' : item.result === 'Поражение' ? '#7F1D1D' : '#374151', color: item.result === 'Победа' ? '#34D399' : item.result === 'Поражение' ? '#FCA5A5' : '#D1D5DB' }}>
                {item.result}
              </span>
              <span style={{ fontWeight: '700', minWidth: '90px', textAlign: 'right', color: item.amount.startsWith('+') ? '#10B981' : item.amount.startsWith('-') ? '#EF4444' : '#9CA3AF' }}>
                {item.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ ...fontStyle, padding: '24px', backgroundColor: '#0B0F19', color: '#F3F4F6', minHeight: '100vh', position: 'relative' }}>
      
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 99 }} />

      <style jsx global>{`
        @keyframes shakeLeft {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-25deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(-25deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes shakeRight {
          0% { transform: rotate(0deg) scaleX(-1); }
          25% { transform: rotate(-25deg) scaleX(-1); }
          50% { transform: rotate(0deg) scaleX(-1); }
          75% { transform: rotate(-25deg) scaleX(-1); }
          100% { transform: rotate(0deg) scaleX(-1); }
        }
        .animate-shake-left { animation: shakeLeft 0.4s infinite ease-in-out; }
        .animate-shake-right { animation: shakeRight 0.4s infinite ease-in-out; }

        @keyframes pulseDot {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .green-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          background-color: #10B981;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulseDot 1.5s infinite ease-in-out;
        }

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 640px) {
          .rooms-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid #1F2937', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0', fontWeight: '900', color: '#818CF8', letterSpacing: '-0.03em' }}>
              КНБ PKOIN
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9CA3AF' }}>Честные p2p дуэли в сети Pocketnet</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#111827', padding: '8px 16px', borderRadius: '12px', border: '1px solid #1F2937', textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '700' }}>Баланс PKOIN</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#10B981' }}>{pkoinBalance.toFixed(2)} 🪙</div>
            </div>

            <button 
              onClick={handleConnectWallet}
              style={{ 
                backgroundColor: isConnected ? '#065F46' : '#4F46E5', 
                border: 'none', 
                color: '#FFF', 
                padding: '10px 16px', 
                borderRadius: '12px', 
                fontSize: '13px', 
                fontWeight: '600', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isConnected ? `🔗 ${walletAddress}` : '🔗 Подключить Bastion'}
            </button>
          </div>
        </div>

        {activeRoom > 0 ? (
          <div>
            <button 
              onClick={() => setActiveRoom(0)} 
              style={{ color: '#818CF8', marginBottom: '20px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600' }}
            >
              ← Назад к выбору комнат
            </button>

            {/* ВНУТРИ КОМНАТЫ */}
            <div style={{ backgroundColor: '#111827', borderRadius: '16px', padding: '20px', border: '1px solid #1F2937', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: '0', fontSize: '20px', fontWeight: '700' }}>{currentRoom.title} — {currentRoom.desc}</h2>
                <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', backgroundColor: '#1F2937', color: '#FBBF24' }}>
                  Ставка: {currentRoom.price}
                </span>
              </div>

              <div style={{ backgroundColor: '#0B0F19', padding: '12px 16px', borderRadius: '12px', border: '1px solid #1F2937', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#9CA3AF' }}>
                    <span className="green-dot"></span>Игроков онлайн:
                  </span>
                  <strong style={{ color: '#10B981', fontWeight: '700' }}>
                    {roomStats[currentRoom.id]?.online || 1}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#9CA3AF' }}>🔥 Выигрыш при победе:</span>
                  <strong style={{ color: '#FBBF24', fontWeight: '800' }}>
                    {getWinAmount(currentRoom.betVal)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Блок ожидания */}
            {pendingBet && (
              <div style={{ backgroundColor: '#1E1B4B', padding: '20px', borderRadius: '16px', border: '1px solid #6366F1', marginBottom: '24px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#F3F4F6', fontSize: '16px' }}>⏳ Поиск второго игрока...</h3>
                <p style={{ margin: '0 0 16px 0', color: '#A5B4FC', fontSize: '13px' }}>
                  Ставка {pendingBet.betVal} PKOIN заблокирована в смарт-контракте.
                  <br />Если второй игрок не найдет за 24 часа, монеты автоматически вернутся.
                </p>

                <div style={{ fontSize: '24px', fontWeight: '900', color: '#FBBF24', marginBottom: '16px', fontFamily: 'monospace' }}>
                  Возврат через: {formatTime(timeLeft)}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    onClick={handleSimulateOpponent}
                    style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                  >
                    ⚡ Найти соперника сейчас (Демо)
                  </button>
                  <button 
                    onClick={() => handleCancelBet(false)}
                    style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                  >
                    ✖ Отменить и вернуть PKOIN
                  </button>
                </div>
              </div>
            )}

            {!pendingBet && (
              <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '20px', border: '1px solid #1F2937', textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#E5E7EB' }}>
                  {isProcessingTx 
                    ? (currentRoom.betVal === 0 ? '⏳ Подготовка...' : '⏳ Отправка ставки в смарт-контракт PKOIN...') 
                    : isPlaying 
                    ? 'Камень... Ножницы... Бумага!' 
                    : 'Сделайте ваш ход для входа в игру:'}
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
                  {choices.map((c) => (
                    <button 
                      key={c} 
                      disabled={isPlaying || isProcessingTx}
                      onClick={() => playGame(c)} 
                      style={{ 
                        flex: '1', 
                        padding: '16px 12px', 
                        fontSize: '32px', 
                        cursor: (isPlaying || isProcessingTx) ? 'not-allowed' : 'pointer', 
                        borderRadius: '16px', 
                        backgroundColor: (isPlaying || isProcessingTx) ? '#111827' : '#1F2937', 
                        border: '1px solid #374151', 
                        color: '#FFF',
                        opacity: (isPlaying || isProcessingTx) ? 0.4 : 1,
                      }}
                    >
                      <div>{choiceIcons[c]}</div>
                      <div style={{ fontSize: '12px', marginTop: '8px', color: '#D1D5DB' }}>{choiceNames[c]}</div>
                    </button>
                  ))}
                </div>

                {isPlaying && (
                  <div style={{ backgroundColor: '#0B0F19', padding: '24px', borderRadius: '16px', border: '1px solid #374151' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>Вы</div>
                        <div className="animate-shake-left" style={{ fontSize: '48px', display: 'inline-block' }}>✊</div>
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: '#818CF8' }}>{shakeCount}</div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>Соперник</div>
                        <div className="animate-shake-right" style={{ fontSize: '48px', display: 'inline-block' }}>✊</div>
                      </div>
                    </div>
                  </div>
                )}

                {!isPlaying && playerChoice && botChoice && (
                  <div style={{ backgroundColor: '#0B0F19', padding: '20px', borderRadius: '16px', border: '1px solid #374151' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Вы</div>
                        <div style={{ fontSize: '42px' }}>{choiceIcons[playerChoice]}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#6B7280' }}>VS</div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Соперник</div>
                        <div style={{ fontSize: '42px' }}>{choiceIcons[botChoice]}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: result?.includes('Победа') ? '#10B981' : result?.includes('Поражение') ? '#EF4444' : '#FBBF24' }}>
                      {result}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ИСТОРИЯ ТРАНЗАКЦИЙ ВНУТРИ КОМНАТЫ */}
            <TransactionHistoryList title="История транзакций комнаты" />

          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#E5E7EB', fontWeight: '700' }}>Выберите комнатный зал (10):</h2>

            {/* Сетка комнат */}
            <div className="rooms-grid" style={{ marginBottom: '32px' }}>
              {rooms.map((room) => {
                const stats = roomStats[room.id] || { online: 0, matches24h: 0, pool24h: 0 };

                return (
                  <div key={room.id} style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '16px', border: room.betVal === 0 ? '1px solid #10B981' : '1px solid #6366F1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backgroundColor: room.betVal === 0 ? '#064E3B' : '#065F46', color: '#34D399' }}>
                          {room.tag}
                        </span>

                        <span style={{ fontSize: '14px', fontWeight: '800', color: room.betVal === 0 ? '#34D399' : '#10B981' }}>
                          {room.price}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>{room.title}</h3>
                      <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#9CA3AF' }}>{room.desc}</p>

                      {/* Статистика комнаты */}
                      <div style={{ backgroundColor: '#0B0F19', padding: '10px 12px', borderRadius: '10px', border: '1px solid #1F2937', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#9CA3AF' }}>
                            <span className="green-dot"></span>Игроков онлайн:
                          </span>
                          <strong style={{ color: '#10B981', fontWeight: '700' }}>{stats.online}</strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#9CA3AF' }}>🔥 Выигрыш при победе:</span>
                          <strong style={{ color: '#FBBF24', fontWeight: '800' }}>
                            {getWinAmount(room.betVal)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div>
                      <button onClick={() => setActiveRoom(room.id)} style={{ backgroundColor: room.betVal === 0 ? '#059669' : '#4F46E5', color: '#FFF', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', width: '100%' }}>
                        {room.betVal === 0 ? 'Играть бесплатно' : 'Войти в комнату'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* ИСТОРИЯ ТРАНЗАКЦИЙ НА ГЛАВНОЙ СТРАНИЦЕ */}
            <TransactionHistoryList title="Общая история последних транзакций и игр" />

          </div>
        )}
      </div>
    </div>
  );
}