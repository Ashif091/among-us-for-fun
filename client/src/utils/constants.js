/** Category display names and emoji icons */
export const CATEGORY_META = {
  anything: { emoji: '🎲', label: 'Anything (Random)' },
  fruits: { emoji: '🍎', label: 'Fruits' },
  animals: { emoji: '🐾', label: 'Animals' },
  electronics: { emoji: '📱', label: 'Electronics' },
  vehicles: { emoji: '🚗', label: 'Vehicles' },
  sports: { emoji: '⚽', label: 'Sports' },
  colors: { emoji: '🎨', label: 'Colors' },
  countries: { emoji: '🌍', label: 'Countries' },
  food: { emoji: '🍕', label: 'Food' },
  clothing: { emoji: '👕', label: 'Clothing' },
  instruments: { emoji: '🎵', label: 'Instruments' },
  objects: { emoji: '🔧', label: 'Objects' },
  movies: { emoji: '🎬', label: 'Movies' },
};

/** Get emoji for a category */
export function getCategoryEmoji(category) {
  return CATEGORY_META[category]?.emoji || '📦';
}

/** Get label for a category */
export function getCategoryLabel(category) {
  return CATEGORY_META[category]?.label || category;
}

/** Player avatar colors based on index */
export const PLAYER_COLORS = [
  '#e94560', '#533483', '#16c79a', '#f5a623', '#4a9eff',
  '#ff6b9d', '#845ec2', '#00c9a7', '#ffc75f', '#0089ba',
  '#c34a36', '#4b4453', '#b0a8b9', '#ff8066', '#2c73d2',
];

/** Get player color */
export function getPlayerColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

/** LocalStorage keys */
export const STORAGE_KEYS = {
  PLAYER_ID: 'imposter_player_id',
  PLAYER_NAME: 'imposter_player_name',
  ROOM_CODE: 'imposter_room_code',
  SAVED_USER_NAME: 'imposter_saved_user_name',
};

/** Save persistent user name for future sessions */
export function saveSavedName(name) {
  try {
    if (name && name.trim()) {
      localStorage.setItem(STORAGE_KEYS.SAVED_USER_NAME, name.trim());
    }
  } catch (e) {
    console.warn('Failed to save user name:', e);
  }
}

/** Get persistent user name */
export function getSavedName() {
  try {
    return localStorage.getItem(STORAGE_KEYS.SAVED_USER_NAME) || localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || '';
  } catch (e) {
    return '';
  }
}

/** Save session to localStorage */
export function saveSession(playerId, playerName, roomCode) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, playerName);
    localStorage.setItem(STORAGE_KEYS.ROOM_CODE, roomCode);
    if (playerName && playerName.trim()) {
      localStorage.setItem(STORAGE_KEYS.SAVED_USER_NAME, playerName.trim());
    }
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

/** Load session from localStorage */
export function loadSession() {
  try {
    const playerId = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
    const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    const roomCode = localStorage.getItem(STORAGE_KEYS.ROOM_CODE);
    if (playerId && playerName && roomCode) {
      return { playerId, playerName, roomCode };
    }
  } catch (e) {
    console.warn('Failed to load session:', e);
  }
  return null;
}

/** Clear session from localStorage */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
    localStorage.removeItem(STORAGE_KEYS.ROOM_CODE);
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
}

/** Format score with sign */
export function formatScore(score) {
  if (score > 0) return `+${score}`;
  return `${score}`;
}

/** Format score change */
export function formatScoreChange(change) {
  if (change > 0) return `+${change}`;
  if (change < 0) return `${change}`;
  return '0';
}

/** Base URL for sharing — reads from Vite env or falls back to production URL */
const APP_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) ||
  'https://among-us-for-fun.vercel.app';

/** Build a shareable room link */
export function getRoomShareUrl(roomCode) {
  return `${APP_BASE_URL}?rm=${roomCode}`;
}

/** Trigger the native share sheet (Web Share API) or fall back to clipboard copy */
export async function shareRoom(roomCode, onCopied) {
  const url = getRoomShareUrl(roomCode);
  const text = `Join my imposter game! Room code: ${roomCode}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: '🕵️ Find the Imposter', text, url });
      return 'shared';
    } catch (err) {
      // User cancelled — not an error
      if (err.name !== 'AbortError') console.warn('Share failed:', err);
      return 'cancelled';
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    if (onCopied) onCopied();
    return 'copied';
  } catch {
    // Last resort: prompt with the URL
    window.prompt('Copy this link to share:', url);
    return 'prompted';
  }
}

