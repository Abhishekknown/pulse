import { useState, useEffect } from 'react';
import { getAiInsights } from '../../api/api';

export default function PersonalButler() {
  const [weather, setWeather] = useState({ temp: null, code: null });
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);
  
  useEffect(() => {
    // Lat: 19.2183, Lon: 72.9781 -> Thane, Mumbai
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=19.2183&longitude=72.9781&current_weather=true');
        const data = await res.json();
        if (data.current_weather) {
          setWeather({ temp: data.current_weather.temperature, code: data.current_weather.weathercode });
        }
      } catch (err) {
        console.error('Failed to fetch weather', err);
      }
    };

    const fetchAi = async () => {
      try {
        const res = await getAiInsights();
        if (res.insights) {
          const points = res.insights.split('\n').filter(p => p.trim());
          setAiInsights(points);
        }
      } catch (err) {
        console.error('Failed to fetch AI insights', err);
      } finally {
        setLoadingAi(false);
      }
    };

    fetchWeather();
    fetchAi();
  }, []);

  const getButlerMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
      return "Good Morning! 🌤️ Starting the day strong. Don't forget to hydrate and plan your core tasks.";
    } else if (hour >= 9 && hour < 13) {
      return "Deep Work Hours! ⚡ Block out distractions. Remember to stretch every hour.";
    } else if (hour >= 13 && hour < 17) {
      return "Afternoon Check-in! ☕ Time for a healthy snack or a quick walk to recharge.";
    } else if (hour >= 17 && hour < 21) {
      return "Evening wind-down! 🌆 Wrap up those remaining tasks. You've earned a break soon.";
    } else {
      return "Late hours! 🌙 Screens off soon. Good sleep is your best productivity tool.";
    }
  };

  const getWeatherIcon = (code) => {
    if (code === null || code === undefined) return '';
    if (code <= 3) return '🌤️';
    if (code <= 48) return '☁️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌦️';
    if (code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌡️';
  };

  return (
    <div className="glass-card" style={{ marginBottom: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--font-2xl)', marginBottom: 'var(--space-2)' }}>Hi Abhishek</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-md)', maxWidth: '600px' }}>
            {getButlerMessage()}
          </p>
        </div>
        
        {weather.temp !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--bg-secondary)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 'var(--font-xl)' }}>{getWeatherIcon(weather.code)}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thane, Mumbai</span>
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{Math.round(weather.temp)}°C</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border)' }}>
        <h3 className="section-title" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <span style={{ color: '#A1A1AA' }}>✨</span> AI Weekly Insight
        </h3>
        {loadingAi ? (
           <p style={{ color: 'var(--text-dim)', fontSize: 'var(--font-sm)' }}>Analyzing recent behavior...</p>
        ) : aiInsights ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
             {aiInsights.map((pt, i) => (
                <div key={i} style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{pt}</div>
             ))}
           </div>
        ) : (
           <p style={{ color: 'var(--text-dim)', fontSize: 'var(--font-sm)' }}>Insights unavailable. Ensure GEMINI_API_KEY is configured.</p>
        )}
      </div>
    </div>
  );
}
