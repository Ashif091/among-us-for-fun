import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { getSavedName, saveSavedName } from '../utils/constants.js';
import './Home.css';

export default function Home() {
  const { createRoom, joinRoom, isConnected } = useGame();
  const [mode, setMode] = useState(null); // null | 'create' | 'join'

  // Pre-fill name from localStorage
  const [name, setName] = useState(() => getSavedName());
  const [roomCode, setRoomCode] = useState('');

  // Auto-detect ?rm=ROOMCODE from shared links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rm = params.get('rm');
    if (rm && rm.trim().length >= 4) {
      setRoomCode(rm.trim().toUpperCase().slice(0, 6));
      setMode('join');
      // Clean the URL so it doesn't persist after joining
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleNameChange = (val) => {
    setName(val);
    saveSavedName(val);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveSavedName(name.trim());
    createRoom(name.trim());
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    saveSavedName(name.trim());
    joinRoom(name.trim(), roomCode.trim().toUpperCase());
  };


  return (
    <div className="page-container">
      <div className="home-content animate-fade-in">
        {/* Logo / Title */}
        <div className="home-hero">
          <div className="home-logo animate-float">
            <span className="home-logo-icon">🕵️</span>
          </div>
          <h1 className="title-xl text-center">
            <span className="text-gradient">Find the</span>
            <br />
            <span className="home-title-imposter">Imposter</span>
          </h1>
          <p className="text-secondary text-center" style={{ marginTop: '8px', fontSize: '0.95rem' }}>
            One word. One liar. Can you find them?
          </p>
        </div>

        {/* Connection status */}
        <div className="home-status">
          <span className={`status-dot ${isConnected ? 'status-dot-online' : 'status-dot-offline'}`} />
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
            {isConnected ? 'Connected to server' : 'Connecting...'}
          </span>
        </div>

        {/* Mode selection */}
        {!mode && (
          <div className="home-actions animate-slide-up">
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => setMode('create')}
              disabled={!isConnected}
              id="create-room-btn"
            >
              🎮 Create Room
            </button>
            <button
              className="btn btn-secondary btn-full btn-lg"
              onClick={() => setMode('join')}
              disabled={!isConnected}
              id="join-room-btn"
            >
              🚪 Join Room
            </button>
          </div>
        )}

        {/* Create Room Form */}
        {mode === 'create' && (
          <form className="home-form glass-card animate-slide-up" onSubmit={handleCreate}>
            <h2 className="title-md">Create a Room</h2>
            <div className="input-group">
              <label className="input-label" htmlFor="create-name">Your Name</label>
              <input
                id="create-name"
                className="input"
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={20}
                autoFocus
                autoComplete="off"
              />
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              type="submit"
              disabled={!name.trim() || !isConnected}
              id="confirm-create-btn"
            >
              🚀 Create & Host
            </button>
            <button
              className="btn btn-ghost btn-full"
              type="button"
              onClick={() => setMode(null)}
            >
              ← Back
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {mode === 'join' && (
          <form className="home-form glass-card animate-slide-up" onSubmit={handleJoin}>
            <h2 className="title-md">Join a Room</h2>

            {/* Invite banner shown when room code came from a share link */}
            {roomCode && (
              <div className="home-invite-banner">
                🔗 Joining room <strong>{roomCode}</strong> via invite link
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="join-name">Your Name</label>
              <input
                id="join-name"
                className="input"
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={20}
                autoFocus
                autoComplete="off"
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="join-code">Room Code</label>
              <input
                id="join-code"
                className="input input-code"
                type="text"
                placeholder="ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                autoComplete="off"
              />
            </div>
            <button
              className="btn btn-success btn-full btn-lg"
              type="submit"
              disabled={!name.trim() || roomCode.trim().length < 4 || !isConnected}
              id="confirm-join-btn"
            >
              🚪 Join Game
            </button>
            <button
              className="btn btn-ghost btn-full"
              type="button"
              onClick={() => setMode(null)}
            >
              ← Back
            </button>
          </form>
        )}


        {/* Footer */}
        <div className="home-footer text-muted" style={{ fontSize: '0.75rem' }}>
          3–15 players • Party game • No downloads
        </div>
      </div>
    </div>
  );
}
