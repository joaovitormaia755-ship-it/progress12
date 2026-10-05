import { useState } from 'react';
import {
  ArrowLeft, Check, Plus, Trash2, Timer, CheckCircle2, Circle,
  Dumbbell, Save, X, TrendingUp, History, ChevronDown, ChevronUp,
  MoreVertical, ArrowLeftRight, RotateCcw, Search
} from 'lucide-react';
import {
  WorkoutTemplate, ExerciseLog, LoggedSet, uid,
  WorkoutSession, ActiveSession, AppData, ExerciseTemplate
} from '@/types';
import { RestTimer } from '@/components/RestTimer';
import {
  getLastSessionForExercise, getProgressionSuggestion
} from '@/progression';

interface SessionViewProps {
  template: WorkoutTemplate;
  data: AppData;
  activeSession: ActiveSession;
  onUpdateActive: (session: ActiveSession) => void;
  onSave: (session: WorkoutSession) => void;
  onExit: () => void;
}

export function SessionView({ template, data, activeSession, onUpdateActive, onSave, onExit }: SessionViewProps) {
  const [exercises, setExercises] = useState<ExerciseLog[]>(
    activeSession.exercises ?? template.exercises.map(ex => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: [{ id: uid(), reps: 0, load: ex.load }],
      completed: false,
    }))
  );
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [swapMenuFor, setSwapMenuFor] = useState<number | null>(null);
  const [showSwapPicker, setShowSwapPicker] = useState<number | null>(null);
  const [swapSearch, setSwapSearch] = useState('');

  function syncExercises(next: ExerciseLog[]) {
    setExercises(next);
    onUpdateActive({ ...activeSession, exercises: next });
  }

  function addSet(exIdx: number, targetLoad: number) {
    syncExercises(exercises.map((ex, i) =>
      i === exIdx
        ? { ...ex, sets: [...ex.sets, { id: uid(), reps: 0, load: targetLoad }] }
        : ex
    ));
  }

  function removeSet(exIdx: number, setId: string) {
    syncExercises(exercises.map((ex, i) =>
      i === exIdx
        ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) }
        : ex
    ));
  }

  function updateSet(exIdx: number, setId: string, field: 'reps' | 'load', value: number) {
    syncExercises(exercises.map((ex, i) =>
      i === exIdx
        ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }
        : ex
    ));
  }

  function toggleComplete(exIdx: number) {
    syncExercises(exercises.map((ex, i) =>
      i === exIdx ? { ...ex, completed: !ex.completed } : ex
    ));
  }

  function swapExercise(exIdx: number, reserve: ExerciseTemplate) {
    const originalName = exercises[exIdx].exerciseName;
    const wasAlreadySwapped = exercises[exIdx].swappedFrom !== undefined;
    syncExercises(exercises.map((ex, i) =>
      i === exIdx
        ? {
            ...ex,
            exerciseName: reserve.name,
            swappedFrom: wasAlreadySwapped ? ex.swappedFrom : originalName,
            sets: [{ id: uid(), reps: 0, load: reserve.load }],
          }
        : ex
    ));
    setSwapMenuFor(null);
    setShowSwapPicker(null);
    setSwapSearch('');
  }

  function revertSwap(exIdx: number) {
    const originalName = exercises[exIdx].swappedFrom;
    if (!originalName) return;
    const originalTmpl = template.exercises.find(t => t.name === originalName);
    syncExercises(exercises.map((ex, i) =>
      i === exIdx
        ? {
            ...ex,
            exerciseName: originalName,
            swappedFrom: undefined,
            sets: [{ id: uid(), reps: 0, load: originalTmpl?.load ?? 0 }],
          }
        : ex
    ));
    setSwapMenuFor(null);
  }

  function finishWorkout() {
    const session: WorkoutSession = {
      id: uid(),
      templateId: template.id,
      templateName: template.name,
      day: template.day,
      date: new Date().toISOString(),
      exercises,
      completed: true,
    };
    onSave(session);
  }

  const completedCount = exercises.filter(e => e.completed).length;
  const allCompleted = completedCount === exercises.length;
  const restOptions = [30, 60, 90, 120];

  const filteredReserves = data.reserveExercises.filter(r =>
    r.name.toLowerCase().includes(swapSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-base-800/95 backdrop-blur-md border-b border-base-500/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowConfirmExit(true)}
            className="w-10 h-10 rounded-xl bg-base-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center flex-1 mx-3">
            <h1 className="font-bold text-white truncate">{template.name}</h1>
            <p className="text-xs text-gray-500">{completedCount}/{exercises.length} concluídos</p>
          </div>
          <button
            onClick={finishWorkout}
            className={`px-4 h-10 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
              allCompleted
                ? 'bg-success text-white'
                : 'bg-accent text-base-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Save size={16} />
              Salvar
            </span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-base-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / Math.max(1, exercises.length)) * 100}%` }}
          />
        </div>
      </header>

      {/* Exercises */}
      <div className="px-4 py-4 space-y-4">
        {exercises.map((ex, exIdx) => {
          const tmpl = template.exercises.find(t => t.id === ex.exerciseId);
          const targetSets = tmpl?.sets ?? 0;
          const targetReps = tmpl?.reps ?? '';
          const targetLoad = tmpl?.load ?? 0;
          const increment = tmpl?.increment ?? 2.5;
          const isSwapped = ex.swappedFrom !== undefined;

          const lastSession = tmpl ? getLastSessionForExercise(data.sessions, tmpl.name) : null;
          const suggestion = tmpl ? getProgressionSuggestion(data, tmpl) : null;
          const isExpanded = expandedSuggestion === ex.exerciseId;

          return (
            <div
              key={ex.exerciseId}
              className={`bg-base-700/60 rounded-2xl border transition-all overflow-hidden relative ${
                ex.completed ? 'border-success/40 bg-success/5' : isSwapped ? 'border-accent/30' : 'border-base-500/20'
              }`}
            >
              {/* Exercise header */}
              <div className="p-4 flex items-start gap-3">
                <button
                  onClick={() => toggleComplete(exIdx)}
                  className={`mt-0.5 transition-colors ${ex.completed ? 'text-success' : 'text-gray-500'}`}
                >
                  {ex.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${ex.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                    {ex.exerciseName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {tmpl?.muscleGroup && `${tmpl.muscleGroup} · `}
                    {targetSets}x{targetReps} · {targetLoad}kg
                  </p>
                  {isSwapped && (
                    <p className="text-[10px] text-accent/70 mt-0.5 flex items-center gap-1">
                      <ArrowLeftRight size={10} />
                      Trocado de: {ex.swappedFrom}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setRestTimer(tmpl?.restSeconds ?? 60)}
                  className="w-9 h-9 rounded-lg bg-base-600 flex items-center justify-center text-gray-400 hover:text-accent transition-colors"
                >
                  <Timer size={18} />
                </button>
                <button
                  onClick={() => setSwapMenuFor(swapMenuFor === exIdx ? null : exIdx)}
                  className="w-9 h-9 rounded-lg bg-base-600 flex items-center justify-center text-gray-400 hover:text-accent transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Swap dropdown menu */}
              {swapMenuFor === exIdx && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSwapMenuFor(null)} />
                  <div className="absolute right-4 top-16 z-40 bg-base-700 rounded-xl border border-base-500/40 shadow-xl py-1 w-44 animate-fade-in">
                    <button
                      onClick={() => { setShowSwapPicker(exIdx); setSwapMenuFor(null); setSwapSearch(''); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-base-600 transition-colors text-left"
                    >
                      <ArrowLeftRight size={16} className="text-gray-400" />
                      Trocar exercício
                    </button>
                    {isSwapped && (
                      <button
                        onClick={() => revertSwap(exIdx)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-base-600 transition-colors text-left"
                      >
                        <RotateCcw size={16} className="text-gray-400" />
                        Reverter troca
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Last session info */}
              {lastSession && (
                <div className="mx-4 mb-3 flex items-center gap-2 bg-base-800/40 rounded-lg px-3 py-2 text-xs text-gray-400">
                  <History size={14} className="text-gray-500" />
                  <span>
                    Última: <strong className="text-gray-200">{lastSession.weight}kg × {lastSession.reps}</strong>
                    {' '}
                    <span className="text-gray-600">
                      · {new Date(lastSession.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </span>
                </div>
              )}

              {/* Progression suggestion */}
              {suggestion && !ex.completed && (
                <div
                  className={`mx-4 mb-3 rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                    suggestion.type === 'up'
                      ? 'bg-accent/10 border border-accent/30'
                      : suggestion.type === 'hold'
                      ? 'bg-base-800/50 border border-base-500/20'
                      : 'bg-base-800/30 border border-base-500/10'
                  }`}
                  onClick={() => setExpandedSuggestion(isExpanded ? null : ex.exerciseId)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TrendingUp
                        size={14}
                        className={suggestion.type === 'up' ? 'text-accent' : 'text-gray-500'}
                      />
                      <span className={`text-xs font-semibold truncate ${
                        suggestion.type === 'up' ? 'text-accent' : 'text-gray-300'
                      }`}>
                        {suggestion.title}
                      </span>
                    </div>
                    {isExpanded
                      ? <ChevronUp size={14} className="text-gray-500 flex-shrink-0" />
                      : <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
                    }
                  </div>
                  {isExpanded && (
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed animate-fade-in">
                      {suggestion.text}
                      {suggestion.nextLoad && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addSet(exIdx, suggestion.nextLoad!);
                          }}
                          className="mt-2 block w-full py-1.5 rounded-lg bg-accent text-base-900 text-xs font-semibold"
                        >
                          Usar {suggestion.nextLoad}kg na próxima série
                        </button>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Set rows */}
              <div className="px-4 pb-3">
                {/* Column headers */}
                <div className="grid grid-cols-[28px_1fr_1fr_36px] gap-2 px-1 mb-1.5">
                  <span className="text-[10px] text-gray-600 font-semibold uppercase">Set</span>
                  <span className="text-[10px] text-gray-600 font-semibold uppercase text-center">Reps</span>
                  <span className="text-[10px] text-gray-600 font-semibold uppercase text-center">Kg</span>
                  <span></span>
                </div>

                <div className="space-y-1.5">
                  {ex.sets.map((set, setIdx) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-[28px_1fr_1fr_36px] gap-2 items-center animate-fade-in"
                    >
                      <span className="text-sm font-bold text-gray-500 text-center">{setIdx + 1}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps || ''}
                        placeholder="0"
                        onChange={e => updateSet(exIdx, set.id, 'reps', Number(e.target.value))}
                        className="w-full bg-base-800 rounded-lg py-2 text-center text-white font-medium text-sm border border-base-500/30 focus:border-accent focus:outline-none transition-colors"
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        value={set.load || ''}
                        placeholder="0"
                        onChange={e => updateSet(exIdx, set.id, 'load', Number(e.target.value))}
                        className="w-full bg-base-800 rounded-lg py-2 text-center text-white font-medium text-sm border border-base-500/30 focus:border-accent focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => removeSet(exIdx, set.id)}
                        disabled={ex.sets.length <= 1}
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-error disabled:opacity-30 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick adjust + add set */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <button
                    onClick={() => addSet(exIdx, targetLoad)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-base-800 text-gray-400 hover:text-accent hover:bg-base-600 transition-colors text-sm font-medium border border-dashed border-base-500/40"
                  >
                    <Plus size={16} />
                    Série
                  </button>
                  <button
                    onClick={() => updateSet(exIdx, ex.sets[ex.sets.length - 1].id, 'load', Math.max(0, ex.sets[ex.sets.length - 1].load - increment))}
                    className="px-2.5 py-2 rounded-lg bg-base-800 text-xs font-medium text-gray-400 hover:text-accent border border-base-500/30 transition-colors"
                  >
                    −{increment}kg
                  </button>
                  <button
                    onClick={() => updateSet(exIdx, ex.sets[ex.sets.length - 1].id, 'load', ex.sets[ex.sets.length - 1].load + increment)}
                    className="px-2.5 py-2 rounded-lg bg-base-800 text-xs font-medium text-gray-400 hover:text-accent border border-base-500/30 transition-colors"
                  >
                    +{increment}kg
                  </button>
                  <button
                    onClick={() => updateSet(exIdx, ex.sets[ex.sets.length - 1].id, 'reps', Math.max(0, ex.sets[ex.sets.length - 1].reps - 1))}
                    className="px-2.5 py-2 rounded-lg bg-base-800 text-xs font-medium text-gray-400 hover:text-accent border border-base-500/30 transition-colors"
                  >
                    −1 rep
                  </button>
                  <button
                    onClick={() => updateSet(exIdx, ex.sets[ex.sets.length - 1].id, 'reps', ex.sets[ex.sets.length - 1].reps + 1)}
                    className="px-2.5 py-2 rounded-lg bg-base-800 text-xs font-medium text-gray-400 hover:text-accent border border-base-500/30 transition-colors"
                  >
                    +1 rep
                  </button>
                </div>

                {/* Rest timer buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {restOptions.map(sec => (
                    <button
                      key={sec}
                      onClick={() => setRestTimer(sec)}
                      className="px-2.5 py-1.5 rounded-lg bg-base-800 text-xs font-medium text-gray-400 hover:text-accent border border-base-500/30 transition-colors flex items-center gap-1"
                    >
                      <Timer size={12} />
                      {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {exercises.length === 0 && (
          <div className="text-center py-16">
            <Dumbbell className="mx-auto text-gray-600 mb-3" size={48} />
            <p className="text-gray-500">Este treino não tem exercícios.</p>
          </div>
        )}
      </div>

      {/* Bottom finish bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-base-700/95 backdrop-blur-md border-t border-base-500/30 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <button
          onClick={finishWorkout}
          className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            allCompleted
              ? 'bg-success text-white'
              : 'bg-accent text-base-900'
          }`}
        >
          <Check size={20} />
          {allCompleted ? 'Treino Concluído!' : 'Finalizar Treino'}
        </button>
      </div>

      {/* Rest timer overlay */}
      {restTimer !== null && (
        <RestTimer seconds={restTimer} onClose={() => setRestTimer(null)} />
      )}

      {/* Swap picker modal */}
      {showSwapPicker !== null && (
        <div className="fixed inset-0 z-[60] bg-base-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
          <div className="bg-base-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col border border-base-500/40">
            <div className="flex justify-between items-center p-4 border-b border-base-500/30">
              <h3 className="font-semibold text-white">Trocar exercício</h3>
              <button onClick={() => { setShowSwapPicker(null); setSwapSearch(''); }} className="text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-base-500/30">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={swapSearch}
                  onChange={e => setSwapSearch(e.target.value)}
                  placeholder="Buscar exercício reserva..."
                  autoFocus
                  className="w-full bg-base-800 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm border border-base-500/30 focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 no-scrollbar">
              {filteredReserves.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  Nenhum exercício reserva encontrado.
                </div>
              ) : (
                filteredReserves.map(reserve => (
                  <button
                    key={reserve.id}
                    onClick={() => swapExercise(showSwapPicker, reserve)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-600 transition-colors text-left border-b border-base-500/10"
                  >
                    <div className="w-9 h-9 rounded-lg bg-base-600 flex items-center justify-center flex-shrink-0">
                      <Dumbbell size={16} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{reserve.name}</p>
                      <p className="text-xs text-gray-500">
                        {reserve.muscleGroup} · {reserve.sets}x{reserve.reps} · {reserve.load}kg
                      </p>
                    </div>
                    <ArrowLeftRight size={16} className="text-gray-500 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exit confirmation */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-[60] bg-base-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-base-700 rounded-2xl p-6 w-full max-w-xs border border-base-500/40">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Sair do treino?</h3>
              <button onClick={() => setShowConfirmExit(false)} className="text-gray-500">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-5">O treino em andamento será salvo. Você pode continuar depois.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="flex-1 py-2.5 rounded-xl bg-base-600 text-gray-300 font-medium text-sm"
              >
                Continuar
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl bg-base-600 text-accent font-medium text-sm border border-accent/30"
              >
                Salvar e Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
