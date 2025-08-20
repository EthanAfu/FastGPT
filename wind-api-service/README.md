# Wind API Service for FastGPT

## 📋 概述

这是一个为 FastGPT 提供 Wind 金融数据服务的 HTTP API 服务器。通过此服务，FastGPT 可以获取股票、债券、基金等金融产品的实时和历史数据。

## ✅ 当前状态

- **Wind API**: ✅ 已连接并运行正常
- **HTTP 服务**: ✅ 运行在 http://localhost:8080
- **FastGPT 集成**: ✅ 完全集成，编译成功
- **数据获取**: ✅ 成功获取真实金融数据

## 🚀 快速开始

### 1. 启动 Wind API 服务

```bash
cd wind-api-service
source venv/bin/activate
python wind_api_server.py
```

服务将在 http://localhost:8080 启动

### 2. 启动 FastGPT

```bash
cd projects/app
pnpm dev
```

FastGPT 将在 http://localhost:3000 启动

### 3. 测试集成

```bash
./test_integration.sh
```

## 📊 测试结果

最新测试 (2025-08-08):
- ✅ Wind API 服务运行正常
- ✅ 成功获取贵州茅台 (600519.SH) 数据：股价 1420.97
- ✅ 批量数据获取成功
- ✅ FastGPT 编译和运行正常

## 🔧 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/data` | POST | 获取金融数据 |
| `/api/search` | POST | 搜索证券 |
| `/api/indicators` | GET | 获取可用指标 |
| `/api/realtime` | POST | 获取实时数据 |
| `/api/sector` | POST | 获取板块数据 |

## 📝 使用示例

### 获取股票数据

```bash
curl -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -d '{
    "codes": "600519.SH",
    "fields": "sec_name,close,pe_ttm,volume"
  }'
```

响应：
```json
{
  "errorCode": 0,
  "codes": ["600519.SH"],
  "fields": ["SEC_NAME", "CLOSE", "PE_TTM", "VOLUME"],
  "data": [["贵州茅台"], [1420.97], [null], [2365234]],
  "message": "success"
}
```

## 🔗 FastGPT 集成

在 FastGPT 工作流中：
1. 添加 "Wind数据获取" 节点
2. 配置股票代码和指标
3. 连接到 LLM 分析节点
4. 运行工作流获取和分析金融数据

## 📁 文件结构

```
wind-api-service/
├── wind_api_server.py    # 主服务器文件
├── requirements.txt       # Python 依赖
├── test_wind_installation.py  # Wind 安装测试
├── test_integration.sh    # 集成测试脚本
├── venv/                  # Python 虚拟环境
└── wind_api.log          # 服务日志
```

## 🛠️ 技术栈

- **Python 3.13.4**: 服务器语言
- **Flask**: Web 框架
- **WindPy**: Wind 金融终端 API
- **TypeScript**: FastGPT 集成
- **Node.js**: FastGPT 运行环境

## 📈 支持的数据类型

- **股票**: A股、港股、美股
- **债券**: 国债、企业债、可转债
- **基金**: 公募基金、ETF
- **商品期货**: 期货合约
- **外汇**: 汇率数据
- **宏观数据**: 经济指标

## 🔐 配置

在 FastGPT 的 `.env.local` 文件中：

```env
WIND_API_URL=http://localhost:8080
WIND_USERNAME=local_wind_service
WIND_PASSWORD=not_required_for_local_service
WIND_TIMEOUT=30000
```

## 🐛 故障排查

1. **Wind API 未连接**
   - 确保 Wind 终端已登录
   - 检查 WindPy 安装：`python test_wind_installation.py`

2. **服务无法启动**
   - 检查端口 8080 是否被占用
   - 确保虚拟环境已激活

3. **FastGPT 编译错误**
   - 清除缓存：`rm -rf .next`
   - 重新安装依赖：`pnpm install`

## 📄 许可

此项目是 FastGPT 的扩展模块，遵循 FastGPT 的开源协议。Wind API 的使用需要有效的 Wind 金融终端许可。

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系

如有问题，请联系 FastGPT 团队或查看 [FastGPT 文档](https://doc.fastgpt.io)