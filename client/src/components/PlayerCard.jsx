import { useGame } from '../context/GameContext.jsx';
import { getPlayerColor } from '../utils/constants.js';
import { FastForward, Check, Clock, UserX, Crown } from 'lucide-react';
import './PlayerCard.css';

export default function PlayerCard({
  player,
  index,
  showScore = true,
  onClick,
  selected = false,
  disabled = false,
  showVoteBadge = false,
  voteTarget = null,
  scoreChange = null,
  isCurrentPlayer = false,
  onKick,
  canKick = false,
  roomState = null,
  isLeader: isLeaderProp,
}) {
  let room;
  try {
    const game = useGame();
    room = game?.room;
  } catch (e) {
    room = null;
  }

  // Calculate if player is 1st place (highest score > 0)
  let isLeader = isLeaderProp;
  if (isLeader === undefined && room && room.players && room.players.length > 0) {
    const maxScore = Math.max(...room.players.map(p => p.score));
    isLeader = player.score > 0 && player.score === maxScore;
  }

  const color = getPlayerColor(index);
  const initials = player.name.charAt(0).toUpperCase();

  return (
    <div
      className={`player-card ${onClick ? 'player-card-clickable' : ''} ${selected ? 'player-card-selected' : ''} ${disabled ? 'player-card-disabled' : ''} ${!player.isOnline ? 'player-card-offline' : ''} ${isCurrentPlayer ? 'player-card-self' : ''}`}
      onClick={!disabled && onClick ? () => onClick(player.id) : undefined}
      style={{ '--player-color': color }}
    >
      {/* Avatar */}
      <div
        className={`player-avatar ${isLeader ? 'player-avatar-leader' : ''}`}
        style={{ background: player.isOnline ? (isLeader ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : color) : 'var(--text-muted)' }}
      >
        {isLeader && (
          <div className="player-avatar-crown" title="1st Place Leader">
            <Crown size={15} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
          </div>
        )}
        <span className="player-avatar-text">{initials}</span>
        <span className={`player-status-indicator ${player.isOnline ? 'status-dot-online' : 'status-dot-offline'}`} />
      </div>

      {/* Info */}
      <div className="player-info">
        <div className="player-name-row">
          <span className="player-name">{player.name}</span>
          {isCurrentPlayer && <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>YOU</span>}
          {player.isHost && <span className="badge badge-host" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>HOST</span>}
          {!player.isOnline && <span className="badge badge-offline" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>OFFLINE</span>}
        </div>

        {showScore && (
          <div className={`player-score ${player.score > 0 ? 'score-positive' : player.score < 0 ? 'score-negative' : 'score-zero'}`}>
            {player.score > 0 ? '+' : ''}{player.score} pts
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="player-card-right">
        {roomState === 'playing' && player.hasSkipped && (
          <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <FastForward size={11} /> SKIPPED
          </span>
        )}

        {roomState === 'playing' && player.hasConfirmed && (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', padding: '2px 6px' }}>
            <Check size={11} /> Ready
          </span>
        )}

        {showVoteBadge && (
          player.hasVoted ? (
            <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Check size={11} /> VOTED
            </span>
          ) : player.isOnline ? (
            <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(234,179,8,0.12)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={11} /> PENDING
            </span>
          ) : null
        )}

        {scoreChange !== null && scoreChange !== undefined && (
          <span className={`player-score-change ${scoreChange > 0 ? 'score-positive' : scoreChange < 0 ? 'score-negative' : 'score-zero'}`}>
            {scoreChange > 0 ? '+' : ''}{scoreChange}
          </span>
        )}

        {voteTarget && (
          <span className="player-vote-target">
            → {voteTarget}
          </span>
        )}

        {selected && (
          <span className="player-selected-check">
            <Check size={14} />
          </span>
        )}

        {canKick && onKick && (
          <button
            className="btn btn-ghost btn-sm player-kick-direct-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Remove ${player.name} from the room?`)) {
                onKick(player.id);
              }
            }}
            title={`Remove ${player.name}`}
            id={`kick-btn-${player.id}`}
            style={{ padding: '2px 6px' }}
          >
            <UserX size={14} className="text-danger" />
          </button>
        )}
      </div>
    </div>
  );
}
