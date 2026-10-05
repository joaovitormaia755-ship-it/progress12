import { useState } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X,
  Dumbbell, GripVertical, Save, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  AppData, WorkoutTemplate, ExerciseTemplate, WeekDay,
  WEEK_DAYS, uid, todayWeekDay
} from '@/types';
import { getLastSessionForExercise, getProgressionSuggestion } from '@/progression';

interface ManageViewProps {
  data: AppData;
  onUpdate: (fn: (prev: AppData) => AppData) => void;
}

export function ManageView({ data, onUpdate }: ManageViewProps) {
  const [expandedDay, setExpandedDay] = useState<WeekDay | null>(todayWeekDay());
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState<string | null>(null);
  const [newEx, setNewEx] = useState({
    name: '', group: '', region: '', sets: '2', reps: '8-12', load: '20', rest: '60', increment: '2.5',
  });

  function toggleDay(day: WeekDay) {
    setExpandedDay(prev => prev === day ? null : day);
  }

  function createTemplate(day: WeekDay) {
    const template: WorkoutTemplate = {
      id: uid(),
      day,
      name: 'Novo Treino',
      exercises: [],
    };
    onUpdate(prev => ({ ...prev, templates: [...prev.templates, template] }));
    setExpandedDay(day);
    setEditingTemplate(template.id);
    setEditName('Novo Treino');
  }

  function deleteTemplate(id: string) {
    onUpdate(prev => ({
      ...prev,
      templates: prev.templates.filter(t => t.id !== id),
    }));
  }

  function saveTemplateName(id: string) {
    const name = editName.trim() || 'Treino';
    onUpdate(prev => ({
      ...prev,
      templates: prev.templates.map(t => t.id === id ? { ...t, name } : t),
    }));
    setEditingTemplate(null);
  }

  function addExercise(templateId: string) {
    const ex: ExerciseTemplate = {
      id: uid(),
      name: newEx.name.trim() || 'Exercício',
      muscleGroup: newEx.group.trim(),
      region: newEx.region.trim(),
      sets: Math.max(1, parseInt(newEx.sets) || 2),
      reps: newEx.reps.trim() || '8-12',
      load: Math.max(0, parseFloat(newEx.load) || 0),
      restSeconds: parseInt(newEx.rest) || 60,
      increment: Math.max(0.5, parseFloat(newEx.increment) || 2.5),
    };
    onUpdate(prev => ({
      ...prev,
      templates: prev.templates.map(t =>
        t.id === templateId ? { ...t, exercises: [...t.exercises, ex] } : t
      ),
    }));
    setNewEx({ name: '', group: '', region: '', sets: '2', reps: '8-12', load: '20', rest: '60', increment: '2.5' });
    setShowAddExercise(null);
  }

  function deleteExercise(templateId: string, exId: string) {
    onUpdate(prev => ({
      ...prev,
      templates: prev.templates.map(t =>
        t.id === templateId
          ? { ...t, exercises: t.exercises.filter(e => e.id !== exId) }
          : t
      ),
    }));
  }

  function updateExercise(templateId: string, exId: string, field: keyof ExerciseTemplate, value: string | number) {
    onUpdate(prev => ({
      ...prev,
      templates: prev.templates.map(t =>
        t.id === templateId
          ? { ...t, exercises: t.exercises.map(e =>
              e.id === exId ? { ...e, [field]: value } : e
            ) }
          : t
      ),
    }));
  }

  function moveExercise(templateId: string, exId: string, dir: 'up' | 'down') {
    onUpdate(prev => ({
      ...prev,
      templates: prev.templates.map(t => {
        if (t.id !== templateId) return t;
        const idx = t.exercises.findIndex(e => e.id === exId);
        if (idx < 0) return t;
        const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= t.exercises.length) return t;
        const exercises = [...t.exercises];
        [exercises[idx], exercises[swapIdx]] = [exercises[swapIdx], exercises[idx]];
        return { ...t, exercises };
      }),
    }));
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="px-6 pt-12 pb-4">
        <h1 className="text-3xl font-bold text-white">Gerenciar Treinos</h1>
        <p className="text-sm text-gray-500 mt-1">Crie e edite treinos por dia da semana</p>
      </header>

      <div className="px-4 space-y-2">
        {WEEK_DAYS.map(dayInfo => {
          const dayTemplates = data.templates.filter(t => t.day === dayInfo.value);
          const isExpanded = expandedDay === dayInfo.value;

          return (
            <div
              key={dayInfo.value}
              className="bg-base-700/60 rounded-2xl border border-base-500/20 overflow-hidden"
            >
              {/* Day header */}
              <button
                onClick={() => toggleDay(dayInfo.value)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    dayTemplates.length > 0 ? 'bg-accent/10' : 'bg-base-600'
                  }`}>
                    <span className={`text-xs font-bold ${dayTemplates.length > 0 ? 'text-accent' : 'text-gray-500'}`}>
                      {dayInfo.short}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{dayInfo.label}</p>
                    <p className="text-xs text-gray-500">
                      {dayTemplates.length === 0
                        ? 'Sem treino'
                        : `${dayTemplates.length} treino${dayTemplates.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-slide-up">
                  {dayTemplates.map(tmpl => (
                    <div key={tmpl.id} className="bg-base-800/60 rounded-xl border border-base-500/20 overflow-hidden">
                      {/* Template name */}
                      <div className="flex items-center gap-2 p-3">
                        {editingTemplate === tmpl.id ? (
                          <>
                            <input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && saveTemplateName(tmpl.id)}
                              className="flex-1 bg-base-900 rounded-lg px-3 py-1.5 text-white text-sm border border-accent/40 focus:outline-none"
                            />
                            <button onClick={() => saveTemplateName(tmpl.id)} className="text-success">
                              <Check size={18} />
                            </button>
                            <button onClick={() => setEditingTemplate(null)} className="text-gray-500">
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <Dumbbell size={16} className="text-accent" />
                            <span className="flex-1 font-medium text-white text-sm">{tmpl.name}</span>
                            <button
                              onClick={() => { setEditingTemplate(tmpl.id); setEditName(tmpl.name); }}
                              className="text-gray-500 hover:text-accent transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => deleteTemplate(tmpl.id)}
                              className="text-gray-500 hover:text-error transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Exercise list */}
                      <div className="px-3 pb-3 space-y-1.5">
                        {tmpl.exercises.map((ex, i) => {
                          const last = getLastSessionForExercise(data.sessions, ex.name);
                          const suggestion = getProgressionSuggestion(data, ex);
                          return (
                            <div key={ex.id} className="bg-base-900/40 rounded-lg p-2 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <GripVertical size={14} className="text-gray-700 flex-shrink-0" />
                                <input
                                  value={ex.name}
                                  onChange={e => updateExercise(tmpl.id, ex.id, 'name', e.target.value)}
                                  className="flex-1 bg-transparent text-sm text-white font-medium focus:outline-none focus:bg-base-900 rounded px-1 py-0.5 min-w-0"
                                />
                                <button onClick={() => moveExercise(tmpl.id, ex.id, 'up')} disabled={i === 0}
                                  className="text-gray-600 hover:text-accent disabled:opacity-30 p-0.5">
                                  <ArrowUp size={14} />
                                </button>
                                <button onClick={() => moveExercise(tmpl.id, ex.id, 'down')} disabled={i === tmpl.exercises.length - 1}
                                  className="text-gray-600 hover:text-accent disabled:opacity-30 p-0.5">
                                  <ArrowDown size={14} />
                                </button>
                                <button
                                  onClick={() => deleteExercise(tmpl.id, ex.id)}
                                  className="text-gray-600 hover:text-error transition-colors flex-shrink-0 p-0.5"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {/* Sub-row: group, region, increment */}
                              <div className="flex items-center gap-1.5 pl-6">
                                <input
                                  value={ex.muscleGroup}
                                  onChange={e => updateExercise(tmpl.id, ex.id, 'muscleGroup', e.target.value)}
                                  placeholder="Grupo"
                                  className="w-16 bg-base-900 rounded text-[11px] text-gray-400 py-1 px-1.5 focus:outline-none border border-base-500/20"
                                />
                                <input
                                  value={ex.region}
                                  onChange={e => updateExercise(tmpl.id, ex.id, 'region', e.target.value)}
                                  placeholder="Região/função"
                                  className="flex-1 min-w-0 bg-base-900 rounded text-[11px] text-gray-400 py-1 px-1.5 focus:outline-none border border-base-500/20"
                                />
                                <span className="text-[10px] text-gray-600">Inc:</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={ex.increment}
                                  onChange={e => updateExercise(tmpl.id, ex.id, 'increment', Math.max(0.5, parseFloat(e.target.value) || 2.5))}
                                  className="w-12 bg-base-900 rounded text-center text-[11px] text-gray-400 py-1 focus:outline-none border border-base-500/20"
                                  title="Incremento de carga (kg)"
                                />
                              </div>

                              {/* Sub-row: sets, reps, load, rest */}
                              <div className="flex items-center gap-1.5 pl-6">
                                <input
                                  type="number"
                                  value={ex.sets}
                                  onChange={e => updateExercise(tmpl.id, ex.id, 'sets', Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-9 bg-base-900 rounded text-center text-[11px] text-gray-300 py-1 focus:outline-none border border-base-500/20"
                                  title="Séries"
                                />
                                <input
                                  value={ex.reps}
                                  onChange={e => updateExercise(tmpl.id, ex.id, 'reps', e.target.value)}
                                  className="w-14 bg-base-900 rounded text-center text-[11px] text-gray-300 py-1 focus:outline-none border border-base-500/20"
                                  title="Reps"
                                />
                                <span className="text-[10px] text-gray-600">kg</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={ex.load}
                                  onChange={e => updateExercise(tmpl.id, ex.id, 'load', Math.max(0, parseFloat(e.target.value) || 0))}
                                  className="w-12 bg-base-900 rounded text-center text-[11px] text-gray-300 py-1 focus:outline-none border border-base-500/20"
                                  title="Carga (kg)"
                                />
                                <span className="text-[10px] text-gray-600">rest</span>
                                <input
                                  type="number"
                                  value={ex.restSeconds}
                                  onChange={e => updateExercise(tmpl.id, ex.id, 'restSeconds', Math.max(10, parseInt(e.target.value) || 60))}
                                  className="w-12 bg-base-900 rounded text-center text-[11px] text-gray-300 py-1 focus:outline-none border border-base-500/20"
                                  title="Descanso (s)"
                                />
                              </div>

                              {/* Progression hint */}
                              {last && (
                                <div className="pl-6 flex items-center gap-1.5 text-[10px]">
                                  {suggestion.type === 'up' ? (
                                    <span className="text-accent font-medium">↑ {suggestion.title}</span>
                                  ) : suggestion.type === 'hold' ? (
                                    <span className="text-gray-500">{suggestion.title}</span>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add exercise form */}
                        {showAddExercise === tmpl.id ? (
                          <div className="bg-base-900/60 rounded-lg p-3 space-y-2 border border-accent/20 animate-fade-in">
                            <input
                              value={newEx.name}
                              onChange={e => setNewEx(s => ({ ...s, name: e.target.value }))}
                              placeholder="Nome do exercício"
                              autoFocus
                              className="w-full bg-base-900 rounded-lg px-3 py-2 text-white text-sm border border-base-500/30 focus:border-accent focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                value={newEx.group}
                                onChange={e => setNewEx(s => ({ ...s, group: e.target.value }))}
                                placeholder="Grupo muscular"
                                className="bg-base-900 rounded-lg px-2 py-1.5 text-white text-xs border border-base-500/30 focus:outline-none"
                              />
                              <input
                                value={newEx.region}
                                onChange={e => setNewEx(s => ({ ...s, region: e.target.value }))}
                                placeholder="Região/função"
                                className="bg-base-900 rounded-lg px-2 py-1.5 text-white text-xs border border-base-500/30 focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              <div>
                                <label className="text-[9px] text-gray-600 uppercase">Séries</label>
                                <input
                                  type="number"
                                  value={newEx.sets}
                                  onChange={e => setNewEx(s => ({ ...s, sets: e.target.value }))}
                                  className="w-full bg-base-900 rounded-lg px-1 py-1.5 text-center text-white text-sm border border-base-500/30 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-600 uppercase">Reps</label>
                                <input
                                  value={newEx.reps}
                                  onChange={e => setNewEx(s => ({ ...s, reps: e.target.value }))}
                                  className="w-full bg-base-900 rounded-lg px-1 py-1.5 text-center text-white text-sm border border-base-500/30 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-600 uppercase">Kg</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={newEx.load}
                                  onChange={e => setNewEx(s => ({ ...s, load: e.target.value }))}
                                  className="w-full bg-base-900 rounded-lg px-1 py-1.5 text-center text-white text-sm border border-base-500/30 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-600 uppercase">Descanso</label>
                                <input
                                  type="number"
                                  value={newEx.rest}
                                  onChange={e => setNewEx(s => ({ ...s, rest: e.target.value }))}
                                  className="w-full bg-base-900 rounded-lg px-1 py-1.5 text-center text-white text-sm border border-base-500/30 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-600 uppercase">Incremento de carga (kg)</label>
                              <input
                                type="number"
                                step="0.5"
                                value={newEx.increment}
                                onChange={e => setNewEx(s => ({ ...s, increment: e.target.value }))}
                                className="w-full bg-base-900 rounded-lg px-2 py-1.5 text-center text-white text-sm border border-base-500/30 focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addExercise(tmpl.id)}
                                className="flex-1 py-2 rounded-lg bg-accent text-base-900 text-sm font-semibold flex items-center justify-center gap-1"
                              >
                                <Save size={14} /> Salvar
                              </button>
                              <button
                                onClick={() => setShowAddExercise(null)}
                                className="px-3 py-2 rounded-lg bg-base-600 text-gray-400 text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setShowAddExercise(tmpl.id); setNewEx({ name: '', group: '', region: '', sets: '2', reps: '8-12', load: '20', rest: '60', increment: '2.5' }); }}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-base-900/30 text-gray-500 hover:text-accent text-sm font-medium border border-dashed border-base-500/30 transition-colors"
                          >
                            <Plus size={16} /> Adicionar exercício
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Create new workout for this day */}
                  <button
                    onClick={() => createTemplate(dayInfo.value)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-base-800/40 text-gray-400 hover:text-accent text-sm font-medium border border-dashed border-base-500/30 transition-colors"
                  >
                    <Plus size={18} /> Criar treino para {dayInfo.short}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
