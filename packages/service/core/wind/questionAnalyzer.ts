/**
 * 金融问题智能分析器
 * 用于解析用户问题，提取实体和意图
 */

import { findStockByName, getStockInfo } from './stockMapping';
import { inferIndicatorsFromQuery } from './indicatorMapping';

// 问题类型枚举（扩展支持更多资产类型）
export enum QuestionType {
  STOCK_PRICE = 'stock_price', // 股价查询
  FINANCIAL_DATA = 'financial_data', // 财务数据
  COMPANY_ANALYSIS = 'company_analysis', // 公司分析
  INDUSTRY_ANALYSIS = 'industry_analysis', // 行业分析
  MARKET_TREND = 'market_trend', // 市场趋势
  INVESTMENT_ADVICE = 'investment_advice', // 投资建议
  COMPARISON = 'comparison', // 对比分析
  RISK_ASSESSMENT = 'risk_assessment', // 风险评估
  MACRO_ECONOMIC = 'macro_economic', // 宏观经济
  TECHNICAL_ANALYSIS = 'technical_analysis', // 技术分析
  FUND_ANALYSIS = 'fund_analysis', // 基金分析
  BOND_ANALYSIS = 'bond_analysis', // 债券分析
  COMMODITY_ANALYSIS = 'commodity_analysis', // 商品分析
  INDEX_ANALYSIS = 'index_analysis', // 指数分析
  PORTFOLIO_ANALYSIS = 'portfolio_analysis', // 组合分析
  EVENT_ANALYSIS = 'event_analysis', // 事件分析
  VALUATION_ANALYSIS = 'valuation_analysis', // 估值分析
  SECTOR_ROTATION = 'sector_rotation', // 板块轮动
  EARNINGS_ANALYSIS = 'earnings_analysis' // 业绩分析
}

// 投资观点类型
export enum InvestmentView {
  BULLISH = 'bullish', // 看好
  BEARISH = 'bearish', // 看空
  NEUTRAL = 'neutral', // 中性
  UNKNOWN = 'unknown' // 未知
}

// 问题分析结果（增强版）
export interface QuestionAnalysisResult {
  questionType: QuestionType;
  assetType: string; // 资产类型：stock/bond/fund/commodity/index
  codes: string[]; // 提取的证券代码（通用）
  stocks: string[]; // 提取的股票代码（向后兼容）
  indicators: string[]; // 需要的指标
  timeRange?: {
    startDate?: string;
    endDate?: string;
    frequency?: string; // 数据频率
  };
  keywords: string[]; // 关键词
  entities: {
    companies: string[]; // 公司名称
    industries: string[]; // 行业名称
    indices: string[]; // 指数名称
    funds: string[]; // 基金名称
    bonds: string[]; // 债券名称
    commodities: string[]; // 商品名称
  };
  intent: {
    needsComparison: boolean; // 是否需要对比
    needsAdvice: boolean; // 是否需要投资建议
    needsForecast: boolean; // 是否需要预测
    needsRiskAssessment: boolean; // 是否需要风险评估
    needsValuation: boolean; // 是吉需要估值分析
  };
  context: {
    industry?: string; // 主要行业
    sector?: string; // 板块
    marketCap?: string; // 市值区间
    riskLevel?: string; // 风险等级
    investmentHorizon?: string; // 投资周期
  };
  confidence: number; // 分析的置信度 0-1
}

// 关键词模式映射（扩展版）
const keywordPatterns = {
  priceRelated: /股价|价格|收盘|开盘|最高|最低|涨跌|涨幅|跌幅|净值|单位净值|累计净值/,
  financialRelated: /财务|营收|利润|净利|毛利|资产|负债|现金流|ROE|PE|PB|ROA|毛利率|净利率|估值/,
  companyRelated: /公司|企业|集团|股份|控股|发展|经营|业务|产品|市场|业绩|财报/,
  industryRelated: /行业|板块|产业|领域|赛道|链条|上下游|板块轮动|风口/,
  trendRelated: /走势|趋势|预测|展望|前景|未来|方向|预期|预测/,
  adviceRelated: /建议|推荐|买入|卖出|持有|观点|看好|看空|评级|配置|投资/,
  comparisonRelated: /对比|比较|对比|区别|差异|优势|劣势|谁更|对比分析|相比/,
  riskRelated: /风险|挑战|机遇|机会|问题|困难|压力|不确定|风险评估|风控/,
  macroRelated: /宏观|经济|政策|利率|汇率|通胀|GDP|贸易|关税|CPI|PPI|PMI/,
  technicalRelated: /技术|均线|MACD|KDJ|RSI|支撑|阻力|形态|突破|技术分析|图形/,
  fundRelated: /基金|净值|收益|夏普|最大回撤|基金经理|费率|分红/,
  bondRelated: /债券|固收|利率|到期收益率|YTM|久期|信用|评级|债券基金/,
  commodityRelated: /商品|期货|现货|持仓|结算|交割|套保|套利/,
  indexRelated: /指数|成分股|权重|ETF|跟踪|指数基金|指数增强/,
  valuationRelated: /估值|市盈率|市净率|市销率|PEG|EV|EBITDA|相对估值|绝对估值/,
  eventRelated: /公告|事件|重组|并购|分红|增发|解禁|停牌|复牌/
};

/**
 * 分析用户问题
 */
export function analyzeQuestion(question: string): QuestionAnalysisResult {
  const result: QuestionAnalysisResult = {
    questionType: QuestionType.STOCK_PRICE,
    assetType: 'stock',
    codes: [],
    stocks: [],
    indicators: [],
    keywords: [],
    entities: {
      companies: [],
      industries: [],
      indices: [],
      funds: [],
      bonds: [],
      commodities: []
    },
    intent: {
      needsComparison: false,
      needsAdvice: false,
      needsForecast: false,
      needsRiskAssessment: false,
      needsValuation: false
    },
    context: {},
    confidence: 0.8
  };

  // 转换为小写以便匹配
  const lowerQuestion = question.toLowerCase();

  // 1. 判断问题类型
  result.questionType = determineQuestionType(lowerQuestion);

  // 2. 提取资产类型和代码
  result.assetType = determineAssetType(lowerQuestion);
  result.codes = extractCodes(question, result.assetType);
  result.stocks = extractStocks(question); // 向后兼容

  // 3. 提取实体信息
  result.entities = extractEntities(question);

  // 4. 提取需要的指标
  result.indicators = inferIndicatorsFromQuery(question);

  // 5. 提取时间范围
  result.timeRange = extractTimeRange(question);

  // 6. 提取关键词
  result.keywords = extractKeywords(question);

  // 7. 分析意图
  result.intent = analyzeIntent(lowerQuestion);

  // 8. 提取上下文信息
  result.context = extractContext(question);

  // 9. 计算置信度
  result.confidence = calculateConfidence(result);

  return result;
}

/**
 * 判断问题类型
 */
function determineQuestionType(question: string): QuestionType {
  // 按优先级判断（扩展版）
  if (keywordPatterns.adviceRelated.test(question)) {
    return QuestionType.INVESTMENT_ADVICE;
  }
  if (keywordPatterns.comparisonRelated.test(question)) {
    return QuestionType.COMPARISON;
  }
  if (keywordPatterns.riskRelated.test(question)) {
    return QuestionType.RISK_ASSESSMENT;
  }
  if (keywordPatterns.macroRelated.test(question)) {
    return QuestionType.MACRO_ECONOMIC;
  }
  if (keywordPatterns.technicalRelated.test(question)) {
    return QuestionType.TECHNICAL_ANALYSIS;
  }
  if (keywordPatterns.fundRelated.test(question)) {
    return QuestionType.FUND_ANALYSIS;
  }
  if (keywordPatterns.bondRelated.test(question)) {
    return QuestionType.BOND_ANALYSIS;
  }
  if (keywordPatterns.commodityRelated.test(question)) {
    return QuestionType.COMMODITY_ANALYSIS;
  }
  if (keywordPatterns.indexRelated.test(question)) {
    return QuestionType.INDEX_ANALYSIS;
  }
  if (keywordPatterns.valuationRelated.test(question)) {
    return QuestionType.VALUATION_ANALYSIS;
  }
  if (keywordPatterns.eventRelated.test(question)) {
    return QuestionType.EVENT_ANALYSIS;
  }
  if (keywordPatterns.industryRelated.test(question)) {
    return QuestionType.INDUSTRY_ANALYSIS;
  }
  if (keywordPatterns.financialRelated.test(question)) {
    return QuestionType.FINANCIAL_DATA;
  }
  if (keywordPatterns.companyRelated.test(question)) {
    return QuestionType.COMPANY_ANALYSIS;
  }
  if (keywordPatterns.trendRelated.test(question)) {
    return QuestionType.MARKET_TREND;
  }

  return QuestionType.STOCK_PRICE;
}

/**
 * 判断资产类型
 */
function determineAssetType(question: string): string {
  if (keywordPatterns.fundRelated.test(question)) {
    return 'fund';
  }
  if (keywordPatterns.bondRelated.test(question)) {
    return 'bond';
  }
  if (keywordPatterns.commodityRelated.test(question)) {
    return 'commodity';
  }
  if (keywordPatterns.indexRelated.test(question)) {
    return 'index';
  }
  if (keywordPatterns.macroRelated.test(question)) {
    return 'macro';
  }

  return 'stock'; // 默认为股票
}

/**
 * 通用代码提取器
 */
function extractCodes(question: string, assetType: string): string[] {
  const codes = new Set<string>();

  switch (assetType) {
    case 'stock':
      return extractStocks(question);
    case 'fund':
      return extractFundCodes(question);
    case 'bond':
      return extractBondCodes(question);
    case 'commodity':
      return extractCommodityCodes(question);
    case 'index':
      return extractIndexCodes(question);
    default:
      return extractStocks(question);
  }
}

/**
 * 提取基金代码
 */
function extractFundCodes(question: string): string[] {
  const codes = new Set<string>();

  // 基金代码模式：6位数字
  const fundPattern = /\b\d{6}\b/g;
  const matches = question.match(fundPattern);

  if (matches) {
    matches.forEach((code) => {
      // 基金代码一般以1-5开头
      if (/^[1-5]/.test(code)) {
        codes.add(code);
      }
    });
  }

  return Array.from(codes);
}

/**
 * 提取债券代码
 */
function extractBondCodes(question: string): string[] {
  const codes = new Set<string>();

  // 债券代码模式
  const bondPatterns = [
    /\b\d{6}\.IB\b/g, // 企业债
    /\b\d{6}\.SH\b/g, // 上交所债券
    /\b\d{6}\.SZ\b/g // 深交所债券
  ];

  bondPatterns.forEach((pattern) => {
    const matches = question.match(pattern);
    if (matches) {
      matches.forEach((code) => codes.add(code));
    }
  });

  return Array.from(codes);
}

/**
 * 提取商品代码
 */
function extractCommodityCodes(question: string): string[] {
  const codes = new Set<string>();

  // 商品期货代码模式
  const commodityPatterns = [
    /\b[A-Z]{1,2}\d{4}\b/g, // CU2312
    /\b\w+\d{4}\.\w{2,3}\b/g // CU2312.SHF
  ];

  commodityPatterns.forEach((pattern) => {
    const matches = question.match(pattern);
    if (matches) {
      matches.forEach((code) => codes.add(code));
    }
  });

  return Array.from(codes);
}

/**
 * 提取指数代码
 */
function extractIndexCodes(question: string): string[] {
  const codes = new Set<string>();

  // 指数代码和名称映射
  const indexMap: Record<string, string> = {
    上证指数: '000001.SH',
    汪深300: '000300.SH',
    中证500: '000905.SH',
    中证1000: '000852.SH',
    创业板指: '399006.SZ',
    科创50: '000688.SH'
  };

  // 直接匹配指数代码
  const indexPattern = /\b\d{6}\.(SH|SZ)\b/g;
  const matches = question.match(indexPattern);
  if (matches) {
    matches.forEach((code) => codes.add(code));
  }

  // 匹配指数名称
  Object.entries(indexMap).forEach(([name, code]) => {
    if (question.includes(name)) {
      codes.add(code);
    }
  });

  return Array.from(codes);
}

/**
 * 提取实体信息
 */
function extractEntities(question: string): QuestionAnalysisResult['entities'] {
  return {
    companies: extractCompanyNames(question),
    industries: extractIndustries(question),
    indices: extractIndexNames(question),
    funds: extractFundNames(question),
    bonds: extractBondNames(question),
    commodities: extractCommodityNames(question)
  };
}

/**
 * 分析意图
 */
function analyzeIntent(question: string): QuestionAnalysisResult['intent'] {
  return {
    needsComparison: keywordPatterns.comparisonRelated.test(question),
    needsAdvice: keywordPatterns.adviceRelated.test(question),
    needsForecast: keywordPatterns.trendRelated.test(question),
    needsRiskAssessment: keywordPatterns.riskRelated.test(question),
    needsValuation: keywordPatterns.valuationRelated.test(question)
  };
}

/**
 * 提取上下文信息
 */
function extractContext(question: string): QuestionAnalysisResult['context'] {
  return {
    industry: extractIndustry(question),
    sector: extractSector(question),
    marketCap: extractMarketCap(question),
    riskLevel: extractRiskLevel(question),
    investmentHorizon: extractInvestmentHorizon(question)
  };
}

/**
 * 计算置信度
 */
function calculateConfidence(result: QuestionAnalysisResult): number {
  let confidence = 0.5; // 基础置信度

  // 有具体代码提高置信度
  if (result.codes.length > 0) confidence += 0.2;

  // 有明确时间范围提高置信度
  if (result.timeRange?.startDate) confidence += 0.1;

  // 有具体指标提高置信度
  if (result.indicators.length > 0) confidence += 0.1;

  // 有明确意图提高置信度
  const intentCount = Object.values(result.intent).filter(Boolean).length;
  confidence += intentCount * 0.05;

  return Math.min(confidence, 1.0);
}

/**
 * 提取股票代码和公司名称
 */
export function extractStocks(question: string): string[] {
  const stocks = new Set<string>();

  // 1. 匹配标准股票代码格式
  const codePatterns = [
    /(\d{6})\.(SH|SZ|HK)/gi, // 600519.SH
    /([A-Z]{2,5})/g, // AAPL, TSLA
    /(\d{6})/g // 600519
  ];

  codePatterns.forEach((pattern) => {
    const matches = question.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        // 处理纯数字代码
        if (/^\d{6}$/.test(match)) {
          if (match.startsWith('6')) {
            stocks.add(`${match}.SH`);
          } else if (match.startsWith('0') || match.startsWith('2') || match.startsWith('3')) {
            stocks.add(`${match}.SZ`);
          }
        } else {
          stocks.add(match.toUpperCase());
        }
      });
    }
  });

  // 2. 匹配公司名称
  const companyNames = [
    '贵州茅台',
    '茅台',
    '五粮液',
    '平安银行',
    '万科',
    '比亚迪',
    '宁德时代',
    '招商银行',
    '泸州老窖',
    '山西汾酒',
    '海康威视',
    '恒瑞医药',
    '长春高新',
    '凯莱英',
    '药明康德',
    '阳光电源',
    '隆基绿能',
    '中兴通讯',
    '科大讯飞',
    '中芯国际',
    '兆易创新',
    '健友股份',
    '海泰新光',
    '康诺亚',
    '春立医疗',
    '爱康医疗',
    '特宝生物',
    '彩虹股份',
    '京东方',
    '固生堂',
    '仙琚制药',
    '盾安环境',
    '理工能科',
    '舜宇光学',
    '比亚迪电子',
    '地平线',
    '老凤祥',
    '苑东生物',
    '人福医药',
    '国邦医药',
    '奕瑞科技',
    '申洲国际',
    '工业富联',
    '先导智能',
    '新秀丽',
    '百润股份',
    '山推股份',
    '中联重科',
    '潞安环能',
    '同仁堂',
    '杰普特'
  ];

  companyNames.forEach((name) => {
    if (question.includes(name)) {
      const code = findStockByName(name);
      if (code) {
        stocks.add(code);
      }
    }
  });

  return Array.from(stocks);
}

/**
 * 提取时间范围
 */
function extractTimeRange(question: string): { startDate?: string; endDate?: string } | undefined {
  const timeRange: { startDate?: string; endDate?: string } = {};

  // 匹配日期格式
  const datePattern = /(\d{4})[-年](\d{1,2})[-月](\d{1,2})?[日]?/g;
  const dates = question.match(datePattern);

  if (dates && dates.length > 0) {
    // 标准化日期格式
    const formattedDates = dates.map((date) => {
      return date.replace(/[年月]/g, '-').replace(/[日]/g, '');
    });

    if (formattedDates.length === 1) {
      timeRange.startDate = formattedDates[0];
    } else if (formattedDates.length >= 2) {
      timeRange.startDate = formattedDates[0];
      timeRange.endDate = formattedDates[formattedDates.length - 1];
    }
  }

  // 匹配相对时间
  const relativeTimePatterns = {
    今年: () => {
      const now = new Date();
      return { startDate: `${now.getFullYear()}-01-01` };
    },
    去年: () => {
      const now = new Date();
      return {
        startDate: `${now.getFullYear() - 1}-01-01`,
        endDate: `${now.getFullYear() - 1}-12-31`
      };
    },
    近一年: () => {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return {
        startDate: oneYearAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      };
    },
    近三个月: () => {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return {
        startDate: threeMonthsAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      };
    }
  };

  for (const [pattern, handler] of Object.entries(relativeTimePatterns)) {
    if (question.includes(pattern)) {
      return handler();
    }
  }

  return Object.keys(timeRange).length > 0 ? timeRange : undefined;
}

/**
 * 提取关键词
 */
function extractKeywords(question: string): string[] {
  const keywords: string[] = [];

  // 定义关键词列表
  const importantKeywords = [
    '买入',
    '卖出',
    '持有',
    '看好',
    '看空',
    '中性',
    '风险',
    '机会',
    '挑战',
    '优势',
    '劣势',
    '增长',
    '下滑',
    '上涨',
    '下跌',
    '震荡',
    '突破',
    '支撑',
    '阻力',
    '回调',
    '反弹',
    '估值',
    '低估',
    '高估',
    '合理',
    '泡沫',
    '龙头',
    '领先',
    '落后',
    '追赶',
    '超越'
  ];

  importantKeywords.forEach((keyword) => {
    if (question.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  return keywords;
}

/**
 * 提取行业信息
 */
function extractIndustry(question: string): string | undefined {
  const industries = [
    '白酒',
    '医药',
    '医疗',
    '新能源',
    '光伏',
    '半导体',
    '芯片',
    '汽车',
    '地产',
    '房地产',
    '银行',
    '保险',
    '证券',
    '金融',
    '消费',
    '零售',
    '食品',
    '饮料',
    '家电',
    '纺织',
    '服装',
    '科技',
    '互联网',
    '软件',
    '通信',
    '5G',
    '人工智能',
    'AI',
    '化工',
    '钢铁',
    '有色',
    '煤炭',
    '石油',
    '电力',
    '公用事业',
    '军工',
    '航空',
    '航天',
    '机械',
    '建材',
    '建筑',
    '交运',
    '传媒',
    '教育',
    '旅游',
    '酒店',
    '餐饮',
    '农业',
    '养殖'
  ];

  for (const industry of industries) {
    if (question.includes(industry)) {
      return industry;
    }
  }

  return undefined;
}

/**
 * 提取公司名称
 */
function extractCompanyNames(question: string): string[] {
  const companies: string[] = [];
  const companyNames = [
    '贵州茅台',
    '五粮液',
    '平安银行',
    '万科',
    '比亚迪',
    '宁德时代',
    '招商银行',
    '泸州老窖',
    '山西汾酒',
    '海康威视',
    '恒瑞医药',
    '長春高新',
    '登莱英',
    '药明康德',
    '阳光电源',
    '隆基绿能',
    '中兴通讯',
    '科大讯飞',
    '中芗国际',
    '兆易创新'
  ];

  companyNames.forEach((name) => {
    if (question.includes(name)) {
      companies.push(name);
    }
  });

  return companies;
}

/**
 * 提取行业信息
 */
function extractIndustries(question: string): string[] {
  const industries: string[] = [];
  const industryKeywords = [
    '白酒',
    '医药',
    '新能源',
    '半导体',
    '汽车',
    '房地产',
    '银行',
    '保险',
    '证券',
    '金融',
    '消费',
    '科技'
  ];

  industryKeywords.forEach((industry) => {
    if (question.includes(industry)) {
      industries.push(industry);
    }
  });

  return industries;
}

/**
 * 提取指数名称
 */
function extractIndexNames(question: string): string[] {
  const indices: string[] = [];
  const indexNames = ['上证指数', '汪深300', '中证500', '创业板指', '科创50'];

  indexNames.forEach((index) => {
    if (question.includes(index)) {
      indices.push(index);
    }
  });

  return indices;
}

/**
 * 提取基金名称
 */
function extractFundNames(question: string): string[] {
  const funds: string[] = [];
  const fundKeywords = [
    '易方达',
    '华夏',
    '嘉实',
    '广发',
    '南方',
    '汇添富',
    '天弘',
    '招商',
    '建信',
    '富国'
  ];

  fundKeywords.forEach((fund) => {
    if (question.includes(fund)) {
      funds.push(fund);
    }
  });

  return funds;
}

/**
 * 提取债券名称
 */
function extractBondNames(question: string): string[] {
  const bonds: string[] = [];
  const bondKeywords = ['国债', '企业债', '公司债', '转债', '可转债', '信用债'];

  bondKeywords.forEach((bond) => {
    if (question.includes(bond)) {
      bonds.push(bond);
    }
  });

  return bonds;
}

/**
 * 提取商品名称
 */
function extractCommodityNames(question: string): string[] {
  const commodities: string[] = [];
  const commodityKeywords = [
    '黄金',
    '白银',
    '原油',
    '铜',
    '铝',
    '锅',
    '铅',
    '大豆',
    '玉米',
    '棉花',
    '白糖',
    '铁矿石',
    '焦炭'
  ];

  commodityKeywords.forEach((commodity) => {
    if (question.includes(commodity)) {
      commodities.push(commodity);
    }
  });

  return commodities;
}

/**
 * 提取板块信息
 */
function extractSector(question: string): string | undefined {
  const sectors = [
    '成长股',
    '价值股',
    '蓝筹股',
    '小盘股',
    '中盘股',
    '大盘股',
    '次新股',
    '创业股',
    '科创股'
  ];

  for (const sector of sectors) {
    if (question.includes(sector)) {
      return sector;
    }
  }

  return undefined;
}

/**
 * 提取市值信息
 */
function extractMarketCap(question: string): string | undefined {
  if (question.includes('大盘') || question.includes('大市值')) {
    return 'large';
  }
  if (question.includes('中盘') || question.includes('中市值')) {
    return 'medium';
  }
  if (question.includes('小盘') || question.includes('小市值')) {
    return 'small';
  }

  return undefined;
}

/**
 * 提取风险等级
 */
function extractRiskLevel(question: string): string | undefined {
  if (question.includes('低风险') || question.includes('稳健')) {
    return 'low';
  }
  if (question.includes('中风险') || question.includes('平衡')) {
    return 'medium';
  }
  if (question.includes('高风险') || question.includes('激进')) {
    return 'high';
  }

  return undefined;
}

/**
 * 提取投资周期
 */
function extractInvestmentHorizon(question: string): string | undefined {
  if (question.includes('短期') || question.includes('短线')) {
    return 'short';
  }
  if (question.includes('中期') || question.includes('中线')) {
    return 'medium';
  }
  if (question.includes('长期') || question.includes('长线')) {
    return 'long';
  }

  return undefined;
}

/**
 * 生成投资决策
 */
export function generateInvestmentDecision(
  analysisResult: any,
  marketData: any
): { view: InvestmentView; reason: string; confidence: number } {
  // 这里实现基于数据分析的投资决策逻辑
  // 可以结合技术指标、财务指标、市场情绪等因素

  let score = 0;
  const reasons: string[] = [];

  // 示例决策逻辑
  if (marketData.pe_ttm && marketData.pe_ttm < 15) {
    score += 2;
    reasons.push('估值较低');
  }

  if (marketData.roe_ttm && marketData.roe_ttm > 15) {
    score += 2;
    reasons.push('盈利能力强');
  }

  if (marketData.or_yoy && marketData.or_yoy > 20) {
    score += 1;
    reasons.push('营收增长良好');
  }

  // 根据得分判断投资观点
  let view: InvestmentView;
  let confidence: number;

  if (score >= 4) {
    view = InvestmentView.BULLISH;
    confidence = Math.min(score * 15, 90);
  } else if (score >= 2) {
    view = InvestmentView.NEUTRAL;
    confidence = 50 + score * 10;
  } else {
    view = InvestmentView.BEARISH;
    confidence = 30 + score * 10;
  }

  return {
    view,
    reason: reasons.join('；'),
    confidence
  };
}
