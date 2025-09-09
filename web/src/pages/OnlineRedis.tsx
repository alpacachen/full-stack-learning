import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Spin, Typography, Space, Tag, Drawer, List, Flex, Row, Col } from 'antd';
import { PlayCircleOutlined, ClearOutlined, QuestionCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import { AuthGuard } from "../guard/auth-guard";
import { useUserSession } from "../context/user-session";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface RedisData {
  port: number;
  keysWithType: { key: string; type: string }[];
  lastUpdated: string;
}

interface CommandResult {
  success: boolean;
  result?: unknown;
  error?: string;
  command: string;
}

interface RedisCommandExample {
  category: string;
  commands: {
    command: string;
    description: string;
    example: string;
  }[];
}

const redisCommandExamples: RedisCommandExample[] = [
  {
    category: "字符串 (String)",
    commands: [
      { command: "SET", description: "设置键值", example: "SET mykey 'hello world'" },
      { command: "GET", description: "获取键值", example: "GET mykey" },
      { command: "INCR", description: "递增数字", example: "INCR counter" },
      { command: "DECR", description: "递减数字", example: "DECR counter" },
      { command: "APPEND", description: "追加字符串", example: "APPEND mykey ' suffix'" },
      { command: "STRLEN", description: "获取字符串长度", example: "STRLEN mykey" }
    ]
  },
  {
    category: "哈希 (Hash)",
    commands: [
      { command: "HSET", description: "设置哈希字段", example: "HSET user:1 name '张三' age 25" },
      { command: "HGET", description: "获取哈希字段", example: "HGET user:1 name" },
      { command: "HGETALL", description: "获取所有哈希字段", example: "HGETALL user:1" },
      { command: "HDEL", description: "删除哈希字段", example: "HDEL user:1 age" },
      { command: "HEXISTS", description: "检查哈希字段是否存在", example: "HEXISTS user:1 name" }
    ]
  },
  {
    category: "列表 (List)",
    commands: [
      { command: "LPUSH", description: "从左侧推入元素", example: "LPUSH mylist 'item1' 'item2'" },
      { command: "RPUSH", description: "从右侧推入元素", example: "RPUSH mylist 'item3'" },
      { command: "LPOP", description: "从左侧弹出元素", example: "LPOP mylist" },
      { command: "RPOP", description: "从右侧弹出元素", example: "RPOP mylist" },
      { command: "LRANGE", description: "获取范围内的元素", example: "LRANGE mylist 0 -1" },
      { command: "LLEN", description: "获取列表长度", example: "LLEN mylist" }
    ]
  },
  {
    category: "集合 (Set)",
    commands: [
      { command: "SADD", description: "添加集合成员", example: "SADD myset 'member1' 'member2'" },
      { command: "SMEMBERS", description: "获取所有成员", example: "SMEMBERS myset" },
      { command: "SREM", description: "删除集合成员", example: "SREM myset 'member1'" },
      { command: "SCARD", description: "获取集合大小", example: "SCARD myset" },
      { command: "SISMEMBER", description: "检查成员是否存在", example: "SISMEMBER myset 'member1'" }
    ]
  },
  {
    category: "有序集合 (Sorted Set)",
    commands: [
      { command: "ZADD", description: "添加有序集合成员", example: "ZADD leaderboard 100 'player1' 200 'player2'" },
      { command: "ZRANGE", description: "按排名获取成员", example: "ZRANGE leaderboard 0 -1 WITHSCORES" },
      { command: "ZREM", description: "删除有序集合成员", example: "ZREM leaderboard 'player1'" },
      { command: "ZCARD", description: "获取有序集合大小", example: "ZCARD leaderboard" },
      { command: "ZSCORE", description: "获取成员分数", example: "ZSCORE leaderboard 'player1'" }
    ]
  },
  {
    category: "通用命令",
    commands: [
      { command: "KEYS", description: "查找键", example: "KEYS user:*" },
      { command: "EXISTS", description: "检查键是否存在", example: "EXISTS mykey" },
      { command: "DEL", description: "删除键", example: "DEL mykey" },
      { command: "TYPE", description: "获取键类型", example: "TYPE mykey" },
      { command: "TTL", description: "获取键过期时间", example: "TTL mykey" },
      { command: "EXPIRE", description: "设置键过期时间", example: "EXPIRE mykey 3600" },
      { command: "FLUSHDB", description: "清空当前数据库", example: "FLUSHDB" }
    ]
  }
];

function InnerOnlineRedis() {
  const { postWithAuth } = useUserSession();
  const [isConnecting, setIsConnecting] = useState(true);
  const [redisPort, setRedisPort] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [redisData, setRedisData] = useState<RedisData | null>(null);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showCommandHelp, setShowCommandHelp] = useState(false);

  // 初始化WebSocket连接
  useEffect(() => {
    const newSocket = io('http://localhost:3000/online-redis');

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

  // 插入命令到输入框
  const insertCommand = (commandExample: string) => {
    setCommand(commandExample);
    setShowCommandHelp(false);
  };

  if (isConnecting) {
    return (
      <Flex justify="center" align="center" className="h-64">
        <Spin size="large" />
        <div className="ml-4">
          <Title level={4}>正在准备Redis环境...</Title>
          <Text type="secondary">正在启动内存Redis服务器</Text>
        </div>
      </Flex>
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
              <Tag color="purple">键数量: {redisData.keysWithType.length}</Tag>
              <Text type="secondary">
                最后更新: {new Date(redisData.lastUpdated).toLocaleTimeString()}
              </Text>
            </>
          )}
        </Space>
      </Card>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          {/* 命令执行区域 */}
          <Card title="Redis命令执行器">
            <Space.Compact className="w-full mb-4">
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
                icon={<QuestionCircleOutlined />}
                onClick={() => setShowCommandHelp(true)}
              >
                命令提示
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
        </Col>

        <Col xs={24} lg={12}>
          {/* Redis数据展示区域 */}
          <Card title="Redis实时数据">
            {redisData ? (
              <Flex vertical gap={8} className="max-h-80 overflow-y-auto">
                {redisData.keysWithType.map((key) => (
                  <Tag key={key.key}>类型:{key.type} 键:{key.key}</Tag>
                ))}
              </Flex>
            ) : (
              <Spin>
                <Text>正在获取Redis数据...</Text>
              </Spin>
            )}
          </Card>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card title="使用说明" className="mt-6">
        <div className="text-sm text-gray-600">
          <p>• 每个用户会获得一个独立的Redis实例，端口随机分配</p>
          <p>• 支持所有Redis原生命令，如：SET, GET, HSET, LPUSH等</p>
          <p>• 数据实时同步，右侧面板每2秒自动更新</p>
          <p>• 断开连接时Redis实例自动销毁</p>
        </div>
      </Card>

      {/* Redis命令提示 Drawer */}
      <Drawer
        title="Redis 命令提示"
        placement="right"
        width={600}
        onClose={() => setShowCommandHelp(false)}
        open={showCommandHelp}
      >
        <Flex vertical gap={16}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            点击命令示例可直接插入到命令输入框中
          </div>
          {redisCommandExamples.map((category, categoryIndex) => (
            <Card
              key={categoryIndex}
              title={
                <span style={{ fontSize: '16px', fontWeight: 600 }}>{category.category}</span>
              }
              size="small"
              style={{ marginBottom: '16px' }}
            >
              <List
                dataSource={category.commands}
                renderItem={(cmd, index) => (
                  <List.Item
                    key={index}
                    className="cursor-pointer rounded p-2 transition-colors hover:bg-gray-50"
                    onClick={() => insertCommand(cmd.example)}
                    actions={[
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          insertCommand(cmd.example);
                        }}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color="blue">{cmd.command}</Tag>
                          <span className="text-sm">{cmd.description}</span>
                        </Space>
                      }
                      description={
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {cmd.example}
                        </code>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          ))}
        </Flex>
      </Drawer>
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