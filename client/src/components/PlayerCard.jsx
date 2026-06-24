import { getPlayerColor } from '../utils/constants.js';
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
}) {
  const color = getPlayerColor(index);
  const initials = player.name.charAt(0).toUpperCase();

  return (
    <div
      className={`player-card ${onClick ? 'player-card-clickable' : ''} ${selected ? 'player-card-selected' : ''} ${disabled ? 'player-card-disabled' : ''} ${!player.isOnline ? 'player-card-offline' : ''} ${isCurrentPlayer ? 'player-card-self' : ''}`}
      onClick={!disabled && onClick ? () => onClick(player.id) : undefined}
      style={{ '--player-color': color }}
    >
      {/* Avatar */}
      <div className="player-avatar" style={{ background: player.isOnline ? color : 'var(--text-muted)' }}>
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
        {roomState === 'playing' && player.hasConfirmed && (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>✓</span> Ready
          </span>
        )}

        {showVoteBadge && player.hasVoted && (
          <span className="badge badge-success">VOTED</span>
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
          <span className="player-selected-check">✓</span>
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
          >
            ❌
          </button>
        )}
      </div>
    </div>
  );
}
