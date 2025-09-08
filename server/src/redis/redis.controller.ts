import { Controller, Injectable, Post } from '@nestjs/common';

@Injectable()
@Controller('redis')
export class RedisController {
  constructor() {}
  @Post('create')
  createRedis() {
    return 'getRedis';
  }
}
