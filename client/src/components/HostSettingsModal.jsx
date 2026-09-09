import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { getCategoryEmoji, getCategoryLabel } from '../utils/constants.js';
import './HostSettingsModal.css';

export default function HostSettingsModal({ isOpen, onClose }) {
  const { room, categories, updateConfig, resetScores } = useGame();
  const [showResetWarning, setShowResetWarning] = useState(false);

  if (!isOpen || !room) return null;

  const s = room.settings || {};
  const maxPlayers = s.maxPlayers ?? 15;
  const correctScore = s.correctScore ?? 1;
  const wrongScore = s.wrongScore ?? -1;
  const votePenaltyMultiplier = s.votePenaltyMultiplier ?? 0;

  const handleCategoryChange = (e) => {
    updateConfig({ category: e.target.value });
  };

  const handleMaxPlayersChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) updateConfig({ maxPlayers: val });
  };

  const handleCorrectScoreChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) updateConfig({ correctScore: val });
  };

  const handleWrongScoreChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) updateConfig({ wrongScore: val });
  };

  const handleVotePenaltyChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) updateConfig({ votePenaltyMultiplier: val });
  };

  const handleResetConfirm = () => {
    resetScores();
    setShowResetWarning(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card host-settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn btn-ghost btn-icon modal-close"
          onClick={onClose}
          id="settings-modal-close"
        >
          ✕
        </button>

        <h2 className="title-lg text-gradient" style={{ marginBottom: '20px' }}>
          ⚙️ Room Settings
        </h2>

        {/* Category */}
        <div className="hs-section">
          <div className="hs-section-title">📂 Category</div>
          <select
            id="settings-category-select"
            className="select"
            value={room.category}
            onChange={handleCategoryChange}
          >
            {(categories.length > 0 ? categories : ['objects']).map(cat => (
              <option key={cat} value={cat}>
                {getCategoryEmoji(cat)} {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Max Players */}
        <div className="hs-section">
          <div className="hs-section-title">
            👥 Max Players
            <span className="hs-badge">{maxPlayers}</span>
          </div>
          <div className="hs-slider-row">
            <span className="hs-range-label">3</span>
            <input
              id="settings-max-players"
              type="range"
              className="hs-range"
              min={3}
              max={25}
              step={1}
              value={maxPlayers}
              onChange={handleMaxPlayersChange}
            />
            <span className="hs-range-label">25</span>
          </div>
          <div className="hs-hint">
            Current room: {room.players.length} / {maxPlayers} players
          </div>
        </div>

        {/* Scoring Rules */}
        <div className="hs-section">
          <div className="hs-section-title">🏆 Scoring Rules</div>

          <div className="hs-score-grid">
            {/* Correct vote score */}
            <div className="hs-score-row">
              <div className="hs-score-desc">
                <span className="hs-score-emoji">✅</span>
                <div>
                  <div className="hs-score-label">Correct Vote</div>
                  <div className="hs-score-sublabel">Player correctly identifies imposter</div>
                </div>
              </div>
              <div className="hs-score-input-wrap">
                <button
                  className="hs-stepper"
                  onClick={() => updateConfig({ correctScore: correctScore - 1 })}
                >−</button>
                <input
                  id="settings-correct-score"
                  type="number"
                  className="hs-number-input"
                  value={correctScore}
                  onChange={handleCorrectScoreChange}
                />
                <button
                  className="hs-stepper"
                  onClick={() => updateConfig({ correctScore: correctScore + 1 })}
                >+</button>
              </div>
            </div>

            {/* Wrong vote score */}
            <div className="hs-score-row">
              <div className="hs-score-desc">
                <span className="hs-score-emoji">❌</span>
                <div>
                  <div className="hs-score-label">Wrong Vote</div>
                  <div className="hs-score-sublabel">Player votes for the wrong person</div>
                </div>
              </div>
              <div className="hs-score-input-wrap">
                <button
                  className="hs-stepper"
                  onClick={() => updateConfig({ wrongScore: wrongScore - 1 })}
                >−</button>
                <input
                  id="settings-wrong-score"
                  type="number"
                  className="hs-number-input"
                  value={wrongScore}
                  onChange={handleWrongScoreChange}
                />
                <button
                  className="hs-stepper"
                  onClick={() => updateConfig({ wrongScore: wrongScore + 1 })}
                >+</button>
              </div>
            </div>

            {/* Vote penalty multiplier */}
            <div className="hs-score-row hs-score-row-penalty">
              <div className="hs-score-desc">
                <span className="hs-score-emoji">🎯</span>
                <div>
                  <div className="hs-score-label">
                    Vote Received Penalty
                    <span className="hs-badge hs-badge-info">per vote</span>
                  </div>
                  <div className="hs-score-sublabel">
                    Deducted <em>per vote received</em> by each player (0 = disabled)
                  </div>
                </div>
              </div>
              <div className="hs-score-input-wrap">
                <button
                  className="hs-stepper"
                  onClick={() => updateConfig({ votePenaltyMultiplier: Math.max(0, votePenaltyMultiplier - 0.5) })}
                >−</button>
                <input
                  id="settings-vote-penalty"
                  type="number"
                  className="hs-number-input"
                  min={0}
                  step={0.5}
                  value={votePenaltyMultiplier}
                  onChange={handleVotePenaltyChange}
                />
                <button
                  className="hs-stepper"
                  onClick={() => updateConfig({ votePenaltyMultiplier: votePenaltyMultiplier + 0.5 })}
                >+</button>
              </div>
            </div>
          </div>

          <div className="hs-scoring-summary glass-card">
            <div className="hs-summary-title">📋 Current Scoring Summary</div>
            <ul className="hs-summary-list">
              <li>Correct vote → <span className={correctScore >= 0 ? 'score-positive' : 'score-negative'}>{correctScore > 0 ? '+' : ''}{correctScore}</span></li>
              <li>Wrong vote → <span className={wrongScore >= 0 ? 'score-positive' : 'score-negative'}>{wrongScore > 0 ? '+' : ''}{wrongScore}</span></li>
              <li>Votes received penalty → <span className="score-negative">−{votePenaltyMultiplier} × (votes received)</span></li>
            </ul>
          </div>
        </div>

        {/* Reset Scoreboard */}
        <div className="hs-section">
          <div className="hs-section-title">⚠️ Danger Zone</div>
          {!showResetWarning ? (
            <button
              className="btn btn-outline-danger btn-full"
              id="reset-scores-btn"
              onClick={() => setShowResetWarning(true)}
            >
              🗑️ Reset All Scores
            </button>
          ) : (
            <div className="hs-reset-warning glass-card">
              <div className="hs-reset-warning-icon">⚠️</div>
              <div className="hs-reset-warning-title">Are you sure?</div>
              <p className="hs-reset-warning-text">
                This will permanently reset <strong>all player scores to 0</strong>. This cannot be undone!
              </p>
              <div className="hs-reset-buttons">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowResetWarning(false)}
                  id="reset-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleResetConfirm}
                  id="reset-confirm-btn"
                >
                  Yes, Reset Scores
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-primary btn-full" onClick={onClose} id="settings-done-btn">
          Done ✓
        </button>
      </div>
    </div>
  );
}
