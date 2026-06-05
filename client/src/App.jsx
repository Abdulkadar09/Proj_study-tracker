import { useEffect, useMemo, useRef, useState } from 'react';
import {
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

const STORAGE_KEY = 'study-tracker-active-session';
const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'history', label: 'History' },
  { id: 'stats', label: 'Stats' },
  { id: 'subjects', label: 'Subjects' }
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
  const notificationTimeoutRef = useRef(null);
  const swRegistrationRef = useRef(null);

  const selectedSubject = useMemo(
    () => subjects.find((item) => item.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId]
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
    async function load() {
      try {
        const [subjectRows, summaryData, sessionRows] = await Promise.all([
          runApi(fetchSubjects, 'Could not load subjects'),
          runApi(fetchSummary, 'Could not load summary'),
          runApi(fetchSessions, 'Could not load sessions')
        ]);
        if (subjectRows) {
          setSubjects(subjectRows);
          if (subjectRows.length && !selectedSubjectId) {
            setSelectedSubjectId(subjectRows[0].id);
          }
        }
        if (summaryData) {
          setSummary(summaryData);
        }
        if (sessionRows) {
          setSessions(sessionRows);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    const stored = localStorage.getItem(STORAGE_KEY);
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
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (subjects.length && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeSession]);

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
    const endedAt = Date.now();
    const pausedDuration = activeSession.pausedDuration + (activeSession.isPaused ? endedAt - activeSession.pausedAt : 0);
    const elapsed = Math.max(0, endedAt - activeSession.startedAt - pausedDuration);
    const durationSeconds = Math.round(elapsed / 1000);
    const saved = await runApi(
      () => createSession({
        subject_id: activeSession.subjectId,
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
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
