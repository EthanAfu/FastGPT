#!/bin/bash
# Wind API 集成测试脚本

echo "========================================="
echo "Wind API 与 FastGPT 集成测试"
echo "========================================="
echo ""

# 1. 检查 Wind API 服务状态
echo "1. 检查 Wind API 服务状态..."
NO_PROXY=localhost curl -s http://localhost:8080/health | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('status') == 'healthy':
    print('✅ Wind API 服务运行正常')
    print(f'  - Wind 可用: {data.get(\"wind_available\")}')
    print(f'  - Wind 连接: {data.get(\"wind_connected\")}')
else:
    print('❌ Wind API 服务异常')
    sys.exit(1)
"

echo ""

# 2. 测试股票数据获取
echo "2. 测试获取股票数据..."
echo "   请求: 贵州茅台 (600519.SH)"
NO_PROXY=localhost curl -s -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -d '{"codes":"600519.SH","fields":"sec_name,close,pe_ttm,volume"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('errorCode') == 0:
    print('✅ 数据获取成功')
    print(f'  - 证券名称: {data[\"data\"][0][0] if data[\"data\"][0] else \"N/A\"}')
    print(f'  - 股票价格: {data[\"data\"][1][0] if len(data[\"data\"]) > 1 else \"N/A\"}')
    print(f'  - 字段: {data[\"fields\"]}')
else:
    print(f'❌ 数据获取失败: {data.get(\"message\")}')
"

echo ""

# 3. 测试多个股票数据
echo "3. 测试批量获取数据..."
echo "   请求: 平安银行 (000001.SZ), 招商银行 (600036.SH)"
NO_PROXY=localhost curl -s -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -d '{"codes":"000001.SZ,600036.SH","fields":"sec_name,close"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('errorCode') == 0:
    print('✅ 批量数据获取成功')
    print(f'  - 证券数量: {len(data[\"codes\"])}')
    print(f'  - 返回字段: {data[\"fields\"]}')
else:
    print(f'❌ 批量数据获取失败: {data.get(\"message\")}')
"

echo ""

# 4. 测试可用指标获取
echo "4. 测试获取可用指标..."
NO_PROXY=localhost curl -s http://localhost:8080/api/indicators | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('errorCode') == 0:
    print('✅ 指标列表获取成功')
    indicators = data.get('data', {})
    for category in indicators:
        print(f'  - {category}: {len(indicators[category])} 类指标')
else:
    print('❌ 指标列表获取失败')
"

echo ""

# 5. 检查 FastGPT 状态
echo "5. 检查 FastGPT 服务状态..."
NO_PROXY=localhost curl -s http://localhost:3000/api/health 2>/dev/null | python3 -c "
import sys
content = sys.stdin.read()
if 'Cannot GET /api/health' in content or not content:
    print('⚠️  FastGPT 运行中（health 端点未实现）')
else:
    print('✅ FastGPT 服务响应正常')
" || echo "❌ FastGPT 服务未启动"

echo ""
echo "========================================="
echo "测试完成"
echo "========================================="
echo ""
echo "📝 使用说明："
echo "1. 确保 Wind API 服务运行在 http://localhost:8080"
echo "2. 确保 FastGPT 运行在 http://localhost:3000"
echo "3. 在 FastGPT 中创建工作流，添加 Wind 数据节点"
echo "4. 输入股票代码或问题，即可获取金融数据"