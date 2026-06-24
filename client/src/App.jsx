import { useEffect, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext.jsx';
import Home from './components/Home.jsx';
import Lobby from './components/Lobby.jsx';
import GamePlay from './components/GamePlay.jsx';
import Voting from './components/Voting.jsx';
import Results from './components/Results.jsx';
import RulesModal from './components/RulesModal.jsx';
import './App.css';

// ── Server Wake-Up Screen ─────────────────────────────────────────
function ServerWakingUp({ attemptCount }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Progress bar: Render cold starts typically take 20–50 s
  const progress = Math.min((elapsed / 50) * 100, 95);

  const getMessage = () => {
    if (elapsed < 5)  return 'Reaching the server…';
    if (elapsed < 15) return 'Server is waking up on Render…';
    if (elapsed < 30) return 'Still starting up, hang tight…';
    if (elapsed < 50) return 'Almost there, just a few more seconds…';
    return 'Taking longer than usual, still trying…';
  };

  return (
    <div className="page-container">
      <div className="wakeup-screen animate-fade-in">

        {/* Animated logo */}
        <div className="wakeup-icon animate-float">🕵️</div>

        <h1 className="title-xl text-center">
          <span className="text-gradient">Find the</span>
          <br />
          <span className="home-title-imposter">Imposter</span>
        </h1>

        {/* Status card */}
        <div className="wakeup-card glass-card">
          {/* Spinner row */}
          <div className="wakeup-spinner-row">
            <div className="wakeup-spinner" />
            <span className="wakeup-status-text">{getMessage()}</span>
          </div>

          {/* Progress bar */}
          <div className="wakeup-progress-track">
            <div
              className="wakeup-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Meta info */}
          <div className="wakeup-meta">
            <span>⏱ {elapsed}s</span>
            {attemptCount > 0 && <span>🔄 Attempt {attemptCount}</span>}
            <span className="wakeup-render-note">Hosted on Render (free tier)</span>
          </div>
        </div>

        <p className="text-secondary text-center" style={{ fontSize: '0.8rem', maxWidth: '280px', lineHeight: 1.6 }}>
          The server sleeps when inactive. It usually wakes up in <strong style={{ color: 'var(--color-warning)' }}>20–50 seconds</strong>.
        </p>
      </div>
    </div>
  );
}

// ── Main Game Screen ──────────────────────────────────────────────
function GameScreen() {
  const { screen, toast, clearToast, isRejoining, isConnected, hasEverConnected, attemptCount } = useGame();

  // Auto-clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(clearToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  // ── 1. Server waking up (Render cold start) ───────────────────
  // Show only on first load before the very first connection
  if (!hasEverConnected) {
    return <ServerWakingUp attemptCount={attemptCount} />;
  }

  // ── 2. Rejoining a previous session ───────────────────────────
  if (isRejoining) {
    return (
      <div className="page-container">
        <div className="app-reconnecting animate-fade-in">
          <div className="app-reconnecting-icon animate-float">🔌</div>
          <h2 className="title-lg text-gradient">Reconnecting…</h2>
          <p className="text-secondary">Getting you back into the game</p>
          <div className="lobby-waiting-dots" style={{ marginTop: '16px' }}>
            <span className="lobby-dot" />
            <span className="lobby-dot" />
            <span className="lobby-dot" />
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Mid-game disconnect banner (non-blocking) ──────────────
  // Show a small fixed banner if disconnected after having connected,
  // but let the user still see whatever screen they were on
  const showDisconnectBanner = !isConnected && hasEverConnected;

  const renderScreen = () => {
    switch (screen) {
      case 'lobby':   return <Lobby />;
      case 'playing': return <GamePlay />;
      case 'voting':  return <Voting />;
      case 'results': return <Results />;
      default:        return <Home />;
    }
  };

  return (
    <>
      {/* ── Disconnect banner ── */}
      {showDisconnectBanner && (
        <div className="disconnect-banner animate-slide-down">
          <div className="disconnect-banner-inner">
            <div className="disconnect-spinner" />
            <span>Connection lost — reconnecting to server…</span>
          </div>
        </div>
      )}

      {/* ── Toast notifications ── */}
      {toast && (
        <div
          className={`toast toast-${toast.type}`}
          onClick={clearToast}
        >
          {toast.message}
        </div>
      )}

      {/* ── Rules modal ── */}
      {screen !== 'home' && <RulesModal />}

      {/* ── Main content ── */}
      {renderScreen()}
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <div className="app-bg" />
      <GameScreen />
    </GameProvider>
  );
}
