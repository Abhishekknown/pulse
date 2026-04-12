import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTimer } from '../context/TimerContext';
import ManualEntryModal from './History/ManualEntryModal';
import { createManualTask } from '../api/api';

export default function Navbar() {
  const { isRunning } = useTimer();
  const [showManualEntry, setShowManualEntry] = useState(false);

  const handleManualSave = async (data) => {
    try {
      await createManualTask(data);
      setShowManualEntry(false);
      window.dispatchEvent(new Event('task_added'));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="mobile-brand-container">
        <NavLink to="/" className="navbar-brand" style={{ textDecoration: 'none', justifyContent: 'center' }}>
          <div className="brand-icon">⚡</div>
          <span>Pulse</span>
          {isRunning && <span className="timer-active-indicator" />}
        </NavLink>
      </div>
      <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand desktop-brand" style={{ textDecoration: 'none' }}>
          <div className="brand-icon">⚡</div>
          <span>Pulse</span>
          {isRunning && <span className="timer-active-indicator" />}
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            <span>⏱️</span>
            <span className="nav-text">Timer</span>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>📊</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          <NavLink to="/logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>📋</span>
            <span className="nav-text">Focus Logs</span>
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>📁</span>
            <span className="nav-text">Categories</span>
          </NavLink>
          <button className="nav-link" onClick={() => setShowManualEntry(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}>
            <span>➕</span>
          </button>
        </div>
      </div>
    </nav>
    {showManualEntry && (
      <ManualEntryModal
        onSave={handleManualSave}
        onClose={() => setShowManualEntry(false)}
      />
    )}
    </>
  );
}
