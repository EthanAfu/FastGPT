/**
 * 金融问题智能分析器
 * 用于解析用户问题，提取实体和意图
 */

import { findStockByName, getStockInfo } from './stockMapping';
import { inferIndicatorsFromQuery } from './indicatorMapping';

// 问题类型枚举
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
  TECHNICAL_ANALYSIS = 'technical_analysis' // 技术分析
}

// 投资观点类型
export enum InvestmentView {
  BULLISH = 'bullish', // 看好
  BEARISH = 'bearish', // 看空
  NEUTRAL = 'neutral', // 中性
  UNKNOWN = 'unknown' // 未知
}

// 问题分析结果
export interface QuestionAnalysisResult {
  questionType: QuestionType;
  stocks: string[]; // 提取的股票代码
  indicators: string[]; // 需要的指标
  timeRange?: {
    startDate?: string;
    endDate?: string;
  };
  keywords: string[]; // 关键词
  needsComparison: boolean; // 是否需要对比
  needsAdvice: boolean; // 是否需要投资建议
  industry?: string; // 涉及的行业
  riskLevel?: string; // 风险等级
}

// 关键词模式映射
const keywordPatterns = {
  priceRelated: /股价|价格|收盘|开盘|最高|最低|涨跌|涨幅|跌幅/,
  financialRelated: /财务|营收|利润|净利|毛利|资产|负债|现金流|ROE|PE|PB/,
  companyRelated: /公司|企业|集团|股份|控股|发展|经营|业务|产品|市场/,
  industryRelated: /行业|板块|产业|领域|赛道|链条|上下游/,
  trendRelated: /走势|趋势|预测|展望|前景|未来|方向/,
  adviceRelated: /建议|推荐|买入|卖出|持有|观点|看好|看空|评级/,
  comparisonRelated: /对比|比较|对比|区别|差异|优势|劣势|谁更/,
  riskRelated: /风险|挑战|机遇|机会|问题|困难|压力|不确定/,
  macroRelated: /宏观|经济|政策|利率|汇率|通胀|GDP|贸易|关税/,
  technicalRelated: /技术|均线|MACD|KDJ|RSI|支撑|阻力|形态|突破/
};

/**
 * 分析用户问题
 */
export function analyzeQuestion(question: string): QuestionAnalysisResult {
  const result: QuestionAnalysisResult = {
    questionType: QuestionType.STOCK_PRICE,
    stocks: [],
    indicators: [],
    keywords: [],
    needsComparison: false,
    needsAdvice: false
  };

  // 转换为小写以便匹配
  const lowerQuestion = question.toLowerCase();

  // 1. 判断问题类型
  result.questionType = determineQuestionType(lowerQuestion);

  // 2. 提取股票代码和公司名称
  result.stocks = extractStocks(question);

  // 3. 提取需要的指标
  result.indicators = inferIndicatorsFromQuery(question);

  // 4. 提取时间范围
  result.timeRange = extractTimeRange(question);

  // 5. 提取关键词
  result.keywords = extractKeywords(question);

  // 6. 判断是否需要对比
  result.needsComparison = keywordPatterns.comparisonRelated.test(lowerQuestion);

  // 7. 判断是否需要投资建议
  result.needsAdvice = keywordPatterns.adviceRelated.test(lowerQuestion);

  // 8. 提取行业信息
  result.industry = extractIndustry(question);

  return result;
}

/**
 * 判断问题类型
 */
function determineQuestionType(question: string): QuestionType {
  // 按优先级判断
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
          } else if (match.startsWith('0') || match.startsWith('3')) {
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
