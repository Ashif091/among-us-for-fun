import { Injectable, Logger } from '@nestjs/common';
import { WordsService } from '../words/words.service';
import {
  GameRoom,
  Player,
  PlayerData,
  RoomData,
  GameStartData,
  VoteResultData,
} from './dto/game.dto';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private rooms = new Map<string, GameRoom>();
  private socketToPlayer = new Map<string, { roomCode: string; playerId: string }>();

  /** Room cleanup delay in ms (5 minutes) */
  private readonly CLEANUP_DELAY = 5 * 60 * 1000;

  constructor(private readonly wordsService: WordsService) {}

  // ─── Room Management ──────────────────────────────────────────

  /** Generate a unique 6-character room code */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /** Generate a unique player ID */
  private generatePlayerId(): string {
    return 'p_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }

  /** Create a new game room */
  createRoom(playerName: string, socketId: string): { room: RoomData; playerId: string } {
    const code = this.generateRoomCode();
    const playerId = this.generatePlayerId();

    const host: Player = {
      id: playerId,
      name: playerName,
      socketId,
      isHost: true,
      score: 0,
      hasVoted: false,
      hasConfirmed: false,
      isOnline: true,
    };

    const room: GameRoom = {
      code,
      hostId: playerId,
      state: 'lobby',
      category: 'objects',
      currentWord: '',
      imposterId: '',
      players: new Map([[playerId, host]]),
      votes: new Map(),
      roundNumber: 0,
      usedImposterIds: new Set(),
      usedWords: new Set(),
    };

    this.rooms.set(code, room);
    this.socketToPlayer.set(socketId, { roomCode: code, playerId });

    this.logger.log(`Room ${code} created by "${playerName}" (${playerId})`);
    return { room: this.serializeRoom(room), playerId };
  }

  /** Join an existing room */
  joinRoom(
    playerName: string,
    roomCode: string,
    socketId: string,
  ): { room: RoomData; playerId: string } | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found. Check the code and try again.' };

    if (room.state !== 'lobby') {
      return { error: 'Game already in progress. Wait for the next round.' };
    }

    if (room.players.size >= 15) {
      return { error: 'Room is full (max 15 players).' };
    }

    // Check for duplicate names
    for (const [, player] of room.players) {
      if (player.name.toLowerCase() === playerName.toLowerCase()) {
        return { error: 'A player with that name already exists in the room.' };
      }
    }

    const playerId = this.generatePlayerId();
    const player: Player = {
      id: playerId,
      name: playerName,
      socketId,
      isHost: false,
      score: 0,
      hasVoted: false,
      hasConfirmed: false,
      isOnline: true,
    };

    room.players.set(playerId, player);
    this.socketToPlayer.set(socketId, { roomCode: room.code, playerId });

    // Cancel cleanup timer if room was about to be cleaned up
    this.cancelCleanupTimer(room);

    this.logger.log(`"${playerName}" (${playerId}) joined room ${room.code}`);
    return { room: this.serializeRoom(room), playerId };
  }

  /** Rejoin a room after disconnect */
  rejoinRoom(
    playerId: string,
    playerName: string,
    roomCode: string,
    socketId: string,
  ): { room: RoomData; playerId: string; gameData?: GameStartData } | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room no longer exists.' };

    const player = room.players.get(playerId);
    if (!player) {
      // Player not found — try matching by name
      for (const [id, p] of room.players) {
        if (p.name.toLowerCase() === playerName.toLowerCase() && !p.isOnline) {
          // Reconnect this player
          p.socketId = socketId;
          p.isOnline = true;
          this.socketToPlayer.set(socketId, { roomCode: room.code, playerId: id });
          this.cancelCleanupTimer(room);

          this.logger.log(`"${playerName}" reconnected by name to room ${room.code}`);
          const result: any = { room: this.serializeRoom(room), playerId: id };
          if (room.state === 'playing' || room.state === 'voting') {
            result.gameData = {
              word: id === room.imposterId ? null : room.currentWord,
              isImposter: id === room.imposterId,
              room: this.serializeRoom(room),
            };
          }
          return result;
        }
      }
      return { error: 'Player not found in this room.' };
    }

    // Reconnect
    player.socketId = socketId;
    player.isOnline = true;
    this.socketToPlayer.set(socketId, { roomCode: room.code, playerId });
    this.cancelCleanupTimer(room);

    this.logger.log(`"${player.name}" (${playerId}) reconnected to room ${room.code}`);

    const result: any = { room: this.serializeRoom(room), playerId };
    if (room.state === 'playing' || room.state === 'voting') {
      result.gameData = {
        word: playerId === room.imposterId ? null : room.currentWord,
        isImposter: playerId === room.imposterId,
        room: this.serializeRoom(room),
      };
    }
    return result;
  }

  /** Handle player disconnect */
  handleDisconnect(socketId: string): { roomCode: string; playerName: string; room: RoomData } | null {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return null;

    const { roomCode, playerId } = mapping;
    const room = this.rooms.get(roomCode);
    if (!room) {
      this.socketToPlayer.delete(socketId);
      return null;
    }

    const player = room.players.get(playerId);
    if (!player) {
      this.socketToPlayer.delete(socketId);
      return null;
    }

    // If the player already reconnected on a NEW socket, their player.socketId won't match this disconnecting socketId.
    // In that case, DO NOT mark them offline!
    if (player.socketId !== socketId) {
      this.socketToPlayer.delete(socketId);
      return null;
    }

    player.isOnline = false;
    player.socketId = null;
    this.socketToPlayer.delete(socketId);

    this.logger.log(`"${player.name}" went offline in room ${roomCode}`);

    // Check if all players are offline
    const anyOnline = Array.from(room.players.values()).some((p) => p.isOnline);
    if (!anyOnline) {
      this.startCleanupTimer(room);
    }

    return { roomCode, playerName: player.name, room: this.serializeRoom(room) };
  }

  // ─── Game Config ──────────────────────────────────────────────

  /** Update room category */
  updateConfig(
    roomCode: string,
    category: string,
    socketId: string,
  ): RoomData | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found.' };

    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping || room.hostId !== mapping.playerId) {
      return { error: 'Only the host can change settings.' };
    }

    if (room.state !== 'lobby') {
      return { error: 'Can only change settings in the lobby.' };
    }

    room.category = category.toLowerCase();
    this.logger.log(`Room ${roomCode} category set to "${category}"`);
    return this.serializeRoom(room);
  }

  /** Change room code (host only) */
  changeRoomCode(
    roomCode: string,
    newRoomCode: string,
    socketId: string,
  ): { room: RoomData; oldCode: string } | { error: string } {
    const oldCode = roomCode.toUpperCase().trim();
    const newCode = newRoomCode.toUpperCase().trim();

    if (!newCode || newCode.length < 3 || newCode.length > 15) {
      return { error: 'Room code must be between 3 and 15 characters.' };
    }

    if (!/^[A-Z0-9]+$/.test(newCode)) {
      return { error: 'Room code must only contain letters and numbers.' };
    }

    const room = this.rooms.get(oldCode);
    if (!room) return { error: 'Room not found.' };

    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping || room.hostId !== mapping.playerId) {
      return { error: 'Only the host can change the room code.' };
    }

    if (room.state !== 'lobby') {
      return { error: 'Can only change the room code in the lobby.' };
    }

    if (oldCode === newCode) {
      return { error: 'New room code is the same as the current one.' };
    }

    if (this.rooms.has(newCode)) {
      return { error: 'This room code is already in use.' };
    }

    // Update room key in mapping
    this.rooms.delete(oldCode);
    room.code = newCode;
    this.rooms.set(newCode, room);

    // Update socket mappings for all players in the room
    for (const [playerId, player] of room.players) {
      if (player.socketId) {
        this.socketToPlayer.set(player.socketId, { roomCode: newCode, playerId });
      }
    }

    this.logger.log(`Room code changed from ${oldCode} to ${newCode}`);
    return { room: this.serializeRoom(room), oldCode };
  }

  /** Get available categories */
  getCategories(): string[] {
    return this.wordsService.getCategories();
  }

  // ─── Game Flow ────────────────────────────────────────────────

  /** Start a new round */
  async startGame(
    roomCode: string,
    socketId: string,
  ): Promise<{ assignments: Map<string, GameStartData>; room: RoomData } | { error: string }> {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found.' };

    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping || room.hostId !== mapping.playerId) {
      return { error: 'Only the host can start the game.' };
    }

    const onlinePlayers = Array.from(room.players.values()).filter((p) => p.isOnline);
    if (onlinePlayers.length < 3) {
      return { error: 'Need at least 3 online players to start.' };
    }

    // ── Word selection (no repeats until all words used) ──────────
    const word = await this.wordsService.getRandomWord(room.category);

    // ── Imposter rotation: each player must be imposter once ──────
    // Only consider online players for imposter selection
    const onlineIds = new Set(onlinePlayers.map((p) => p.id));

    // Remove IDs that are no longer in the room from usedImposterIds
    for (const id of room.usedImposterIds) {
      if (!onlineIds.has(id)) room.usedImposterIds.delete(id);
    }

    // Eligible = online players who have NOT yet been imposter this cycle
    const eligible = onlinePlayers.filter((p) => !room.usedImposterIds.has(p.id));

    // If everyone has had a turn, reset the rotation
    if (eligible.length === 0) {
      room.usedImposterIds.clear();
      eligible.push(...onlinePlayers);
    }

    // ── CRITICAL: select exactly ONE imposter atomically ──────────
    const selectedIndex = Math.floor(Math.random() * eligible.length);
    const chosenImposter = eligible[selectedIndex];

    // Freeze the chosen ID immediately — no other code path sets imposterId
    const newImposterId = chosenImposter.id;

    // Sanity double-check: confirm the chosen player is actually online & in the room
    const verifiedImposter = room.players.get(newImposterId);
    if (!verifiedImposter || !verifiedImposter.isOnline) {
      this.logger.error(
        `[SAFETY] Imposter candidate ${newImposterId} is not valid. Re-picking from all online players.`,
      );
      const fallback = onlinePlayers[Math.floor(Math.random() * onlinePlayers.length)];
      room.imposterId = fallback.id;
    } else {
      room.imposterId = newImposterId;
    }

    // Record this player as having been imposter
    room.usedImposterIds.add(room.imposterId);

    this.logger.log(
      `[IMPOSTER CHECK] Round ${room.roundNumber + 1} — imposterId locked to: "${room.players.get(room.imposterId)?.name}" (${room.imposterId})`,
    );

    // ── Apply state changes ───────────────────────────────────────
    room.currentWord = word;
    room.usedWords.add(word);

    // Reset voting & confirmation state
    room.votes.clear();
    for (const [, player] of room.players) {
      player.hasVoted = false;
      player.hasConfirmed = false;
    }

    room.state = 'playing';
    room.roundNumber++;

    this.logger.log(
      `Round ${room.roundNumber} started in room ${roomCode}: word="${word}", imposter="${room.players.get(room.imposterId)?.name}" (${room.imposterId})`,
    );

    // ── Build per-player assignments (verify imposterId once more) ─
    const finalImposterId = room.imposterId; // snapshot — never changes after this point
    const assignments = new Map<string, GameStartData>();
    let imposterAssigned = 0;

    for (const [id, player] of room.players) {
      if (player.isOnline && player.socketId) {
        const isThisPlayerImposter = id === finalImposterId;
        if (isThisPlayerImposter) imposterAssigned++;

        assignments.set(player.socketId, {
          word: isThisPlayerImposter ? null : room.currentWord,
          isImposter: isThisPlayerImposter,
          room: this.serializeRoom(room),
        });
      }
    }

    // ── Final safety assertion ────────────────────────────────────
    if (imposterAssigned !== 1) {
      this.logger.error(
        `[CRITICAL] imposterAssigned=${imposterAssigned} for room ${roomCode}! Expected exactly 1. imposterId=${finalImposterId}`,
      );
    }

    return { assignments, room: this.serializeRoom(room) };
  }

  /** Start voting phase */
  startVoting(
    roomCode: string,
    socketId?: string,
    bypassHostCheck = false,
  ): RoomData | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found.' };

    if (!bypassHostCheck && socketId) {
      const mapping = this.socketToPlayer.get(socketId);
      if (!mapping || room.hostId !== mapping.playerId) {
        return { error: 'Only the host can start voting.' };
      }
    }

    if (room.state !== 'playing') {
      return { error: 'Game must be in playing state to start voting.' };
    }

    room.state = 'voting';
    room.votes.clear();
    for (const [, player] of room.players) {
      player.hasVoted = false;
    }

    this.logger.log(`Voting started in room ${roomCode}`);
    return this.serializeRoom(room);
  }

  /** Cast a vote */
  castVote(
    roomCode: string,
    suspectedPlayerId: string,
    socketId: string,
  ): { room: RoomData; allVoted: boolean; votedCount: number; totalCount: number } | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found.' };

    if (room.state !== 'voting') {
      return { error: 'Voting is not active.' };
    }

    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return { error: 'Player not found.' };

    const voter = room.players.get(mapping.playerId);
    if (!voter) return { error: 'Player not found in room.' };

    if (voter.hasVoted) {
      return { error: 'You have already voted.' };
    }

    // Can't vote for yourself
    if (mapping.playerId === suspectedPlayerId) {
      return { error: 'You cannot vote for yourself.' };
    }

    // Check if suspected player exists
    if (!room.players.has(suspectedPlayerId)) {
      return { error: 'Invalid player selected.' };
    }

    room.votes.set(mapping.playerId, suspectedPlayerId);
    voter.hasVoted = true;

    // Count votes from online players only
    const onlinePlayers = Array.from(room.players.values()).filter((p) => p.isOnline);
    const votedCount = onlinePlayers.filter((p) => p.hasVoted).length;
    const totalCount = onlinePlayers.length;
    const allVoted = votedCount >= totalCount;

    this.logger.log(
      `"${voter.name}" voted in room ${roomCode} (${votedCount}/${totalCount})`,
    );

    return {
      room: this.serializeRoom(room),
      allVoted,
      votedCount,
      totalCount,
    };
  }

  /** Calculate round results */
  calculateResults(roomCode: string): VoteResultData | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found.' };

    if (room.state !== 'voting') {
      return { error: 'Not in voting state.' };
    }

    // Count votes per player
    const voteCount: Record<string, number> = {};
    for (const [, player] of room.players) {
      voteCount[player.id] = 0;
    }
    for (const [, suspectedId] of room.votes) {
      voteCount[suspectedId] = (voteCount[suspectedId] || 0) + 1;
    }

    // Find max votes
    const maxVotes = Math.max(...Object.values(voteCount));
    const playersWithMaxVotes = Object.keys(voteCount).filter(
      (id) => voteCount[id] === maxVotes,
    );

    const imposterVotes = voteCount[room.imposterId] || 0;
    const totalVoters = room.votes.size;

    // Determine outcome
    let imposterCaught = false;
    let isDraw = false;

    if (playersWithMaxVotes.length === 1 && playersWithMaxVotes[0] === room.imposterId) {
      // Imposter got the most votes uniquely → imposter caught
      imposterCaught = true;
    } else if (
      playersWithMaxVotes.length > 1 &&
      playersWithMaxVotes.includes(room.imposterId)
    ) {
      // Tie including imposter → draw
      isDraw = true;
    }
    // else: imposter didn't get majority → imposter wins

    // Calculate score changes
    const scoreChanges: Record<string, number> = {};

    // Imposter scoring
    const imposter = room.players.get(room.imposterId);
    if (imposterCaught) {
      scoreChanges[room.imposterId] = -imposterVotes;
    } else if (isDraw) {
      scoreChanges[room.imposterId] = 0;
    } else {
      scoreChanges[room.imposterId] = totalVoters - imposterVotes;
    }

    // Player scoring
    for (const [voterId, suspectedId] of room.votes) {
      if (voterId === room.imposterId) continue; // imposter's score handled above

      let change = 0;
      // +1 for correct guess
      if (suspectedId === room.imposterId) {
        change += 1;
      }
      // -1 if imposter wins
      if (!imposterCaught && !isDraw) {
        change -= 1;
      }
      scoreChanges[voterId] = change;
    }

    // Offline players who didn't vote get -1 if imposter wins
    for (const [playerId, player] of room.players) {
      if (playerId === room.imposterId) continue;
      if (!room.votes.has(playerId)) {
        if (!imposterCaught && !isDraw) {
          scoreChanges[playerId] = -1;
        } else {
          scoreChanges[playerId] = 0;
        }
      }
    }

    // Apply score changes
    for (const [playerId, change] of Object.entries(scoreChanges)) {
      const player = room.players.get(playerId);
      if (player) {
        player.score += change;
      }
    }

    room.state = 'results';

    // Serialize votes
    const votesObj: Record<string, string> = {};
    for (const [voterId, suspectedId] of room.votes) {
      votesObj[voterId] = suspectedId;
    }

    const imposterPlayer = room.players.get(room.imposterId);

    this.logger.log(
      `Results for room ${roomCode}: imposterCaught=${imposterCaught}, isDraw=${isDraw}`,
    );

    return {
      imposterId: room.imposterId,
      imposterName: imposterPlayer?.name || 'Unknown',
      votes: votesObj,
      voteCount,
      imposterCaught,
      isDraw,
      scoreChanges,
      room: this.serializeRoom(room),
    };
  }

  /** Restart game (back to lobby) */
  restartGame(
    roomCode: string,
    socketId: string,
  ): RoomData | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found.' };

    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping || room.hostId !== mapping.playerId) {
      return { error: 'Only the host can restart the game.' };
    }

    room.state = 'lobby';
    room.currentWord = '';
    room.imposterId = '';
    room.votes.clear();
    for (const [, player] of room.players) {
      player.hasVoted = false;
    }

    this.logger.log(`Game restarted in room ${roomCode}`);
    return this.serializeRoom(room);
  }

  /** Kick a player (host only) */
  kickPlayer(
    roomCode: string,
    playerId: string,
    socketId: string,
  ): {
    room: RoomData;
    kickedSocketId: string | null;
    kickedName: string;
    imposterKicked?: boolean;
    allVoted?: boolean;
    results?: any;
  } | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found.' };

    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping || room.hostId !== mapping.playerId) {
      return { error: 'Only the host can kick players.' };
    }

    if (room.state !== 'lobby') {
      return { error: 'Players can only be removed in the lobby.' };
    }

    if (playerId === room.hostId) {
      return { error: 'Cannot kick the host.' };
    }

    const player = room.players.get(playerId);
    if (!player) return { error: 'Player not found.' };

    const kickedSocketId = player.socketId;
    const kickedName = player.name;

    // Remove player's socket mapping
    if (kickedSocketId) {
      this.socketToPlayer.delete(kickedSocketId);
    }
    
    // Remove their vote if they voted
    room.votes.delete(playerId);
    
    // Remove player
    room.players.delete(playerId);

    let imposterKicked = false;
    let allVoted = false;
    let results: any = null;

    if (room.state !== 'lobby') {
      if (playerId === room.imposterId) {
        // Imposter was kicked -> Reset game to lobby
        imposterKicked = true;
        room.state = 'lobby';
        room.currentWord = '';
        room.imposterId = '';
        room.votes.clear();
        for (const [, p] of room.players) {
          p.hasVoted = false;
        }
      } else if (room.state === 'voting') {
        // Check if all remaining online players have voted
        const onlinePlayers = Array.from(room.players.values()).filter((p) => p.isOnline);
        const votedCount = onlinePlayers.filter((p) => p.hasVoted).length;
        const totalCount = onlinePlayers.length;
        if (votedCount >= totalCount && totalCount > 0) {
          allVoted = true;
          results = this.calculateResults(roomCode);
        }
      }
    }

    this.logger.log(`"${kickedName}" kicked from room ${roomCode}`);
    return {
      room: this.serializeRoom(room),
      kickedSocketId,
      kickedName,
      imposterKicked,
      allVoted,
      results: results && !('error' in results) ? results : undefined,
    };
  }

  /** Get room code for a socket */
  getRoomCode(socketId: string): string | null {
    return this.socketToPlayer.get(socketId)?.roomCode || null;
  }

  /** Player leaves the room permanently */
  leaveRoom(
    roomCode: string,
    socketId: string,
  ): { room: RoomData; playerName: string; gameRestarted: boolean } | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found.' };

    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return { error: 'Player not found.' };

    const player = room.players.get(mapping.playerId);
    if (!player) return { error: 'Player not found in room.' };

    const playerName = player.name;
    const isHost = player.isHost;

    // Remove socket mapping
    this.socketToPlayer.delete(socketId);

    // Remove player
    room.players.delete(mapping.playerId);

    // Remove vote if cast
    room.votes.delete(mapping.playerId);

    let gameRestarted = false;

    // If host left, pass crown to next player
    if (isHost && room.players.size > 0) {
      const remaining = Array.from(room.players.values());
      const newHost = remaining[0];
      newHost.isHost = true;
      room.hostId = newHost.id;
      this.logger.log(`Host left. "${newHost.name}" is now the host of room ${roomCode}`);
    }

    // Clean up empty rooms
    if (room.players.size === 0) {
      this.rooms.delete(room.code);
      this.logger.log(`Room ${roomCode} deleted because last player left`);
    } else {
      // If game was active, reset to lobby
      if (room.state !== 'lobby') {
        gameRestarted = true;
        room.state = 'lobby';
        room.currentWord = '';
        room.imposterId = '';
        room.votes.clear();
        for (const [, p] of room.players) {
          p.hasVoted = false;
          p.hasConfirmed = false;
        }
        this.logger.log(`Game auto-restarted in room ${roomCode} because "${playerName}" left`);
      }
    }

    return {
      room: this.serializeRoom(room),
      playerName,
      gameRestarted,
    };
  }

  /** Confirm word read for a player */
  confirmRead(
    roomCode: string,
    socketId: string,
  ): { room: RoomData; allConfirmed: boolean } | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found.' };

    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return { error: 'Player not found.' };

    const player = room.players.get(mapping.playerId);
    if (!player) return { error: 'Player not found in room.' };

    player.hasConfirmed = true;

    // Count confirmations from online players only
    const onlinePlayers = Array.from(room.players.values()).filter((p) => p.isOnline);
    const confirmedCount = onlinePlayers.filter((p) => p.hasConfirmed).length;
    const totalCount = onlinePlayers.length;
    const allConfirmed = confirmedCount >= totalCount;

    this.logger.log(
      `Player "${player.name}" confirmed word in room ${roomCode} (${confirmedCount}/${totalCount})`,
    );

    return {
      room: this.serializeRoom(room),
      allConfirmed,
    };
  }

  /** Auto-restart game to lobby without host signature check (called by timer) */
  autoRestartGame(roomCode: string): RoomData | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return null;

    room.state = 'lobby';
    room.currentWord = '';
    room.imposterId = '';
    room.votes.clear();
    for (const [, player] of room.players) {
      player.hasVoted = false;
      player.hasConfirmed = false;
    }

    this.logger.log(`Game auto-restarted in room ${roomCode}`);
    return this.serializeRoom(room);
  }

  /** Get game room state */
  getRoomState(roomCode: string): string | null {
    return this.rooms.get(roomCode.toUpperCase())?.state || null;
  }

  // ─── Serialization ────────────────────────────────────────────

  /** Serialize room for client consumption */
  private serializeRoom(room: GameRoom): RoomData {
    const players: PlayerData[] = [];
    for (const [, player] of room.players) {
      players.push({
        id: player.id,
        name: player.name,
        isHost: player.isHost,
        score: player.score,
        hasVoted: player.hasVoted,
        hasConfirmed: player.hasConfirmed,
        isOnline: player.isOnline,
      });
    }

    // Sort: host first, then by name
    players.sort((a, b) => {
      if (a.isHost) return -1;
      if (b.isHost) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      code: room.code,
      state: room.state,
      category: room.category,
      players,
      roundNumber: room.roundNumber,
    };
  }

  // ─── Cleanup ──────────────────────────────────────────────────

  /** Start cleanup timer for a room (5 min after all disconnect) */
  private startCleanupTimer(room: GameRoom) {
    this.cancelCleanupTimer(room);
    room.cleanupTimer = setTimeout(() => {
      this.logger.log(`Room ${room.code} cleaned up after timeout`);
      this.rooms.delete(room.code);
    }, this.CLEANUP_DELAY);
  }

  /** Cancel cleanup timer */
  private cancelCleanupTimer(room: GameRoom) {
    if (room.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
      room.cleanupTimer = undefined;
    }
  }
}
