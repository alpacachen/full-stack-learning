import { Controller, Post, Body } from '@nestjs/common';
import { MySQLService } from './mysql.service';

@Controller('mysql')
export class MySQLController {
  constructor(private readonly mysqlService: MySQLService) {}

  @Post('execute')
  async executeQuery(@Body() body: { sessionId: string; query: string }) {
    return this.mysqlService.executeQuery(body.sessionId, body.query);
  }
}
