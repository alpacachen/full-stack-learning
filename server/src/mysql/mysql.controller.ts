import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { MySQLService } from './mysql.service';

@Controller('mysql')
export class MySQLController {
  constructor(private readonly mysqlService: MySQLService) {}

  @Post('create-session')
  async createSession(): Promise<{ sessionId: string; port: number }> {
    const sessionId = this.generateSessionId();
    const port = await this.mysqlService.createMySQLInstance(sessionId);
    return { sessionId, port };
  }

  @Post('execute')
  async executeQuery(@Body() body: { sessionId: string; query: string }) {
    return this.mysqlService.executeQuery(body.sessionId, body.query);
  }

  @Get('data/:sessionId')
  async getMySQLData(@Param('sessionId') sessionId: string): Promise<any> {
    return await this.mysqlService.getMySQLData(sessionId);
  }

  @Delete('session/:sessionId')
  async destroySession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean }> {
    await this.mysqlService.destroyMySQLInstance(sessionId);
    return { success: true };
  }

  @Post('destroy-session')
  async destroySessionPost(
    @Body() body: { sessionId: string },
  ): Promise<{ success: boolean }> {
    await this.mysqlService.destroyMySQLInstance(body.sessionId);
    return { success: true };
  }

  private generateSessionId(): string {
    return (
      'mysql_' +
      Math.random().toString(36).substr(2, 9) +
      Date.now().toString(36)
    );
  }
}
