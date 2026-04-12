import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getActiveTask, startTask as apiStartTask, stopTask as apiStopTask } from '../api/api';

const TimerContext = createContext();

const TIMER_MODES = {
  focus: { label: 'Focus', duration: 55 * 60 },
  short_break: { label: 'Short Break', duration: 5 * 60 },
  long_break: { label: 'Long Break', duration: 15 * 60 },
};


export function TimerProvider({ children }) {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [pomodoroCount, setPomodoroCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Create audio context for notification
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdW+Jm5yUfGlkdH+Qm5uSgHJrcn+MnJuTgXRtcX6MmpiUg3VwcHyKl5eShXdyb3uIlZOShHl0b3qGkpCQhHt2cHqEj46NhH14cnqCjIuKhIB7dXqAiYiHhIJ+eHp/hoWEg4OAfHt+g4KBgYKAf31+gYCAgIGBgH9+f4CAgICBgYCAf3+AgICAgQ==');
  }, []);

  // Fetch active task on mount (handles page reload)
  useEffect(() => {
    fetchActiveTask();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(intervalRef.current);
    }
  }, [isRunning]);

  const handleTimerEnd = () => {
    setIsRunning(false);
    setSessionCompleted(true);
    // Play notification sound
    try {
      audioRef.current?.play().catch(() => {});
    } catch (e) {}
    // Update document title
    document.title = 'Time\'s up! — Pulse';

    // Automatically stop the task in the backend as 'completed'
    if (activeTask) {
      stopTimer({ status: 'completed', comment: 'Session completed naturally' });
    }

    // Auto-reset after a short delay so user can see "Time's up"
    setTimeout(() => {
      if (mode === 'focus') {
        setTimeLeft(TIMER_MODES.focus.duration);
      }
    }, 3000);
  };

  // Update document title with timer
  useEffect(() => {
    if (isRunning) {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      document.title = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} - ${TIMER_MODES[mode].label}`;
    } else if (!sessionCompleted) {
      document.title = 'Pulse — Focus Tracker';
    }
  }, [timeLeft, isRunning, mode, sessionCompleted]);

  const fetchActiveTask = async () => {
    try {
      setLoading(true);
      const task = await getActiveTask();
      if (task && task.status === 'running') {
        setActiveTask(task);
        setMode(task.sessionType || 'focus');
        // Calculate remaining time based on elapsed
        const elapsed = Math.floor((Date.now() - new Date(task.startTime).getTime()) / 1000);
        const modeDuration = TIMER_MODES[task.sessionType || 'focus'].duration;
        const remaining = Math.max(0, modeDuration - elapsed);
        setTimeLeft(remaining);
        setIsRunning(remaining > 0);
        if (remaining === 0) {
          setSessionCompleted(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch active task:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = useCallback((newMode) => {
    if (isRunning) return; // Don't switch while running
    setMode(newMode);
    setTimeLeft(TIMER_MODES[newMode].duration);
    setSessionCompleted(false);
    document.title = 'Pulse — Focus Tracker';
  }, [isRunning]);

  const startTimer = useCallback(async (taskData) => {
    try {
      const task = await apiStartTask({
        ...taskData,
        sessionType: mode,
        pomodoroCount
      });
      setActiveTask(task);
      setIsRunning(true);
      setSessionCompleted(false);
      return task;
    } catch (err) {
      throw err;
    }
  }, [mode, pomodoroCount]);

  const stopTimer = useCallback(async (data = {}) => {
    if (!activeTask) return null;
    try {
      const task = await apiStopTask(activeTask._id, data);
      setActiveTask(null);
      setIsRunning(false);

      // If focus session completed naturally or manually marked as completed, increment pomodoro count
      if (mode === 'focus' && (sessionCompleted || data.status === 'completed')) {
        setPomodoroCount(prev => prev + 1);
      }

      // Always reset time to 55m when stopping/completing
      if (mode === 'focus') {
        setTimeLeft(TIMER_MODES.focus.duration);
      }

      return task;
    } catch (err) {
      throw err;
    }
  }, [activeTask, mode, sessionCompleted]);

  const resetTimer = useCallback(() => {
    setTimeLeft(TIMER_MODES[mode].duration);
    setIsRunning(false);
    setSessionCompleted(false);
    document.title = 'Pulse — Focus Tracker';
  }, [mode]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }, []);

  const resumeTimer = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true);
    }
  }, [timeLeft]);

  return (
    <TimerContext.Provider value={{
      mode,
      timeLeft,
      isRunning,
      activeTask,
      pomodoroCount,
      loading,
      sessionCompleted,
      TIMER_MODES,
      switchMode,
      startTimer,
      stopTimer,
      resetTimer,
      pauseTimer,
      resumeTimer,
      fetchActiveTask,
      setSessionCompleted
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
