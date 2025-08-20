# Wind API 集成指南

## 概述

FastGPT 现已集成 Wind 金融数据服务，支持获取股票、债券、基金等金融数据，并结合大模型进行智能分析。

## 功能特性

### 1. Wind 数据获取节点
- 支持多种金融产品：股票、债券、基金、商品期货、外汇
- 灵活的指标配置：支持 Wind 全量指标字段
- 智能代码识别：自动从用户问题中提取证券代码
- 指标推断：根据问题类型自动推断所需指标
- 数据缓存：5分钟缓存机制，提高响应速度

### 2. Wind 智能分析节点
- 结合大模型进行数据解读
- 支持多种分析类型：综合分析、技术分析、基本面分析、风险分析
- 专业金融知识库
- 个性化分析需求

## 环境配置

在 `.env.local` 文件中添加 Wind API 配置：

```bash
# Wind API 配置
WIND_API_URL=http://your-wind-api-server.com
WIND_USERNAME=your_wind_username
WIND_PASSWORD=your_wind_password
WIND_TIMEOUT=30000
```

## 快速开始

### 1. 创建 Wind 金融分析应用

1. 登录 FastGPT 管理台
2. 创建新应用
3. 选择"从模板创建"
4. 导入 `examples/wind-financial-analysis-workflow.json`

### 2. 工作流节点说明

#### Wind 数据获取节点
- **数据类型**：选择要获取的数据类型（股票/债券/基金等）
- **证券代码**：支持标准格式（如 600519.SH）或从用户输入自动提取
- **指标字段**：Wind 指标代码，支持多个指标用逗号分隔
- **时间范围**：可指定数据的开始和结束日期
- **数据频率**：日频、周频、月频等

#### Wind 智能分析节点
- **Wind数据输入**：连接 Wind 数据节点的输出
- **分析类型**：选择分析角度
- **AI模型**：选择用于分析的大模型
- **系统提示词**：可自定义分析框架和要求

## 支持的 Wind 指标

### 股票指标
```
close          # 收盘价
open           # 开盘价  
high           # 最高价
low            # 最低价
volume         # 成交量
amt            # 成交额
pe_ttm         # 市盈率TTM
pb_lf          # 市净率LF
mkt_cap_ard    # 总市值
or_ttm         # 营业收入TTM
np_ttm         # 净利润TTM
roe_ttm        # 净资产收益率TTM
```

### 债券指标
```
yield_to_maturity    # 到期收益率
duration            # 久期
convexity           # 凸性
credit_rating       # 信用评级
```

### 基金指标  
```
unit_nav           # 单位净值
accum_nav          # 累计净值
return_1m          # 近1月收益率
return_1y          # 近1年收益率
max_drawdown       # 最大回撤
```

## 用户问题示例

### 股票分析
- "分析贵州茅台的投资价值"
- "600519.SH 近期表现怎么样？"
- "比较五粮液和茅台的基本面"
- "新能源板块有哪些投资机会？"

### 债券分析
- "分析 10年期国债的投资价值"
- "当前利率环境下的债券配置建议"
- "企业债的信用风险如何？"

### 基金分析
- "推荐几只优质的主动权益基金"
- "指数基金和主动基金哪个更好？"
- "基金定投策略分析"

## API 接口说明

### Wind API 服务接口

#### 数据获取接口
```
POST /api/data
```

请求参数：
```json
{
  "codes": "600519.SH,000858.SZ",
  "fields": "close,pe_ttm,pb_lf",
  "startDate": "2024-01-01", 
  "endDate": "2024-12-31",
  "frequency": "D",
  "dataType": "stock"
}
```

响应格式：
```json
{
  "errorCode": 0,
  "data": [[...], [...]],
  "fields": ["close", "pe_ttm", "pb_lf"],
  "codes": ["600519.SH", "000858.SZ"],
  "times": ["2024-01-01", "2024-01-02"],
  "message": "success"
}
```

## 错误处理

### 常见错误及解决方案

1. **Wind API 未配置**
   - 检查环境变量配置
   - 确认 Wind API 服务可访问

2. **证券代码错误**
   - 使用标准格式：6位数字.市场代码
   - 上海：.SH，深圳：.SZ，香港：.HK

3. **指标字段不存在**
   - 参考 Wind 官方文档
   - 使用标准指标代码

4. **数据获取超时**
   - 调整 WIND_TIMEOUT 配置
   - 减少请求的数据量

## 性能优化

### 缓存策略
- 相同请求 5 分钟内返回缓存结果
- 支持批量获取多个证券数据
- 异步处理大量数据请求

### 最佳实践
1. 合理设置时间范围，避免获取过多历史数据
2. 按需选择指标字段，减少无效数据传输  
3. 使用智能代码提取，减少手动输入错误
4. 结合分析类型，选择合适的 AI 模型

## 扩展开发

### 自定义指标
可以在 `WindAPIService` 中扩展更多指标映射：

```typescript
const indicatorMap = {
  '自定义关键词': ['custom_field1', 'custom_field2'],
  // 添加更多映射
};
```

### 自定义分析类型
在 Wind 智能分析节点中可以扩展更多分析维度：

```typescript
{
  label: '自定义分析',
  value: 'custom_analysis'
}
```

## 故障排查

### 日志查看
Wind API 调用日志会记录在系统日志中：

```bash
# 查看 Wind API 调用日志
grep "Wind API" logs/fastgpt.log
```

### 测试连接
```bash
# 测试 Wind API 连接
curl -X POST $WIND_API_URL/api/data \
  -H "Content-Type: application/json" \
  -d '{"codes":"000001.SZ","fields":"close"}'
```

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础股票、债券、基金数据获取
- 集成 LLM 智能分析功能
- 提供示例工作流模板

## 技术支持

如有问题，请联系：
- GitHub Issues: [FastGPT Issues](https://github.com/labring/FastGPT/issues)
- 技术文档: [FastGPT Docs](https://doc.fastgpt.io)