import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || (
  typeof window !== 'undefined'
    ? (window.location.port === '5173' ? 'http://localhost:3001' : window.location.origin)
    : 'http://localhost:3001'
);

/**
 * Custom hook to manage Socket.IO connection with auto-reconnect.
 * Exposes isConnected, hasEverConnected, and attemptCount so the UI
 * can show a proper "server waking up" screen on Render cold starts.
 */
export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected]         = useState(false);
  const [hasEverConnected, setHasEverConnected] = useState(false);
  const [attemptCount, setAttemptCount]       = useState(0);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
      timeout: 20000,        // Render cold starts can take ~30s, give generous timeout
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to server:', socket.id);
      setIsConnected(true);
      setHasEverConnected(true);
      setAttemptCount(0);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setAttemptCount((n) => n + 1);
    });

    // Socket.IO fires 'reconnect_attempt' on every retry
    socket.io.on('reconnect_attempt', () => {
      setAttemptCount((n) => n + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  /** Emit an event to the server */
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  /** Listen for an event from the server */
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  /** Remove a listener */
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    hasEverConnected,
    attemptCount,
    emit,
    on,
    off,
  };
}
