import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TimerProvider } from './context/TimerContext';
import AccessPage from './pages/AccessPage';
import Navbar from './components/Navbar';
import TimerPage from './pages/TimerPage';
import DashboardPage from './pages/DashboardPage';
import FocusLogsPage from './pages/FocusLogsPage';
import CategoriesPage from './pages/CategoriesPage';

export default function App() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('pulse_auth') === '1'
  );

  const handleAccess = () => {
    sessionStorage.setItem('pulse_auth', '1');
    setAuthenticated(true);
  };

  if (!authenticated) {
    return <AccessPage onAccess={handleAccess} />;
  }

  return (
    <Router>
      <TimerProvider>
        <div className="app-layout">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<TimerPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/logs" element={<FocusLogsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
            </Routes>
          </main>
        </div>
      </TimerProvider>
    </Router>
  );
}
