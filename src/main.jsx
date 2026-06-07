import { StrictMode, useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'
import FootballApp from './FootballApp.jsx'

const FOOTBALL_PASSWORD = 'Asher20!';

function SportWrapper() {
  const [sport, setSport] = useState('basketball');
  const [showFootball, setShowFootball] = useState(false);

  const unlockFootball = useCallback(() => {
    const input = window.prompt('');
    if (input === FOOTBALL_PASSWORD) {
      setShowFootball(true);
      setSport('football');
    } else if (input !== null) {
      window.alert('Incorrect password.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white">
      <div className="bg-[#0a0c14]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 pt-2">
          <div className="flex gap-1">
            <button
              onClick={() => setSport('basketball')}
              className={`flex-1 py-2 rounded-t-lg text-xs font-bold tracking-widest uppercase transition-all ${
                sport === 'basketball'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              🏀 Basketball
            </button>
            {showFootball && (
              <button
                onClick={() => setSport('football')}
                className={`flex-1 py-2 rounded-t-lg text-xs font-bold tracking-widest uppercase transition-all ${
                  sport === 'football'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                🏈 Football
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={sport === 'basketball' ? '' : 'hidden'}>
        <App onUnlockFootball={unlockFootball} />
      </div>
      {showFootball && (
        <div className={sport === 'football' ? '' : 'hidden'}>
          <FootballApp onUnlockFootball={unlockFootball} />
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SportWrapper />
    <Analytics />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
