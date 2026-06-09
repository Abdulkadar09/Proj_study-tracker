import { Pause, Play, Square } from 'lucide-react';
import TimerDisplay from '../components/TimerDisplay';

export default function TimerScreen({ subject, startedAt, pausedAt, pausedDuration, isPaused, onTogglePause, onStop }) {
  return (
    <div className="timer-screen">
      <div className="timer-hero">
        <div className="timer-subject-badge">
          <span className="chip-dot" style={{ background: subject?.color || '#6366f1' }} />
          <span>{subject?.name || 'Selected subject'}</span>
        </div>

        <TimerDisplay
          startedAt={startedAt}
          pausedAt={pausedAt}
          pausedDuration={pausedDuration}
          isPaused={isPaused}
        />

        <div className="timer-label">
          Started at {new Date(startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>

      <div className="timer-controls">
        <button
          type="button"
          className={`pause-button ${isPaused ? 'paused' : ''}`}
          onClick={onTogglePause}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className="stop-button" onClick={onStop}>
          <Square size={18} />
          Stop & Save
        </button>
      </div>
    </div>
  );
}
