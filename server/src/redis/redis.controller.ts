import { Controller, Post, Body, Param } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private redisService: RedisService) {}

  @Post('execute')
  async executeCommand(@Body() body: { sessionId: string; command: string }) {
    try {
      const result = await this.redisService.executeCommand(
        body.sessionId,
        body.command,
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        command: body.command,
      };
    }
  }

  @Post('data/:sessionId')
  async getRedisData(@Param('sessionId') sessionId: string): Promise<any> {
    return await this.redisService.getRedisData(sessionId);
  }
}
