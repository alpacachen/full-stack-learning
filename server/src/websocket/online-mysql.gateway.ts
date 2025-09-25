import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MySQLService } from '../mysql/mysql.service';

@WebSocketGateway({
  namespace: '/online-mysql',
  cors: {
    origin: '*',
  },
})
export class OnlineMySQLGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

  constructor(private mysqlService: MySQLService) {}

  async handleConnection(client: Socket) {
    console.log(`MySQL在线测试客户端连接: ${client.id}`);

    // 存储客户端引用
    this.clients.set(client.id, client);

    try {
      // 为每个连接创建MySQL实例
      const port = await this.mysqlService.createMySQLInstance(client.id);

      // 发送端口信息给客户端
      client.emit('mysqlReady', { port, sessionId: client.id });

      // 延迟启动数据同步，确保WebSocket服务器完全初始化
      this.startDataSync(client.id).catch((error) => {
        console.error('同步MySQL数据失败:', error);
      });
    } catch (error) {
      console.error('创建MySQL实例失败:', error);
      client.emit('error', {
        message: '创建MySQL实例失败',
      });
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`MySQL在线测试客户端断开: ${client.id}`);

    // 移除客户端引用
    this.clients.delete(client.id);

    // 清理MySQL实例
    await this.mysqlService.destroyMySQLInstance(client.id);
  }

  private async startDataSync(sessionId: string) {
    console.log('开始同步MySQL数据:', sessionId);

    const syncData = async () => {
      try {
        console.log('检查WebSocket服务器状态...');

        // 检查server是否存在
        if (!this.server?.sockets) {
          console.log('WebSocket server未就绪，跳过同步');
          return false;
        }

        // 从存储的客户端引用中获取客户端
        const client = this.clients.get(sessionId);
        console.log('找到客户端:', !!client, '连接状态:', client?.connected);

        if (!client || !client.connected) {
          console.log('客户端未连接，停止同步');
          return false;
        }

        const data = await this.mysqlService.getMySQLData(sessionId);
        console.log('获取MySQL数据:', !!data);

        if (data) {
          client.emit('mysqlDataUpdate', data);
          console.log('发送MySQL数据更新');
        }
        return true;
      } catch (error) {
        console.error('同步MySQL数据失败:', error);
        return false;
      }
    };

    // 立即同步一次
    await syncData();

    // 设置定时同步（每3秒）
    const interval = setInterval(() => {
      syncData()
        .then((success) => {
          if (!success) {
            clearInterval(interval);
          }
        })
        .catch((error) => {
          console.error('同步MySQL数据失败:', error);
        });
    }, 3000);

    // 设置清理定时器的超时
    setTimeout(() => {
      clearInterval(interval);
    }, 300000); // 5分钟后自动清理
  }
}
