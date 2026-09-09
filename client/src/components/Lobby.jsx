import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import PlayerCard from './PlayerCard.jsx';
import ScoreBoard from './ScoreBoard.jsx';
import HostSettingsModal from './HostSettingsModal.jsx';
import { getCategoryEmoji, getCategoryLabel, shareRoom } from '../utils/constants.js';
import './Lobby.css';

export default function Lobby() {
  const {
    room, isHost, playerId, categories,
    updateConfig, startGame, kickPlayer, leaveRoom,
  } = useGame();
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState(null); // null | 'copied' | 'shared'

  const handleShare = async () => {
    const result = await shareRoom(room.code, () => {
      setShareStatus('copied');
      setTimeout(() => setShareStatus(null), 2500);
    });
    if (result === 'shared') {
      setShareStatus('shared');
      setTimeout(() => setShareStatus(null), 2500);
    }
  };

  if (!room) return null;

  const onlinePlayers = room.players.filter(p => p.isOnline);
  const settings = room.settings || {};
  const canStart = isHost && onlinePlayers.length >= 3 && onlinePlayers.length <= (settings.maxPlayers ?? 15);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isHost && (
              <button
                className="btn btn-ghost btn-sm lobby-settings-btn"
                onClick={() => setSettingsOpen(true)}
                id="host-settings-btn"
                title="Room Settings"
              >
                ⚙️ Settings
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { if (window.confirm("Are you sure you want to leave the room?")) leaveRoom(); }}
              id="leave-room-btn"
            >
              🚪 Leave
            </button>
          </div>
        </div>

        {/* Room Code + Share */}
        <div className="room-code-container">
          <div className="room-code-display animate-fade-in" onClick={handleCopyCode} id="copy-room-code">
            <div>
              <div className="room-code-text">{room.code}</div>
              <div className="room-code-copy">
                {copied ? '✅ Copied!' : '📋 Tap to copy room code'}
              </div>
            </div>
          </div>
          <button
            className="btn lobby-share-btn"
            onClick={handleShare}
            id="share-room-btn"
            title="Share room link"
          >
            {shareStatus === 'copied' ? '✅ Link copied!' : shareStatus === 'shared' ? '✅ Shared!' : '🔗 Share'}
          </button>
        </div>

        {/* Room info summary for non-hosts */}
        {!isHost && (
          <div className="lobby-category-info glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Category</span>
              <span className="title-sm">
                {getCategoryEmoji(room.category)} {getCategoryLabel(room.category)}
              </span>
            </div>
            {settings.maxPlayers && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Max Players</span>
                <span className="title-sm">👥 {settings.maxPlayers}</span>
              </div>
            )}
          </div>
        )}

        {/* Host: quick settings summary pill */}
        {isHost && (
          <button
            className="lobby-settings-summary glass-card"
            onClick={() => setSettingsOpen(true)}
            id="host-settings-summary-btn"
          >
            <span className="lobby-settings-summary-item">
              {getCategoryEmoji(room.category)} {getCategoryLabel(room.category)}
            </span>
            <span className="lobby-settings-divider">·</span>
            <span className="lobby-settings-summary-item">👥 Max {settings.maxPlayers ?? 15}</span>
            <span className="lobby-settings-divider">·</span>
            <span className="lobby-settings-summary-item">
              ✅{settings.correctScore >= 0 ? '+' : ''}{settings.correctScore ?? 1}
              &nbsp;/&nbsp;
              ❌{settings.wrongScore >= 0 ? '+' : ''}{settings.wrongScore ?? -1}
            </span>
            <span className="lobby-settings-summary-edit">✏️ Edit</span>
          </button>
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

      {/* Host Settings Modal */}
      <HostSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
