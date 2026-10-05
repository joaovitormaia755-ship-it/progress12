export type WeekDay =
  | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const WEEK_DAYS: { value: WeekDay; label: string; short: string }[] = [
  { value: 'mon', label: 'Segunda-feira', short: 'Seg' },
  { value: 'tue', label: 'Terça-feira', short: 'Ter' },
  { value: 'wed', label: 'Quarta-feira', short: 'Qua' },
  { value: 'thu', label: 'Quinta-feira', short: 'Qui' },
  { value: 'fri', label: 'Sexta-feira', short: 'Sex' },
  { value: 'sat', label: 'Sábado', short: 'Sáb' },
  { value: 'sun', label: 'Domingo', short: 'Dom' },
];

export function todayWeekDay(): WeekDay {
  const idx = new Date().getDay(); // 0 = Sunday
  const map: WeekDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[idx];
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  muscleGroup: string;
  region: string;
  sets: number;
  reps: string; // e.g. "6-10" or "8-12"
  load: number; // target load in kg
  restSeconds: number; // rest between sets
  increment: number; // kg to add when progressing
}

export interface WorkoutTemplate {
  id: string;
  day: WeekDay;
  name: string;
  exercises: ExerciseTemplate[];
}

export interface LoggedSet {
  id: string;
  reps: number;
  load: number;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSet[];
  completed: boolean;
  swappedFrom?: string; // original exercise name if this was swapped from a reserve
}

export interface WorkoutSession {
  id: string;
  templateId: string;
  templateName: string;
  day: WeekDay;
  date: string; // ISO date string
  exercises: ExerciseLog[];
  completed: boolean;
}

export interface ActiveSession {
  templateId: string;
  templateName: string;
  day: WeekDay;
  exercises: ExerciseLog[];
  startedAt: number;
}

export interface AppData {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSession: ActiveSession | null;
  reserveExercises: ExerciseTemplate[];
}

// ─── Default data ──────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

interface RawExercise {
  name: string;
  group: string;
  region: string;
  sets: number;
  reps: string;
  load: number;
  rest: number;
  increment: number;
}

function buildExercise(r: RawExercise): ExerciseTemplate {
  return { id: uid(), name: r.name, muscleGroup: r.group, region: r.region, sets: r.sets, reps: r.reps, load: r.load, restSeconds: r.rest, increment: r.increment };
}

function defaultTemplates(): WorkoutTemplate[] {
  const push: RawExercise[] = [
    { name: 'Supino inclinado na máquina', group: 'Peito', region: 'Peito superior', sets: 2, reps: '6–10', load: 30, rest: 90, increment: 2.5 },
    { name: 'Chest press na máquina', group: 'Peito', region: 'Peito médio', sets: 2, reps: '6–10', load: 35, rest: 90, increment: 2.5 },
    { name: 'Crossover na polia', group: 'Peito', region: 'Adução e contração', sets: 2, reps: '8–12', load: 20, rest: 60, increment: 2.5 },
    { name: 'Elevação lateral', group: 'Ombros', region: 'Deltoide lateral', sets: 2, reps: '8–12', load: 8, rest: 60, increment: 1 },
    { name: 'Tríceps francês na polia', group: 'Tríceps', region: 'Cabeça longa', sets: 2, reps: '8–12', load: 20, rest: 60, increment: 2.5 },
    { name: 'Tríceps Carter unilateral com cotovelo apoiado', group: 'Tríceps', region: 'Extensão estável', sets: 2, reps: '8–12', load: 10, rest: 60, increment: 1 },
  ];

  const pull: RawExercise[] = [
    { name: 'Puxada alta na polia', group: 'Costas', region: 'Largura dorsal', sets: 2, reps: '6–10', load: 35, rest: 90, increment: 2.5 },
    { name: 'Puxada baixa', group: 'Costas', region: 'Extensão do ombro', sets: 2, reps: '8–12', load: 40, rest: 60, increment: 2.5 },
    { name: 'Remada na máquina', group: 'Costas', region: 'Romboides e trapézio médio', sets: 2, reps: '6–10', load: 35, rest: 90, increment: 2.5 },
    { name: 'Reverse pec deck', group: 'Ombros', region: 'Deltoide posterior', sets: 2, reps: '8–12', load: 25, rest: 60, increment: 2.5 },
    { name: 'Rosca direta na polia', group: 'Bíceps', region: 'Bíceps', sets: 2, reps: '8–12', load: 15, rest: 60, increment: 1 },
    { name: 'Rosca martelo na polia', group: 'Bíceps', region: 'Braquial e antebraço', sets: 2, reps: '8–12', load: 12, rest: 60, increment: 1 },
    { name: 'Rosca inversa na polia', group: 'Antebraços', region: 'Extensores', sets: 2, reps: '10–15', load: 10, rest: 45, increment: 1 },
  ];

  const legs: RawExercise[] = [
    { name: 'Hack squat', group: 'Quadríceps', region: 'Quadríceps e glúteos', sets: 2, reps: '6–10', load: 60, rest: 120, increment: 5 },
    { name: 'Cadeira extensora', group: 'Quadríceps', region: 'Quadríceps', sets: 2, reps: '8–12', load: 40, rest: 60, increment: 2.5 },
    { name: 'Cadeira flexora', group: 'Posteriores', region: 'Posteriores da coxa', sets: 2, reps: '8–12', load: 30, rest: 60, increment: 2.5 },
    { name: 'Elevação pélvica', group: 'Glúteos', region: 'Glúteo máximo', sets: 2, reps: '8–12', load: 40, rest: 90, increment: 2.5 },
    { name: 'Abdutora', group: 'Glúteos', region: 'Glúteo médio e mínimo', sets: 2, reps: '10–15', load: 30, rest: 45, increment: 2.5 },
    { name: 'Panturrilha em pé', group: 'Panturrilhas', region: 'Gastrocnêmio', sets: 2, reps: '8–12', load: 50, rest: 45, increment: 2.5 },
    { name: 'Panturrilha sentado', group: 'Panturrilhas', region: 'Sóleo', sets: 2, reps: '10–15', load: 40, rest: 45, increment: 2.5 },
    { name: 'Legpress 45', group: 'Pernas', region: 'Quadríceps', sets: 2, reps: '8–12', load: 100, rest: 90, increment: 5 },
  ];

  const upper: RawExercise[] = [
    { name: 'Supino inclinado na máquina', group: 'Peito', region: 'Peito superior', sets: 2, reps: '6–10', load: 30, rest: 90, increment: 2.5 },
    { name: 'Chest press na máquina', group: 'Peito', region: 'Peito médio', sets: 2, reps: '6–10', load: 35, rest: 90, increment: 2.5 },
    { name: 'Puxada alta na polia', group: 'Costas', region: 'Largura dorsal', sets: 2, reps: '6–10', load: 35, rest: 90, increment: 2.5 },
    { name: 'Remada na máquina', group: 'Costas', region: 'Romboides e trapézio médio', sets: 2, reps: '8–12', load: 35, rest: 60, increment: 2.5 },
    { name: 'Elevação lateral', group: 'Ombros', region: 'Deltoide lateral', sets: 2, reps: '8–12', load: 8, rest: 60, increment: 1 },
    { name: 'Reverse pec deck', group: 'Ombros', region: 'Deltoide posterior', sets: 2, reps: '8–12', load: 25, rest: 60, increment: 2.5 },
    { name: 'Encolhimento de ombros', group: 'Trapézio', region: 'Trapézio superior', sets: 2, reps: '10–15', load: 30, rest: 60, increment: 2.5 },
    { name: 'Rosca direta na polia', group: 'Bíceps', region: 'Bíceps', sets: 2, reps: '8–12', load: 15, rest: 60, increment: 1 },
    { name: 'Tríceps francês na polia', group: 'Tríceps', region: 'Cabeça longa', sets: 2, reps: '8–12', load: 20, rest: 60, increment: 2.5 },
    { name: 'Tríceps Carter unilateral com cotovelo apoiado', group: 'Tríceps', region: 'Extensão estável', sets: 2, reps: '8–12', load: 10, rest: 60, increment: 1 },
  ];

  const lower: RawExercise[] = [
    { name: 'Leg press 45°', group: 'Quadríceps', region: 'Quadríceps e glúteos', sets: 2, reps: '8–12', load: 80, rest: 90, increment: 5 },
    { name: 'Cadeira extensora', group: 'Quadríceps', region: 'Quadríceps', sets: 2, reps: '8–12', load: 40, rest: 60, increment: 2.5 },
    { name: 'Cadeira flexora', group: 'Posteriores', region: 'Posteriores da coxa', sets: 2, reps: '8–12', load: 30, rest: 60, increment: 2.5 },
    { name: 'Elevação pélvica', group: 'Glúteos', region: 'Glúteo máximo', sets: 2, reps: '8–12', load: 40, rest: 90, increment: 2.5 },
    { name: 'Adutora', group: 'Adutores', region: 'Parte interna da coxa', sets: 2, reps: '10–15', load: 25, rest: 45, increment: 2.5 },
    { name: 'Panturrilha em pé', group: 'Panturrilhas', region: 'Gastrocnêmio', sets: 2, reps: '8–12', load: 50, rest: 45, increment: 2.5 },
    { name: 'Panturrilha sentado', group: 'Panturrilhas', region: 'Sóleo', sets: 2, reps: '10–15', load: 40, rest: 45, increment: 2.5 },
    { name: 'Abdominal na máquina', group: 'Abdômen', region: 'Reto abdominal', sets: 2, reps: '10–15', load: 25, rest: 45, increment: 2.5 },
  ];

  const mk = (day: WeekDay, name: string, exs: RawExercise[]): WorkoutTemplate => ({
    id: uid(),
    day,
    name,
    exercises: exs.map(buildExercise),
  });

  return [
    mk('mon', 'PUSH', push),
    mk('tue', 'PULL', pull),
    mk('wed', 'LEGS', legs),
    mk('thu', 'UPPER', upper),
    mk('fri', 'LOWER', lower),
  ];
}

function defaultReserveExercises(): ExerciseTemplate[] {
  const reserves: RawExercise[] = [
    { name: 'Crucifixo na máquina', group: 'Peito', region: 'Peito médio', sets: 2, reps: '8–12', load: 25, rest: 60, increment: 2.5 },
    { name: 'Supino reto na máquina', group: 'Peito', region: 'Peito médio', sets: 2, reps: '6–10', load: 35, rest: 90, increment: 2.5 },
    { name: 'Desenvolvimento com halteres', group: 'Ombros', region: 'Deltoide anterior', sets: 2, reps: '8–12', load: 12, rest: 60, increment: 1 },
    { name: 'Tríceps testa', group: 'Tríceps', region: 'Cabeça longa', sets: 2, reps: '8–12', load: 15, rest: 60, increment: 2.5 },
    { name: 'Puxada na maquina', group: 'Costas', region: 'Largura dorsal', sets: 2, reps: '8–12', load: 35, rest: 60, increment: 2.5 },
    { name: 'Remada baixa na polia', group: 'Costas', region: 'Romboides e trapézio médio', sets: 2, reps: '8–12', load: 30, rest: 60, increment: 2.5 },
    { name: 'Rosca alternada', group: 'Bíceps', region: 'Bíceps', sets: 2, reps: '8–12', load: 10, rest: 60, increment: 1 },
    { name: 'Agachamento livre', group: 'Quadríceps', region: 'Quadríceps e glúteos', sets: 2, reps: '6–10', load: 50, rest: 120, increment: 5 },
    { name: 'Stiff', group: 'Posteriores', region: 'Posteriores da coxa', sets: 2, reps: '8–12', load: 30, rest: 90, increment: 2.5 },
    { name: 'Afundo', group: 'Quadríceps', region: 'Quadríceps e glúteos', sets: 2, reps: '8–12', load: 20, rest: 90, increment: 2.5 },
  ];
  return reserves.map(buildExercise);
}

export function defaultData(): AppData {
  return {
    templates: defaultTemplates(),
    sessions: [],
    activeSession: null,
    reserveExercises: defaultReserveExercises(),
  };
}

// ─── Rep range parsing ─────────────────────────────────────────

export function parseRepRange(reps: string): { min: number; max: number } {
  const m = reps.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) };
  const single = parseInt(reps);
  if (!isNaN(single)) return { min: single, max: single };
  return { min: 8, max: 12 };
}
