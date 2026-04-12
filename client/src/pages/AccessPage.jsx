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
          placeholder="ENTER PASSWORD"
          autoFocus
          className="access-input"
          style={{
            width: '100%',
            padding: '16px 0',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid #161618',
            outline: 'none',
            fontSize: '0.9rem',
            fontFamily: 'Inter, -apple-system, sans-serif',
            letterSpacing: '0.4em',
            color: '#FFFFFF',
            textAlign: 'center',
            caretColor: '#EF4444',
            transition: 'border-color 0.3s ease',
            animation: shake ? 'accessShake 0.4s ease' : 'none',
          }}
        />
        <button
          type="submit"
          style={{
            display: 'block',
            width: '100%',
            marginTop: 32,
            padding: '14px 0',
            background: '#FFFFFF',
            color: '#0B0B0C',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: 700,
            letterSpacing: '0.2em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          {password.length > 0 ? 'SUBMIT' : 'SECURE ACCESS'}
        </button>
      </form>

      <style>{`
        .access-input:focus {
          border-bottom-color: #FFFFFF !important;
        }

        /* Fix Chrome/Safari autofill background */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #FFFFFF;
          -webkit-box-shadow: 0 0 0px 1000px #0B0B0C inset;
          transition: background-color 5000s ease-in-out 0s;
        }

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
