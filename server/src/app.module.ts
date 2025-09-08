import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisController } from './redis/redis.controller';

@Module({
  imports: [],
  controllers: [AppController, RedisController],
  providers: [AppService],
})
export class AppModule {}
