import TimerDisplay from '../components/TimerDisplay';

export default function TimerScreen({ subject, startedAt, pausedAt, pausedDuration, isPaused, onTogglePause, onStop }) {
  return (
    <div className="timer-screen">
      <div className="topbar">
        <h1 className="title">Session</h1>
      </div>

      <div className="list-panel" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div className="subject-name" style={{ justifyContent: 'center' }}>
          <span className="chip-dot" style={{ background: subject?.color || '#1b1b1f' }} />
          <strong>{subject?.name || 'Selected subject'}</strong>
        </div>
        <TimerDisplay
          startedAt={startedAt}
          pausedAt={pausedAt}
          pausedDuration={pausedDuration}
          isPaused={isPaused}
        />
        <div className="timer-label">Started at {new Date(startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
      </div>

      <button type="button" className={`pause-button ${isPaused ? 'paused' : ''}`} onClick={onTogglePause}>
        {isPaused ? '▶ Resume' : '⏸ Pause'}
      </button>
      <button type="button" className="stop-button" onClick={onStop}>
        ■ Stop & save
      </button>
    </div>
  );
}
