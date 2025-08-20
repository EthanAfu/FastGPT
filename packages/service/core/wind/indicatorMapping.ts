/**
 * Wind指标映射和配置
 * 包含财务指标、技术指标、宏观指标等
 */

export interface IndicatorConfig {
  code: string; // Wind指标代码
  name: string; // 指标名称
  category: string; // 指标类别
  description: string; // 指标描述
  unit?: string; // 单位
  formula?: string; // 计算公式
  keywords: string[]; // 关键词，用于匹配用户问题
}

// 指标分类
export enum IndicatorCategory {
  PRICE = '价格指标',
  VOLUME = '成交量指标',
  VALUATION = '估值指标',
  PROFITABILITY = '盈利能力',
  GROWTH = '成长性指标',
  SOLVENCY = '偿债能力',
  OPERATION = '运营能力',
  TECHNICAL = '技术指标',
  MACRO = '宏观指标',
  FUND = '基金指标',
  BOND = '债券指标',
  COMMODITY = '商品指标',
  INDEX = '指数指标'
}

// Wind指标映射表
export const indicatorMapping: Record<string, IndicatorConfig> = {
  // 价格指标
  close: {
    code: 'close',
    name: '收盘价',
    category: IndicatorCategory.PRICE,
    description: '股票收盘价格',
    unit: '元',
    keywords: ['收盘价', '股价', '价格', 'close']
  },
  open: {
    code: 'open',
    name: '开盘价',
    category: IndicatorCategory.PRICE,
    description: '股票开盘价格',
    unit: '元',
    keywords: ['开盘价', 'open']
  },
  high: {
    code: 'high',
    name: '最高价',
    category: IndicatorCategory.PRICE,
    description: '日内最高价格',
    unit: '元',
    keywords: ['最高价', '高点', 'high']
  },
  low: {
    code: 'low',
    name: '最低价',
    category: IndicatorCategory.PRICE,
    description: '日内最低价格',
    unit: '元',
    keywords: ['最低价', '低点', 'low']
  },
  pct_chg: {
    code: 'pct_chg',
    name: '涨跌幅',
    category: IndicatorCategory.PRICE,
    description: '日涨跌幅',
    unit: '%',
    keywords: ['涨跌幅', '涨幅', '跌幅', '变化率']
  },

  // 成交量指标
  volume: {
    code: 'volume',
    name: '成交量',
    category: IndicatorCategory.VOLUME,
    description: '股票成交量',
    unit: '手',
    keywords: ['成交量', '交易量', 'volume', '量']
  },
  amt: {
    code: 'amt',
    name: '成交额',
    category: IndicatorCategory.VOLUME,
    description: '股票成交金额',
    unit: '万元',
    keywords: ['成交额', '成交金额', 'amount', '交易额']
  },
  turn: {
    code: 'turn',
    name: '换手率',
    category: IndicatorCategory.VOLUME,
    description: '换手率',
    unit: '%',
    keywords: ['换手率', '换手', 'turnover']
  },

  // 估值指标
  pe_ttm: {
    code: 'pe_ttm',
    name: '市盈率(TTM)',
    category: IndicatorCategory.VALUATION,
    description: '滚动市盈率',
    formula: '总市值/归母净利润(TTM)',
    keywords: ['市盈率', 'PE', 'pe', 'P/E', '估值']
  },
  pe_lyr: {
    code: 'pe_lyr',
    name: '市盈率(静态)',
    category: IndicatorCategory.VALUATION,
    description: '静态市盈率',
    formula: '总市值/上年度归母净利润',
    keywords: ['静态市盈率', '静态PE']
  },
  pb_lf: {
    code: 'pb_lf',
    name: '市净率(LF)',
    category: IndicatorCategory.VALUATION,
    description: '市净率',
    formula: '总市值/最新净资产',
    keywords: ['市净率', 'PB', 'pb', 'P/B']
  },
  ps_ttm: {
    code: 'ps_ttm',
    name: '市销率(TTM)',
    category: IndicatorCategory.VALUATION,
    description: '市销率',
    formula: '总市值/营业收入(TTM)',
    keywords: ['市销率', 'PS', 'ps', 'P/S']
  },
  pcf_ocf_ttm: {
    code: 'pcf_ocf_ttm',
    name: '市现率',
    category: IndicatorCategory.VALUATION,
    description: '市值与经营现金流比率',
    formula: '总市值/经营现金流(TTM)',
    keywords: ['市现率', 'PCF', '现金流估值']
  },
  dividendyield: {
    code: 'dividendyield',
    name: '股息率',
    category: IndicatorCategory.VALUATION,
    description: '股息收益率',
    unit: '%',
    keywords: ['股息率', '股息', '分红率', '分红', 'dividend']
  },

  // 盈利能力指标
  roe_ttm: {
    code: 'roe_ttm',
    name: '净资产收益率(TTM)',
    category: IndicatorCategory.PROFITABILITY,
    description: '净资产收益率',
    unit: '%',
    formula: '归母净利润/平均净资产',
    keywords: ['ROE', 'roe', '净资产收益率', '股东回报率']
  },
  roa_ttm: {
    code: 'roa_ttm',
    name: '总资产收益率(TTM)',
    category: IndicatorCategory.PROFITABILITY,
    description: '总资产收益率',
    unit: '%',
    formula: '净利润/平均总资产',
    keywords: ['ROA', 'roa', '总资产收益率', '资产回报率']
  },
  grossprofitmargin: {
    code: 'grossprofitmargin',
    name: '毛利率',
    category: IndicatorCategory.PROFITABILITY,
    description: '销售毛利率',
    unit: '%',
    formula: '(营业收入-营业成本)/营业收入',
    keywords: ['毛利率', '毛利', 'gross margin']
  },
  netprofitmargin: {
    code: 'netprofitmargin',
    name: '净利率',
    category: IndicatorCategory.PROFITABILITY,
    description: '销售净利率',
    unit: '%',
    formula: '净利润/营业收入',
    keywords: ['净利率', '净利', 'net margin', '利润率']
  },

  // 成长性指标
  or_ttm: {
    code: 'or_ttm',
    name: '营业收入(TTM)',
    category: IndicatorCategory.GROWTH,
    description: '滚动12个月营业收入',
    unit: '万元',
    keywords: ['营收', '营业收入', '收入', 'revenue']
  },
  or_yoy: {
    code: 'or_yoy',
    name: '营收同比增长率',
    category: IndicatorCategory.GROWTH,
    description: '营业收入同比增长率',
    unit: '%',
    keywords: ['营收增长', '收入增长', '营收增速']
  },
  np_ttm: {
    code: 'np_ttm',
    name: '净利润(TTM)',
    category: IndicatorCategory.GROWTH,
    description: '滚动12个月净利润',
    unit: '万元',
    keywords: ['净利润', '利润', 'profit', '盈利']
  },
  np_yoy: {
    code: 'np_yoy',
    name: '净利润同比增长率',
    category: IndicatorCategory.GROWTH,
    description: '净利润同比增长率',
    unit: '%',
    keywords: ['利润增长', '净利增长', '利润增速']
  },
  eps_ttm: {
    code: 'eps_ttm',
    name: '每股收益(TTM)',
    category: IndicatorCategory.GROWTH,
    description: '每股收益',
    unit: '元',
    keywords: ['EPS', 'eps', '每股收益', '每股盈利']
  },

  // 偿债能力指标
  debttoassets: {
    code: 'debttoassets',
    name: '资产负债率',
    category: IndicatorCategory.SOLVENCY,
    description: '总负债/总资产',
    unit: '%',
    formula: '总负债/总资产',
    keywords: ['资产负债率', '负债率', '杠杆率', 'leverage']
  },
  current: {
    code: 'current',
    name: '流动比率',
    category: IndicatorCategory.SOLVENCY,
    description: '流动资产/流动负债',
    formula: '流动资产/流动负债',
    keywords: ['流动比率', '流动性', 'current ratio']
  },
  quick: {
    code: 'quick',
    name: '速动比率',
    category: IndicatorCategory.SOLVENCY,
    description: '(流动资产-存货)/流动负债',
    formula: '(流动资产-存货)/流动负债',
    keywords: ['速动比率', 'quick ratio']
  },

  // 运营能力指标
  invturn: {
    code: 'invturn',
    name: '存货周转率',
    category: IndicatorCategory.OPERATION,
    description: '营业成本/平均存货',
    keywords: ['存货周转率', '库存周转', 'inventory turnover']
  },
  arturn: {
    code: 'arturn',
    name: '应收账款周转率',
    category: IndicatorCategory.OPERATION,
    description: '营业收入/平均应收账款',
    keywords: ['应收账款周转率', '应收周转']
  },
  assetsturn: {
    code: 'assetsturn',
    name: '总资产周转率',
    category: IndicatorCategory.OPERATION,
    description: '营业收入/平均总资产',
    keywords: ['总资产周转率', '资产周转']
  },

  // 市值指标
  mkt_cap_ard: {
    code: 'mkt_cap_ard',
    name: '总市值',
    category: IndicatorCategory.VALUATION,
    description: '总市值',
    unit: '万元',
    keywords: ['市值', '总市值', 'market cap', '市场价值']
  },
  mkt_cap_float: {
    code: 'mkt_cap_float',
    name: '流通市值',
    category: IndicatorCategory.VALUATION,
    description: '流通市值',
    unit: '万元',
    keywords: ['流通市值', '流通盘']
  },

  // 技术指标
  ma5: {
    code: 'ma5',
    name: '5日均线',
    category: IndicatorCategory.TECHNICAL,
    description: '5日简单移动平均',
    unit: '元',
    keywords: ['5日均线', '5日线', 'MA5', 'ma5']
  },
  ma10: {
    code: 'ma10',
    name: '10日均线',
    category: IndicatorCategory.TECHNICAL,
    description: '10日简单移动平均',
    unit: '元',
    keywords: ['10日均线', '10日线', 'MA10', 'ma10']
  },
  ma20: {
    code: 'ma20',
    name: '20日均线',
    category: IndicatorCategory.TECHNICAL,
    description: '20日简单移动平均',
    unit: '元',
    keywords: ['20日均线', '20日线', 'MA20', 'ma20']
  },
  rsi: {
    code: 'rsi',
    name: 'RSI指标',
    category: IndicatorCategory.TECHNICAL,
    description: '相对强弱指数',
    keywords: ['RSI', 'rsi', '相对强弱指数']
  },
  macd: {
    code: 'macd',
    name: 'MACD指标',
    category: IndicatorCategory.TECHNICAL,
    description: '指数平滑移动平均线',
    keywords: ['MACD', 'macd', '指数平滑移动平均']
  },
  kdj_k: {
    code: 'kdj_k',
    name: 'KDJ-K值',
    category: IndicatorCategory.TECHNICAL,
    description: 'KDJ指标K值',
    keywords: ['KDJ', 'kdj', 'K值']
  },
  boll_upper: {
    code: 'boll_upper',
    name: '布林上轨',
    category: IndicatorCategory.TECHNICAL,
    description: '布林带上轨',
    unit: '元',
    keywords: ['布林带', '上轨', 'BOLL', 'boll']
  },
  boll_lower: {
    code: 'boll_lower',
    name: '布林下轨',
    category: IndicatorCategory.TECHNICAL,
    description: '布林带下轨',
    unit: '元',
    keywords: ['布林带', '下轨', 'BOLL', 'boll']
  },

  // 宏观指标
  cpi: {
    code: 'cpi',
    name: '消费者物价指数',
    category: IndicatorCategory.MACRO,
    description: '消费者物价指数(CPI)',
    unit: '%',
    keywords: ['CPI', 'cpi', '消费者物价指数', '通胀']
  },
  ppi: {
    code: 'ppi',
    name: '生产者物价指数',
    category: IndicatorCategory.MACRO,
    description: '生产者物价指数(PPI)',
    unit: '%',
    keywords: ['PPI', 'ppi', '生产者物价指数']
  },
  gdp_yoy: {
    code: 'gdp_yoy',
    name: 'GDP同比增速',
    category: IndicatorCategory.MACRO,
    description: '国内生产总值同比增速',
    unit: '%',
    keywords: ['GDP', 'gdp', '国内生产总值', '经济增速']
  },
  m2_yoy: {
    code: 'm2_yoy',
    name: 'M2同比增速',
    category: IndicatorCategory.MACRO,
    description: '广义货币供应量M2同比增速',
    unit: '%',
    keywords: ['M2', 'm2', '货币供应量']
  },
  shibor_3m: {
    code: 'shibor_3m',
    name: '3月Shibor',
    category: IndicatorCategory.MACRO,
    description: '3个月上海银行间同业拆借利率',
    unit: '%',
    keywords: ['Shibor', 'shibor', '同业拆借利率', '利率']
  },

  // 基金指标
  fund_nav: {
    code: 'fund_nav',
    name: '基金单位净值',
    category: IndicatorCategory.FUND,
    description: '基金单位净值',
    unit: '元',
    keywords: ['基金净值', '单位净值', 'NAV', 'nav']
  },
  fund_acc_nav: {
    code: 'fund_acc_nav',
    name: '基金累计净值',
    category: IndicatorCategory.FUND,
    description: '基金累计单位净值',
    unit: '元',
    keywords: ['累计净值', '累计单位净值']
  },
  fund_return_1y: {
    code: 'fund_return_1y',
    name: '基金1年收益率',
    category: IndicatorCategory.FUND,
    description: '基金近一年收益率',
    unit: '%',
    keywords: ['基金收益', '1年收益', '年化收益']
  },
  fund_sharpe: {
    code: 'fund_sharpe',
    name: '基金夏普比率',
    category: IndicatorCategory.FUND,
    description: '基金夏普比率',
    keywords: ['夏普比率', 'Sharpe', 'sharpe', '风险调整收益']
  },

  // 债券指标
  bond_ytm: {
    code: 'bond_ytm',
    name: '债券到期收益率',
    category: IndicatorCategory.BOND,
    description: '债券到期收益率(YTM)',
    unit: '%',
    keywords: ['到期收益率', 'YTM', 'ytm', '债券收益']
  },
  bond_duration: {
    code: 'bond_duration',
    name: '债券久期',
    category: IndicatorCategory.BOND,
    description: '债券修正久期',
    unit: '年',
    keywords: ['久期', 'duration', '修正久期']
  },
  bond_convexity: {
    code: 'bond_convexity',
    name: '债券凸性',
    category: IndicatorCategory.BOND,
    description: '债券凸性',
    keywords: ['凸性', 'convexity', '价格敏感性']
  },

  // 商品指标
  commodity_settle: {
    code: 'commodity_settle',
    name: '商品期货结算价',
    category: IndicatorCategory.COMMODITY,
    description: '商品期货结算价',
    unit: '元',
    keywords: ['结算价', '期货价格', 'settle']
  },
  commodity_oi: {
    code: 'commodity_oi',
    name: '商品期货持仓量',
    category: IndicatorCategory.COMMODITY,
    description: '商品期货未平仓量',
    unit: '手',
    keywords: ['持仓量', '未平仓', 'open interest', 'oi']
  },

  // 指数指标
  index_weight: {
    code: 'index_weight',
    name: '指数成分权重',
    category: IndicatorCategory.INDEX,
    description: '股票在指数中的权重',
    unit: '%',
    keywords: ['权重', '指数权重', 'weight']
  },
  index_pe: {
    code: 'index_pe',
    name: '指数市盈率',
    category: IndicatorCategory.INDEX,
    description: '指数市盈率',
    keywords: ['指数PE', '指数市盈率']
  },
  index_pb: {
    code: 'index_pb',
    name: '指数市净率',
    category: IndicatorCategory.INDEX,
    description: '指数市净率',
    keywords: ['指数PB', '指数市净率']
  }
};

/**
 * 根据用户问题推断需要的指标
 */
export function inferIndicatorsFromQuery(query: string): string[] {
  const normalizedQuery = query.toLowerCase();
  const matchedIndicators = new Set<string>();

  // 遍历所有指标，查找匹配的关键词
  Object.entries(indicatorMapping).forEach(([code, config]) => {
    for (const keyword of config.keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        matchedIndicators.add(code);
        break;
      }
    }
  });

  // 如果没有匹配到特定指标，根据问题类型返回默认指标
  if (matchedIndicators.size === 0) {
    // 根据问题内容智能推断需要的指标类型
    if (
      normalizedQuery.includes('技术') ||
      normalizedQuery.includes('均线') ||
      normalizedQuery.includes('macd') ||
      normalizedQuery.includes('rsi')
    ) {
      return ['close', 'ma5', 'ma20', 'rsi', 'macd', 'volume'];
    } else if (
      normalizedQuery.includes('基金') ||
      normalizedQuery.includes('净值') ||
      normalizedQuery.includes('收益')
    ) {
      return ['fund_nav', 'fund_acc_nav', 'fund_return_1y', 'fund_sharpe'];
    } else if (
      normalizedQuery.includes('债券') ||
      normalizedQuery.includes('利率') ||
      normalizedQuery.includes('收益率')
    ) {
      return ['bond_ytm', 'bond_duration', 'close', 'volume'];
    } else if (
      normalizedQuery.includes('期货') ||
      normalizedQuery.includes('商品') ||
      normalizedQuery.includes('持仓')
    ) {
      return ['commodity_settle', 'commodity_oi', 'volume', 'pct_chg'];
    } else if (normalizedQuery.includes('指数') || normalizedQuery.includes('指数')) {
      return ['close', 'index_pe', 'index_pb', 'volume', 'pct_chg'];
    } else if (
      normalizedQuery.includes('宏观') ||
      normalizedQuery.includes('gdp') ||
      normalizedQuery.includes('cpi')
    ) {
      return ['cpi', 'ppi', 'gdp_yoy', 'm2_yoy', 'shibor_3m'];
    }

    // 默认股票基础指标集
    return ['close', 'volume', 'pe_ttm', 'pb_lf', 'roe_ttm', 'or_yoy', 'np_yoy'];
  }

  // 根据类别补充相关指标
  const indicatorArray = Array.from(matchedIndicators);
  const categories = new Set<string>();

  indicatorArray.forEach((code) => {
    const indicator = indicatorMapping[code];
    if (indicator) {
      categories.add(indicator.category);
    }
  });

  // 如果查询估值指标，补充相关估值指标
  if (categories.has(IndicatorCategory.VALUATION)) {
    ['pe_ttm', 'pb_lf', 'ps_ttm'].forEach((code) => matchedIndicators.add(code));
  }

  // 如果查询盈利能力，补充相关指标
  if (categories.has(IndicatorCategory.PROFITABILITY)) {
    ['roe_ttm', 'roa_ttm', 'netprofitmargin'].forEach((code) => matchedIndicators.add(code));
  }

  // 如果查询成长性，补充相关指标
  if (categories.has(IndicatorCategory.GROWTH)) {
    ['or_yoy', 'np_yoy', 'eps_ttm'].forEach((code) => matchedIndicators.add(code));
  }

  // 如果查询技术指标，补充相关指标
  if (categories.has(IndicatorCategory.TECHNICAL)) {
    ['close', 'volume', 'ma5', 'ma20'].forEach((code) => matchedIndicators.add(code));
  }

  // 如果查询基金指标，补充相关指标
  if (categories.has(IndicatorCategory.FUND)) {
    ['fund_nav', 'fund_acc_nav', 'fund_return_1y'].forEach((code) => matchedIndicators.add(code));
  }

  // 如果查询债券指标，补充相关指标
  if (categories.has(IndicatorCategory.BOND)) {
    ['bond_ytm', 'close', 'volume'].forEach((code) => matchedIndicators.add(code));
  }

  // 如果查询宏观指标，补充相关指标
  if (categories.has(IndicatorCategory.MACRO)) {
    ['cpi', 'ppi', 'gdp_yoy'].forEach((code) => matchedIndicators.add(code));
  }

  return Array.from(matchedIndicators);
}

/**
 * 获取指标分类
 */
export function getIndicatorsByCategory(category: string): IndicatorConfig[] {
  return Object.values(indicatorMapping).filter((indicator) => indicator.category === category);
}

/**
 * 获取指标配置
 */
export function getIndicatorConfig(code: string): IndicatorConfig | null {
  return indicatorMapping[code] || null;
}

/**
 * 格式化指标值
 */
export function formatIndicatorValue(code: string, value: number): string {
  const config = indicatorMapping[code];
  if (!config) return String(value);

  // 根据单位格式化
  if (config.unit === '%') {
    return `${value.toFixed(2)}%`;
  } else if (config.unit === '万元') {
    if (Math.abs(value) >= 100000000) {
      return `${(value / 100000000).toFixed(2)}万亿`;
    } else if (Math.abs(value) >= 10000) {
      return `${(value / 10000).toFixed(2)}亿`;
    }
    return `${value.toFixed(2)}万`;
  } else if (config.unit === '元') {
    return `${value.toFixed(2)}元`;
  } else if (config.unit === '手') {
    return `${(value / 100).toFixed(0)}手`;
  }

  return value.toFixed(2);
}
