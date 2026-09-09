import { useEffect, useRef, useState } from 'react';
import { Sparkles, Eye } from 'lucide-react';
import './ScratchCard.css';

export default function ScratchCard({ isImposter, word, onRevealed }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width) || 300;
    const height = Math.floor(rect.height) || 160;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw metallic scratch foil
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#312e81');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Add grid/sparkle texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Add instruction text on foil
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 15px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ SCRATCH ME TO REVEAL ✨', width / 2, height / 2 - 10);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px Outfit, sans-serif';
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    ctx.fillText(
      isTouch ? 'Swipe with finger to scratch' : 'Click & hold to scratch',
      width / 2,
      height / 2 + 15
    );
  }, []);

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparent = 0;

    // Sample every 4th pixel for high performance
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) transparent++;
    }

    const totalSampled = pixels.length / 16;
    const ratio = transparent / totalSampled;

    if (ratio > 0.35) {
      setIsRevealed(true);
      if (onRevealed) onRevealed();
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const scratch = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const handleStart = (e) => {
    isDrawing.current = true;
    setIsScratching(true);
    const { x, y } = getCoordinates(e);
    scratch(x, y);
  };

  const handleMove = (e) => {
    if (!isDrawing.current || isRevealed) return;
    const { x, y } = getCoordinates(e);
    scratch(x, y);
  };

  const handleEnd = () => {
    isDrawing.current = false;
    setIsScratching(false);
  };

  const handleRevealAll = () => {
    setIsRevealed(true);
    if (onRevealed) onRevealed();
  };

  return (
    <div className="scratch-card-wrapper" ref={containerRef}>
      {/* Underneath Revealed Content */}
      <div className={`scratch-content ${isImposter ? 'scratch-imposter' : 'scratch-word'}`}>
        {isImposter ? (
          <>
            <div className="gameplay-imposter-icon">🔴</div>
            <div className="gameplay-imposter-text">YOU ARE THE</div>
            <div className="gameplay-imposter-title">IMPOSTER</div>
            <div className="gameplay-imposter-hint">
              You don't know the word. Blend in and don't get caught!
            </div>
          </>
        ) : (
          <>
            <div className="gameplay-word-label">The secret word is</div>
            <div className="gameplay-word">{word}</div>
            <div className="gameplay-word-hint">
              Don't let the imposter figure out the word!
            </div>
          </>
        )}
      </div>

      {/* Canvas Foil Overlay */}
      {!isRevealed && (
        <canvas
          ref={canvasRef}
          className={`scratch-canvas ${isScratching ? 'scratching' : ''}`}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      )}

      {/* Instant Reveal Button */}
      {!isRevealed && (
        <button className="btn btn-ghost btn-sm scratch-reveal-btn" onClick={handleRevealAll}>
          <Eye size={14} /> Reveal
        </button>
      )}
    </div>
  );
}
