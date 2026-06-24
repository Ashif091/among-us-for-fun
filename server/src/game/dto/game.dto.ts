/** Game state types */
export type GameState = 'lobby' | 'playing' | 'voting' | 'results';

/** Player in a game room */
export interface Player {
  id: string;
  name: string;
  socketId: string | null;
  isHost: boolean;
  score: number;
  hasVoted: boolean;
  hasConfirmed: boolean;
  isOnline: boolean;
}

/** A game room */
export interface GameRoom {
  code: string;
  hostId: string;
  state: GameState;
  category: string;
  currentWord: string;
  imposterId: string;
  players: Map<string, Player>;
  votes: Map<string, string>; // voterId → suspectedPlayerId
  cleanupTimer?: ReturnType<typeof setTimeout>;
  roundNumber: number;
  /** Track players who have already been imposter (for rotation) */
  usedImposterIds: Set<string>;
  /** Track words used this session to avoid repeats */
  usedWords: Set<string>;
}

/** Payload for creating a room */
export interface CreateRoomDto {
  playerName: string;
}

/** Payload for joining a room */
export interface JoinRoomDto {
  playerName: string;
  roomCode: string;
}

/** Payload for rejoining a room */
export interface RejoinRoomDto {
  playerId: string;
  playerName: string;
  roomCode: string;
}

/** Payload for updating room config */
export interface UpdateConfigDto {
  roomCode: string;
  category: string;
}

/** Payload for starting the game */
export interface StartGameDto {
  roomCode: string;
}

/** Payload for casting a vote */
export interface CastVoteDto {
  roomCode: string;
  suspectedPlayerId: string;
}

/** Payload for room code actions */
export interface RoomCodeDto {
  roomCode: string;
}

/** Payload for kicking a player */
export interface KickPlayerDto {
  roomCode: string;
  playerId: string;
}

/** Payload for changing room code */
export interface ChangeRoomCodeDto {
  roomCode: string;
  newRoomCode: string;
}

/** Player data sent to clients (serialized) */
export interface PlayerData {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  hasVoted: boolean;
  hasConfirmed: boolean;
  isOnline: boolean;
}

/** Room data sent to clients */
export interface RoomData {
  code: string;
  state: GameState;
  category: string;
  players: PlayerData[];
  roundNumber: number;
}

/** Game start data sent to individual players */
export interface GameStartData {
  word: string | null; // null for imposter
  isImposter: boolean;
  room: RoomData;
}

/** Vote result data */
export interface VoteResultData {
  imposterId: string;
  imposterName: string;
  votes: Record<string, string>; // voterId → suspectedPlayerId
  voteCount: Record<string, number>; // playerId → voteCount
  imposterCaught: boolean;
  isDraw: boolean;
  scoreChanges: Record<string, number>; // playerId → score change
  room: RoomData;
}
