import { useState } from 'react';

export default function AccessPage({ onAccess }) {
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'yourdata') {
      onAccess();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPassword('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0B0B0C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 300, padding: 24 }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="·····"
          autoFocus
          style={{
            width: '100%',
            padding: '14px 0',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #27272A',
            outline: 'none',
            fontSize: '1.125rem',
            fontFamily: 'Inter, -apple-system, sans-serif',
            letterSpacing: '0.15em',
            color: '#FFFFFF',
            textAlign: 'center',
            caretColor: '#71717A',
            animation: shake ? 'accessShake 0.4s ease' : 'none',
          }}
        />
        <button
          type="submit"
          style={{
            display: 'block',
            width: '100%',
            marginTop: 28,
            padding: '12px 0',
            background: '#FFFFFF',
            color: '#0B0B0C',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          ENTER
        </button>
      </form>

      <style>{`
        @keyframes accessShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
