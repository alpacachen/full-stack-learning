import { Injectable } from '@nestjs/common';
import { createDB } from 'mysql-memory-server';
import * as mysql from 'mysql2/promise';

interface MySQLInstance {
  server: {
    port: number;
    stop: () => Promise<void>;
  };
  connection: mysql.Connection;
  port: number;
  createdAt: Date;
}

@Injectable()
export class MySQLService {
  private mysqlInstances: Map<string, MySQLInstance> = new Map();

  async createMySQLInstance(sessionId: string): Promise<number> {
    if (this.mysqlInstances.has(sessionId)) {
      await this.destroyMySQLInstance(sessionId);
    }
    const mysqlDB = await createDB({
      dbName: 'testdb',
      username: 'root',
    });
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: mysqlDB.port,
      user: mysqlDB.username,
      password: '',
      database: mysqlDB.dbName,
    });
    // 创建默认数据库和一些示例表
    await connection.query('CREATE DATABASE IF NOT EXISTS testdb');
    await connection.query('USE testdb');

    // 创建示例表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        age INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 插入示例数据
    await connection.query(`
      INSERT IGNORE INTO users (name, email, age) VALUES
      ('张三', 'zhangsan@example.com', 25),
      ('李四', 'lisi@example.com', 30),
      ('王五', 'wangwu@example.com', 28)
    `);

    await connection.query(`
      INSERT IGNORE INTO products (name, price, category) VALUES
      ('iPhone 15', 7999.00, '手机'),
      ('MacBook Pro', 12999.00, '笔记本'),
      ('iPad Air', 4599.00, '平板')
    `);

    this.mysqlInstances.set(sessionId, {
      server: mysqlDB,
      connection: connection,
      port: mysqlDB.port,
      createdAt: new Date(),
    });

    console.log(
      `MySQL实例创建成功 - SessionId: ${sessionId}, Port: ${mysqlDB.port}`,
    );
    return mysqlDB.port;
  }

  async executeQuery(sessionId: string, query: string) {
    const instance = this.mysqlInstances.get(sessionId);
    if (!instance) {
      throw new Error('MySQL实例不存在');
    }

    try {
      const [rows, fields] = await instance.connection.execute(query);

      return {
        success: true,
        result: {
          rows: rows,
          fields:
            fields?.map((field) => ({
              name: field.name,
              type: field.type,
            })) || [],
          affectedRows: (rows as any)?.affectedRows,
          insertId: (rows as any)?.insertId,
        },
        query: query,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        query: query,
      };
    }
  }

  async getMySQLData(sessionId: string) {
    const instance = this.mysqlInstances.get(sessionId);
    if (!instance) {
      return null;
    }

    try {
      // 获取所有数据库
      const [databases] = await instance.connection.query('SHOW DATABASES');

      // 获取当前数据库的所有表
      const [tables] = await instance.connection.query(
        'SHOW TABLES FROM testdb',
      );

      // 获取每个表的基本信息
      const tableInfo: any[] = [];
      for (const table of tables as any[]) {
        const tableName = Object.values(table)[0] as string;
        const [tableStatus] = await instance.connection.query(
          `SHOW TABLE STATUS FROM testdb LIKE '${tableName}'`,
        );
        const [columns] = await instance.connection.query(
          `DESCRIBE testdb.${tableName}`,
        );

        tableInfo.push({
          name: tableName,
          status: tableStatus,
          columns: columns,
        });
      }

      return {
        databases: databases,
        tables: tableInfo,
        port: instance.port,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('获取MySQL数据失败:', error);
      return {
        databases: [],
        tables: [],
        port: instance.port,
        lastUpdated: new Date(),
      };
    }
  }

  async destroyMySQLInstance(sessionId: string): Promise<void> {
    const instance = this.mysqlInstances.get(sessionId);
    if (!instance) {
      return;
    }

    try {
      await instance.connection.end();
      await instance.server.stop();
      this.mysqlInstances.delete(sessionId);
      console.log(`MySQL实例销毁 - SessionId: ${sessionId}`);
    } catch (error) {
      console.error('销毁MySQL实例失败:', error);
    }
  }

  getInstancePort(sessionId: string): number | null {
    const instance = this.mysqlInstances.get(sessionId);
    return instance ? instance.port : null;
  }
}
