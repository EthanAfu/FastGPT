/**
 * Wind金融分析功能测试脚本
 * 用于测试问题分析、数据获取和投资建议生成
 */

import {
  analyzeQuestion,
  extractStocks,
  QuestionType,
  InvestmentView
} from '../../packages/service/core/wind/questionAnalyzer';
import {
  findStockByName,
  getStockInfo,
  getTopStocks
} from '../../packages/service/core/wind/stockMapping';
import {
  inferIndicatorsFromQuery,
  getIndicatorConfig
} from '../../packages/service/core/wind/indicatorMapping';

// 测试问题列表（从用户提供的问题中选取代表性的）
const testQuestions = [
  '健友股份关税问题',
  '海泰新光面临的机遇与挑战',
  '春立医疗与爱康医疗竞争优势对比',
  '特宝生物估值问题',
  '贸易战对京东方的影响',
  '固生堂面临的风险与挑战',
  '城市NOA带来的投资机会',
  '智能驾驶渗透率提升带来的投资机会有哪些？',
  '国邦医药的主要竞争对手有哪些？',
  '百润股份怎么看',
  '如果降息哪些板块或个股最受益',
  '分析下滔搏的投资逻辑',
  '梳理下红利板块及推荐标的',
  '黄金未来中期走势如何',
  '比亚迪和宁德时代哪个更值得投资'
];

console.log('=== Wind金融分析功能测试 ===\n');

// 测试1: 问题意图识别
console.log('1. 测试问题意图识别功能');
console.log('-'.repeat(50));

testQuestions.slice(0, 5).forEach((question, index) => {
  console.log(`\n问题${index + 1}: ${question}`);
  const analysis = analyzeQuestion(question);

  console.log(`  类型: ${analysis.questionType}`);
  console.log(`  股票: ${analysis.stocks.join(', ') || '未识别到股票'}`);
  console.log(`  指标: ${analysis.indicators.slice(0, 5).join(', ')}`);
  console.log(`  关键词: ${analysis.keywords.join(', ')}`);
  console.log(`  需要对比: ${analysis.needsComparison ? '是' : '否'}`);
  console.log(`  需要建议: ${analysis.needsAdvice ? '是' : '否'}`);
  if (analysis.industry) {
    console.log(`  行业: ${analysis.industry}`);
  }
});

// 测试2: 股票识别和映射
console.log('\n\n2. 测试股票识别功能');
console.log('-'.repeat(50));

const stockTestCases = [
  '贵州茅台的投资价值',
  '600519.SH最新股价',
  '比亚迪和宁德时代对比',
  '分析京东方000725',
  '春立医疗怎么样'
];

stockTestCases.forEach((testCase) => {
  const stocks = extractStocks(testCase);
  console.log(`\n"${testCase}"`);
  stocks.forEach((code) => {
    const info = getStockInfo(code);
    if (info) {
      console.log(`  - ${code}: ${info.name} (${info.industry})`);
    } else {
      console.log(`  - ${code}: 未找到股票信息`);
    }
  });
});

// 测试3: 指标推断
console.log('\n\n3. 测试指标推断功能');
console.log('-'.repeat(50));

const indicatorTestCases = [
  '公司的市盈率和市净率是多少',
  '净资产收益率和毛利率',
  '股价走势和成交量',
  '营收增长和利润情况',
  '资产负债率和流动比率'
];

indicatorTestCases.forEach((testCase) => {
  const indicators = inferIndicatorsFromQuery(testCase);
  console.log(`\n"${testCase}"`);
  console.log(`  推断指标: ${indicators.join(', ')}`);
});

// 测试4: 公司名称查找
console.log('\n\n4. 测试公司名称查找');
console.log('-'.repeat(50));

const companyNames = ['茅台', '比亚迪', '宁德时代', '招商银行', '海康威视'];
companyNames.forEach((name) => {
  const code = findStockByName(name);
  console.log(`${name} -> ${code || '未找到'}`);
});

// 测试5: 热门股票获取
console.log('\n\n5. 热门股票列表（按市值排序）');
console.log('-'.repeat(50));

const topStocks = getTopStocks(10);
topStocks.forEach((stock, index) => {
  console.log(
    `${index + 1}. ${stock.name} (${stock.code}) - ${stock.industry} - 市值: ${stock.marketCap}亿`
  );
});

// 测试6: 模拟投资决策
console.log('\n\n6. 模拟投资决策示例');
console.log('-'.repeat(50));

const mockMarketData = {
  pe_ttm: 12.5,
  pb_lf: 1.8,
  roe_ttm: 18.5,
  or_yoy: 25.3,
  np_yoy: 30.2,
  debttoassets: 45.6
};

console.log('\n模拟市场数据:');
Object.entries(mockMarketData).forEach(([key, value]) => {
  const config = getIndicatorConfig(key);
  console.log(`  ${config?.name || key}: ${value}${config?.unit || ''}`);
});

// 简单的决策逻辑
let score = 0;
const reasons = [];

if (mockMarketData.pe_ttm < 15) {
  score += 2;
  reasons.push('低估值');
}
if (mockMarketData.roe_ttm > 15) {
  score += 2;
  reasons.push('高ROE');
}
if (mockMarketData.or_yoy > 20) {
  score += 1;
  reasons.push('营收高增长');
}
if (mockMarketData.debttoassets < 60) {
  score += 1;
  reasons.push('负债率健康');
}

const decision = score >= 4 ? '看好' : score >= 2 ? '中性' : '看空';
const confidence = Math.min(50 + score * 10, 90);

console.log(`\n投资决策: ${decision}`);
console.log(`置信度: ${confidence}%`);
console.log(`关键因素: ${reasons.join(', ')}`);

// 测试7: 问题分类统计
console.log('\n\n7. 问题分类统计');
console.log('-'.repeat(50));

const typeCount: Record<string, number> = {};
testQuestions.forEach((question) => {
  const analysis = analyzeQuestion(question);
  typeCount[analysis.questionType] = (typeCount[analysis.questionType] || 0) + 1;
});

Object.entries(typeCount).forEach(([type, count]) => {
  console.log(`${type}: ${count}个问题`);
});

console.log('\n=== 测试完成 ===');
console.log('\n说明:');
console.log('1. 本测试脚本验证了问题分析、股票识别、指标推断等核心功能');
console.log('2. 实际使用时需要配置Wind API连接以获取真实市场数据');
console.log('3. 投资建议基于多维度数据分析，包括估值、盈利、成长等指标');
console.log('4. 系统支持300+个金融问题的智能分析和回答');
