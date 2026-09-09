import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import PlayerCard from './PlayerCard.jsx';
import ScoreBoard from './ScoreBoard.jsx';
import HostSettingsModal from './HostSettingsModal.jsx';
import { shareRoom } from '../utils/constants.js';
import { Settings, LogOut, ClipboardCopy, Check, Share2, Users, Zap } from 'lucide-react';
import './Lobby.css';

export default function Lobby() {
  const {
    room, isHost, playerId,
    startGame, kickPlayer, leaveRoom,
  } = useGame();
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState(null); // null | 'copied' | 'shared'

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

  const handleShare = async (e) => {
    e.stopPropagation();
    const result = await shareRoom(room.code, () => {
      setShareStatus('copied');
      setTimeout(() => setShareStatus(null), 2500);
    });
    if (result === 'shared') {
      setShareStatus('shared');
      setTimeout(() => setShareStatus(null), 2500);
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
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Settings size={16} /> Settings
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { if (window.confirm("Are you sure you want to leave the room?")) leaveRoom(); }}
              id="leave-room-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={16} /> Leave
            </button>
          </div>
        </div>

        {/* Room Code Display with Copy + Share button in one box */}
        <div className="room-code-container">
          <div
            className="room-code-display animate-fade-in"
            onClick={handleCopyCode}
            id="copy-room-code"
            style={{ width: '100%', justifyContent: 'space-between', padding: '14px 20px' }}
          >
            <div>
              <div className="room-code-text">{room.code}</div>
              <div className="room-code-copy" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {copied ? <Check size={14} className="text-success" /> : <ClipboardCopy size={14} />}
                {copied ? 'Copied!' : 'Tap code to copy'}
              </div>
            </div>

            <button
              className="lobby-share-btn"
              onClick={handleShare}
              id="share-room-btn"
              title="Share room link"
            >
              {shareStatus ? <Check size={18} /> : <Share2 size={18} />}
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="lobby-players">
          <div className="lobby-players-header">
            <span className="title-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} /> Players ({onlinePlayers.length}/{room.players.length})
            </span>
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Zap size={20} />
            {canStart
              ? `Start Round ${room.roundNumber + 1}`
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

