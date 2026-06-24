import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import PlayerCard from './PlayerCard.jsx';
import ScoreBoard from './ScoreBoard.jsx';
import { getCategoryEmoji, getCategoryLabel } from '../utils/constants.js';
import './Lobby.css';

export default function Lobby() {
  const {
    room, isHost, playerId, categories,
    updateConfig, startGame, kickPlayer, leaveRoom,
  } = useGame();
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const onlinePlayers = room.players.filter(p => p.isOnline);
  const canStart = isHost && onlinePlayers.length >= 3;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = room.code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="page-container">
      <div className="lobby-content animate-fade-in">
        {/* Header */}
        <div className="lobby-header">
          <h2 className="title-lg">Game Lobby</h2>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => { if (window.confirm("Are you sure you want to leave the room?")) leaveRoom(); }} 
            id="leave-room-btn"
          >
            🚪 Leave
          </button>
        </div>

        {/* Room Code */}
        <div className="room-code-container">
          <div className="room-code-display animate-fade-in" onClick={handleCopyCode} id="copy-room-code">
            <div>
              <div className="room-code-text">{room.code}</div>
              <div className="room-code-copy">
                {copied ? '✅ Copied!' : '📋 Tap to copy room code'}
              </div>
            </div>
          </div>
        </div>

        {/* Category Selector (host only) */}
        {isHost && (
          <div className="lobby-config glass-card">
            <div className="input-group">
              <label className="input-label" htmlFor="category-select">
                {getCategoryEmoji(room.category)} Category
              </label>
              <select
                id="category-select"
                className="select"
                value={room.category}
                onChange={(e) => updateConfig(e.target.value)}
              >
                {(categories.length > 0 ? categories : ['objects']).map(cat => (
                  <option key={cat} value={cat}>
                    {getCategoryEmoji(cat)} {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Category display for non-hosts */}
        {!isHost && (
          <div className="lobby-category-info glass-card">
            <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Category</span>
            <span className="title-sm">
              {getCategoryEmoji(room.category)} {getCategoryLabel(room.category)}
            </span>
          </div>
        )}

        {/* Players List */}
        <div className="lobby-players">
          <div className="lobby-players-header">
            <span className="title-sm">Players ({onlinePlayers.length}/{room.players.length})</span>
            {onlinePlayers.length < 3 && (
              <span className="badge badge-warning">Need {3 - onlinePlayers.length} more</span>
            )}
          </div>

          <div className="lobby-players-list stagger-children">
            {room.players.map((player, i) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={i}
                isCurrentPlayer={player.id === playerId}
                canKick={isHost && !player.isHost}
                onKick={kickPlayer}
              />
            ))}
          </div>
        </div>

        {/* Scoreboard (if there are scores from previous rounds) */}
        {room.players.some(p => p.score !== 0) && (
          <ScoreBoard compact />
        )}

        {/* Start Button */}
        {isHost && (
          <button
            className="btn btn-primary btn-full btn-lg lobby-start-btn"
            onClick={startGame}
            disabled={!canStart}
            id="start-game-btn"
          >
            {canStart
              ? `⚡ Start Round ${room.roundNumber + 1}`
              : `Need at least 3 players (${onlinePlayers.length}/3)`
            }
          </button>
        )}

        {!isHost && (
          <div className="lobby-waiting">
            <div className="lobby-waiting-dots">
              <span className="lobby-dot" />
              <span className="lobby-dot" />
              <span className="lobby-dot" />
            </div>
            <span className="text-secondary">Waiting for host to start the game...</span>
          </div>
        )}
      </div>
    </div>
  );
}
