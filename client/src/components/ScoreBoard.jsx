import { useGame } from '../context/GameContext.jsx';
import PlayerCard from './PlayerCard.jsx';
import './ScoreBoard.css';

export default function ScoreBoard({ compact = false }) {
  const { room, playerId } = useGame();

  if (!room || !room.players || room.players.length === 0) return null;

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  if (compact) {
    return (
      <div className="scoreboard-compact">
        <div className="scoreboard-compact-title">🏆 Scores</div>
        <div className="scoreboard-compact-list">
          {sortedPlayers.map((player, i) => (
            <div key={player.id} className={`scoreboard-compact-item ${player.id === playerId ? 'scoreboard-compact-self' : ''}`}>
              <span className="scoreboard-rank">#{i + 1}</span>
              <span className="scoreboard-name">{player.name}</span>
              <span className={`scoreboard-score ${player.score > 0 ? 'score-positive' : player.score < 0 ? 'score-negative' : 'score-zero'}`}>
                {player.score > 0 ? '+' : ''}{player.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="scoreboard glass-card">
      <div className="scoreboard-header">
        <span className="scoreboard-icon">🏆</span>
        <span className="title-sm">Scoreboard</span>
      </div>
      <div className="scoreboard-list stagger-children">
        {sortedPlayers.map((player, i) => (
          <PlayerCard
            key={player.id}
            player={player}
            index={room.players.findIndex(p => p.id === player.id)}
            isCurrentPlayer={player.id === playerId}
          />
        ))}
      </div>
    </div>
  );
}
