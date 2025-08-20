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

// 临时类型定义
type WindDataTypeEnum = 'stock' | 'bond' | 'fund' | 'commodity' | 'forex' | 'macro';

// Wind API 配置
export interface WindConfig {
  apiUrl: string;
  username?: string;
  password?: string;
  timeout?: number;
}

// Wind API 数据请求参数
export interface WindDataRequest {
  codes: string[]; // 证券代码数组
  fields: string[]; // 指标字段数组
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
  frequency?: string; // 数据频率
  dataType: WindDataTypeEnum; // 数据类型
}

// Wind API 响应数据结构
export interface WindAPIResponse {
  errorCode: number;
  data: any[][]; // 数据矩阵
  fields: string[]; // 字段名
  codes: string[]; // 证券代码
  times: string[]; // 时间序列
  message?: string; // 错误消息
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
        frequency: request.frequency || 'D',
        dataType: request.dataType
      };

      console.log('发送到Wind API的请求:', apiRequest);

      // 根据您的wind-api-service接口路径调整这里的URL
      const response = await this.client.post('/api/data', apiRequest);

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
