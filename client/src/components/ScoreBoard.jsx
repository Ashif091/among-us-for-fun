import { useGame } from '../context/GameContext.jsx';
import PlayerCard from './PlayerCard.jsx';
import { Crown, Trophy } from 'lucide-react';
import './ScoreBoard.css';

export default function ScoreBoard({ compact = false }) {
  const { room, playerId } = useGame();

  if (!room || !room.players || room.players.length === 0) return null;

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...room.players.map(p => p.score), 0);

  if (compact) {
    return (
      <div className="scoreboard-compact">
        <div className="scoreboard-compact-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Trophy size={14} className="text-warning" /> Scores
        </div>
        <div className="scoreboard-compact-list">
          {sortedPlayers.map((player, i) => {
            const isLeader = player.score > 0 && player.score === maxScore;
            return (
              <div
                key={player.id}
                className={`scoreboard-compact-item ${player.id === playerId ? 'scoreboard-compact-self' : ''}`}
                style={{
                  border: isLeader ? '1px solid rgba(251,191,36,0.5)' : undefined,
                  background: isLeader ? 'rgba(251,191,36,0.08)' : undefined,
                }}
              >
                <span className="scoreboard-rank" style={{ color: isLeader ? '#fbbf24' : undefined, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  {isLeader ? <Crown size={12} style={{ color: '#fbbf24', fill: '#fbbf24' }} /> : `#${i + 1}`}
                </span>
                <span className="scoreboard-name" style={{ color: isLeader ? '#fbbf24' : undefined, fontWeight: isLeader ? 'bold' : 'normal' }}>
                  {player.name}
                </span>
                <span className={`scoreboard-score ${player.score > 0 ? 'score-positive' : player.score < 0 ? 'score-negative' : 'score-zero'}`}>
                  {player.score > 0 ? '+' : ''}{player.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="scoreboard glass-card">
      <div className="scoreboard-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Trophy size={18} className="text-warning" />
        <span className="title-sm">Scoreboard</span>
      </div>
      <div className="scoreboard-list stagger-children">
        {sortedPlayers.map((player, i) => {
          const isLeader = player.score > 0 && player.score === maxScore;
          return (
            <PlayerCard
              key={player.id}
              player={player}
              index={room.players.findIndex(p => p.id === player.id)}
              isCurrentPlayer={player.id === playerId}
              isLeader={isLeader}
            />
          );
        })}
      </div>
    </div>
  );
}
