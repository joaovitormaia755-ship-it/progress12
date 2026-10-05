import { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Dumbbell, ChevronDown, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { AppData, WorkoutSession, parseRepRange } from '@/types';
import { getProgressionSuggestion } from '@/progression';

interface HistoryViewProps {
  data: AppData;
}

export function HistoryView({ data }: HistoryViewProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showExPicker, setShowExPicker] = useState(false);

  const sortedSessions = useMemo(
    () => [...data.sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [data.sessions]
  );

  // Gather all unique exercise names
  const allExercises = useMemo(() => {
    const names = new Set<string>();
    data.sessions.forEach(s => s.exercises.forEach(e => names.add(e.exerciseName)));
    return Array.from(names).sort();
  }, [data.sessions]);

  // Load progression data for selected exercise (last 8 weeks)
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];
    const eightWeeksAgo = Date.now() - 8 * 7 * 24 * 60 * 60 * 1000;

    const points = data.sessions
      .filter(s => new Date(s.date).getTime() >= eightWeeksAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(s => {
        const ex = s.exercises.find(e => e.exerciseName === selectedExercise);
        if (!ex || ex.sets.length === 0) return null;
        const maxLoad = Math.max(...ex.sets.map(set => set.load));
        const date = new Date(s.date);
        return { date, maxLoad, session: s };
      })
      .filter((p): p is { date: Date; maxLoad: number; session: WorkoutSession } => p !== null);

    return points;
  }, [data.sessions, selectedExercise]);

  // Compare current vs previous
  const comparison = useMemo(() => {
    if (chartData.length < 2) return null;
    const current = chartData[chartData.length - 1].maxLoad;
    const previous = chartData[chartData.length - 2].maxLoad;
    const diff = current - previous;
    const pct = previous > 0 ? (diff / previous) * 100 : 0;
    return { current, previous, diff, pct };
  }, [chartData]);

  // Chart dimensions
  const chartW = 320;
  const chartH = 160;
  const padLeft = 36;
  const padBottom = 24;
  const padTop = 12;
  const padRight = 12;

  const chartPoints = useMemo(() => {
    if (chartData.length === 0) return { path: '', points: [] as { x: number; y: number; load: number; date: Date }[] };
    const loads = chartData.map(d => d.maxLoad);
    const maxLoad = Math.max(...loads, 1);
    const minLoad = Math.min(...loads, 0);
    const range = Math.max(maxLoad - minLoad, 1);

    const innerW = chartW - padLeft - padRight;
    const innerH = chartH - padTop - padBottom;

    const pts = chartData.map((d, i) => {
      const x = padLeft + (chartData.length === 1 ? innerW / 2 : (i / (chartData.length - 1)) * innerW);
      const y = padTop + innerH - ((d.maxLoad - minLoad) / range) * innerH;
      return { x, y, load: d.maxLoad, date: d.date };
    });

    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return { path, points: pts };
  }, [chartData]);

  const yMax = chartData.length > 0 ? Math.max(...chartData.map(d => d.maxLoad), 1) : 1;
  const yMin = chartData.length > 0 ? Math.min(...chartData.map(d => d.maxLoad), 0) : 0;

  return (
    <div className="min-h-screen pb-24">
      <header className="px-6 pt-12 pb-4">
        <h1 className="text-3xl font-bold text-white">Histórico</h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhe sua evolução</p>
      </header>

      {data.sessions.length === 0 ? (
        <div className="px-6 mt-8">
          <div className="bg-base-700/60 rounded-3xl p-8 text-center border border-base-500/20">
            <div className="w-14 h-14 rounded-2xl bg-base-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="text-gray-500" size={28} />
            </div>
            <p className="text-gray-300 font-medium mb-1">Nenhum treino registrado</p>
            <p className="text-sm text-gray-500">Conclua um treino para ver seu histórico aqui.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Progress chart card */}
          <div className="px-6 mb-6">
            <div className="bg-base-700/60 rounded-2xl p-5 border border-base-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-accent" />
                  <h3 className="font-semibold text-white">Evolução de carga</h3>
                </div>
                <button
                  onClick={() => setShowExPicker(v => !v)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors bg-base-800 rounded-lg px-3 py-1.5"
                >
                  <span className="max-w-[120px] truncate">{selectedExercise ?? 'Escolher'}</span>
                  <ChevronDown size={14} />
                </button>
              </div>

              {showExPicker && (
                <div className="mb-4 max-h-44 overflow-y-auto bg-base-800 rounded-xl border border-base-500/20 animate-fade-in no-scrollbar">
                  {allExercises.map(name => (
                    <button
                      key={name}
                      onClick={() => { setSelectedExercise(name); setShowExPicker(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-base-600 ${
                        selectedExercise === name ? 'text-accent font-medium' : 'text-gray-300'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {!selectedExercise ? (
                <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
                  Selecione um exercício para ver o gráfico
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
                  Sem dados nas últimas 8 semanas
                </div>
              ) : (
                <>
                  {/* Progression suggestion */}
                  {(() => {
                    const tmpl = data.templates.flatMap(t => t.exercises).find(e => e.name === selectedExercise);
                    if (!tmpl) return null;
                    const sug = getProgressionSuggestion(data, tmpl);
                    return (
                      <div className={`mb-3 rounded-xl px-3 py-2.5 text-sm ${
                        sug.type === 'up'
                          ? 'bg-accent/10 border border-accent/30'
                          : 'bg-base-800/50 border border-base-500/20'
                      }`}>
                        <span className={`font-semibold ${sug.type === 'up' ? 'text-accent' : 'text-gray-300'}`}>
                          {sug.title}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{sug.text}</p>
                      </div>
                    );
                  })()}

                  {/* Comparison badges */}
                  {comparison && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-base-800 rounded-xl px-3 py-2 flex-1">
                        <p className="text-[10px] text-gray-500 uppercase">Atual</p>
                        <p className="text-lg font-bold text-white">{comparison.current}kg</p>
                      </div>
                      <div className="bg-base-800 rounded-xl px-3 py-2 flex-1">
                        <p className="text-[10px] text-gray-500 uppercase">Anterior</p>
                        <p className="text-lg font-bold text-gray-400">{comparison.previous}kg</p>
                      </div>
                      <div className={`rounded-xl px-3 py-2 flex-1 ${
                        comparison.diff > 0 ? 'bg-success/10' : comparison.diff < 0 ? 'bg-error/10' : 'bg-base-800'
                      }`}>
                        <p className="text-[10px] text-gray-500 uppercase">Diferença</p>
                        <p className={`text-lg font-bold flex items-center gap-1 ${
                          comparison.diff > 0 ? 'text-success' : comparison.diff < 0 ? 'text-error' : 'text-gray-400'
                        }`}>
                          {comparison.diff > 0 ? <ArrowUp size={16} /> : comparison.diff < 0 ? <ArrowDown size={16} /> : <Minus size={16} />}
                          {comparison.diff > 0 ? '+' : ''}{comparison.diff}kg
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SVG Chart */}
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Grid lines */}
                    {[0, 0.5, 1].map(frac => {
                      const y = padTop + (chartH - padTop - padBottom) * frac;
                      const val = Math.round(yMax - (yMax - yMin) * frac);
                      return (
                        <g key={frac}>
                          <line x1={padLeft} y1={y} x2={chartW - padRight} y2={y}
                            stroke="#33334d" strokeWidth="0.5" strokeDasharray="2 3" />
                          <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="8" fill="#666">
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area fill */}
                    {chartPoints.path && (
                      <>
                        <path
                          d={`${chartPoints.path} L ${chartPoints.points[chartPoints.points.length - 1].x.toFixed(1)} ${chartH - padBottom} L ${chartPoints.points[0].x.toFixed(1)} ${chartH - padBottom} Z`}
                          fill="url(#chartGradient)"
                          opacity="0.2"
                        />
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00d2d3" />
                            <stop offset="100%" stopColor="#00d2d3" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Line */}
                        <path
                          d={chartPoints.path}
                          fill="none"
                          stroke="#00d2d3"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Data points */}
                        {chartPoints.points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill="#00d2d3" />
                            <circle cx={p.x} cy={p.y} r="6" fill="#00d2d3" opacity="0.15" />
                            <text x={p.x} y={chartH - 8} textAnchor="middle" fontSize="7" fill="#666">
                              {p.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </text>
                          </g>
                        ))}
                      </>
                    )}
                  </svg>
                </>
              )}
            </div>
          </div>

          {/* Session list */}
          <div className="px-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Treinos ({sortedSessions.length})
            </h3>
            <div className="space-y-2">
              {sortedSessions.map(session => {
                const date = new Date(session.date);
                const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0);
                const completedEx = session.exercises.filter(e => e.completed).length;

                return (
                  <div
                    key={session.id}
                    className="bg-base-700/60 rounded-2xl p-4 border border-base-500/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white">{session.templateName}</p>
                        <p className="text-xs text-gray-500">
                          {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} · {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {session.completed && (
                        <span className="text-success text-xs font-medium bg-success/10 px-2 py-0.5 rounded-full">
                          Concluído
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Dumbbell size={12} /> {session.exercises.length} exercícios
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {totalSets} séries
                      </span>
                      <span>{completedEx}/{session.exercises.length} concluídos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
