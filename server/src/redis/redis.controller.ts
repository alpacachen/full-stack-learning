import { Controller, Post, Body, Param } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private redisService: RedisService) {}

  @Post('execute')
  async executeCommand(@Body() body: { sessionId: string; command: string }) {
    const result = await this.redisService.executeCommand(
      body.sessionId,
      body.command,
    );
    return result;
  }

  @Post('data/:sessionId')
  async getRedisData(@Param('sessionId') sessionId: string): Promise<any> {
    return await this.redisService.getRedisData(sessionId);
  }
}
