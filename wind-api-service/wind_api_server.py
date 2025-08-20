#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wind API HTTP 服务器
提供 RESTful API 接口供 FastGPT 调用 Wind 金融数据
"""

import json
import logging
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
# 移除 pandas 依赖，直接使用日期处理
from datetime import datetime, timedelta

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 尝试导入 WindPy
try:
    from WindPy import w
    WIND_AVAILABLE = True
    logger.info("WindPy 导入成功")
except ImportError:
    WIND_AVAILABLE = False
    logger.warning("WindPy 未安装或配置不正确，将使用模拟数据")
    
    # 模拟 WindPy 接口
    class MockWind:
        def start(self):
            return {"ErrorCode": 0, "Data": "Mock Wind API started"}
        
        def isconnected(self):
            return True
        
        def wss(self, codes, fields, options=""):
            """模拟获取股票快照数据"""
            mock_data = {
                "000001.SZ": {"sec_name": "平安银行", "close": 10.5, "pe_ttm": 5.2},
                "600519.SH": {"sec_name": "贵州茅台", "close": 1800.0, "pe_ttm": 35.5},
            }
            return {
                "ErrorCode": 0,
                "Data": [[mock_data.get(codes, {}).get(f, 0) for f in fields.split(",")]],
                "Fields": fields.split(","),
                "Codes": [codes]
            }
        
        def wsd(self, codes, fields, start_date, end_date, options=""):
            """模拟获取历史数据"""
            import random
            from datetime import datetime, timedelta
            
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            
            dates = []
            current = start
            while current <= end:
                dates.append(current)
                current += timedelta(days=1)
                
            data = []
            for _ in dates:
                row = [random.uniform(95, 105) for _ in fields.split(",")]
                data.append(row)
            return {
                "ErrorCode": 0,
                "Data": data,
                "Fields": fields.split(","),
                "Codes": codes.split(","),
                "Times": [d.strftime("%Y-%m-%d") for d in dates]
            }
    
    w = MockWind()

# 创建 Flask 应用
app = Flask(__name__)
CORS(app)  # 允许跨域访问

# Wind API 初始化
wind_connected = False

def init_wind():
    """初始化 Wind API 连接"""
    global wind_connected
    try:
        if WIND_AVAILABLE:
            ret = w.start()
            if ret.ErrorCode == 0:
                wind_connected = w.isconnected()
                logger.info(f"Wind API 连接状态: {wind_connected}")
                return wind_connected
            else:
                logger.error(f"Wind API 启动失败: {ret}")
                return False
        else:
            wind_connected = True  # 使用模拟数据
            logger.info("使用模拟 Wind API")
            return True
    except Exception as e:
        logger.error(f"Wind API 初始化异常: {e}")
        return False

def parse_wind_response(response) -> Dict:
    """解析 Wind API 响应"""
    try:
        if hasattr(response, 'ErrorCode'):
            result = {
                "errorCode": response.ErrorCode,
                "message": "success" if response.ErrorCode == 0 else str(response.Data)
            }
            
            if response.ErrorCode == 0:
                # 处理数据
                if hasattr(response, 'Data'):
                    result["data"] = response.Data
                if hasattr(response, 'Fields'):
                    result["fields"] = response.Fields
                if hasattr(response, 'Codes'):
                    result["codes"] = response.Codes
                if hasattr(response, 'Times'):
                    result["times"] = response.Times
                    
            return result
        else:
            return response
    except Exception as e:
        logger.error(f"解析 Wind 响应失败: {e}")
        return {"errorCode": -1, "message": str(e)}

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        "status": "healthy",
        "wind_available": WIND_AVAILABLE,
        "wind_connected": wind_connected
    })

@app.route('/api/connect', methods=['POST'])
def connect_wind():
    """连接 Wind API"""
    success = init_wind()
    return jsonify({
        "success": success,
        "connected": wind_connected
    })

@app.route('/api/data', methods=['POST'])
def get_wind_data():
    """获取 Wind 数据
    
    请求参数:
    {
        "codes": "600519.SH,000001.SZ",  // 证券代码
        "fields": "close,pe_ttm,pb_lf",  // 指标字段
        "startDate": "2024-01-01",       // 开始日期（可选）
        "endDate": "2024-12-31",         // 结束日期（可选）
        "frequency": "D",                // 频率：D(日)、W(周)、M(月)
        "dataType": "stock"              // 数据类型
    }
    """
    try:
        if not wind_connected:
            init_wind()
            
        data = request.json
        codes = data.get('codes', '')
        fields = data.get('fields', 'close')
        start_date = data.get('startDate', '')
        end_date = data.get('endDate', '')
        frequency = data.get('frequency', 'D')
        data_type = data.get('dataType', 'stock')
        
        logger.info(f"获取数据请求: codes={codes}, fields={fields}, start={start_date}, end={end_date}")
        
        # 如果没有指定日期，获取最新数据
        if not start_date and not end_date:
            # 获取快照数据
            response = w.wss(codes, fields, "")
        else:
            # 获取历史数据
            if not start_date:
                start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
            if not end_date:
                end_date = datetime.now().strftime("%Y-%m-%d")
                
            # 添加频率参数
            options = f"Period={frequency}"
            response = w.wsd(codes, fields, start_date, end_date, options)
        
        result = parse_wind_response(response)
        logger.info(f"Wind API 响应: errorCode={result.get('errorCode')}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"获取 Wind 数据失败: {e}")
        return jsonify({
            "errorCode": -1,
            "message": str(e)
        }), 500

@app.route('/api/search', methods=['POST'])
def search_securities():
    """搜索证券代码
    
    请求参数:
    {
        "keyword": "茅台",
        "type": "stock"  // stock, bond, fund
    }
    """
    try:
        data = request.json
        keyword = data.get('keyword', '')
        sec_type = data.get('type', 'stock')
        
        # 这里可以实现证券搜索逻辑
        # 由于 Wind API 搜索功能需要特定函数，这里提供模拟数据
        mock_results = {
            "茅台": [
                {"code": "600519.SH", "name": "贵州茅台", "type": "stock"},
                {"code": "000858.SZ", "name": "五粮液", "type": "stock"}
            ],
            "银行": [
                {"code": "000001.SZ", "name": "平安银行", "type": "stock"},
                {"code": "600036.SH", "name": "招商银行", "type": "stock"},
                {"code": "601398.SH", "name": "工商银行", "type": "stock"}
            ]
        }
        
        results = []
        for key, values in mock_results.items():
            if key in keyword:
                results.extend(values)
                
        return jsonify({
            "errorCode": 0,
            "data": results
        })
        
    except Exception as e:
        logger.error(f"搜索证券失败: {e}")
        return jsonify({
            "errorCode": -1,
            "message": str(e)
        }), 500

@app.route('/api/indicators', methods=['GET'])
def get_indicators():
    """获取可用指标列表"""
    indicators = {
        "stock": {
            "price": ["open", "high", "low", "close", "volume", "amt"],
            "valuation": ["pe_ttm", "pb_lf", "ps_ttm", "pcf_ttm"],
            "financial": ["or_ttm", "np_ttm", "roe_ttm", "roa_ttm"],
            "technical": ["ma5", "ma10", "ma20", "rsi", "macd"]
        },
        "bond": {
            "yield": ["yield_to_maturity", "duration", "convexity"],
            "rating": ["credit_rating", "rating_outlook"]
        },
        "fund": {
            "nav": ["unit_nav", "accum_nav", "nav_date"],
            "performance": ["return_1m", "return_3m", "return_1y", "max_drawdown"]
        }
    }
    
    return jsonify({
        "errorCode": 0,
        "data": indicators
    })

@app.route('/api/realtime', methods=['POST'])
def get_realtime_data():
    """获取实时行情数据"""
    try:
        data = request.json
        codes = data.get('codes', '')
        fields = data.get('fields', 'last,volume,amt,bid1,ask1')
        
        # 使用 wsq 获取实时数据（如果 Wind 支持）
        if WIND_AVAILABLE and hasattr(w, 'wsq'):
            response = w.wsq(codes, fields)
        else:
            # 模拟实时数据
            response = w.wss(codes, fields, "")
            
        result = parse_wind_response(response)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"获取实时数据失败: {e}")
        return jsonify({
            "errorCode": -1,
            "message": str(e)
        }), 500

@app.route('/api/sector', methods=['POST'])
def get_sector_data():
    """获取板块数据"""
    try:
        data = request.json
        sector = data.get('sector', '801010.SI')  # 申万一级行业指数
        fields = data.get('fields', 'close,pct_chg')
        
        response = w.wss(sector, fields, "")
        result = parse_wind_response(response)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"获取板块数据失败: {e}")
        return jsonify({
            "errorCode": -1,
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # 启动时初始化 Wind
    init_wind()
    
    # 获取端口配置
    port = int(os.environ.get('WIND_API_PORT', 8080))
    host = os.environ.get('WIND_API_HOST', '0.0.0.0')
    
    logger.info(f"Wind API 服务启动在 {host}:{port}")
    
    # 启动 Flask 服务
    app.run(host=host, port=port, debug=False)