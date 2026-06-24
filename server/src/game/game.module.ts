import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { WordsModule } from '../words/words.module';

@Module({
  imports: [WordsModule],
  providers: [GameGateway, GameService],
})
export class GameModule {}
