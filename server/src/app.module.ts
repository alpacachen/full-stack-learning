import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisController } from './redis/redis.controller';
import { RedisService } from './redis/redis.service';
import { OnlineRedisGateway } from './websocket/online-redis.gateway';
import { AuthGuard } from './interceptor/auth.guard';
import { createClient } from '@supabase/supabase-js';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, RedisController],
  providers: [
    AppService,
    RedisService,
    OnlineRedisGateway,
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get('SUPABASE_URL') ?? '',
          configService.get('SUPABASE_ANON_KEY') ?? '',
        );
      },
      inject: [ConfigService],
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
