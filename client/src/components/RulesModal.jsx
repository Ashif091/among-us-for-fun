import { useState } from 'react';
import './RulesModal.css';

export default function RulesModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="btn btn-ghost btn-icon rules-trigger"
        onClick={() => setIsOpen(true)}
        title="Game Rules & Scoring"
        id="rules-btn"
      >
        ℹ️
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content glass-card rules-modal" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost btn-icon modal-close" onClick={() => setIsOpen(false)}>✕</button>

            <h2 className="title-lg text-gradient" style={{ marginBottom: '16px' }}>How to Play</h2>

            <div className="rules-section">
              <h3 className="rules-heading">🎯 Goal</h3>
              <p className="rules-text">
                One player is secretly the <strong>Imposter</strong>. All other players see a secret word.
                The Imposter doesn't know the word and must blend in. Players question each other to find the Imposter!
              </p>
            </div>

            <div className="rules-section">
              <h3 className="rules-heading">🔄 Game Flow</h3>
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
              <h3 className="rules-heading">🏆 Scoring</h3>

              <div className="rules-score-block">
                <div className="rules-score-title">If Imposter is caught <span className="badge badge-success">MAJORITY VOTES</span></div>
                <ul className="rules-list">
                  <li><strong>Imposter:</strong> <span className="score-negative">−(votes against)</span></li>
                  <li><strong>Correct voters:</strong> <span className="score-positive">+1</span></li>
                  <li><strong>Wrong voters:</strong> <span className="score-zero">0</span></li>
                </ul>
              </div>

              <div className="rules-score-block">
                <div className="rules-score-title">If Imposter wins <span className="badge badge-danger">NOT CAUGHT</span></div>
                <ul className="rules-list">
                  <li><strong>Imposter:</strong> <span className="score-positive">+(players − votes against)</span></li>
                  <li><strong>All players:</strong> <span className="score-negative">−1</span></li>
                  <li>Correct guess + loss = <span className="score-zero">0 net</span></li>
                </ul>
              </div>

              <div className="rules-score-block">
                <div className="rules-score-title">If Draw <span className="badge badge-warning">TIE VOTES</span></div>
                <ul className="rules-list">
                  <li><strong>Imposter:</strong> <span className="score-zero">0</span></li>
                  <li><strong>Correct voters:</strong> <span className="score-positive">+1</span></li>
                  <li><strong>Wrong voters:</strong> <span className="score-zero">0</span></li>
                </ul>
              </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={() => setIsOpen(false)} style={{ marginTop: '8px' }}>
              Got it! 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}
