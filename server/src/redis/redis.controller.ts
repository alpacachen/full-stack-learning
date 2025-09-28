import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private redisService: RedisService) {}

  @Post('create-session')
  async createSession(): Promise<{ sessionId: string; port: number }> {
    const sessionId = this.generateSessionId();
    const port = await this.redisService.createRedisInstance(sessionId);
    return { sessionId, port };
  }

  @Post('execute')
  async executeCommand(@Body() body: { sessionId: string; command: string }) {
    const result = await this.redisService.executeCommand(
      body.sessionId,
      body.command,
    );
    return result;
  }

  @Get('data/:sessionId')
  async getRedisData(@Param('sessionId') sessionId: string): Promise<any> {
    return await this.redisService.getRedisData(sessionId);
  }

  @Delete('session/:sessionId')
  async destroySession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean }> {
    await this.redisService.destroyRedisInstance(sessionId);
    return { success: true };
  }

  @Post('destroy-session')
  async destroySessionPost(@Body() body: { sessionId: string }): Promise<{ success: boolean }> {
    await this.redisService.destroyRedisInstance(body.sessionId);
    return { success: true };
  }

  private generateSessionId(): string {
    return (
      'redis_' +
      Math.random().toString(36).substr(2, 9) +
      Date.now().toString(36)
    );
  }
}
