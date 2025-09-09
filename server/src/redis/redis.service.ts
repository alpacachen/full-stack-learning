import { Injectable } from '@nestjs/common';
import { RedisMemoryServer } from 'redis-memory-server';
import { createClient } from 'redis';

interface RedisInstance {
  server: RedisMemoryServer;
  client: ReturnType<typeof createClient>;
  port: number;
  createdAt: Date;
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

  private parseCommand(command: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
      const char = command[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      } else if (!inQuotes && char === ' ') {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  async executeCommand(sessionId: string, command: string) {
    const instance = this.redisInstances.get(sessionId);
    if (!instance) {
      throw new Error('Redis实例不存在');
    }

    try {
      const parts = this.parseCommand(command.trim());
      const result = await instance.client.sendCommand(parts);

      return {
        success: true,
        result: result as unknown as string,
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

  async getRedisData(sessionId: string) {
    const instance = this.redisInstances.get(sessionId);
    if (!instance) {
      return null;
    }

    const keys = (await instance.client.sendCommand([
      'KEYS',
      '*',
    ])) as unknown as string[];
    const keysWithType = await Promise.all(
      keys.map(async (key) => {
        const type = (await instance.client.sendCommand([
          'TYPE',
          key,
        ])) as unknown as string;
        return { key, type };
      }),
    );
    return {
      keysWithType,
      port: instance.port,
      lastUpdated: new Date(),
    };
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
