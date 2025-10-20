/**
 * 股票实时数据接口
 */
export interface StockData {
  /** 股票代码 */
  code: string;
  /** 股票名称 */
  name: string;
  /** 原始数据数组 */
  raw: string[];
  /** 今日开盘价 */
  open?: number;
  /** 昨日收盘价 */
  preClose?: number;
  /** 当前价格 */
  current?: number;
  /** 最高价 */
  high?: number;
  /** 最低价 */
  low?: number;
  /** 成交量 */
  volume?: number;
  /** 成交额 */
  amount?: number;
  /** 日期 */
  date?: string;
  /** 时间 */
  time?: string;
}

/**
 * K线数据接口（历史数据）
 */
export interface KLineData {
  /** 日期 YYYY-MM-DD */
  day: string;
  /** 开盘价 */
  open: string;
  /** 最高价 */
  high: string;
  /** 最低价 */
  low: string;
  /** 收盘价 */
  close: string;
  /** 成交量 */
  volume: string;
}

/**
 * 实时数据 API 响应接口
 */
export interface StockDataResponse {
  /** 请求是否成功 */
  success: boolean;
  /** 股票数据数组 */
  data: StockData[];
  /** 时间戳 */
  timestamp: string;
}

/**
 * 历史数据 API 响应接口
 */
export interface KLineDataResponse {
  /** 请求是否成功 */
  success: boolean;
  /** K线数据数组 */
  data: KLineData[];
  /** 股票代码 */
  code: string;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 单个股票的K线数据结果
 */
export interface StockKLineResult {
  /** 股票代码 */
  code: string;
  /** 是否成功 */
  success: boolean;
  /** K线数据数组 */
  data?: KLineData[];
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 批量K线数据 API 响应接口
 */
export interface BatchKLineDataResponse {
  /** 请求是否成功 */
  success: boolean;
  /** 各股票K线数据 */
  results: StockKLineResult[];
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 健康检查响应接口
 */
export interface HealthCheckResponse {
  /** 服务状态 */
  status: string;
  /** 服务名称 */
  service: string;
  /** 时间戳 */
  timestamp: string;
}
