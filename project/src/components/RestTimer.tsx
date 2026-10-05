import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, X } from 'lucide-react';

interface RestTimerProps {
  seconds: number;
  onClose: () => void;
}

export function RestTimer({ seconds, onClose }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, remaining]);

  const pct = Math.max(0, (remaining / seconds) * 100);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - pct / 100);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;

  return (
    <div className="fixed inset-0 z-[60] bg-base-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-base-700 rounded-3xl p-8 w-full max-w-sm border border-base-500/50 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-200">Tempo de descanso</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#33334d" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="#00d2d3" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${remaining <= 5 && remaining > 0 ? 'text-error animate-tick' : 'text-accent'}`}>
              {display}
            </span>
            {remaining <= 0 && (
              <span className="text-sm text-success mt-1 font-medium">Descanso concluído!</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setRemaining(seconds)}
            className="w-12 h-12 rounded-full bg-base-600 flex items-center justify-center text-gray-400 hover:text-accent transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={() => setPaused(p => !p)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              paused ? 'bg-accent text-base-900 animate-pulse-glow' : 'bg-base-600 text-gray-300'
            }`}
          >
            {paused ? <Play size={28} /> : <Pause size={28} />}
          </button>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-base-600 flex items-center justify-center text-gray-400 hover:text-error transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
