import {
  WorkoutSession, ExerciseLog, LoggedSet, WeekDay, uid
} from '@/types';

interface BackupSet {
  exerciseIndex: number;
  exercise: string;
  weight: number;
  reps: number;
  rir: number | null;
  timestamp: number;
}

interface BackupLog {
  id: number;
  date: string;
  workout: string;
  sets: BackupSet[];
  duration: number;
}

interface BackupData {
  workouts: Record<string, [string, string, string, number, string][]>;
  logs: BackupLog[];
}

const WORKOUT_DAY_MAP: Record<string, WeekDay> = {
  PUSH: 'mon',
  PULL: 'tue',
  LEGS: 'wed',
  UPPER: 'thu',
  LOWER: 'fri',
};

export function importBackupSessions(
  backup: BackupData,
  templates: { id: string; name: string }[]
): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];

  for (const log of backup.logs) {
    const template = templates.find(t => t.name === log.workout);
    const day = WORKOUT_DAY_MAP[log.workout] ?? 'mon';

    // Group sets by exercise name
    const byExercise = new Map<string, BackupSet[]>();
    for (const set of log.sets) {
      const arr = byExercise.get(set.exercise) ?? [];
      arr.push(set);
      byExercise.set(set.exercise, arr);
    }

    const exercises: ExerciseLog[] = [];
    for (const [exerciseName, sets] of byExercise) {
      const loggedSets: LoggedSet[] = sets.map(s => ({
        id: uid(),
        reps: s.reps,
        load: s.weight,
      }));
      exercises.push({
        exerciseId: uid(),
        exerciseName,
        sets: loggedSets,
        completed: true,
      });
    }

    sessions.push({
      id: String(log.id),
      templateId: template?.id ?? uid(),
      templateName: log.workout,
      day,
      date: log.date,
      exercises,
      completed: true,
    });
  }

  return sessions;
}

export function parseBackup(jsonString: string): BackupData | null {
  try {
    const parsed = JSON.parse(jsonString) as BackupData;
    if (!parsed.workouts || !parsed.logs) return null;
    return parsed;
  } catch {
    return null;
  }
}
