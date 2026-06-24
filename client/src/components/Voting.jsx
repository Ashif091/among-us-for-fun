import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import PlayerCard from './PlayerCard.jsx';
import './Voting.css';

export default function Voting() {
  const { room, playerId, currentPlayer, castVote, votedCount, totalCount, isHost, restartGame, kickPlayer, leaveRoom } = useGame();
  const [selectedId, setSelectedId] = useState(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  if (!room) return null;

  const hasVoted = currentPlayer?.hasVoted || hasConfirmed;
  const otherPlayers = room.players.filter(p => p.id !== playerId);
  const progress = totalCount > 0 ? (votedCount / totalCount) * 100 : 0;

  const handleSelect = (id) => {
    if (hasVoted) return;
    setSelectedId(id === selectedId ? null : id);
  };

  const handleConfirmVote = () => {
    if (!selectedId || hasVoted) return;
    castVote(selectedId);
    setHasConfirmed(true);
  };

  return (
    <div className="page-container">
      <div className="voting-content animate-fade-in">
        {/* Header */}
        <div className="voting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="title-lg" style={{ margin: 0 }}>🗳️ Vote</h2>
            <span className="badge badge-danger">Round {room.roundNumber}</span>
          </div>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => { if (window.confirm("Are you sure you want to leave the room? This will abort the active round for everyone.")) leaveRoom(); }} 
            id="leave-room-btn"
          >
            🚪 Leave
          </button>
        </div>

        {/* Progress */}
        <div className="voting-progress">
          <div className="voting-progress-info">
            <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
              Votes cast
            </span>
            <span className="title-sm">{votedCount} / {totalCount}</span>
          </div>
          <div className="voting-progress-bar">
            <div
              className="voting-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Voting state */}
        {hasVoted ? (
          <div className="voting-done glass-card">
            <div className="voting-done-icon">✅</div>
            <div className="title-md">Vote Submitted!</div>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
              Waiting for others to vote...
            </p>
            <div className="voting-done-dots">
              <span className="lobby-dot" />
              <span className="lobby-dot" />
              <span className="lobby-dot" />
            </div>
            {isHost && (
              <button
                className="btn btn-secondary btn-full animate-fade-in"
                onClick={restartGame}
                style={{ marginTop: '24px' }}
                id="host-abort-vote-btn"
              >
                🔄 Restart (Back to Lobby)
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-secondary text-center" style={{ fontSize: '0.9rem' }}>
              Who do you think is the <strong style={{ color: 'var(--color-danger)' }}>Imposter</strong>?
              <br />
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Your vote is final — choose wisely!</span>
            </p>

            {/* Player list */}
            <div className="voting-players stagger-children">
              {otherPlayers.map((player, i) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  index={room.players.findIndex(p => p.id === player.id)}
                  showScore={false}
                  onClick={handleSelect}
                  selected={selectedId === player.id}
                  disabled={!player.isOnline}
                  showVoteBadge={true}
                  canKick={false}
                  onKick={kickPlayer}
                />
              ))}
            </div>

            {/* Confirm & Host Reset buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%', marginTop: 'var(--space-md)' }}>
              <button
                className="btn btn-primary btn-full btn-lg voting-confirm-btn"
                onClick={handleConfirmVote}
                disabled={!selectedId}
                id="confirm-vote-btn"
              >
                {selectedId
                  ? `⚡ Vote for ${otherPlayers.find(p => p.id === selectedId)?.name}`
                  : 'Select a player to vote'
                }
              </button>
              {isHost && (
                <button
                  className="btn btn-secondary btn-full"
                  onClick={restartGame}
                  id="host-abort-vote-btn"
                >
                  🔄 Restart (Back to Lobby)
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
