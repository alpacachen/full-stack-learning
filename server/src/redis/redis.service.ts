import { Injectable } from '@nestjs/common';
import { RedisMemoryServer } from 'redis-memory-server';
import { createClient } from 'redis';

interface RedisInstance {
  server: RedisMemoryServer;
  client: ReturnType<typeof createClient>;
  port: number;
  createdAt: Date;
}

interface RedisKeyValue {
  key: string;
  type: string;
  value: any;
}

interface RedisDataResponse {
  port: number;
  keys: number;
  keysList: string[];
  keyValuePairs: RedisKeyValue[];
  lastUpdated: Date;
}

@Injectable()
export class RedisService {
  private redisInstances: Map<string, RedisInstance> = new Map();

  async createRedisInstance(sessionId: string): Promise<number> {
    if (this.redisInstances.has(sessionId)) {
      await this.destroyRedisInstance(sessionId);
    }

    const redisServer = new RedisMemoryServer();
    await redisServer.start();
    const port = await redisServer.getPort();

    const client = createClient({
      socket: {
        host: 'localhost',
        port: port,
      },
    });

    await client.connect();

    this.redisInstances.set(sessionId, {
      server: redisServer,
      client: client,
      port: port,
      createdAt: new Date(),
    });

    console.log(`Redis实例创建成功 - SessionId: ${sessionId}, Port: ${port}`);
    return port;
  }

  async executeCommand(sessionId: string, command: string): Promise<any> {
    const instance = this.redisInstances.get(sessionId);
    if (!instance) {
      throw new Error('Redis实例不存在');
    }

    try {
      const parts = command.trim().split(' ');
      const result = await instance.client.sendCommand(parts);

      return {
        success: true,
        result: result,
        command: command,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        command: command,
      };
    }
  }

  async getRedisData(sessionId: string): Promise<RedisDataResponse | null> {
    const instance = this.redisInstances.get(sessionId);
    if (!instance) {
      return null;
    }

    try {
      const keys = await instance.client.sendCommand(['KEYS', '*']);
      const keysList = Array.isArray(keys) ? (keys as string[]) : [];

      // 获取每个键的类型和值
      const keyValuePairs: RedisKeyValue[] = [];

      for (const key of keysList) {
        try {
          const type = (await instance.client.sendCommand([
            'TYPE',
            key,
          ])) as string;
          let value: any;

          switch (type) {
            case 'string':
              value = await instance.client.sendCommand(['GET', key]);
              break;
            case 'list':
              value = await instance.client.sendCommand([
                'LRANGE',
                key,
                '0',
                '-1',
              ]);
              break;
            case 'set':
              value = await instance.client.sendCommand(['SMEMBERS', key]);
              break;
            case 'hash':
              value = await instance.client.sendCommand(['HGETALL', key]);
              break;
            case 'zset':
              value = await instance.client.sendCommand([
                'ZRANGE',
                key,
                '0',
                '-1',
                'WITHSCORES',
              ]);
              break;
            default:
              value = 'Unsupported type';
          }

          keyValuePairs.push({ key, type, value });
        } catch (error) {
          keyValuePairs.push({
            key,
            type: 'error',
            value: 'Failed to get value',
          });
        }
      }

      return {
        port: instance.port,
        keys: keysList.length,
        keysList: keysList,
        keyValuePairs: keyValuePairs,
        lastUpdated: new Date(),
      };
    } catch {
      return null;
    }
  }

  async destroyRedisInstance(sessionId: string): Promise<void> {
    const instance = this.redisInstances.get(sessionId);
    if (!instance) {
      return;
    }

    try {
      await instance.client.quit();
      await instance.server.stop();
      this.redisInstances.delete(sessionId);
      console.log(`Redis实例销毁 - SessionId: ${sessionId}`);
    } catch (error) {
      console.error('销毁Redis实例失败:', error);
    }
  }

  getInstancePort(sessionId: string): number | null {
    const instance = this.redisInstances.get(sessionId);
    return instance ? instance.port : null;
  }
}
