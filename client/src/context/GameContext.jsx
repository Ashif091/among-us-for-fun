import { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket.js';
import { saveSession, loadSession, clearSession } from '../utils/constants.js';

const GameContext = createContext(null);

// ─── State Shape ────────────────────────────────────────────────
const initialState = {
  // Connection
  screen: 'home', // 'home' | 'lobby' | 'playing' | 'voting' | 'results'

  // Player info
  playerId: null,
  playerName: '',

  // Room info
  room: null,        // { code, state, category, players, roundNumber }
  categories: [],

  // Game data
  gameData: null,    // { word, isImposter }

  // Voting
  votedCount: 0,
  totalCount: 0,

  // Results
  results: null,

  // UI
  error: null,
  toast: null,
};

// ─── Reducer ────────────────────────────────────────────────────
function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };

    case 'SET_PLAYER':
      return { ...state, playerId: action.payload.playerId, playerName: action.payload.playerName };

    case 'SET_ROOM':
      return { ...state, room: action.payload };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'ROOM_CREATED':
    case 'ROOM_JOINED':
      return {
        ...state,
        screen: 'lobby',
        playerId: action.payload.playerId,
        room: action.payload.room,
        categories: action.payload.categories || state.categories,
        gameData: null,
        results: null,
      };

    case 'ROOM_REJOINED': {
      const rejoinedPlayerId = action.payload.playerId || state.playerId;
      const rejoinedPlayer = action.payload.room?.players?.find(p => p.id === rejoinedPlayerId);
      return {
        ...state,
        screen: action.payload.gameData
          ? (action.payload.room.state === 'voting' ? 'voting' : 'playing')
          : (action.payload.room.state === 'results' ? 'results' : 'lobby'),
        room: action.payload.room,
        playerId: rejoinedPlayerId,
        playerName: rejoinedPlayer?.name || state.playerName,
        gameData: action.payload.gameData || state.gameData,
        categories: action.payload.categories || state.categories,
      };
    }

    case 'PLAYER_UPDATE':
      return { ...state, room: action.payload.room };

    case 'CONFIG_UPDATED':
      return { ...state, room: action.payload.room };


    case 'GAME_STARTED':
      return {
        ...state,
        screen: 'playing',
        gameData: { word: action.payload.word, isImposter: action.payload.isImposter },
        room: action.payload.room,
        results: null,
      };

    case 'VOTING_STARTED':
      return {
        ...state,
        screen: 'voting',
        room: action.payload.room,
        votedCount: 0,
        totalCount: action.payload.room.players.filter(p => p.isOnline).length,
      };

    case 'VOTE_UPDATE':
      return {
        ...state,
        room: action.payload.room,
        votedCount: action.payload.votedCount,
        totalCount: action.payload.totalCount,
      };

    case 'ROUND_RESULTS':
      return {
        ...state,
        screen: 'results',
        results: action.payload,
        room: action.payload.room,
      };

    case 'GAME_RESTARTED':
      return {
        ...state,
        screen: 'lobby',
        room: action.payload.room,
        gameData: null,
        results: null,
      };

    case 'KICKED':
      clearSession();
      return {
        ...initialState,
        toast: { type: 'error', message: 'You have been kicked from the room.' },
      };

    case 'REJOIN_FAILED':
      clearSession();
      return { ...initialState };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_TOAST':
      return { ...state, toast: action.payload };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    case 'RESET':
      clearSession();
      return { ...initialState };

    default:
      return state;
  }
}

// ─── Provider ───────────────────────────────────────────────────
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket, isConnected, hasEverConnected, attemptCount, emit, on, off } = useSocket();
  const [isRejoining, setIsRejoining] = useState(false);

  // ── Socket Event Listeners ──────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handlers = {
      'room-created': (data) => {
        dispatch({ type: 'ROOM_CREATED', payload: data });
        const pName = data.room.players.find((p) => p.id === data.playerId)?.name || state.playerName || '';
        saveSession(data.playerId, pName, data.room.code);
      },
      'room-joined': (data) => {
        dispatch({ type: 'ROOM_JOINED', payload: data });
        const pName = data.room.players.find((p) => p.id === data.playerId)?.name || state.playerName || '';
        saveSession(data.playerId, pName, data.room.code);
      },
      'room-rejoined': (data) => {
        dispatch({ type: 'ROOM_REJOINED', payload: data });
        // data.playerId is now sent by the server — use it to correctly identify the player
        const resolvedId = data.playerId;
        const pName = resolvedId
          ? data.room.players.find(p => p.id === resolvedId)?.name || state.playerName
          : state.playerName;
        if (resolvedId) {
          saveSession(resolvedId, pName || '', data.room.code);
        }
        setIsRejoining(false);
      },
      'rejoin-failed': () => {
        dispatch({ type: 'REJOIN_FAILED' });
        setIsRejoining(false);
      },
      'player-joined': (data) => {
        dispatch({ type: 'PLAYER_UPDATE', payload: data });
        dispatch({ type: 'SET_TOAST', payload: { type: 'info', message: 'A new player joined!' } });
      },
      'player-left': (data) => {
        dispatch({ type: 'PLAYER_UPDATE', payload: data });
        dispatch({ type: 'SET_TOAST', payload: { type: 'warning', message: `${data.playerName} left the room` } });
      },
      'player-offline': (data) => {
        dispatch({ type: 'PLAYER_UPDATE', payload: data });
        dispatch({ type: 'SET_TOAST', payload: { type: 'warning', message: `${data.playerName} went offline` } });
      },
      'player-online': (data) => {
        dispatch({ type: 'PLAYER_UPDATE', payload: data });
        dispatch({ type: 'SET_TOAST', payload: { type: 'success', message: 'A player reconnected!' } });
      },
      'player-kicked': (data) => {
        dispatch({ type: 'PLAYER_UPDATE', payload: data });
        dispatch({ type: 'SET_TOAST', payload: { type: 'info', message: `${data.kickedName} was kicked` } });
      },
      'player-confirmed': (data) => {
        dispatch({ type: 'PLAYER_UPDATE', payload: data });
      },
      'config-updated': (data) => {
        dispatch({ type: 'CONFIG_UPDATED', payload: data });
      },

      'game-started': (data) => {
        dispatch({ type: 'GAME_STARTED', payload: data });
      },
      'voting-started': (data) => {
        dispatch({ type: 'VOTING_STARTED', payload: data });
      },
      'vote-update': (data) => {
        dispatch({ type: 'VOTE_UPDATE', payload: data });
      },
      'round-results': (data) => {
        dispatch({ type: 'ROUND_RESULTS', payload: data });
      },
      'game-restarted': (data) => {
        dispatch({ type: 'GAME_RESTARTED', payload: data });
      },
      'kicked': () => {
        dispatch({ type: 'KICKED' });
      },
      'rejoin-failed': () => {
        dispatch({ type: 'REJOIN_FAILED' });
      },
      'error': (data) => {
        dispatch({ type: 'SET_TOAST', payload: { type: 'error', message: data.message } });
      },
    };

    // Register all handlers
    for (const [event, handler] of Object.entries(handlers)) {
      on(event, handler);
    }

    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        off(event, handler);
      }
    };
  }, [socket, on, off, state.playerName]);

  // ── Auto-rejoin on connect ──────────────────────────────────
  useEffect(() => {
    if (!isConnected) return;

    const session = loadSession();
    if (session) {
      setIsRejoining(true);
      dispatch({ type: 'SET_PLAYER', payload: { playerId: session.playerId, playerName: session.playerName } });
      emit('rejoin-room', {
        playerId: session.playerId,
        playerName: session.playerName,
        roomCode: session.roomCode,
      });
      // Timeout fallback for slow mobile networks
      setTimeout(() => setIsRejoining(false), 15000);
    }
  }, [isConnected, emit]);

  // ── Actions ─────────────────────────────────────────────────
  const createRoom = useCallback((playerName) => {
    dispatch({ type: 'SET_PLAYER', payload: { playerId: null, playerName } });
    emit('create-room', { playerName });
  }, [emit]);

  const joinRoom = useCallback((playerName, roomCode) => {
    dispatch({ type: 'SET_PLAYER', payload: { playerId: null, playerName } });
    emit('join-room', { playerName, roomCode });
  }, [emit]);

  const updateConfig = useCallback((category) => {
    if (state.room) {
      emit('update-config', { roomCode: state.room.code, category });
    }
  }, [emit, state.room]);


  const startGame = useCallback(() => {
    if (state.room) {
      emit('start-game', { roomCode: state.room.code });
    }
  }, [emit, state.room]);

  const startVoting = useCallback(() => {
    if (state.room) {
      emit('start-voting', { roomCode: state.room.code });
    }
  }, [emit, state.room]);

  const confirmRead = useCallback(() => {
    if (state.room) {
      emit('confirm-read', { roomCode: state.room.code });
    }
  }, [emit, state.room]);

  const castVote = useCallback((suspectedPlayerId) => {
    if (state.room) {
      emit('cast-vote', { roomCode: state.room.code, suspectedPlayerId });
    }
  }, [emit, state.room]);

  const restartGame = useCallback(() => {
    if (state.room) {
      emit('restart-game', { roomCode: state.room.code });
    }
  }, [emit, state.room]);

  const kickPlayer = useCallback((playerId) => {
    if (state.room) {
      emit('kick-player', { roomCode: state.room.code, playerId });
    }
  }, [emit, state.room]);

  const leaveRoom = useCallback(() => {
    if (state.room) {
      emit('leave-room', { roomCode: state.room.code });
    }
    dispatch({ type: 'RESET' });
  }, [emit, state.room]);

  const clearToast = useCallback(() => {
    dispatch({ type: 'CLEAR_TOAST' });
  }, []);

  // ── Derived state ───────────────────────────────────────────
  const currentPlayer = state.room?.players?.find(p => p.id === state.playerId);
  const isHost = currentPlayer?.isHost || false;

  const value = {
    ...state,
    isConnected,
    hasEverConnected,
    attemptCount,
    isRejoining,
    currentPlayer,
    isHost,
    // Actions
    createRoom,
    joinRoom,
    updateConfig,
    startGame,
    startVoting,
    confirmRead,
    castVote,
    restartGame,
    kickPlayer,
    leaveRoom,
    clearToast,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
