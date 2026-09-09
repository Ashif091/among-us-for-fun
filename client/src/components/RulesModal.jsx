import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { getCategoryEmoji, getCategoryLabel } from '../utils/constants.js';
import { Info, Target, RefreshCw, Trophy, X, CheckCircle2, Sliders, Users, FolderOpen } from 'lucide-react';
import './RulesModal.css';

export default function RulesModal() {
  const { room } = useGame();
  const [isOpen, setIsOpen] = useState(false);

  const settings = room?.settings || {};
  const maxPlayers = settings.maxPlayers ?? 15;
  const correctScore = settings.correctScore ?? 1;
  const wrongScore = settings.wrongScore ?? -1;
  const votePenaltyMultiplier = settings.votePenaltyMultiplier ?? 0;
  const category = room?.category || 'anything';

  return (
    <>
      <button
        className="btn info-trigger"
        onClick={() => setIsOpen(true)}
        title="Game Info & Settings"
        id="info-btn"
      >
        <Info size={16} className="info-trigger-icon" />
        <span className="info-trigger-label">Info</span>
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content glass-card rules-modal" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost btn-icon modal-close" onClick={() => setIsOpen(false)} id="info-modal-close">
              <X size={20} />
            </button>

            <h2 className="title-lg text-gradient" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={24} /> Game Info & Rules
            </h2>

            {/* Room Configuration Section (Read-only) */}
            <div className="rules-section room-info-card">
              <h3 className="rules-heading" style={{ color: '#4a9eff' }}>
                <Sliders size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Active Room Settings
              </h3>
              <div className="room-info-grid">
                <div className="room-info-item">
                  <div className="room-info-label"><FolderOpen size={14} /> Category</div>
                  <div className="room-info-value">{getCategoryEmoji(category)} {getCategoryLabel(category)}</div>
                </div>
                <div className="room-info-item">
                  <div className="room-info-label"><Users size={14} /> Max Players</div>
                  <div className="room-info-value">{maxPlayers} players</div>
                </div>
                <div className="room-info-item">
                  <div className="room-info-label"><Trophy size={14} /> Scoring System</div>
                  <div className="room-info-subgrid">
                    <span className="badge badge-success">Correct Vote: {correctScore > 0 ? `+${correctScore}` : correctScore}</span>
                    <span className="badge badge-danger">Wrong Vote: {wrongScore}</span>
                    <span className="badge badge-warning">
                      Penalty: {votePenaltyMultiplier > 0 ? `-${votePenaltyMultiplier}/vote` : 'None (0)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rules-section">
              <h3 className="rules-heading"><Target size={18} style={{marginRight: '6px', verticalAlign: 'middle'}}/> Goal</h3>
              <p className="rules-text">
                One player is secretly the <strong>Imposter</strong>. All other players see a secret word.
                The Imposter doesn't know the word and must blend in. Players question each other to find the Imposter!
              </p>
            </div>

            <div className="rules-section">
              <h3 className="rules-heading"><RefreshCw size={18} style={{marginRight: '6px', verticalAlign: 'middle'}}/> Game Flow</h3>
              <ol className="rules-list">
                <li>Host creates a room &amp; picks a category</li>
                <li>Everyone gets the secret word — except the Imposter</li>
                <li>Players take turns asking each other questions</li>
                <li>When ready, the Host starts voting</li>
                <li>Everyone votes on who they think is the Imposter</li>
                <li>Results are revealed!</li>
              </ol>
            </div>

            <div className="rules-section">
              <h3 className="rules-heading"><Trophy size={18} style={{marginRight: '6px', verticalAlign: 'middle'}}/> Detailed Scoring</h3>

              <div className="rules-score-block">
                <div className="rules-score-title">If Imposter is caught <span className="badge badge-success">MAJORITY VOTES</span></div>
                <ul className="rules-list">
                  <li><strong>Imposter:</strong> <span className={votePenaltyMultiplier > 0 ? "score-negative" : "score-zero"}>{votePenaltyMultiplier > 0 ? `−(votes against × ${votePenaltyMultiplier})` : '0'}</span></li>
                  <li><strong>Correct voters:</strong> <span className={correctScore > 0 ? "score-positive" : "score-negative"}>{correctScore > 0 ? `+${correctScore}` : correctScore}</span></li>
                  <li><strong>Wrong voters:</strong> <span className={wrongScore < 0 ? "score-negative" : "score-positive"}>{wrongScore}</span></li>
                </ul>
              </div>

              <div className="rules-score-block">
                <div className="rules-score-title">If Imposter wins <span className="badge badge-danger">NOT CAUGHT</span></div>
                <ul className="rules-list">
                  <li><strong>Imposter:</strong> <span className="score-positive">+(players − votes against)</span></li>
                  <li><strong>All players:</strong> <span className={wrongScore < 0 ? "score-negative" : "score-positive"}>{wrongScore}</span></li>
                  <li><strong>Correct voters:</strong> <span className={correctScore > 0 ? "score-positive" : "score-negative"}>{correctScore > 0 ? `+${correctScore}` : correctScore}</span> (net {correctScore + wrongScore})</li>
                </ul>
              </div>

              <div className="rules-score-block">
                <div className="rules-score-title">If Draw <span className="badge badge-warning">TIE VOTES</span></div>
                <ul className="rules-list">
                  <li><strong>Imposter:</strong> <span className="score-zero">0</span></li>
                  <li><strong>Correct voters:</strong> <span className={correctScore > 0 ? "score-positive" : "score-negative"}>{correctScore > 0 ? `+${correctScore}` : correctScore}</span></li>
                  <li><strong>Wrong voters:</strong> <span className={wrongScore < 0 ? "score-negative" : "score-positive"}>{wrongScore}</span></li>
                </ul>
              </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={() => setIsOpen(false)} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} /> Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

