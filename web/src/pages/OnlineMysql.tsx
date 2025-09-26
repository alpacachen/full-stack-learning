import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Spin, Typography, Space, Tag, Drawer, List, Flex, Row, Col, Table } from 'antd';
import { PlayCircleOutlined, ClearOutlined, QuestionCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import { basePost } from '../utils/fetch';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface MySQLData {
  port: number;
  databases: any[];
  tables: {
    name: string;
    status: any[];
    columns: any[];
  }[];
  lastUpdated: string;
}

interface QueryResult {
  success: boolean;
  result?: {
    rows: any[];
    fields: { name: string; type: number }[];
    affectedRows?: number;
    insertId?: number;
  };
  error?: string;
  query: string;
}

interface MySQLCommandExample {
  category: string;
  commands: {
    command: string;
    description: string;
    example: string;
  }[];
}

const mysqlCommandExamples: MySQLCommandExample[] = [
  {
    category: "基础查询",
    commands: [
      { command: "SELECT", description: "查询数据", example: "SELECT * FROM users" },
      { command: "SELECT with WHERE", description: "条件查询", example: "SELECT name, age FROM users WHERE age > 25" },
      { command: "SELECT with ORDER", description: "排序查询", example: "SELECT * FROM users ORDER BY age DESC" },
      { command: "SELECT with LIMIT", description: "限制结果数量", example: "SELECT * FROM users LIMIT 5" },
      { command: "COUNT", description: "统计记录数", example: "SELECT COUNT(*) FROM users" },
    ]
  },
  {
    category: "数据操作",
    commands: [
      { command: "INSERT", description: "插入数据", example: "INSERT INTO users (name, email, age) VALUES ('新用户', 'new@example.com', 22)" },
      { command: "UPDATE", description: "更新数据", example: "UPDATE users SET age = 26 WHERE name = '张三'" },
      { command: "DELETE", description: "删除数据", example: "DELETE FROM users WHERE age < 20" },
    ]
  },
  {
    category: "表结构操作",
    commands: [
      { command: "CREATE TABLE", description: "创建表", example: "CREATE TABLE test_table (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100))" },
      { command: "ALTER TABLE", description: "修改表结构", example: "ALTER TABLE users ADD COLUMN phone VARCHAR(20)" },
      { command: "DROP TABLE", description: "删除表", example: "DROP TABLE test_table" },
      { command: "DESCRIBE", description: "查看表结构", example: "DESCRIBE users" },
    ]
  },
  {
    category: "联表查询",
    commands: [
      { command: "INNER JOIN", description: "内连接", example: "SELECT u.name, p.name as product FROM users u INNER JOIN products p ON u.id = p.id" },
      { command: "LEFT JOIN", description: "左连接", example: "SELECT u.name, p.price FROM users u LEFT JOIN products p ON u.id = p.id" },
    ]
  },
  {
    category: "系统命令",
    commands: [
      { command: "SHOW TABLES", description: "显示所有表", example: "SHOW TABLES" },
      { command: "SHOW DATABASES", description: "显示所有数据库", example: "SHOW DATABASES" },
      { command: "SHOW COLUMNS", description: "显示表字段", example: "SHOW COLUMNS FROM users" },
      { command: "SHOW CREATE TABLE", description: "显示建表语句", example: "SHOW CREATE TABLE users" },
    ]
  }
];

function InnerOnlineMysql() {
  const [isConnecting, setIsConnecting] = useState(true);
  const [mysqlPort, setMysqlPort] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [mysqlData, setMysqlData] = useState<MySQLData | null>(null);
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showCommandHelp, setShowCommandHelp] = useState(false);

  // 初始化WebSocket连接
  useEffect(() => {
    const newSocket = io(`${import.meta.env.VITE_WS_DOMAIN}/online-mysql`);

    newSocket.on('connect', () => {
      console.log('WebSocket连接成功');
      setSessionId(newSocket.id ?? '');
    });

    newSocket.on('mysqlReady', (data: { port: number; sessionId: string }) => {
      console.log('MySQL实例准备完成:', data);
      setMysqlPort(data.port);
      setIsConnecting(false);
    });

    newSocket.on('mysqlDataUpdate', (data: MySQLData) => {
      setMysqlData(data);
    });

    newSocket.on('error', (error: { message: string; error: string }) => {
      console.error('MySQL错误:', error);
      setIsConnecting(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 执行MySQL查询
  const executeQuery = useCallback(async () => {
    if (!query.trim() || !sessionId) return;

    setIsExecuting(true);
    try {
      const result = await basePost('/mysql/execute', {
        sessionId,
        query: query.trim(),
      });

      setQueryHistory(prev => [result, ...prev]);
      setQuery('');
    } catch (error) {
      console.error('执行查询失败:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [query, sessionId]);

  // 清空查询历史
  const clearHistory = () => {
    setQueryHistory([]);
  };

  // 处理Enter键执行
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeQuery();
    }
  };

  // 插入命令到输入框
  const insertCommand = (commandExample: string) => {
    setQuery(commandExample);
    setShowCommandHelp(false);
  };

  // 渲染查询结果
  const renderQueryResult = (result: QueryResult) => {
    if (!result.success) {
      return (
        <div className="text-red-600 mt-1">
          错误: {result.error}
        </div>
      );
    }

    if (!result.result?.rows) {
      return (
        <div className="text-green-600 mt-1">
          查询执行成功
          {result.result?.affectedRows && ` (影响 ${result.result.affectedRows} 行)`}
          {result.result?.insertId && ` (插入ID: ${result.result.insertId})`}
        </div>
      );
    }

    const { rows, fields } = result.result;

    if (Array.isArray(rows) && rows.length > 0) {
      const columns = fields?.map(field => ({
        title: field.name,
        dataIndex: field.name,
        key: field.name,
      })) || Object.keys(rows[0]).map(key => ({
        title: key,
        dataIndex: key,
        key: key,
      }));

      return (
        <div className="mt-2">
          <div className="text-green-600 mb-2">查询返回 {rows.length} 条记录</div>
          <Table
            dataSource={rows.map((row, index) => ({ ...row, key: index }))}
            columns={columns}
            pagination={{ pageSize: 10 }}
            size="small"
            scroll={{ x: true }}
          />
        </div>
      );
    }

    return (
      <div className="text-green-600 mt-1">
        查询执行成功，无返回结果
      </div>
    );
  };

  if (isConnecting) {
    return (
      <Flex justify="center" align="center" className="h-64">
        <Spin size="large" />
        <div className="ml-4">
          <Title level={4}>正在准备MySQL环境...</Title>
          <Text type="secondary">正在启动内存MySQL服务器</Text>
        </div>
      </Flex>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Title level={2}>在线MySQL测试</Title>

      {/* MySQL信息面板 */}
      <Card className="mb-6">
        <Space>
          <Tag color="green">端口: {mysqlPort}</Tag>
          <Tag color="blue">会话ID: {sessionId}</Tag>
          {mysqlData && (
            <>
              <Tag color="purple">表数量: {mysqlData.tables.length}</Tag>
              <Text type="secondary">
                最后更新: {new Date(mysqlData.lastUpdated).toLocaleTimeString()}
              </Text>
            </>
          )}
        </Space>
      </Card>

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          {/* 查询执行区域 */}
          <Card title="MySQL查询执行器">
            <Space.Compact className="w-full mb-4">
              <TextArea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入SQL查询，如：SELECT * FROM users&#10;使用 Ctrl+Enter 或 Cmd+Enter 执行"
                autoSize={{ minRows: 3, maxRows: 8 }}
                onKeyDown={handleKeyPress}
              />
            </Space.Compact>

            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={executeQuery}
                loading={isExecuting}
                disabled={!query.trim()}
              >
                执行查询 (Ctrl+Enter)
              </Button>
              <Button
                icon={<QuestionCircleOutlined />}
                onClick={() => setShowCommandHelp(true)}
              >
                SQL提示
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={clearHistory}
                disabled={queryHistory.length === 0}
              >
                清空历史
              </Button>
            </Space>

            {/* 查询执行历史 */}
            <div className="mt-4 max-h-96 overflow-y-auto">
              <Title level={5}>执行历史</Title>
              {queryHistory.length === 0 ? (
                <Text type="secondary">暂无查询执行记录</Text>
              ) : (
                queryHistory.map((result, index) => (
                  <Card key={index} size="small" className="mb-3">
                    <div className="font-mono text-sm">
                      <div className="text-blue-600 font-medium mb-2">SQL: {result.query}</div>
                      {renderQueryResult(result)}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          {/* MySQL数据展示区域 */}
          <Card title="数据库结构">
            {mysqlData ? (
              <div className="space-y-4">
                <div>
                  <Title level={5}>数据库</Title>
                  <div className="flex flex-wrap gap-2">
                    {mysqlData.databases.map((db: any, index) => (
                      <Tag key={index} color="blue">
                        {Object.values(db)[0] as string}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div>
                  <Title level={5}>表结构</Title>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {mysqlData.tables.map((table) => (
                      <Card key={table.name} size="small" title={table.name}>
                        <div className="space-y-1">
                          {table.columns.map((column: any, index) => (
                            <div key={index} className="text-xs">
                              <Tag color="green">{column.Field}</Tag>
                              <span className="text-gray-500 ml-1">{column.Type}</span>
                              {column.Key === 'PRI' && <Tag color="red" className="ml-1">主键</Tag>}
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Spin>
                <Text>正在获取MySQL数据...</Text>
              </Spin>
            )}
          </Card>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card title="使用说明" className="mt-6">
        <div className="text-sm text-gray-600 space-y-1">
          <p>• 每个用户会获得一个独立的MySQL实例，端口随机分配</p>
          <p>• 默认创建了 testdb 数据库，包含 users 和 products 示例表</p>
          <p>• 支持所有MySQL标准SQL语句：SELECT、INSERT、UPDATE、DELETE等</p>
          <p>• 使用 Ctrl+Enter (Windows) 或 Cmd+Enter (Mac) 快速执行查询</p>
          <p>• 数据实时同步，右侧面板每3秒自动更新表结构</p>
          <p>• 断开连接时MySQL实例自动销毁</p>
        </div>
      </Card>

      {/* MySQL命令提示 Drawer */}
      <Drawer
        title="MySQL SQL 提示"
        placement="right"
        width={600}
        onClose={() => setShowCommandHelp(false)}
        open={showCommandHelp}
      >
        <Flex vertical gap={16}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            点击SQL示例可直接插入到查询输入框中
          </div>
          {mysqlCommandExamples.map((category, categoryIndex) => (
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

export default function OnlineMysql() {
  return <InnerOnlineMysql />;
}