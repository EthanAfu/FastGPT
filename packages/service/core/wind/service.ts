import type { AxiosInstance } from 'axios';
import axios from 'axios';
import crypto from 'crypto';
import { findStockByName, getStockInfo } from './stockMapping';
import { inferIndicatorsFromQuery, formatIndicatorValue } from './indicatorMapping';
import {
  analyzeQuestion,
  extractStocks,
  generateInvestmentDecision,
  InvestmentView
} from './questionAnalyzer';

// Wind数据类型枚举（基于官方API文档）
export enum WindDataTypeEnum {
  STOCK = 'stock', // 股票
  BOND = 'bond', // 债券
  FUND = 'fund', // 基金
  COMMODITY = 'commodity', // 商品期货
  INDEX = 'index', // 指数
  FOREX = 'forex', // 外汇
  MACRO = 'macro', // 宏观经济
  OPTION = 'option', // 期权
  FUTURES = 'futures', // 期货
  REPO = 'repo', // 回购
  WARRANT = 'warrant', // 权证
  SECTOR = 'sector' // 行业板块
}

// Wind API 配置
export interface WindConfig {
  apiUrl: string;
  username?: string;
  password?: string;
  timeout?: number;
}

// Wind API 数据请求参数（支持所有Wind API函数）
export interface WindDataRequest {
  codes: string[]; // 证券代码数组
  fields: string[]; // 指标字段数组
  startDate?: string; // 开始日期 YYYY-MM-DD
  endDate?: string; // 结束日期 YYYY-MM-DD
  frequency?: WindFrequency; // 数据频率
  dataType: WindDataTypeEnum; // 数据类型
  options?: WindRequestOptions; // 附加选项
  apiFunction?: WindAPIFunction; // API函数类型
}

// Wind API函数类型
export enum WindAPIFunction {
  WSD = 'wsd', // 时间序列数据
  WSS = 'wss', // 截面数据
  WSI = 'wsi', // 分钟数据
  WST = 'wst', // 成交明细数据
  WSQ = 'wsq', // 实时行情数据
  WDT = 'wdt', // 分笔数据
  WSE = 'wse', // 事件数据
  WSES = 'wses', // 指定事件数据
  WSET = 'wset', // 板块成分数据
  WPLT = 'wplt', // 图片生成
  WFQA = 'wfqa' // 数据质量检查
}

// Wind数据频率
export enum WindFrequency {
  DAILY = 'D', // 日频
  WEEKLY = 'W', // 周频
  MONTHLY = 'M', // 月频
  QUARTERLY = 'Q', // 季频
  YEARLY = 'Y', // 年频
  MINUTE_1 = '1', // 1分钟
  MINUTE_5 = '5', // 5分钟
  MINUTE_15 = '15', // 15分钟
  MINUTE_30 = '30', // 30分钟
  HOURLY = '60', // 小时
  TICK = 'tick' // tick级别
}

// Wind请求附加选项
export interface WindRequestOptions {
  tradeDate?: string; // 交易日期
  currency?: string; // 货币单位
  rptDate?: string; // 报告期
  period?: string; // 周期
  days?: string; // 天数
  priceAdj?: string; // 复权方式：F前复权，B后复权
  cycle?: string; // 周期性
  credibility?: string; // 可信度
  fill?: string; // 数据填充方式
  logType?: string; // 日志类型
  nonTrading?: string; // 非交易日处理
  showblank?: string; // 显示空白
  unit?: string; // 单位转换
}

// Wind API 响应数据结构（标准化格式）
export interface WindAPIResponse {
  errorCode: number; // 错误码：0成功，非0失败
  data: any[][]; // 数据矩阵 [时间][代码*字段]
  fields: string[]; // 字段名数组
  codes: string[]; // 证券代码数组
  times?: string[]; // 时间序列（时序数据）
  message?: string; // 错误或状态消息
  requestId?: string; // 请求ID
  dataSource?: string; // 数据来源
  timestamp?: number; // 响应时间戳
  apiFunction?: WindAPIFunction; // 使用的API函数
  metadata?: WindResponseMetadata; // 元数据信息
}

// Wind响应元数据
export interface WindResponseMetadata {
  totalCount?: number; // 总记录数
  pageSize?: number; // 分页大小
  currentPage?: number; // 当前页
  hasMore?: boolean; // 是否有更多数据
  dataQuality?: string; // 数据质量
  updateTime?: string; // 数据更新时间
  frequency?: WindFrequency; // 数据频率
  currency?: string; // 货币单位
}

// 格式化的金融数据
export interface FormattedFinancialData {
  code: string;
  name: string;
  data: Array<{
    date: string;
    [key: string]: any;
  }>;
  summary: {
    latest: { [key: string]: any };
    min: { [key: string]: any };
    max: { [key: string]: any };
    avg: { [key: string]: any };
  };
}

// Wind API 服务类
export class WindAPIService {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5分钟缓存

  constructor(config: WindConfig) {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FastGPT-Wind-Client/1.0'
      },
      // 绕过代理访问本地服务
      proxy: false,
      // 如果是本地服务，强制绕过系统代理
      ...(config.apiUrl.includes('127.0.0.1') || config.apiUrl.includes('localhost')
        ? {
            httpAgent: new (require('http').Agent)({
              keepAlive: true,
              // 禁用代理
              proxy: false
            }),
            httpsAgent: new (require('https').Agent)({
              keepAlive: true,
              // 禁用代理
              proxy: false
            })
          }
        : {})
    });

    // 设置请求拦截器
    this.client.interceptors.request.use((config) => {
      console.log(`Wind API 请求: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // 设置响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`Wind API 响应: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error(`Wind API 错误: ${error.message}`);
        throw error;
      }
    );
  }

  /**
   * 生成缓存键
   */
  getCacheKey(request: WindDataRequest): string {
    const key = JSON.stringify({
      codes: request.codes.sort(),
      fields: request.fields.sort(),
      startDate: request.startDate,
      endDate: request.endDate,
      frequency: request.frequency,
      dataType: request.dataType
    });
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * 从缓存获取数据
   */
  getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * 设置缓存数据
   */
  setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 调用 Wind API 获取数据
   */
  async fetchData(request: WindDataRequest): Promise<WindAPIResponse> {
    const cacheKey = this.getCacheKey(request);
    const cachedData = this.getFromCache(cacheKey);

    if (cachedData) {
      console.log('使用缓存的 Wind 数据');
      return cachedData;
    }

    try {
      console.log('调用 Wind API 获取数据:', request);

      // 构建 Wind API 请求
      // 注意：请根据您的wind-api-service实际接口格式调整这里的参数
      const apiRequest = {
        codes: request.codes.join(','),
        fields: request.fields.join(','),
        startDate: request.startDate,
        endDate: request.endDate,
        frequency: request.frequency || WindFrequency.DAILY,
        dataType: request.dataType,
        apiFunction: request.apiFunction || WindAPIFunction.WSD
      };

      console.log('发送到Wind API的请求:', apiRequest);

      // 根据API函数类型选择不同的接口路径
      const apiPath = this.getAPIPath(request.apiFunction || WindAPIFunction.WSD);
      const response = await this.client.post(apiPath, apiRequest);

      if (response.data.errorCode !== 0) {
        throw new Error(`Wind API 错误: ${response.data.message}`);
      }

      // 缓存结果
      this.setCache(cacheKey, response.data);

      return response.data;
    } catch (error) {
      console.error('Wind API 调用失败:', error);
      throw error;
    }
  }

  /**
   * 格式化金融数据
   */
  formatFinancialData(response: WindAPIResponse): FormattedFinancialData[] {
    const { data, fields, codes, times } = response;

    if (!data || !fields || !codes) {
      throw new Error('Wind API 返回数据格式错误');
    }

    const results: FormattedFinancialData[] = [];

    // 按证券代码组织数据
    codes.forEach((code, codeIndex) => {
      const formattedData: FormattedFinancialData = {
        code,
        name: this.getSecurityName(code),
        data: [],
        summary: {
          latest: {},
          min: {},
          max: {},
          avg: {}
        }
      };

      // 组织时间序列数据
      times?.forEach((time, timeIndex) => {
        const dataPoint: any = { date: time };

        fields.forEach((field, fieldIndex) => {
          const value = data[timeIndex] && data[timeIndex][codeIndex * fields.length + fieldIndex];
          if (value !== null && value !== undefined) {
            dataPoint[field] = value;
          }
        });

        formattedData.data.push(dataPoint);
      });

      // 计算统计摘要
      this.calculateSummary(formattedData);
      results.push(formattedData);
    });

    return results;
  }

  /**
   * 获取证券名称
   */
  private getSecurityName(code: string): string {
    const stockInfo = getStockInfo(code);
    return stockInfo?.name || code;
  }

  /**
   * 计算数据统计摘要
   */
  private calculateSummary(data: FormattedFinancialData): void {
    if (data.data.length === 0) return;

    const fields = Object.keys(data.data[0]).filter((key) => key !== 'date');

    fields.forEach((field) => {
      const values = data.data
        .map((item) => item[field])
        .filter((val) => val !== null && val !== undefined && !isNaN(val));

      if (values.length === 0) return;

      data.summary.latest[field] = data.data[data.data.length - 1][field];
      data.summary.min[field] = Math.min(...values);
      data.summary.max[field] = Math.max(...values);
      data.summary.avg[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });
  }

  /**
   * 生成数据的文本描述
   */
  generateDataDescription(formattedData: FormattedFinancialData[]): string {
    if (!formattedData || formattedData.length === 0) {
      return '未获取到有效数据';
    }

    let description = '# Wind 金融数据分析报告\n\n';

    formattedData.forEach((security) => {
      description += `## ${security.name} (${security.code})\n\n`;

      if (security.data.length > 0) {
        const latest = security.data[security.data.length - 1];
        description += `**最新数据 (${latest.date}):**\n`;

        Object.entries(latest).forEach(([key, value]) => {
          if (key !== 'date' && value !== null && value !== undefined) {
            description += `- ${key}: ${this.formatValue(value)}\n`;
          }
        });

        description += '\n**统计摘要:**\n';
        Object.entries(security.summary.latest).forEach(([key, value]) => {
          const min = security.summary.min[key];
          const max = security.summary.max[key];
          const avg = security.summary.avg[key];

          description += `- ${key}: 最新=${this.formatValue(value)}, 最小=${this.formatValue(min)}, 最大=${this.formatValue(max)}, 均值=${this.formatValue(avg)}\n`;
        });
      }

      description += '\n';
    });

    description += `\n**数据来源:** Wind 金融终端\n`;
    description += `**更新时间:** ${new Date().toLocaleString('zh-CN')}\n`;

    return description;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200 && response.data?.status === 'healthy';
    } catch (error) {
      console.error('Wind API 健康检查失败:', error);
      return false;
    }
  }

  /**
   * 格式化数值显示
   */
  private formatValue(value: any): string {
    if (typeof value === 'number') {
      if (value > 1000000) {
        return `${(value / 10000).toFixed(2)}万`;
      } else if (value > 1000) {
        return `${(value / 1000).toFixed(2)}千`;
      } else {
        return value.toFixed(2);
      }
    }
    return String(value);
  }

  /**
   * 根据API函数获取对应的接口路径
   */
  private getAPIPath(apiFunction: WindAPIFunction): string {
    const pathMap: Record<WindAPIFunction, string> = {
      [WindAPIFunction.WSD]: '/api/data', // 时间序列数据
      [WindAPIFunction.WSS]: '/api/cross', // 截面数据
      [WindAPIFunction.WSI]: '/api/minute', // 分钟数据
      [WindAPIFunction.WST]: '/api/tick', // 成交明细
      [WindAPIFunction.WSQ]: '/api/realtime', // 实时行情
      [WindAPIFunction.WDT]: '/api/detail', // 分笔数据
      [WindAPIFunction.WSE]: '/api/event', // 事件数据
      [WindAPIFunction.WSES]: '/api/events', // 指定事件
      [WindAPIFunction.WSET]: '/api/sector', // 板块成分
      [WindAPIFunction.WPLT]: '/api/plot', // 图片生成
      [WindAPIFunction.WFQA]: '/api/quality' // 数据质量
    };

    return pathMap[apiFunction] || '/api/data';
  }

  /**
   * 创建特定类型的数据请求
   */
  createDataRequest(
    codes: string[],
    fields: string[],
    dataType: WindDataTypeEnum,
    options?: Partial<WindDataRequest>
  ): WindDataRequest {
    return {
      codes,
      fields,
      dataType,
      apiFunction: WindAPIFunction.WSD,
      frequency: WindFrequency.DAILY,
      ...options
    };
  }

  /**
   * 创建实时数据请求
   */
  createRealtimeRequest(codes: string[], fields: string[]): WindDataRequest {
    return this.createDataRequest(codes, fields, WindDataTypeEnum.STOCK, {
      apiFunction: WindAPIFunction.WSQ
    });
  }

  /**
   * 创建历史数据请求
   */
  createHistoricalRequest(
    codes: string[],
    fields: string[],
    startDate: string,
    endDate: string,
    frequency: WindFrequency = WindFrequency.DAILY
  ): WindDataRequest {
    return this.createDataRequest(codes, fields, WindDataTypeEnum.STOCK, {
      apiFunction: WindAPIFunction.WSD,
      startDate,
      endDate,
      frequency
    });
  }

  /**
   * 创建截面数据请求
   */
  createCrossSectionRequest(codes: string[], fields: string[], tradeDate: string): WindDataRequest {
    return this.createDataRequest(codes, fields, WindDataTypeEnum.STOCK, {
      apiFunction: WindAPIFunction.WSS,
      options: { tradeDate }
    });
  }

  /**
   * 创建分钟级数据请求
   */
  createMinuteRequest(
    codes: string[],
    fields: string[],
    startDate: string,
    endDate: string,
    frequency: WindFrequency = WindFrequency.MINUTE_1
  ): WindDataRequest {
    return this.createDataRequest(codes, fields, WindDataTypeEnum.STOCK, {
      apiFunction: WindAPIFunction.WSI,
      startDate,
      endDate,
      frequency
    });
  }

  /**
   * 智能分析金融数据并生成投资建议
   */
  async analyzeAndRecommend(
    question: string,
    windData: FormattedFinancialData[]
  ): Promise<{
    analysis: string;
    recommendation: InvestmentView;
    confidence: number;
    reasons: string[];
  }> {
    // 分析用户问题
    const questionAnalysis = analyzeQuestion(question);

    // 基础分析文本
    let analysis = `## 数据分析报告\n\n`;
    const reasons: string[] = [];
    let totalScore = 0;
    let scoreCount = 0;

    // 对每个证券进行分析
    for (const security of windData) {
      const stockInfo = getStockInfo(security.code);
      analysis += `### ${security.name} (${security.code})\n`;

      if (stockInfo) {
        analysis += `**行业**: ${stockInfo.industry} | **板块**: ${stockInfo.sector}\n`;
        if (stockInfo.marketCap) {
          analysis += `**市值**: ${stockInfo.marketCap}亿元\n`;
        }
      }

      // 分析关键指标
      if (security.summary.latest) {
        const latest = security.summary.latest;
        let stockScore = 0;

        // PE估值分析
        if (latest.pe_ttm !== undefined) {
          const pe = latest.pe_ttm;
          analysis += `- **市盈率(TTM)**: ${formatIndicatorValue('pe_ttm', pe)}\n`;
          if (pe > 0 && pe < 20) {
            stockScore += 2;
            reasons.push(`${security.name}估值合理(PE=${pe.toFixed(2)})`);
          } else if (pe > 50) {
            stockScore -= 1;
            reasons.push(`${security.name}估值偏高(PE=${pe.toFixed(2)})`);
          }
        }

        // ROE盈利能力分析
        if (latest.roe_ttm !== undefined) {
          const roe = latest.roe_ttm;
          analysis += `- **ROE(TTM)**: ${formatIndicatorValue('roe_ttm', roe)}\n`;
          if (roe > 15) {
            stockScore += 2;
            reasons.push(`${security.name}盈利能力优秀(ROE=${roe.toFixed(2)}%)`);
          } else if (roe < 5) {
            stockScore -= 1;
            reasons.push(`${security.name}盈利能力较弱(ROE=${roe.toFixed(2)}%)`);
          }
        }

        // 营收增长分析
        if (latest.or_yoy !== undefined) {
          const growth = latest.or_yoy;
          analysis += `- **营收增速**: ${formatIndicatorValue('or_yoy', growth)}\n`;
          if (growth > 20) {
            stockScore += 1;
            reasons.push(`${security.name}营收高速增长(${growth.toFixed(2)}%)`);
          } else if (growth < 0) {
            stockScore -= 1;
            reasons.push(`${security.name}营收负增长(${growth.toFixed(2)}%)`);
          }
        }

        // 负债率分析
        if (latest.debttoassets !== undefined) {
          const debt = latest.debttoassets;
          analysis += `- **资产负债率**: ${formatIndicatorValue('debttoassets', debt)}\n`;
          if (debt > 70) {
            stockScore -= 1;
            reasons.push(`${security.name}负债率偏高(${debt.toFixed(2)}%)`);
          }
        }

        totalScore += stockScore;
        scoreCount++;
      }

      analysis += `\n`;
    }

    // 生成投资建议
    let recommendation: InvestmentView;
    let confidence: number;

    if (scoreCount > 0) {
      const avgScore = totalScore / scoreCount;

      if (avgScore >= 3) {
        recommendation = InvestmentView.BULLISH;
        confidence = Math.min(80 + avgScore * 5, 95);
        analysis += `## 投资建议: **看好** 🔼\n`;
      } else if (avgScore >= 0) {
        recommendation = InvestmentView.NEUTRAL;
        confidence = 50 + avgScore * 10;
        analysis += `## 投资建议: **中性** ➡️\n`;
      } else {
        recommendation = InvestmentView.BEARISH;
        confidence = Math.max(30 + avgScore * 10, 10);
        analysis += `## 投资建议: **看空** 🔽\n`;
      }
    } else {
      recommendation = InvestmentView.UNKNOWN;
      confidence = 0;
      analysis += `## 投资建议: **数据不足** ❓\n`;
    }

    analysis += `\n**置信度**: ${confidence.toFixed(0)}%\n`;
    analysis += `\n**关键因素**:\n`;
    reasons.forEach((reason) => {
      analysis += `- ${reason}\n`;
    });

    // 添加风险提示
    analysis += `\n---\n`;
    analysis += `*风险提示: 以上分析基于历史数据，不构成投资建议。投资有风险，入市需谨慎。*`;

    return {
      analysis,
      recommendation,
      confidence,
      reasons
    };
  }
}

// 全局 Wind API 服务实例
let windAPIService: WindAPIService | null = null;

/**
 * 获取 Wind API 服务实例
 */
export function getWindAPIService(): WindAPIService {
  if (!windAPIService) {
    // 从环境变量读取配置
    const config: WindConfig = {
      apiUrl: process.env.WIND_API_URL || 'http://localhost:8080',
      username: process.env.WIND_USERNAME,
      password: process.env.WIND_PASSWORD,
      timeout: parseInt(process.env.WIND_TIMEOUT || '30000', 10)
    };

    windAPIService = new WindAPIService(config);
    console.log(`Wind API 服务已初始化: ${config.apiUrl}`);
  }

  return windAPIService;
}

/**
 * 健康检查
 */
export async function checkWindAPIHealth(): Promise<boolean> {
  try {
    const service = getWindAPIService();
    return await service.healthCheck();
  } catch (error) {
    console.error('Wind API 健康检查失败:', error);
    return false;
  }
}

/**
 * 初始化 Wind API 服务
 */
export async function initWindAPI(): Promise<boolean> {
  try {
    const isHealthy = await checkWindAPIHealth();

    if (isHealthy) {
      console.log('Wind API 服务连接正常');
      return true;
    } else {
      console.warn('Wind API 服务连接异常');
      return false;
    }
  } catch (error) {
    console.error('Wind API 初始化失败:', error);
    return false;
  }
}

/**
 * 解析用户问题中的股票代码（使用新的问题分析器）
 */
export function extractStockCodes(query: string): string[] {
  return extractStocks(query);
}

/**
 * 根据问题类型推断需要的指标（使用新的指标映射）
 */
export function inferIndicators(query: string): string[] {
  return inferIndicatorsFromQuery(query);
}

/**
 * 验证Wind代码格式
 */
export function validateWindCode(code: string): boolean {
  // Wind代码格式：6位数字.交易所代码
  const windCodePattern = /^\d{6}\.(SH|SZ|CF|SHF|CZC|DCE|INE|OC)$/;
  return windCodePattern.test(code);
}

/**
 * 标准化Wind代码格式
 */
export function normalizeWindCode(code: string): string {
  // 移除空格和转换为大写
  const cleanCode = code.trim().toUpperCase();

  // 如果只有6位数字，自动添加交易所后缀
  if (/^\d{6}$/.test(cleanCode)) {
    // 根据股票代码范围推断交易所
    const num = parseInt(cleanCode);
    if (num >= 600000 && num <= 688999) {
      return `${cleanCode}.SH`; // 上交所
    } else if (num >= 0 && num <= 399999) {
      return `${cleanCode}.SZ`; // 深交所
    }
  }

  return cleanCode;
}

/**
 * 获取支持的资产类型列表
 */
export function getSupportedAssetTypes(): WindDataTypeEnum[] {
  return Object.values(WindDataTypeEnum);
}

/**
 * 获取支持的API函数列表
 */
export function getSupportedAPIFunctions(): WindAPIFunction[] {
  return Object.values(WindAPIFunction);
}

/**
 * 获取支持的数据频率列表
 */
export function getSupportedFrequencies(): WindFrequency[] {
  return Object.values(WindFrequency);
}
