#!/bin/bash
# Wind API 服务启动脚本

# 设置环境变量
export WIND_API_PORT=8080
export WIND_API_HOST=0.0.0.0

# 检查 Python 环境
echo "检查 Python 环境..."
python3 --version

# 检查 WindPy 是否安装
echo "检查 WindPy 安装..."
python3 -c "from WindPy import w; print('WindPy 已安装')" 2>/dev/null || echo "WindPy 未安装，将使用模拟数据"

# 安装依赖
echo "安装依赖..."
pip3 install -r requirements.txt

# 启动服务
echo "启动 Wind API 服务..."
python3 wind_api_server.py