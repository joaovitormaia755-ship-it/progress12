import { AppData, ExerciseTemplate, WorkoutSession, parseRepRange, ExerciseLog } from '@/types';

export interface LastSetInfo {
  weight: number;
  reps: number;
  date: string;
}

export function getLastSessionForExercise(
  sessions: WorkoutSession[],
  exerciseName: string
): LastSetInfo | null {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const s of sorted) {
    const ex = s.exercises.find(e => e.exerciseName === exerciseName);
    if (ex && ex.sets.length > 0) {
      const bestSet = ex.sets.reduce((best, set) =>
        set.load > best.load ? set : best
      , ex.sets[0]);
      return { weight: bestSet.load, reps: bestSet.reps, date: s.date };
    }
  }
  return null;
}

export interface ProgressionSuggestion {
  type: 'up' | 'hold' | 'start';
  title: string;
  text: string;
  nextLoad?: number;
}

export function getProgressionSuggestion(
  data: AppData,
  template: ExerciseTemplate
): ProgressionSuggestion {
  const { min, max } = parseRepRange(template.reps);

  // Find recent sessions for this exercise (last 3)
  const recentSessions = [...data.sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map(s => {
      const ex = s.exercises.find(e => e.exerciseName === template.name);
      return ex ? { session: s, ex } : null;
    })
    .filter((x): x is { session: WorkoutSession; ex: ExerciseLog } => x !== null);

  if (recentSessions.length === 0) {
    return {
      type: 'start',
      title: 'Primeira referência',
      text: `Registre suas séries com ${min}–${max} reps. O app vai sugerir quando aumentar a carga.`,
    };
  }

  const lastSession = recentSessions[0];
  const lastSets = lastSession.ex.sets.filter(s => s.reps > 0 && s.load > 0);
  if (lastSets.length === 0) {
    return {
      type: 'start',
      title: 'Primeira referência',
      text: `Registre suas séries com ${min}–${max} reps. O app vai sugerir quando aumentar a carga.`,
    };
  }

  const currentWeight = Math.max(...lastSets.map(s => s.load));
  const topReps = Math.max(...lastSets.map(s => s.reps));
  const reachedTop = lastSets.filter(s => s.reps >= max).length;
  const topRate = reachedTop / lastSets.length;

  // If 75%+ of sets reached the top of the rep range → suggest increasing load
  if (topRate >= 0.75) {
    const nextLoad = roundToIncrement(currentWeight + template.increment, template.increment);
    return {
      type: 'up',
      title: `Aumentar para ${nextLoad} kg`,
      text: `Na última sessão, ${Math.round(topRate * 100)}% das séries chegaram a ${max} reps com ${currentWeight} kg. Suba a carga e volte para perto de ${min} reps.`,
      nextLoad,
    };
  }

  // If most sets are in range but not at the top → hold and try to reach more reps
  const inRange = lastSets.filter(s => s.reps >= min && s.reps <= max).length;
  const inRangeRate = inRange / lastSets.length;

  if (inRangeRate >= 0.5) {
    return {
      type: 'hold',
      title: `Mantenha ${currentWeight} kg`,
      text: `Tente chegar a ${max} reps na maioria das séries. Quando conseguir, o app vai sugerir aumentar a carga.`,
    };
  }

  // Below range
  return {
    type: 'hold',
    title: `Mantenha ${currentWeight} kg`,
    text: `Ainda não atingiu a faixa de ${min}–${max} reps. Foque em ganhar repetições mantendo a execução.`,
  };
}

function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}
