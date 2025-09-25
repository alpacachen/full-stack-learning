import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisController } from './redis/redis.controller';
import { RedisService } from './redis/redis.service';
import { OnlineRedisGateway } from './websocket/online-redis.gateway';
import { MySQLController } from './mysql/mysql.controller';
import { MySQLService } from './mysql/mysql.service';
import { OnlineMySQLGateway } from './websocket/online-mysql.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, RedisController, MySQLController],
  providers: [
    AppService,
    RedisService,
    OnlineRedisGateway,
    MySQLService,
    OnlineMySQLGateway,
  ],
})
export class AppModule {}
