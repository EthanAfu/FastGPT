import type { AxiosInstance } from 'axios';
import axios from 'axios';
import crypto from 'crypto';
// 注释掉导致编译错误的导入
// import { 
//   WindDataTypeEnum,
//   WindDataNode
// } from '@fastgpt/global/core/workflow/template/system/windData';
// import { WorkflowIOValueTypeEnum } from '@fastgpt/global/core/workflow/constants';

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
  codes: string[];           // 证券代码数组
  fields: string[];          // 指标字段数组
  startDate?: string;        // 开始日期
  endDate?: string;          // 结束日期
  frequency?: string;        // 数据频率
  dataType: WindDataTypeEnum; // 数据类型
}

// Wind API 响应数据结构
export interface WindAPIResponse {
  errorCode: number;
  data: any[][];             // 数据矩阵
  fields: string[];          // 字段名
  codes: string[];           // 证券代码
  times: string[];           // 时间序列
  message?: string;          // 错误消息
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
      }
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
      const apiRequest = {
        codes: request.codes.join(','),
        fields: request.fields.join(','),
        startDate: request.startDate,
        endDate: request.endDate,
        frequency: request.frequency || 'D',
        dataType: request.dataType
      };

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
   * 获取证券名称（可以从本地缓存或另一个API获取）
   */
  private getSecurityName(code: string): string {
    // 这里可以实现证券代码到名称的映射
    // 可以从本地数据库或另一个API获取
    const nameMap: Record<string, string> = {
      '600519.SH': '贵州茅台',
      '000858.SZ': '五 粮 液',
      '000001.SZ': '平安银行',
      // 可以扩展更多映射
    };
    
    return nameMap[code] || code;
  }

  /**
   * 计算数据统计摘要
   */
  private calculateSummary(data: FormattedFinancialData): void {
    if (data.data.length === 0) return;

    const fields = Object.keys(data.data[0]).filter(key => key !== 'date');
    
    fields.forEach(field => {
      const values = data.data
        .map(item => item[field])
        .filter(val => val !== null && val !== undefined && !isNaN(val));
      
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
    
    formattedData.forEach(security => {
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
 * 解析用户问题中的股票代码
 */
export function extractStockCodes(query: string): string[] {
  // 匹配股票代码的正则表达式
  const patterns = [
    /(\d{6})\.(SH|SZ|HK)/gi,     // 标准格式：600519.SH
    /([A-Z]{1,5})/g,              // 美股代码：AAPL
    /(\d{6})/g                    // 纯数字代码：600519
  ];

  const codes: Set<string> = new Set();
  
  patterns.forEach(pattern => {
    const matches = query.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // 标准化代码格式
        if (/^\d{6}$/.test(match)) {
          // 纯数字，需要添加市场后缀
          if (match.startsWith('6')) {
            codes.add(`${match}.SH`);
          } else if (match.startsWith('0') || match.startsWith('3')) {
            codes.add(`${match}.SZ`);
          }
        } else {
          codes.add(match.toUpperCase());
        }
      });
    }
  });

  return Array.from(codes);
}

/**
 * 根据问题类型推断需要的指标
 */
export function inferIndicators(query: string): string[] {
  const indicatorMap = {
    '价格|股价|收盘价': ['close', 'open', 'high', 'low'],
    '成交量|交易量': ['volume', 'amt'],
    '市盈率|PE': ['pe_ttm', 'pe_lyr'],
    '市净率|PB': ['pb_lf', 'pb_mrq'],
    '净资产收益率|ROE': ['roe_ttm', 'roe_lyr'],
    '营收|收入': ['or_ttm', 'or_lyr'],
    '净利润|利润': ['np_ttm', 'np_lyr'],
    '资产负债率': ['debttoassets'],
    '毛利率': ['grossprofitmargin'],
    '净利率': ['netprofitmargin'],
    '股息率|分红': ['dividendyield'],
    '市值': ['mkt_cap_ard'],
    '流通市值': ['mkt_cap_float']
  };

  const indicators: Set<string> = new Set();
  
  Object.entries(indicatorMap).forEach(([keywords, fields]) => {
    const regex = new RegExp(keywords, 'i');
    if (regex.test(query)) {
      fields.forEach(field => indicators.add(field));
    }
  });

  // 如果没有匹配到特定指标，返回基础指标
  if (indicators.size === 0) {
    return ['close', 'volume', 'pe_ttm', 'pb_lf', 'mkt_cap_ard'];
  }

  return Array.from(indicators);
}