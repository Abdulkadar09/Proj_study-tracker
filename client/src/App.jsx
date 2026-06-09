import { useEffect, useMemo, useRef, useState } from 'react';
import { Home, History, BarChart2, BookOpen, Sun, Moon, LogOut } from 'lucide-react';
import {
  setApiAccessToken,
  fetchSubjects,
  createSubject,
  deleteSubject,
  deleteSession,
  fetchSessions,
  createSession,
  updateSession,
  fetchSummary,
  fetchSubjectStats,
  fetchDailyTotals
} from './api';
import { getStartOfWeek } from './utils';
import HomeScreen from './screens/HomeScreen';
import TimerScreen from './screens/TimerScreen';
import HistoryScreen from './screens/HistoryScreen';
import StatsScreen from './screens/StatsScreen';
import SubjectsScreen from './screens/SubjectsScreen';
import AuthScreen from './screens/AuthScreen';
import { supabase, hasSupabaseConfig } from './supabaseClient';

const STORAGE_KEY = 'study-tracker-active-session';
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'history', label: 'History', icon: History },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'subjects', label: 'Subjects', icon: BookOpen }
];

function App() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [summary, setSummary] = useState({ today_seconds: 0, week_seconds: 0 });
  const [sessions, setSessions] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [dailyTotals, setDailyTotals] = useState([]);
  const [activeScreen, setActiveScreen] = useState('home');
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [authSession, setAuthSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const notificationTimeoutRef = useRef(null);
  const swRegistrationRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setAuthLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setAuthSession(data.session);
      setApiAccessToken(data.session?.access_token ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      setApiAccessToken(session?.access_token ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const selectedSubject = useMemo(
    () => subjects.find((item) => item.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId]
  );
  const activeSessionStorageKey = useMemo(
    () => authSession?.user?.id ? `${STORAGE_KEY}:${authSession.user.id}` : STORAGE_KEY,
    [authSession]
  );

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleApiError = (error, fallbackMessage) => {
    console.error(error);
    showNotification(fallbackMessage || error?.message || 'Something went wrong');
  };

  async function runApi(action, fallbackMessage) {
    try {
      return await action();
    } catch (error) {
      handleApiError(error, fallbackMessage);
      return null;
    }
  }

  const handleUpdateApp = () => {
    if (swRegistrationRef.current?.waiting) {
      swRegistrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authSession) {
      setSubjects([]);
      setSelectedSubjectId(null);
      setSummary({ today_seconds: 0, week_seconds: 0 });
      setSessions([]);
      setSubjectStats([]);
      setDailyTotals([]);
      setActiveSession(null);
      setActiveScreen('home');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [subjectRows, summaryData, sessionRows] = await Promise.all([
          runApi(fetchSubjects, 'Could not load subjects'),
          runApi(fetchSummary, 'Could not load summary'),
          runApi(fetchSessions, 'Could not load sessions')
        ]);
        if (cancelled) {
          return;
        }
        if (subjectRows) {
          setSubjects(subjectRows);
          setSelectedSubjectId((current) => current ?? subjectRows[0]?.id ?? null);
        }
        if (summaryData) {
          setSummary(summaryData);
        }
        if (sessionRows) {
          setSessions(sessionRows);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    const stored = localStorage.getItem(activeSessionStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActiveSession({
          subjectId: parsed.subjectId,
          subjectName: parsed.subjectName,
          subjectColor: parsed.subjectColor,
          startedAt: parsed.startedAt,
          pausedAt: parsed.pausedAt ?? null,
          pausedDuration: parsed.pausedDuration ?? 0,
          isPaused: parsed.isPaused ?? false
        });
        setActiveScreen('timer');
      } catch (error) {
        localStorage.removeItem(activeSessionStorageKey);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [authLoading, authSession, activeSessionStorageKey]);

  useEffect(() => {
    if (subjects.length && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    if (loading || !activeSession) {
      return;
    }
    const subjectStillExists = subjects.some((subject) => subject.id === activeSession.subjectId);
    if (!subjectStillExists) {
      setActiveSession(null);
      setActiveScreen('home');
      showNotification('That subject no longer exists. Start a new session.', 'info');
    }
  }, [loading, subjects, activeSession]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('Back online.', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleSwUpdate = (event) => {
      swRegistrationRef.current = event.detail?.registration;
      setUpdateAvailable(true);
      showNotification('A new version is ready.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('swUpdate', handleSwUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('swUpdate', handleSwUpdate);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeScreen === 'stats') {
      const from = getStartOfWeek();
      const to = Date.now();
      (async () => {
        const statsData = await runApi(() => fetchSubjectStats(), 'Could not load subject stats');
        if (statsData) {
          setSubjectStats(statsData);
        }
      })();
      (async () => {
        const dailyData = await runApi(() => fetchDailyTotals(from, to), 'Could not load daily totals');
        if (dailyData) {
          setDailyTotals(dailyData);
        }
      })();
    }
  }, [activeScreen]);

  async function refreshSummary() {
    const summaryData = await runApi(fetchSummary, 'Could not refresh summary');
    if (summaryData) {
      setSummary(summaryData);
    }
  }

  async function refreshSessions() {
    const sessionRows = await runApi(fetchSessions, 'Could not refresh sessions');
    if (sessionRows) {
      setSessions(sessionRows);
    }
  }

  async function refreshAll() {
    await Promise.all([refreshSummary(), refreshSessions()]);
  }

  async function handleAddSubject(subject) {
    const newSubject = await runApi(() => createSubject(subject), 'Could not add subject');
    if (!newSubject) {
      return;
    }
    setSubjects((prev) => [...prev, newSubject]);
    setSelectedSubjectId(newSubject.id);
    setActiveScreen('home');
  }

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem(activeSessionStorageKey, JSON.stringify(activeSession));
    } else {
      localStorage.removeItem(activeSessionStorageKey);
    }
  }, [activeSession, activeSessionStorageKey]);

  async function handleSignOut() {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
  }

  async function handleDeleteSubject(id) {
    if (!window.confirm('Delete this subject and all related sessions?')) {
      return;
    }
    const result = await runApi(() => deleteSubject(id), 'Could not delete subject');
    if (!result) {
      return;
    }
    setSubjects((prev) => {
      const nextSubjects = prev.filter((item) => item.id !== id);
      if (selectedSubjectId === id) {
        setSelectedSubjectId(nextSubjects[0]?.id ?? null);
      }
      return nextSubjects;
    });
  }

  function handleSelectSubject(id) {
    setSelectedSubjectId(id);
  }

  function handleStartSession() {
    if (!selectedSubject) {
      return;
    }
    const payload = {
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      subjectColor: selectedSubject.color,
      startedAt: Date.now(),
      pausedAt: null,
      pausedDuration: 0,
      isPaused: false
    };
    setActiveSession(payload);
    setActiveScreen('timer');
  }

  function handlePauseToggle() {
    if (!activeSession) {
      return;
    }
    setActiveSession((prev) => {
      if (!prev) {
        return prev;
      }
      if (prev.isPaused) {
        const resumedAt = Date.now();
        return {
          ...prev,
          isPaused: false,
          pausedDuration: prev.pausedDuration + (resumedAt - prev.pausedAt),
          pausedAt: null
        };
      }
      return {
        ...prev,
        isPaused: true,
        pausedAt: Date.now()
      };
    });
  }

  async function handleStopSession() {
    if (!activeSession) {
      return;
    }
    const subjectStillExists = subjects.some((subject) => subject.id === activeSession.subjectId);
    if (!subjectStillExists) {
      setActiveSession(null);
      setActiveScreen('home');
      showNotification('That subject no longer exists. Start a new session.', 'info');
      return;
    }
    const endedAt = Date.now();
    const pausedDuration = activeSession.pausedDuration + (activeSession.isPaused ? endedAt - activeSession.pausedAt : 0);
    const elapsed = Math.max(0, endedAt - activeSession.startedAt - pausedDuration);
    const durationSeconds = Math.round(elapsed / 1000);
    const saved = await runApi(
      () => createSession({
        subject_id: Number(activeSession.subjectId),
        started_at: activeSession.startedAt,
        ended_at: endedAt,
        duration_seconds: durationSeconds
      }),
      'Could not save session'
    );
    if (!saved) {
      return;
    }
    setActiveSession(null);
    setActiveScreen('home');
    await refreshAll();
  }

  async function handleDeleteSession(session) {
    const countText = session.count > 1 ? `${session.count} sessions` : 'this session';
    if (!window.confirm(`Delete ${countText} for ${session.subject_name}?`)) {
      return;
    }
    const results = await Promise.all(
      session.session_ids.map((id) => runApi(() => deleteSession(id), 'Could not delete session'))
    );
    if (results.some((result) => !result)) {
      return;
    }
    showNotification(`${countText} deleted.`, 'success');
    await refreshAll();
  }

  function renderScreen() {
    if (activeScreen === 'timer' && activeSession) {
      return (
        <TimerScreen
          subject={selectedSubject ?? { name: activeSession.subjectName, color: activeSession.subjectColor }}
          startedAt={activeSession.startedAt}
          pausedAt={activeSession.pausedAt}
          pausedDuration={activeSession.pausedDuration}
          isPaused={activeSession.isPaused}
          onTogglePause={handlePauseToggle}
          onStop={handleStopSession}
        />
      );
    }
    switch (activeScreen) {
      case 'history':
        return (
          <HistoryScreen
            sessions={sessions}
            subjects={subjects}
            onAddSession={async (payload) => {
              const created = await runApi(() => createSession(payload), 'Could not add session');
              if (created) {
                await refreshAll();
              }
            }}
            onUpdateSession={async (sessionId, durationSeconds) => {
              const updated = await runApi(() => updateSession(sessionId, { duration_seconds: durationSeconds }), 'Could not update session');
              if (updated) {
                await refreshAll();
              }
            }}
            onDeleteSession={handleDeleteSession}
          />
        );
      case 'stats':
        return <StatsScreen subjectStats={subjectStats} dailyTotals={dailyTotals} />;
      case 'subjects':
        return (
          <SubjectsScreen
            subjects={subjects}
            onAdd={handleAddSubject}
            onDelete={handleDeleteSubject}
          />
        );
      default:
        return (
          <HomeScreen
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            selectedSubject={selectedSubject}
            onSelectSubject={handleSelectSubject}
            onStartSession={handleStartSession}
            summary={summary}
            loading={loading}
          />
        );
    }
  }

  if (authLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-panel">
          <h1>Study Tracker</h1>
          <p>Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!authSession) {
    return <AuthScreen />;
  }

  return (
    <div className="app-shell">
      {notification && (
        <div className={`status-banner ${notification.type}`}>
          {notification.message}
        </div>
      )}
      {updateAvailable && (
        <div className="status-banner update-ready">
          A new version is available. <button type="button" onClick={handleUpdateApp}>Refresh</button>
        </div>
      )}
      {!isOnline && (
        <div className="status-banner offline">
          You are offline. Some features may be unavailable.
        </div>
      )}
      <div className="topbar">
        <h1 className="title">Study Tracker</h1>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="icon-btn" onClick={handleSignOut} title="Sign out">
            <LogOut size={20} />
          </button>
        </div>
      </div>
      {renderScreen()}
      {activeScreen !== 'timer' && (
        <div className="bottom-nav">
          <div className="nav-row">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeScreen === item.id ? 'active' : ''}`}
                onClick={() => setActiveScreen(item.id)}
              >
                <item.icon size={22} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
