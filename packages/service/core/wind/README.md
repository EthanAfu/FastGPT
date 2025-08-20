# Wind金融知识库系统

## 概述

Wind金融知识库是FastGPT的一个专业金融分析模块，通过集成Wind API实现实时金融数据获取、智能问题分析和投资决策建议。系统能够理解和回答300+种金融投资问题，并给出明确的投资观点（看好/看空/中性）。

## 核心功能

### 1. 智能问题分析
- **实体识别**: 自动识别股票代码、公司名称
- **意图理解**: 判断问题类型（数据查询/公司分析/投资建议等）
- **指标推断**: 根据问题自动推断需要的财务指标
- **时间提取**: 识别问题中的时间范围

### 2. 数据自动获取
- **Wind API集成**: 实时获取股票、债券、基金等金融数据
- **智能缓存**: 5分钟数据缓存，提高响应速度
- **批量查询**: 支持多证券、多指标批量查询
- **数据格式化**: 自动格式化和汇总数据

### 3. 投资决策分析
- **多维度评估**: 基于估值、盈利、成长、负债等多维度分析
- **风险识别**: 自动识别潜在风险因素
- **投资建议**: 生成明确的投资观点和置信度
- **对比分析**: 支持多股票对比分析

## 支持的问题类型

### 个股研究类（35%）
- 公司基本面分析
- 财务状况评估
- 竞争优势对比
- 风险与机遇评估

### 行业分析类（30%）
- 行业格局分析
- 市场规模评估
- 产业链分析
- 技术趋势判断

### 宏观策略类（20%）
- 政策影响分析
- 市场走势预测
- 投资策略推荐
- 风险对冲建议

### 数据查询类（15%）
- 实时行情查询
- 历史数据对比
- 财务指标查询
- 市场统计数据

## 快速开始

### 1. 配置Wind API

复制环境配置文件：
```bash
cp .env.wind.example .env.local
```

编辑 `.env.local` 文件，填入Wind API凭证：
```env
WIND_API_URL=http://your-wind-api-server.com
WIND_USERNAME=your_username
WIND_PASSWORD=your_password
WIND_ENABLED=true
```

### 2. 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start
```

### 3. 使用工作流模板

1. 登录FastGPT管理界面
2. 创建新应用
3. 导入金融分析工作流模板 (`stockAnalysis.json`)
4. 配置AI模型（推荐GPT-4）
5. 开始对话测试

### 4. API调用示例

```javascript
// 调用分析接口
const response = await fetch('/api/core/wind/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    question: "分析贵州茅台的投资价值"
  })
});

const result = await response.json();
console.log(result.analysis); // 分析报告
console.log(result.recommendation); // 投资建议：bullish/bearish/neutral
console.log(result.confidence); // 置信度：0-100
```

## 核心模块说明

### stockMapping.ts
- 股票代码和名称映射
- 热门股票信息维护
- 行业分类管理

### indicatorMapping.ts
- Wind指标配置
- 指标分类和描述
- 智能指标推断

### questionAnalyzer.ts
- 问题意图识别
- 实体提取算法
- 投资决策生成

### service.ts
- Wind API服务封装
- 数据缓存管理
- 智能分析引擎

## 示例问题

系统可以回答以下类型的问题：

**个股分析**
- "健友股份关税问题影响如何？"
- "春立医疗与爱康医疗谁的竞争力更强？"
- "特宝生物的估值是否合理？"

**行业研究**
- "固态电池概念股有哪些投资机会？"
- "智能驾驶板块的发展前景如何？"
- "医药行业哪些细分领域值得关注？"

**投资策略**
- "如果降息哪些板块最受益？"
- "红利股有哪些标的值得投资？"
- "当前市场适合价值投资还是成长投资？"

**市场分析**
- "贸易战对新能源板块的影响？"
- "黄金未来走势如何？"
- "A股市场当前的投资机会在哪里？"

## 数据来源

- **实时数据**: Wind金融终端API
- **公司信息**: 内置股票映射数据库
- **财务指标**: Wind标准财务指标体系
- **行业分类**: 申万行业分类标准

## 注意事项

1. **Wind API许可**: 需要有效的Wind API授权
2. **数据延迟**: 实时数据可能有15分钟延迟
3. **投资风险**: 系统建议仅供参考，不构成投资建议
4. **数据准确性**: 请以Wind官方数据为准

## 扩展开发

### 添加新股票
编辑 `stockMapping.ts`，添加股票信息：
```typescript
'新股票代码': {
  code: '新股票代码',
  name: '公司名称',
  industry: '所属行业',
  sector: '所属板块',
  marketCap: 市值,
  keywords: ['关键词1', '关键词2']
}
```

### 添加新指标
编辑 `indicatorMapping.ts`，添加指标配置：
```typescript
新指标代码: {
  code: '新指标代码',
  name: '指标名称',
  category: IndicatorCategory.类别,
  description: '指标描述',
  unit: '单位',
  keywords: ['关键词1', '关键词2']
}
```

### 自定义分析逻辑
修改 `service.ts` 中的 `analyzeAndRecommend` 方法，添加自定义分析规则。

## 技术支持

- 问题反馈：提交Issue到项目仓库
- 功能建议：欢迎提交PR
- Wind API：参考Wind官方文档

## License

本项目遵循FastGPT的开源协议。Wind API的使用需遵守Wind的服务条款。