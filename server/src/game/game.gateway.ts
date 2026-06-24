import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import {
  CreateRoomDto,
  JoinRoomDto,
  RejoinRoomDto,
  UpdateConfigDto,
  StartGameDto,
  CastVoteDto,
  RoomCodeDto,
  KickPlayerDto,
  ChangeRoomCodeDto,
} from './dto/game.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly gameService: GameService) {}

  // ─── Connection Lifecycle ─────────────────────────────────────

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const result = this.gameService.handleDisconnect(client.id);
    if (result) {
      // Notify other players in the room
      this.server.to(result.roomCode).emit('player-offline', {
        playerName: result.playerName,
        room: result.room,
      });
    }
  }

  // ─── Room Management ──────────────────────────────────────────

  @SubscribeMessage('create-room')
  handleCreateRoom(
    @MessageBody() data: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.playerName || data.playerName.trim().length === 0) {
      client.emit('error', { message: 'Player name is required.' });
      return;
    }

    if (data.playerName.trim().length > 20) {
      client.emit('error', { message: 'Name must be 20 characters or less.' });
      return;
    }

    const result = this.gameService.createRoom(data.playerName.trim(), client.id);

    // Join the socket.io room
    client.join(result.room.code);

    // Send categories along with room data
    const categories = this.gameService.getCategories();

    client.emit('room-created', {
      room: result.room,
      playerId: result.playerId,
      categories,
    });

    this.logger.log(`Room ${result.room.code} created`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.playerName || data.playerName.trim().length === 0) {
      client.emit('error', { message: 'Player name is required.' });
      return;
    }

    if (!data.roomCode || data.roomCode.trim().length === 0) {
      client.emit('error', { message: 'Room code is required.' });
      return;
    }

    const result = this.gameService.joinRoom(
      data.playerName.trim(),
      data.roomCode.trim().toUpperCase(),
      client.id,
    );

    if ('error' in result) {
      client.emit('error', { message: result.error });
      return;
    }

    // Join the socket.io room
    client.join(result.room.code);

    const categories = this.gameService.getCategories();

    // Notify the joining player
    client.emit('room-joined', {
      room: result.room,
      playerId: result.playerId,
      categories,
    });

    // Notify other players
    client.to(result.room.code).emit('player-joined', {
      room: result.room,
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: RoomCodeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gameService.leaveRoom(data.roomCode, client.id);

    if ('error' in result) {
      client.emit('error', { message: result.error });
      return;
    }

    client.leave(data.roomCode);

    // Notify remaining players
    this.server.to(data.roomCode).emit('player-left', {
      room: result.room,
      playerName: result.playerName,
    });

    // If game was in progress, reset and notify
    if (result.gameRestarted) {
      this.server.to(data.roomCode).emit('error', {
        message: `${result.playerName} left the game. Returning to lobby.`,
      });
      this.server.to(data.roomCode).emit('game-restarted', { room: result.room });
    }
  }

  @SubscribeMessage('rejoin-room')
  handleRejoinRoom(
    @MessageBody() data: RejoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gameService.rejoinRoom(
      data.playerId,
      data.playerName,
      data.roomCode,
      client.id,
    );

    if ('error' in result) {
      client.emit('error', { message: result.error });
      client.emit('rejoin-failed', { message: result.error });
      return;
    }

    // Join the socket.io room
    client.join(result.room.code);

    const categories = this.gameService.getCategories();

    client.emit('room-rejoined', {
      room: result.room,
      playerId: result.playerId,
      gameData: result.gameData || null,
      categories,
    });

    // Notify others that player is back online
    client.to(result.room.code).emit('player-online', {
      room: result.room,
    });
  }

  // ─── Game Config ──────────────────────────────────────────────

  @SubscribeMessage('update-config')
  handleUpdateConfig(
    @MessageBody() data: UpdateConfigDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gameService.updateConfig(
      data.roomCode,
      data.category,
      client.id,
    );

    if ('error' in result) {
      client.emit('error', { message: result.error });
      return;
    }

    this.server.to(data.roomCode).emit('config-updated', { room: result });
  }



  // ─── Game Flow ────────────────────────────────────────────────

  @SubscribeMessage('start-game')
  async handleStartGame(
    @MessageBody() data: StartGameDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.gameService.startGame(data.roomCode, client.id);

    if ('error' in result) {
      client.emit('error', { message: result.error });
      return;
    }

    // Send personalized game data to each player
    for (const [socketId, gameData] of result.assignments) {
      this.server.to(socketId).emit('game-started', gameData);
    }
  }

  @SubscribeMessage('start-voting')
  handleStartVoting(
    @MessageBody() data: RoomCodeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gameService.startVoting(data.roomCode, client.id);

    if ('error' in result) {
      client.emit('error', { message: result.error });
      return;
    }

    this.server.to(data.roomCode).emit('voting-started', { room: result });
  }

  @SubscribeMessage('confirm-read')
  handleConfirmRead(
    @MessageBody() data: RoomCodeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gameService.confirmRead(data.roomCode, client.id);

    if ('error' in result) {
      client.emit('error', { message: result.error });
      return;
    }

    // Broadcast confirmation progress
    this.server.to(data.roomCode).emit('player-confirmed', { room: result.room });

    // If all confirmed, auto-transition to voting phase
    if (result.allConfirmed) {
      const votingRoom = this.gameService.startVoting(data.roomCode, undefined, true);
      if (!('error' in votingRoom)) {
        this.server.to(data.roomCode).emit('voting-started', { room: votingRoom });
      }
    }
  }

  @SubscribeMessage('cast-vote')
  handleCastVote(
    @MessageBody() data: CastVoteDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gameService.castVote(
      data.roomCode,
      data.suspectedPlayerId,
      client.id,
    );

    if ('error' in result) {
      client.emit('error', { message: result.error });
      return;
    }

    // Broadcast vote progress
    this.server.to(data.roomCode).emit('vote-update', {
      room: result.room,
      votedCount: result.votedCount,
      totalCount: result.totalCount,
    });

    // If all voted, auto-calculate results and show them
    // NOTE: No auto-restart — host manually controls when to proceed
    if (result.allVoted) {
      const results = this.gameService.calculateResults(data.roomCode);
      if ('error' in results) {
        client.emit('error', { message: results.error });
        return;
      }
      this.server.to(data.roomCode).emit('round-results', results);
    }
  }

  @SubscribeMessage('restart-game')
  handleRestartGame(
    @MessageBody() data: RoomCodeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gameService.restartGame(data.roomCode, client.id);

    if ('error' in result) {
      client.emit('error', { message: result.error });
      return;
    }

    this.server.to(data.roomCode).emit('game-restarted', { room: result });
  }

  @SubscribeMessage('kick-player')
  handleKickPlayer(
    @MessageBody() data: KickPlayerDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gameService.kickPlayer(
      data.roomCode,
      data.playerId,
      client.id,
    );

    if ('error' in result) {
      client.emit('error', { message: result.error });
      return;
    }

    // Notify kicked player
    if (result.kickedSocketId) {
      this.server.to(result.kickedSocketId).emit('kicked', {
        message: 'You have been kicked from the room.',
      });
      // Remove kicked player from socket.io room
      const kickedSocket = this.server.sockets.sockets.get(result.kickedSocketId);
      if (kickedSocket) {
        kickedSocket.leave(data.roomCode);
      }
    }

    // Notify remaining players
    this.server.to(data.roomCode).emit('player-kicked', {
      room: result.room,
      kickedName: result.kickedName,
    });

    if ('imposterKicked' in result && result.imposterKicked) {
      this.server.to(data.roomCode).emit('error', {
        message: `The Imposter (${result.kickedName}) was kicked! Game reset to lobby.`,
      });
      this.server.to(data.roomCode).emit('game-restarted', { room: result.room });
    } else if ('allVoted' in result && result.allVoted && result.results) {
      this.server.to(data.roomCode).emit('round-results', result.results);
    }
  }
}
