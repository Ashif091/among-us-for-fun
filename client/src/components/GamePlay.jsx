import { useGame } from '../context/GameContext.jsx';
import ScoreBoard from './ScoreBoard.jsx';
import PlayerCard from './PlayerCard.jsx';
import { getCategoryEmoji, getCategoryLabel } from '../utils/constants.js';
import './GamePlay.css';

export default function GamePlay() {
  const { room, gameData, isHost, playerId, startVoting, restartGame, kickPlayer, confirmRead, leaveRoom } = useGame();

  if (!room || !gameData) return null;

  const currentPlayer = room.players.find(p => p.id === playerId);
  const hasConfirmed = currentPlayer?.hasConfirmed || false;

  return (
    <div className="page-container">
      <div className="gameplay-content animate-fade-in">
        {/* Round info */}
        <div className="gameplay-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-info">Round {room.roundNumber}</span>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
              {getCategoryEmoji(room.category)} {getCategoryLabel(room.category)}
            </span>
          </div>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => { if (window.confirm("Are you sure you want to leave the room? This will abort the active round for everyone.")) leaveRoom(); }} 
            id="leave-room-btn"
          >
            🚪 Leave
          </button>
        </div>

        {/* Word / Imposter Reveal */}
        <div className={`gameplay-reveal glass-card ${gameData.isImposter ? 'gameplay-reveal-imposter' : 'gameplay-reveal-word'}`}>
          {gameData.isImposter ? (
            <>
              <div className="gameplay-imposter-icon">🔴</div>
              <div className="gameplay-imposter-text">YOU ARE THE</div>
              <div className="gameplay-imposter-title">IMPOSTER</div>
              <div className="gameplay-imposter-hint">
                You don't know the word. Blend in and don't get caught!
              </div>
            </>
          ) : (
            <>
              <div className="gameplay-word-label">The secret word is</div>
              <div className="gameplay-word">{gameData.word}</div>
              <div className="gameplay-word-hint">
                Don't let the imposter figure out the word!
              </div>
            </>
          )}
        </div>

        {/* Word Confirm / Read check button */}
        {!hasConfirmed ? (
          <button
            className="btn btn-primary btn-full btn-lg animate-glow"
            onClick={confirmRead}
            id="confirm-read-btn"
            style={{ animation: 'glowPulse 2s ease-in-out infinite' }}
          >
            👍 I've Seen My Word / Role
          </button>
        ) : (
          <div 
            className="gameplay-confirmed-badge glass-card" 
            style={{ 
              padding: 'var(--space-sm) var(--space-md)', 
              textAlign: 'center', 
              borderColor: 'rgba(22,199,154,0.3)',
              background: 'rgba(22,199,154,0.02)'
            }}
          >
            <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '0.95rem' }}>
              ✓ Word Confirmed
            </span>
            <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
              Waiting for others to confirm...
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="gameplay-instructions glass-card">
          <div className="title-sm" style={{ marginBottom: '8px' }}>📢 Discussion Time!</div>
          <p className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
            Take turns asking each other questions about the word.
            Identify the imposter — or blend in if you are the imposter!
          </p>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '8px' }}>
            Once everyone clicks confirm, the voting phase will start automatically.
          </p>
        </div>

        {/* Players List (Play Area with Crowns & Kicks) */}
        <div className="gameplay-players">
          <div className="title-sm" style={{ marginBottom: '12px' }}>👥 Players ({room.players.length})</div>
          <div className="gameplay-players-list stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {room.players.map((player, i) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={room.players.findIndex(p => p.id === player.id)}
                isCurrentPlayer={player.id === playerId}
                canKick={false}
                onKick={kickPlayer}
                roomState={room.state}
              />
            ))}
          </div>
        </div>

        {/* Scoreboard */}
        <ScoreBoard compact />

        {/* Host controls */}
        {isHost && (
          <div className="gameplay-host-actions" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
            <button
              className="btn btn-primary btn-full btn-lg gameplay-vote-btn"
              onClick={startVoting}
              id="start-voting-btn"
            >
              🗳️ Start Voting
            </button>
            <button
              className="btn btn-secondary btn-full"
              onClick={restartGame}
              id="restart-game-btn"
            >
              🔄 Restart (Back to Lobby)
            </button>
          </div>
        )}

        {!isHost && (
          <div className="gameplay-waiting text-secondary" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            Waiting for host to start voting...
          </div>
        )}
      </div>
    </div>
  );
}
