/**
 * 股票代码和名称映射表
 * 用于快速查找股票名称和行业分类
 */

export interface StockInfo {
  code: string;
  name: string;
  industry: string;
  sector: string;
  marketCap?: number; // 市值（亿元）
  keywords?: string[]; // 关键词，用于模糊匹配
}

// 热门股票映射表
export const stockMapping: Record<string, StockInfo> = {
  // A股主要股票
  '600519.SH': {
    code: '600519.SH',
    name: '贵州茅台',
    industry: '白酒',
    sector: '消费',
    marketCap: 21000,
    keywords: ['茅台', '白酒', 'maotai']
  },
  '000858.SZ': {
    code: '000858.SZ',
    name: '五粮液',
    industry: '白酒',
    sector: '消费',
    marketCap: 3800,
    keywords: ['五粮液', '白酒', 'wuliangye']
  },
  '000001.SZ': {
    code: '000001.SZ',
    name: '平安银行',
    industry: '银行',
    sector: '金融',
    marketCap: 2300,
    keywords: ['平安银行', '银行', 'pingan']
  },
  '000002.SZ': {
    code: '000002.SZ',
    name: '万科A',
    industry: '房地产',
    sector: '地产',
    marketCap: 1200,
    keywords: ['万科', '地产', 'vanke']
  },
  '002594.SZ': {
    code: '002594.SZ',
    name: '比亚迪',
    industry: '新能源汽车',
    sector: '汽车',
    marketCap: 8000,
    keywords: ['比亚迪', '新能源', 'BYD', 'byd']
  },
  '300750.SZ': {
    code: '300750.SZ',
    name: '宁德时代',
    industry: '动力电池',
    sector: '新能源',
    marketCap: 7500,
    keywords: ['宁德时代', '电池', 'CATL', 'catl']
  },
  '600036.SH': {
    code: '600036.SH',
    name: '招商银行',
    industry: '银行',
    sector: '金融',
    marketCap: 9000,
    keywords: ['招商银行', '招行', 'CMB']
  },
  '000568.SZ': {
    code: '000568.SZ',
    name: '泸州老窖',
    industry: '白酒',
    sector: '消费',
    marketCap: 3000,
    keywords: ['泸州老窖', '老窖', '白酒']
  },
  '600809.SH': {
    code: '600809.SH',
    name: '山西汾酒',
    industry: '白酒',
    sector: '消费',
    marketCap: 2800,
    keywords: ['汾酒', '山西汾酒', '白酒']
  },
  '002415.SZ': {
    code: '002415.SZ',
    name: '海康威视',
    industry: '安防',
    sector: '科技',
    marketCap: 3500,
    keywords: ['海康威视', '海康', '安防', 'hikvision']
  },

  // 医药股
  '600276.SH': {
    code: '600276.SH',
    name: '恒瑞医药',
    industry: '医药',
    sector: '医药',
    marketCap: 2500,
    keywords: ['恒瑞医药', '恒瑞', '医药']
  },
  '000661.SZ': {
    code: '000661.SZ',
    name: '长春高新',
    industry: '生物医药',
    sector: '医药',
    marketCap: 800,
    keywords: ['长春高新', '生长激素', '医药']
  },
  '002821.SZ': {
    code: '002821.SZ',
    name: '凯莱英',
    industry: 'CDMO',
    sector: '医药',
    marketCap: 400,
    keywords: ['凯莱英', 'CDMO', '医药外包']
  },
  '603259.SH': {
    code: '603259.SH',
    name: '药明康德',
    industry: 'CRO',
    sector: '医药',
    marketCap: 2000,
    keywords: ['药明康德', 'CRO', '医药研发']
  },

  // 新能源
  '300274.SZ': {
    code: '300274.SZ',
    name: '阳光电源',
    industry: '光伏逆变器',
    sector: '新能源',
    marketCap: 1200,
    keywords: ['阳光电源', '逆变器', '光伏']
  },
  '601012.SH': {
    code: '601012.SH',
    name: '隆基绿能',
    industry: '光伏',
    sector: '新能源',
    marketCap: 2500,
    keywords: ['隆基', '隆基绿能', '光伏', '硅片']
  },

  // 科技股
  '000063.SZ': {
    code: '000063.SZ',
    name: '中兴通讯',
    industry: '通信设备',
    sector: '科技',
    marketCap: 1200,
    keywords: ['中兴通讯', '中兴', '5G', '通信']
  },
  '002230.SZ': {
    code: '002230.SZ',
    name: '科大讯飞',
    industry: '人工智能',
    sector: '科技',
    marketCap: 900,
    keywords: ['科大讯飞', '讯飞', 'AI', '人工智能']
  },

  // 半导体
  '688981.SH': {
    code: '688981.SH',
    name: '中芯国际',
    industry: '半导体',
    sector: '科技',
    marketCap: 4000,
    keywords: ['中芯国际', '中芯', '芯片', '晶圆']
  },
  '603986.SH': {
    code: '603986.SH',
    name: '兆易创新',
    industry: '半导体',
    sector: '科技',
    marketCap: 600,
    keywords: ['兆易创新', '存储芯片', 'MCU']
  }
};

// 公司名称到股票代码的反向映射
export const nameToCodeMapping: Record<string, string> = {};
Object.values(stockMapping).forEach((stock) => {
  nameToCodeMapping[stock.name] = stock.code;
  // 添加关键词映射
  stock.keywords?.forEach((keyword) => {
    nameToCodeMapping[keyword.toLowerCase()] = stock.code;
  });
});

/**
 * 根据公司名称或关键词查找股票代码
 */
export function findStockByName(name: string): string | null {
  const normalizedName = name.toLowerCase().trim();

  // 精确匹配
  if (nameToCodeMapping[normalizedName]) {
    return nameToCodeMapping[normalizedName];
  }

  // 模糊匹配
  for (const [key, code] of Object.entries(nameToCodeMapping)) {
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return code;
    }
  }

  return null;
}

/**
 * 获取股票信息
 */
export function getStockInfo(code: string): StockInfo | null {
  return stockMapping[code] || null;
}

/**
 * 按行业分类获取股票列表
 */
export function getStocksByIndustry(industry: string): StockInfo[] {
  return Object.values(stockMapping).filter(
    (stock) => stock.industry === industry || stock.sector === industry
  );
}

/**
 * 获取热门股票列表（按市值排序）
 */
export function getTopStocks(limit: number = 10): StockInfo[] {
  return Object.values(stockMapping)
    .filter((stock) => stock.marketCap)
    .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
    .slice(0, limit);
}
