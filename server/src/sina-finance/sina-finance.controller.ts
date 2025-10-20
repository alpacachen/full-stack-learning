import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SinaFinanceService } from './sina-finance.service';
import type {
  KLineDataResponse,
  BatchKLineDataResponse,
} from './sina-finance.interface';

@Controller('sina-finance-proxy')
export class SinaFinanceController {
  constructor(private readonly sinaFinanceService: SinaFinanceService) {}
  async getKLineData(
    @Query('code') code: string,
    @Query('scale') scale?: string,
    @Query('datalen') datalen?: string,
  ): Promise<KLineDataResponse> {
    try {
      if (!code) {
        throw new HttpException(
          '请提供股票代码参数 code',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 解析参数
      const scaleValue = scale || '240';
      const datalenValue = datalen ? parseInt(datalen, 10) : 100;

      if (isNaN(datalenValue) || datalenValue <= 0 || datalenValue > 1000) {
        throw new HttpException(
          'datalen 参数必须是1-1000之间的数字',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.sinaFinanceService.getKLineData(
        code,
        scaleValue,
        datalenValue,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '获取股票历史数据失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 批量获取股票历史K线数据
   * GET /api/sina-finance-proxy/batch-kline?codes=sh600000,sz000001&scale=240&datalen=100
   * 或 GET /api/sina-finance-proxy/batch-kline?codes=sh600000&codes=sz000001&scale=240&datalen=100
   */
  @Get('batch-kline')
  async getBatchKLineData(
    @Query('codes') codes: string | string[],
    @Query('scale') scale?: string,
    @Query('datalen') datalen?: string,
  ): Promise<BatchKLineDataResponse> {
    try {
      // 处理 codes 参数，支持逗号分隔或多个 codes 参数
      let stockCodes: string[];

      if (Array.isArray(codes)) {
        stockCodes = codes;
      } else if (typeof codes === 'string') {
        // 支持逗号分隔
        stockCodes = codes
          .split(',')
          .map((code) => code.trim())
          .filter((code) => code);
      } else {
        throw new HttpException(
          '请提供股票代码参数 codes',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (stockCodes.length === 0) {
        throw new HttpException('股票代码不能为空', HttpStatus.BAD_REQUEST);
      }

      // 解析参数
      const scaleValue = scale || '240';
      const datalenValue = datalen ? parseInt(datalen, 10) : 100;

      if (isNaN(datalenValue) || datalenValue <= 0 || datalenValue > 1000) {
        throw new HttpException(
          'datalen 参数必须是1-1000之间的数字',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.sinaFinanceService.getBatchKLineData(
        stockCodes,
        scaleValue,
        datalenValue,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '批量获取股票历史数据失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
