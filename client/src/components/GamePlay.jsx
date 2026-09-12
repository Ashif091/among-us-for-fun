import { useGame } from '../context/GameContext.jsx';
import ScoreBoard from './ScoreBoard.jsx';
import PlayerCard from './PlayerCard.jsx';
import ScratchCard from './ScratchCard.jsx';
import { FastForward, AlertTriangle, X, ThumbsUp, CheckCircle2, MessageSquare, Users, Vote, RotateCcw, LogOut } from 'lucide-react';
import { getCategoryEmoji, getCategoryLabel } from '../utils/constants.js';
import './GamePlay.css';

export default function GamePlay() {
  const { room, gameData, isHost, playerId, startVoting, restartGame, kickPlayer, confirmRead, leaveRoom, voteSkip, confirmSkipRound, cancelSkip, skipData } = useGame();

  if (!room || !gameData) return null;

  const currentPlayer = room.players.find(p => p.id === playerId);
  const hasConfirmed = currentPlayer?.hasConfirmed || false;
  const onlinePlayers = room.players.filter(p => p.isOnline);
  const skipCount = onlinePlayers.filter(p => p.hasSkipped).length;
  const totalOnline = onlinePlayers.length;
  const majorityCount = Math.floor(totalOnline / 2) + 1;
  const majorityReached = skipData?.majorityReached || (skipCount >= majorityCount && totalOnline > 0);

  return (
    <div className="page-container">
      <div className="gameplay-content animate-fade-in">
        {/* Round info */}
        <div className="gameplay-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-info">Round {room.roundNumber}</span>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
              {getCategoryEmoji(room.category)} {getCategoryLabel(room.category)}
            </span>
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

        {/* Interactive Scratch Card Reveal */}
        <ScratchCard isImposter={gameData.isImposter} word={gameData.word} isConfirmed={hasConfirmed} />

        {/* Skip Word Button */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '4px' }}>
          <button
            className={`btn btn-sm ${currentPlayer?.hasSkipped ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={voteSkip}
            id="vote-skip-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              padding: '4px 12px',
              borderRadius: '999px',
              border: currentPlayer?.hasSkipped ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.12)',
              background: currentPlayer?.hasSkipped ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
              color: currentPlayer?.hasSkipped ? '#c084fc' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <FastForward size={14} />
            {currentPlayer?.hasSkipped ? 'Skipped Word' : 'Vote to Skip Word'}
            {skipCount > 0 && (
              <span className="badge" style={{ marginLeft: '4px', background: 'rgba(168,85,247,0.3)', color: '#fff', padding: '1px 6px', fontSize: '0.7rem' }}>
                {skipCount}/{totalOnline}
              </span>
            )}
          </button>
        </div>

        {/* Host Majority Skip Confirmation Prompt */}
        {isHost && majorityReached && (
          <div className="glass-card animate-glow" style={{ border: '2px solid rgba(168,85,247,0.6)', padding: '16px', borderRadius: '12px', background: 'rgba(168,85,247,0.1)', textAlign: 'center', margin: '10px 0' }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#e9d5ff', marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={18} className="text-warning" /> Majority Voted to Skip Word! ({skipCount}/{totalOnline})
            </div>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
              Players find this secret word too difficult. Skip this round and pick a new secret word?
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={confirmSkipRound} id="host-confirm-skip-btn" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FastForward size={14} /> Skip & New Word
              </button>
              <button className="btn btn-ghost btn-sm" onClick={cancelSkip} id="host-cancel-skip-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <X size={14} /> Keep Playing
              </button>
            </div>
          </div>
        )}

        {/* Word Confirm / Read check button */}
        {!hasConfirmed ? (
          <button
            className="btn btn-primary btn-full btn-lg animate-glow"
            onClick={confirmRead}
            id="confirm-read-btn"
            style={{ animation: 'glowPulse 2s ease-in-out infinite', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <ThumbsUp size={20} /> I've Seen My Word / Role
          </button>
        ) : (
          <div 
            className="gameplay-confirmed-badge glass-card" 
            style={{ 
              padding: 'var(--space-sm) var(--space-md)', 
              textAlign: 'center', 
              borderColor: 'rgba(22,199,154,0.3)',
              background: 'rgba(22,199,154,0.02)'
            }}
          >
            <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Word Confirmed
            </span>
            <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
              Waiting for others to confirm...
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="gameplay-instructions glass-card">
          <div className="title-sm" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} className="text-primary" /> Discussion Time!
          </div>
          <p className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
            Take turns asking each other questions about the word.
            Identify the imposter — or blend in if you are the imposter!
          </p>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '8px' }}>
            Once everyone clicks confirm, the voting phase will start automatically.
          </p>
        </div>

        {/* Players List (Play Area with Crowns & Kicks) */}
        <div className="gameplay-players">
          <div className="title-sm" style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} className="text-primary" /> Players ({room.players.length})
          </div>
          <div className="gameplay-players-list stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {room.players.map((player, i) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={room.players.findIndex(p => p.id === player.id)}
                isCurrentPlayer={player.id === playerId}
                canKick={false}
                onKick={kickPlayer}
                roomState={room.state}
              />
            ))}
          </div>
        </div>

        {/* Scoreboard */}
        <ScoreBoard compact />

        {/* Host controls */}
        {isHost && (
          <div className="gameplay-host-actions" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
            <button
              className="btn btn-primary btn-full btn-lg gameplay-vote-btn"
              onClick={startVoting}
              id="start-voting-btn"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Vote size={20} /> Start Voting
            </button>
            <button
              className="btn btn-secondary btn-full"
              onClick={restartGame}
              id="restart-game-btn"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <RotateCcw size={16} /> Restart (Back to Lobby)
            </button>
          </div>
        )}

        {!isHost && (
          <div className="gameplay-waiting text-secondary" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            Waiting for host to start voting...
          </div>
        )}
      </div>
    </div>
  );
}
