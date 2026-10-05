import { useMemo } from 'react';
import { Dumbbell, Play, ChevronRight, Calendar, Flame, History, TrendingUp } from 'lucide-react';
import { AppData, WorkoutTemplate, todayWeekDay, WEEK_DAYS, WeekDay } from '@/types';
import { getLastSessionForExercise, getProgressionSuggestion } from '@/progression';

interface TodayViewProps {
  data: AppData;
  onStartSession: (template: WorkoutTemplate) => void;
  onViewDay: (day: WeekDay) => void;
}

export function TodayView({ data, onStartSession, onViewDay }: TodayViewProps) {
  const today = todayWeekDay();
  const todayInfo = WEEK_DAYS.find(d => d.value === today)!;
  const template = data.templates.find(t => t.day === today);

  const totalExercises = template?.exercises.length ?? 0;
  const totalSets = template?.exercises.reduce((s, e) => s + e.sets, 0) ?? 0;

  const todayDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  }, []);

  // Count progression suggestions to increase
  const upCount = useMemo(() => {
    if (!template) return 0;
    return template.exercises.filter(ex => {
      const s = getProgressionSuggestion(data, ex);
      return s.type === 'up';
    }).length;
  }, [data, template]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
          <Calendar size={14} />
          <span>{todayInfo.label}</span>
          <span className="text-gray-600">·</span>
          <span>{todayDate}</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Treino do Dia</h1>
      </header>

      {/* Today's workout card */}
      {template ? (
        <div className="px-6 mb-6 animate-slide-up">
          <div className="bg-gradient-to-br from-base-700 to-base-600 rounded-3xl p-6 border border-base-500/30 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-accent text-xs font-semibold uppercase tracking-wider mb-1">Hoje</p>
                <h2 className="text-2xl font-bold text-white">{template.name}</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Dumbbell className="text-accent" size={24} />
              </div>
            </div>

            <div className="flex gap-4 mb-5">
              <div className="flex-1 bg-base-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{totalExercises}</p>
                <p className="text-xs text-gray-400">Exercícios</p>
              </div>
              <div className="flex-1 bg-base-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{totalSets}</p>
                <p className="text-xs text-gray-400">Séries</p>
              </div>
              {upCount > 0 && (
                <div className="flex-1 bg-accent/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-accent">{upCount}</p>
                  <p className="text-xs text-gray-400">Pra subir</p>
                </div>
              )}
            </div>

            <button
              onClick={() => onStartSession(template)}
              className="w-full bg-accent text-base-900 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-accent-600 transition-all active:scale-[0.98] animate-pulse-glow"
            >
              <Play size={20} fill="currentColor" />
              Começar Treino
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 mb-6 animate-slide-up">
          <div className="bg-base-700 rounded-3xl p-8 text-center border border-base-500/30">
            <div className="w-14 h-14 rounded-2xl bg-base-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="text-gray-500" size={28} />
            </div>
            <p className="text-gray-300 font-medium mb-1">Sem treino hoje</p>
            <p className="text-sm text-gray-500">Aproveite o descanso ou crie um treino para {todayInfo.label}.</p>
          </div>
        </div>
      )}

      {/* Exercise list preview */}
      {template && template.exercises.length > 0 && (
        <div className="px-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Exercícios</h3>
          <div className="space-y-2">
            {template.exercises.map((ex, i) => {
              const last = getLastSessionForExercise(data.sessions, ex.name);
              const suggestion = getProgressionSuggestion(data, ex);
              return (
                <div
                  key={ex.id}
                  className="bg-base-700/60 rounded-2xl p-4 border border-base-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-base-600 flex items-center justify-center text-sm font-bold text-gray-400 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{ex.name}</p>
                      <p className="text-sm text-gray-500">
                        {ex.muscleGroup && `${ex.muscleGroup} · `}
                        {ex.sets}x{ex.reps} · {ex.load}kg
                      </p>
                    </div>
                    {suggestion.type === 'up' && (
                      <div className="flex items-center gap-1 text-accent text-xs font-medium bg-accent/10 px-2 py-1 rounded-lg flex-shrink-0">
                        <TrendingUp size={12} />
                        {suggestion.nextLoad}kg
                      </div>
                    )}
                  </div>
                  {/* Last session */}
                  {last && (
                    <div className="flex items-center gap-1.5 mt-2 ml-12 text-xs text-gray-500">
                      <History size={12} className="text-gray-600" />
                      <span>
                        Última: <strong className="text-gray-300">{last.weight}kg × {last.reps}</strong>
                        {' · '}
                        {new Date(last.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week overview */}
      <div className="px-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Semana</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_DAYS.map(day => {
            const hasWorkout = data.templates.some(t => t.day === day.value);
            const isToday = day.value === today;
            return (
              <button
                key={day.value}
                onClick={() => onViewDay(day.value)}
                className={`flex flex-col items-center py-2.5 rounded-xl transition-all ${
                  isToday
                    ? 'bg-accent text-base-900'
                    : hasWorkout
                    ? 'bg-base-700 text-gray-200 border border-base-500/30'
                    : 'bg-base-800/50 text-gray-600'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{day.short}</span>
                <span className="mt-0.5">
                  {hasWorkout ? <Flame size={12} /> : <span className="w-3 h-3 inline-block" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
