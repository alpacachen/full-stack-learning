import React, { useState, useEffect, useCallback, type FC } from 'react';
import { Card, Button, Input, Spin, Typography, Space, Tag } from 'antd';
import { PlayCircleOutlined, ClearOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import { AuthGuard } from "../guard/auth-guard";
import { useUserSession } from "../context/user-session";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface StringKeyValue {
  key: string;
  type: 'string';
  value: string;
}

type KeyValue = StringKeyValue;

interface RedisData {
  port: number;
  keys: number;
  keysList: string[];
  keyValuePairs: KeyValue[];
  lastUpdated: string;
}

interface CommandResult {
  success: boolean;
  result?: unknown;
  error?: string;
  command: string;
}

const KVRender: FC<{ item: KeyValue }> = ({ item }) => {
  switch (item.type) {
    case 'string':
      return <Card key={item.key} size="small" className="mb-2">
        <div className="font-mono text-sm">{item.key}</div>
        <div className="text-gray-700">{item.value}</div>
      </Card>;
    default:
      return <div>{item.value}</div>;
  }
};

function InnerOnlineRedis() {
  const { postWithAuth } = useUserSession();
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [redisPort, setRedisPort] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [redisData, setRedisData] = useState<RedisData | null>(null);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // 初始化WebSocket连接
  useEffect(() => {
    const newSocket = io('http://localhost:3000/online-redis');
    // setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('WebSocket连接成功');
      setSessionId(newSocket.id ?? '');
    });

    newSocket.on('redisReady', (data: { port: number; sessionId: string }) => {
      console.log('Redis实例准备完成:', data);
      setRedisPort(data.port);
      setIsConnecting(false);
    });

    newSocket.on('redisDataUpdate', (data: RedisData) => {
      setRedisData(data);
    });

    newSocket.on('error', (error: { message: string; error: string }) => {
      console.error('Redis错误:', error);
      setIsConnecting(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 执行Redis命令
  const executeCommand = useCallback(async () => {
    if (!command.trim() || !sessionId) return;

    setIsExecuting(true);
    try {
      const result = await postWithAuth('/redis/execute', {
        sessionId,
        command: command.trim(),
      });

      setCommandHistory(prev => [result, ...prev]);
      setCommand('');
    } catch (error) {
      console.error('执行命令失败:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [command, sessionId, postWithAuth]);

  // 清空命令历史
  const clearHistory = () => {
    setCommandHistory([]);
  };

  // 处理Enter键执行
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
        <div className="ml-4">
          <Title level={4}>正在准备Redis环境...</Title>
          <Text type="secondary">正在启动内存Redis服务器</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title level={2}>在线Redis测试</Title>

      {/* Redis信息面板 */}
      <Card className="mb-6">
        <Space>
          <Tag color="green">端口: {redisPort}</Tag>
          <Tag color="blue">会话ID: {sessionId}</Tag>
          {redisData && (
            <>
              <Tag color="purple">键数量: {redisData.keys}</Tag>
              <Text type="secondary">
                最后更新: {new Date(redisData.lastUpdated).toLocaleTimeString()}
              </Text>
            </>
          )}
        </Space>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 命令执行区域 */}
        <Card title="Redis命令执行器" className="h-fit">
          <Space.Compact style={{ width: '100%' }} className="mb-4">
            <TextArea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="输入Redis命令，如：SET mykey myvalue"
              autoSize={{ minRows: 2, maxRows: 6 }}
              onKeyDown={handleKeyPress}
            />
          </Space.Compact>

          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={executeCommand}
              loading={isExecuting}
              disabled={!command.trim()}
            >
              执行命令
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={clearHistory}
              disabled={commandHistory.length === 0}
            >
              清空历史
            </Button>
          </Space>

          {/* 命令执行历史 */}
          <div className="mt-4 max-h-80 overflow-y-auto">
            <Title level={5}>执行历史</Title>
            {commandHistory.length === 0 ? (
              <Text type="secondary">暂无命令执行记录</Text>
            ) : (
              commandHistory.map((result, index) => (
                <Card key={index} size="small" className="mb-2">
                  <div className="font-mono text-sm">
                    <div className="text-blue-600">$ {result.command}</div>
                    {result.success ? (
                      <div className="text-green-600 mt-1">
                        {typeof result.result === 'string'
                          ? result.result
                          : result.result === null || result.result === undefined
                            ? 'OK'
                            : (() => {
                              try {
                                return JSON.stringify(result.result, null, 2);
                              } catch {
                                return String(result.result);
                              }
                            })()}
                      </div>
                    ) : (
                      <div className="text-red-600 mt-1">
                        错误: {typeof result.error === 'string' ? result.error : String(result.error)}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* Redis数据展示区域 */}
        <Card title="Redis实时数据" className="h-fit">
          {redisData ? (
            <div>
              <div className="mb-4">
                <Text strong>当前键值对 ({redisData.keys} 个):</Text>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {redisData.keyValuePairs.map((item, index) => (
                  <KVRender key={index + '_' + item.key} item={item} />
                ))}
              </div>

              <div className="mt-4 text-xs text-gray-500">
                自动刷新 • 最后更新: {new Date(redisData.lastUpdated).toLocaleString()}
              </div>
            </div>
          ) : (
            <Spin>
              <Text>正在获取Redis数据...</Text>
            </Spin>
          )}
        </Card>
      </div>

      {/* 使用说明 */}
      <Card title="使用说明" className="mt-6">
        <div className="text-sm text-gray-600">
          <p>• 每个用户会获得一个独立的Redis实例，端口随机分配</p>
          <p>• 支持所有Redis原生命令，如：SET, GET, HSET, LPUSH等</p>
          <p>• 数据实时同步，右侧面板每2秒自动更新</p>
          <p>• 断开连接时Redis实例自动销毁</p>
        </div>
      </Card>
    </div>
  );
}

export const OnlineRedis = () => {
  return (
    <AuthGuard>
      <InnerOnlineRedis />
    </AuthGuard>
  );
};