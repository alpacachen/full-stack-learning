import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  StockData,
  StockDataResponse,
  KLineData,
  KLineDataResponse,
  BatchKLineDataResponse,
  StockKLineResult,
} from './sina-finance.interface';

@Injectable()
export class SinaFinanceService {
  private axiosInstance: AxiosInstance;
  private historyAxiosInstance: AxiosInstance;

  constructor() {
    // 创建 axios 实例，配置新浪财经的基础 URL（实时数据）
    this.axiosInstance = axios.create({
      baseURL: 'https://hq.sinajs.cn',
      timeout: 10000,
      headers: {
        Referer: 'https://finance.sina.com.cn',
      },
    });

    // 创建 axios 实例，配置新浪财经的基础 URL（历史数据）
    this.historyAxiosInstance = axios.create({
      baseURL: 'https://money.finance.sina.com.cn',
      timeout: 15000,
      headers: {
        Referer: 'https://finance.sina.com.cn',
      },
    });
  }

  /**
   * 获取股票实时数据
   * @param stockCodes 股票代码数组，例如 ['sh000001', 'sz399001']
   * @returns 股票数据
   */
  async getStockData(stockCodes: string[]): Promise<StockDataResponse> {
    try {
      if (!stockCodes || stockCodes.length === 0) {
        throw new HttpException('股票代码不能为空', HttpStatus.BAD_REQUEST);
      }

      // 新浪财经接口支持多个股票代码，用逗号分隔
      const list = stockCodes.join(',');
      const response = await this.axiosInstance.get<string>(`/list=${list}`);

      // 解析新浪财经返回的数据
      const data = this.parseStockData(response.data);

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '获取股票数据失败';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 解析新浪财经返回的数据
   * @param rawData 原始数据
   * @returns 解析后的数据
   */
  private parseStockData(rawData: string): StockData[] {
    const lines = rawData.trim().split('\n');
    const results: StockData[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // 解析格式: var hq_str_sh000001="上证指数,3254.31,..."
      const match = line.match(/var hq_str_(.+?)="(.+?)";/);
      if (match) {
        const stockCode = match[1];
        const dataStr = match[2];
        const fields = dataStr.split(',');

        // 根据不同市场解析不同字段
        if (fields.length > 0) {
          const stockData: StockData = {
            code: stockCode,
            name: fields[0] || '',
            raw: fields, // 返回原始数据，方便前端根据需要处理
          };

          // 常见字段（A股）:
          // 0: 股票名称
          // 1: 今日开盘价
          // 2: 昨日收盘价
          // 3: 当前价格
          // 4: 最高价
          // 5: 最低价
          // 6: 买一价
          // 7: 卖一价
          // 8: 成交量
          // 9: 成交额
          // ...
          // 30: 日期
          // 31: 时间
          if (fields.length >= 32) {
            stockData.open = parseFloat(fields[1]) || 0;
            stockData.preClose = parseFloat(fields[2]) || 0;
            stockData.current = parseFloat(fields[3]) || 0;
            stockData.high = parseFloat(fields[4]) || 0;
            stockData.low = parseFloat(fields[5]) || 0;
            stockData.volume = parseFloat(fields[8]) || 0;
            stockData.amount = parseFloat(fields[9]) || 0;
            stockData.date = fields[30];
            stockData.time = fields[31];
          }

          results.push(stockData);
        }
      }
    }

    return results;
  }

  /**
   * 获取股票历史K线数据
   * @param stockCode 股票代码，例如 'sh600000' 或 'sz000001'
   * @param scale K线周期：5=5分钟, 15=15分钟, 30=30分钟, 60=60分钟, 240=日线, 周线=week, 月线=month
   * @param dataLen 返回数据长度，默认100
   * @returns K线数据
   */
  async getKLineData(
    stockCode: string,
    scale: string | number = 240,
    dataLen: number = 100,
  ): Promise<KLineDataResponse> {
    try {
      if (!stockCode) {
        throw new HttpException('股票代码不能为空', HttpStatus.BAD_REQUEST);
      }

      // 新浪财经历史数据接口
      // scale: 5=5分钟, 15=15分钟, 30=30分钟, 60=60分钟, 240=日线, week=周线, month=月线
      const url = `/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${stockCode}&scale=${scale}&ma=no&datalen=${dataLen}`;

      const response = await this.historyAxiosInstance.get<KLineData[]>(url);

      if (!response.data || !Array.isArray(response.data)) {
        throw new HttpException(
          '获取历史数据失败或数据格式错误',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        success: true,
        data: response.data,
        code: stockCode,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '获取股票历史数据失败';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 批量获取股票历史K线数据
   * @param stockCodes 股票代码数组，例如 ['sh600000', 'sz000001']
   * @param scale K线周期，默认240（日线）
   * @param dataLen 返回数据长度，默认100
   * @returns 批量K线数据
   */
  async getBatchKLineData(
    stockCodes: string[],
    scale: string | number = 240,
    dataLen: number = 100,
  ): Promise<BatchKLineDataResponse> {
    if (!stockCodes || stockCodes.length === 0) {
      throw new HttpException('股票代码不能为空', HttpStatus.BAD_REQUEST);
    }

    if (stockCodes.length > 50) {
      throw new HttpException(
        '一次最多只能查询50只股票',
        HttpStatus.BAD_REQUEST,
      );
    }

    const results: StockKLineResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // 并发获取所有股票的K线数据
    const promises = stockCodes.map(async (code) => {
      try {
        const response = await this.getKLineData(code, scale, dataLen);
        successCount++;
        return {
          code,
          success: true,
          data: response.data,
        } as StockKLineResult;
      } catch (error) {
        failureCount++;
        const errorMessage =
          error instanceof Error ? error.message : '获取数据失败';
        return {
          code,
          success: false,
          error: errorMessage,
        } as StockKLineResult;
      }
    });

    // 等待所有请求完成
    const settledResults = await Promise.all(promises);
    results.push(...settledResults);

    return {
      success: true,
      results,
      successCount,
      failureCount,
      timestamp: new Date().toISOString(),
    };
  }
}
