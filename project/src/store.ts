import { useEffect, useState, useCallback } from 'react';
import { AppData, defaultData, ExerciseTemplate } from '@/types';
import { BACKUP_DATA } from '@/backupData';
import { importBackupSessions } from '@/backupImport';

const STORAGE_KEY = 'gymtrack-data-v3';
const IMPORTED_FLAG = 'gymtrack-backup-imported';

function migrateOldExercise(ex: Partial<ExerciseTemplate>): ExerciseTemplate {
  return {
    id: ex.id ?? '',
    name: ex.name ?? '',
    muscleGroup: ex.muscleGroup ?? '',
    region: ex.region ?? '',
    sets: ex.sets ?? 3,
    reps: ex.reps ?? '8-12',
    load: ex.load ?? 0,
    restSeconds: ex.restSeconds ?? 60,
    increment: ex.increment ?? 2.5,
  };
}

function loadData(): AppData {
  const base = defaultData();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First load — import backup sessions
      const imported = importBackupSessions(
        BACKUP_DATA as never,
        base.templates.map(t => ({ id: t.id, name: t.name }))
      );
      const data: AppData = { ...base, sessions: imported };
      localStorage.setItem(IMPORTED_FLAG, '1');
      return data;
    }

    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (!parsed.templates || !parsed.sessions) return base;

    const templates = parsed.templates.map(t => ({
      ...t,
      exercises: t.exercises.map(migrateOldExercise),
    }));

    return {
      templates,
      sessions: parsed.sessions,
      activeSession: parsed.activeSession ?? null,
      reserveExercises: parsed.reserveExercises ?? base.reserveExercises,
    };
  } catch {
    return base;
  }
}

function saveData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function useStore() {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData(prev => fn(prev));
  }, []);

  return { data, setData, update };
}
