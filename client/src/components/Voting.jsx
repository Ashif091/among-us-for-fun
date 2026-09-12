import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import PlayerCard from './PlayerCard.jsx';
import { Vote, LogOut, CheckCircle2, Check, Clock, RotateCcw, Zap } from 'lucide-react';
import './Voting.css';

export default function Voting() {
  const { room, playerId, currentPlayer, castVote, votedCount, totalCount, isHost, restartGame, kickPlayer, leaveRoom } = useGame();
  const [selectedId, setSelectedId] = useState(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  if (!room) return null;

  const hasVoted = currentPlayer?.hasVoted || hasConfirmed;
  const otherPlayers = room.players.filter(p => p.id !== playerId);
  const totalRoomPlayers = room.players.length;
  const progress = totalRoomPlayers > 0 ? (votedCount / totalRoomPlayers) * 100 : 0;

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
            <Vote size={22} className="text-primary" />
            <h2 className="title-lg" style={{ margin: 0 }}>Vote</h2>
            <span className="badge badge-danger">Round {room.roundNumber}</span>
          </div>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => { if (window.confirm("Are you sure you want to leave the room? This will abort the active round for everyone.")) leaveRoom(); }} 
            id="leave-room-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Leave
          </button>
        </div>

        {/* Progress */}
        <div className="voting-progress">
          <div className="voting-progress-info">
            <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
              Votes cast
            </span>
            <span className="title-sm">{votedCount} / {totalRoomPlayers}</span>
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
            <div className="voting-done-icon">
              <CheckCircle2 size={48} className="text-success" />
            </div>
            <div className="title-md" style={{ marginTop: '8px' }}>Vote Submitted!</div>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
              Waiting for remaining players to vote...
            </p>
            <div className="voting-done-dots">
              <span className="lobby-dot" />
              <span className="lobby-dot" />
              <span className="lobby-dot" />
            </div>

            {/* Live Voting Progress Breakdown */}
            <div style={{ marginTop: '20px', width: '100%', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Live Player Status ({votedCount}/{totalRoomPlayers}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {room.players.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontWeight: p.id === playerId ? 'bold' : 'normal', fontSize: '0.9rem' }}>
                      {p.name} {p.id === playerId && <span className="text-muted" style={{ fontSize: '0.75rem' }}>(You)</span>}
                    </span>
                    {p.hasVoted ? (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Voted
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(234,179,8,0.12)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Pending Vote
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isHost && (
              <button
                className="btn btn-secondary btn-full animate-fade-in"
                onClick={restartGame}
                style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                id="host-abort-vote-btn"
              >
                <RotateCcw size={16} /> Restart (Back to Lobby)
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
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {selectedId ? (
                  <>
                    <Zap size={18} /> Vote for {otherPlayers.find(p => p.id === selectedId)?.name}
                  </>
                ) : (
                  'Select a player to vote'
                )}
              </button>
              {isHost && (
                <button
                  className="btn btn-secondary btn-full"
                  onClick={restartGame}
                  id="host-abort-vote-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <RotateCcw size={16} /> Restart (Back to Lobby)
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
