import { useEffect, useState } from 'react';

function formatTime(diffMs) {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export default function TimerDisplay({ startedAt, pausedAt, pausedDuration, isPaused }) {
  const [elapsed, setElapsed] = useState(() => {
    const pauseAdjustment = isPaused && pausedAt ? Date.now() - pausedAt : 0;
    return Date.now() - startedAt - pausedDuration - pauseAdjustment;
  });

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const pausedAdjustment = isPaused && pausedAt ? now - pausedAt : 0;
      setElapsed(Math.max(0, now - startedAt - pausedDuration - pausedAdjustment));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, pausedAt, pausedDuration, isPaused]);

  return <div className="timer-value">{formatTime(elapsed)}</div>;
}
