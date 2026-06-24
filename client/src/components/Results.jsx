import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext.jsx';
import PlayerCard from './PlayerCard.jsx';
import './Results.css';

export default function Results() {
  const { room, results, playerId, isHost, startGame, restartGame, leaveRoom } = useGame();
  // Track whether the current player has acknowledged the results
  const [acknowledged, setAcknowledged] = useState(false);
  // Store a frozen snapshot of results so it doesn't disappear when room transitions
  const frozenResults = useRef(results);
  const frozenRoom = useRef(room);

  useEffect(() => {
    if (results) frozenResults.current = results;
    if (room) frozenRoom.current = room;
  }, [results, room]);

  const displayResults = frozenResults.current;
  const displayRoom   = frozenRoom.current;

  if (!displayRoom || !displayResults) return null;

  const {
    imposterId, imposterName, imposterCaught, isDraw,
    votes, voteCount, scoreChanges,
  } = displayResults;

  // Build player name map
  const playerNameMap = {};
  displayRoom.players.forEach(p => { playerNameMap[p.id] = p.name; });

  // Outcome
  let outcomeEmoji, outcomeText, outcomeClass;
  if (imposterCaught) {
    outcomeEmoji = '🎉';
    outcomeText  = 'Imposter Caught!';
    outcomeClass = 'results-outcome-caught';
  } else if (isDraw) {
    outcomeEmoji = '🤝';
    outcomeText  = "It's a Draw!";
    outcomeClass = 'results-outcome-draw';
  } else {
    outcomeEmoji = '😈';
    outcomeText  = 'Imposter Wins!';
    outcomeClass = 'results-outcome-wins';
  }

  return (
    <div className="page-container">
      <div className="results-content animate-fade-in">

        {/* ── Header ── */}
        <div className="results-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="title-lg" style={{ margin: 0 }}>📊 Results</h2>
            <span className="badge badge-info">Round {displayRoom.roundNumber}</span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (window.confirm('Leave the room? You will return to the home screen.')) leaveRoom();
            }}
            id="leave-room-btn"
          >
            🚪 Leave
          </button>
        </div>

        {/* ── Outcome Banner ── */}
        <div className={`results-outcome glass-card ${outcomeClass}`}>
          <div className="results-outcome-emoji">{outcomeEmoji}</div>
          <div className="results-outcome-text">{outcomeText}</div>
        </div>

        {/* ── Imposter Reveal ── */}
        <div className="results-imposter glass-card">
          <div className="results-imposter-label">The Imposter was</div>
          <div className="results-imposter-name">🔴 {imposterName}</div>
          <div className="results-imposter-score">
            Score change:&nbsp;
            <span className={
              (scoreChanges[imposterId] || 0) > 0 ? 'score-positive'
              : (scoreChanges[imposterId] || 0) < 0 ? 'score-negative'
              : 'score-zero'
            }>
              {(scoreChanges[imposterId] || 0) > 0 ? '+' : ''}{scoreChanges[imposterId] || 0}
            </span>
          </div>
        </div>

        {/* ── Vote Breakdown (who voted for whom) ── */}
        <div className="results-votes">
          <h3 className="title-sm" style={{ marginBottom: '12px' }}>🗳️ Who Voted For Whom</h3>
          <div className="results-votes-list stagger-children">
            {displayRoom.players.map((player, i) => {
              const votedForId   = votes[player.id];
              const votedForName = votedForId ? playerNameMap[votedForId] : null;
              const change       = scoreChanges[player.id];
              const isImposterP  = player.id === imposterId;

              // Arrow label: e.g. "voted → Alice ✅" or "voted → Bob ❌"
              let voteLabel;
              if (isImposterP) {
                voteLabel = votedForName ? `voted → ${votedForName}` : '(no vote)';
              } else {
                voteLabel = votedForName
                  ? `voted → ${votedForName} ${votedForId === imposterId ? '✅' : '❌'}`
                  : '(no vote)';
              }

              return (
                <div
                  key={player.id}
                  className={`results-vote-row glass-card ${isImposterP ? 'results-vote-row-imposter' : ''}`}
                >
                  {/* Avatar + name */}
                  <PlayerCard
                    player={player}
                    index={i}
                    isCurrentPlayer={player.id === playerId}
                    scoreChange={change}
                    canKick={false}
                    showScore
                  />
                  {/* Vote arrow */}
                  <div className="results-vote-arrow">
                    {voteLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Vote Counts Bar ── */}
        <div className="results-summary glass-card">
          <h3 className="title-sm" style={{ marginBottom: '12px' }}>📊 Votes Received</h3>
          <div className="results-counts">
            {displayRoom.players
              .slice()
              .sort((a, b) => (voteCount[b.id] || 0) - (voteCount[a.id] || 0))
              .map(player => (
                <div
                  key={player.id}
                  className={`results-count-item ${player.id === imposterId ? 'results-count-imposter' : ''}`}
                >
                  <span className="results-count-name">
                    {player.id === imposterId && '🔴 '}
                    {player.name}
                  </span>
                  <div className="results-count-bar-wrapper">
                    <div
                      className="results-count-bar"
                      style={{
                        width: `${((voteCount[player.id] || 0) / Math.max(displayRoom.players.length, 1)) * 100}%`,
                        background: player.id === imposterId
                          ? 'linear-gradient(90deg, var(--color-danger), var(--color-accent))'
                          : 'linear-gradient(90deg, var(--bg-elevated), var(--text-muted))',
                      }}
                    />
                  </div>
                  <span className="results-count-num">{voteCount[player.id] || 0}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* ── Scoreboard ── */}
        <div className="results-scores glass-card">
          <h3 className="title-sm" style={{ marginBottom: '12px' }}>🏆 Current Scores</h3>
          <div className="results-scores-list">
            {displayRoom.players
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((player, rank) => (
                <div key={player.id} className="results-score-row">
                  <span className="results-score-rank">#{rank + 1}</span>
                  <span className="results-score-name">
                    {player.id === imposterId && '🔴 '}
                    {player.name}
                    {player.id === playerId && <span className="badge badge-info" style={{ fontSize: '0.6rem', marginLeft: '6px', padding: '1px 5px' }}>YOU</span>}
                  </span>
                  <span className={`results-score-val ${player.score > 0 ? 'score-positive' : player.score < 0 ? 'score-negative' : 'score-zero'}`}>
                    {player.score > 0 ? '+' : ''}{player.score} pts
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        {/* ── Acknowledgement (all players) ── */}
        {!acknowledged && (
          <button
            className="btn btn-primary btn-full btn-lg results-ack-btn animate-scale-up"
            onClick={() => setAcknowledged(true)}
            id="acknowledge-results-btn"
          >
            ✅ I've Seen the Results
          </button>
        )}

        {/* ── Host actions (visible after ack) ── */}
        {acknowledged && isHost && (
          <div className="results-actions animate-slide-up">
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={startGame}
              id="next-round-btn"
            >
              ⚡ Next Round
            </button>
            <button
              className="btn btn-secondary btn-full"
              onClick={restartGame}
              id="restart-game-btn"
            >
              🔄 Back to Lobby
            </button>
          </div>
        )}

        {/* Non-host waiting message (after ack) */}
        {acknowledged && !isHost && (
          <div className="results-waiting text-secondary text-center animate-fade-in" style={{ fontSize: '0.85rem' }}>
            <div className="lobby-waiting-dots" style={{ justifyContent: 'center', marginBottom: '6px' }}>
              <span className="lobby-dot" />
              <span className="lobby-dot" />
              <span className="lobby-dot" />
            </div>
            Waiting for host to start the next round...
          </div>
        )}

      </div>
    </div>
  );
}
