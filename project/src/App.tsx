import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import {
  WorkoutTemplate, WorkoutSession, WeekDay,
  ActiveSession, uid
} from '@/types';
import { BottomNav } from '@/components/BottomNav';
import { TodayView } from '@/views/TodayView';
import { SessionView } from '@/views/SessionView';
import { ManageView } from '@/views/ManageView';
import { HistoryView } from '@/views/HistoryView';
import { AlertCircle, X } from 'lucide-react';

type View = 'today' | 'session' | 'manage' | 'history';

export default function App() {
  const { data, update } = useStore();
  const [view, setView] = useState<View>('today');
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleStartSession = useCallback((template: WorkoutTemplate) => {
    // If there's already an active session for this template, resume it
    const existing = data.activeSession;
    if (existing && existing.templateId === template.id) {
      setActiveTemplate(template);
      setView('session');
      return;
    }

    // Start a new active session
    const newSession: ActiveSession = {
      templateId: template.id,
      templateName: template.name,
      day: template.day,
      exercises: template.exercises.map(ex => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: [{ id: uid(), reps: 0, load: ex.load }],
        completed: false,
      })),
      startedAt: Date.now(),
    };
    update(prev => ({ ...prev, activeSession: newSession }));
    setActiveTemplate(template);
    setView('session');
    setDismissedBanner(false);
  }, [data.activeSession, update]);

  const handleUpdateActive = useCallback((session: ActiveSession) => {
    update(prev => ({ ...prev, activeSession: session }));
  }, [update]);

  const handleSaveSession = useCallback((session: WorkoutSession) => {
    update(prev => ({
      ...prev,
      sessions: [...prev.sessions, session],
      activeSession: null,
    }));
    setActiveTemplate(null);
    setView('today');
    setDismissedBanner(false);
    showToast('Treino salvo com sucesso!');
  }, [update, showToast]);

  const handleExitSession = useCallback(() => {
    // Keep the active session saved — user can resume later
    setActiveTemplate(null);
    setView('today');
    setDismissedBanner(false);
  }, []);

  const handleResumeSession = useCallback(() => {
    if (data.activeSession) {
      const template = data.templates.find(t => t.id === data.activeSession!.templateId);
      if (template) {
        setActiveTemplate(template);
        setView('session');
        setDismissedBanner(false);
      }
    }
  }, [data.activeSession, data.templates]);

  const handleDiscardSession = useCallback(() => {
    update(prev => ({ ...prev, activeSession: null }));
    setDismissedBanner(true);
  }, [update]);

  const handleViewDay = useCallback((day: WeekDay) => {
    const template = data.templates.find(t => t.day === day);
    if (template) {
      handleStartSession(template);
    } else {
      setView('manage');
    }
  }, [data.templates, handleStartSession]);

  // Session view is a full-screen overlay (not in bottom nav)
  if (view === 'session' && activeTemplate && data.activeSession) {
    return (
      <>
        <SessionView
          template={activeTemplate}
          data={data}
          activeSession={data.activeSession}
          onUpdateActive={handleUpdateActive}
          onSave={handleSaveSession}
          onExit={handleExitSession}
        />
        {toast && <Toast message={toast} />}
      </>
    );
  }

  const showBanner = data.activeSession && !dismissedBanner && view !== 'session';

  return (
    <div className="min-h-screen bg-base-800 max-w-md mx-auto">
      {view === 'today' && (
        <TodayView data={data} onStartSession={handleStartSession} onViewDay={handleViewDay} />
      )}
      {view === 'manage' && <ManageView data={data} onUpdate={update} />}
      {view === 'history' && <HistoryView data={data} />}

      {/* Resume session banner */}
      {showBanner && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 max-w-md mx-auto animate-slide-up">
          <div className="bg-accent/10 backdrop-blur-md border border-accent/30 rounded-2xl p-3 flex items-center gap-3">
            <AlertCircle size={20} className="text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Treino em andamento: {data.activeSession!.templateName}
              </p>
            </div>
            <button
              onClick={handleResumeSession}
              className="px-3 py-1.5 rounded-lg bg-accent text-base-900 text-xs font-semibold flex-shrink-0"
            >
              Continuar
            </button>
            <button
              onClick={handleDiscardSession}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-error flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <BottomNav active={view} onNavigate={setView} />

      {toast && <Toast message={toast} />}
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-base-700 text-white px-5 py-3 rounded-xl border border-accent/30 shadow-xl animate-slide-up text-sm font-medium">
      {message}
    </div>
  );
}
