/**
 * Wind API 集成功能测试
 * 运行命令：npm test tests/wind-api-integration.test.js
 */

const { 
  WindAPIService, 
  extractStockCodes, 
  inferIndicators 
} = require('../packages/service/core/wind/service');

describe('Wind API Integration Tests', () => {
  let windService;

  beforeAll(() => {
    // 初始化 Wind API 服务（使用测试配置）
    const testConfig = {
      apiUrl: process.env.WIND_API_URL || 'http://localhost:8080',
      username: process.env.WIND_USERNAME || 'test_user',
      password: process.env.WIND_PASSWORD || 'test_password',
      timeout: 10000
    };

    windService = new WindAPIService(testConfig);
  });

  describe('股票代码提取功能', () => {
    test('应该能够提取标准格式的股票代码', () => {
      const query = '分析贵州茅台600519.SH的投资价值';
      const codes = extractStockCodes(query);
      expect(codes).toContain('600519.SH');
    });

    test('应该能够提取多个股票代码', () => {
      const query = '比较600519.SH和000858.SZ的表现';
      const codes = extractStockCodes(query);
      expect(codes).toContain('600519.SH');
      expect(codes).toContain('000858.SZ');
    });

    test('应该能够自动添加市场后缀', () => {
      const query = '分析600519的基本面';
      const codes = extractStockCodes(query);
      expect(codes).toContain('600519.SH');
    });
  });

  describe('指标推断功能', () => {
    test('应该能够根据价格相关问题推断指标', () => {
      const query = '茅台的股价走势如何？';
      const indicators = inferIndicators(query);
      expect(indicators).toEqual(expect.arrayContaining(['close', 'open', 'high', 'low']));
    });

    test('应该能够根据估值问题推断指标', () => {
      const query = '这只股票的市盈率如何？';
      const indicators = inferIndicators(query);
      expect(indicators).toEqual(expect.arrayContaining(['pe_ttm', 'pe_lyr']));
    });

    test('未匹配时应该返回默认指标', () => {
      const query = '这只股票怎么样？';
      const indicators = inferIndicators(query);
      expect(indicators).toEqual(['close', 'volume', 'pe_ttm', 'pb_lf', 'mkt_cap_ard']);
    });
  });

  describe('数据格式化功能', () => {
    test('应该能够正确格式化 Wind 响应数据', () => {
      const mockResponse = {
        errorCode: 0,
        data: [
          [100.0, 50000, 20.5],
          [101.0, 55000, 21.0]
        ],
        fields: ['close', 'volume', 'pe_ttm'],
        codes: ['600519.SH'],
        times: ['2024-01-01', '2024-01-02']
      };

      const formatted = windService.formatFinancialData(mockResponse);
      
      expect(formatted).toHaveLength(1);
      expect(formatted[0].code).toBe('600519.SH');
      expect(formatted[0].data).toHaveLength(2);
      expect(formatted[0].data[0]).toEqual({
        date: '2024-01-01',
        close: 100.0,
        volume: 50000,
        pe_ttm: 20.5
      });
    });

    test('应该能够计算统计摘要', () => {
      const mockResponse = {
        errorCode: 0,
        data: [
          [100.0, 50000],
          [101.0, 55000],
          [99.0, 45000]
        ],
        fields: ['close', 'volume'],
        codes: ['600519.SH'],
        times: ['2024-01-01', '2024-01-02', '2024-01-03']
      };

      const formatted = windService.formatFinancialData(mockResponse);
      const summary = formatted[0].summary;

      expect(summary.latest.close).toBe(99.0);
      expect(summary.min.close).toBe(99.0);
      expect(summary.max.close).toBe(101.0);
      expect(summary.avg.close).toBeCloseTo(100.0);
    });
  });

  describe('缓存功能', () => {
    test('相同请求应该使用缓存', async () => {
      const request = {
        codes: ['600519.SH'],
        fields: ['close'],
        dataType: 'stock'
      };

      const cacheKey = windService.getCacheKey(request);
      windService.setCache(cacheKey, { test: 'data' });

      const cached = windService.getFromCache(cacheKey);
      expect(cached).toEqual({ test: 'data' });
    });

    test('过期缓存应该被清除', async () => {
      const request = {
        codes: ['600519.SH'],
        fields: ['close'],
        dataType: 'stock'
      };

      const cacheKey = windService.getCacheKey(request);
      windService.setCache(cacheKey, { test: 'data' });

      // 模拟缓存过期
      windService.cacheExpiry = -1;

      const cached = windService.getFromCache(cacheKey);
      expect(cached).toBeNull();
    });
  });

  describe('数据描述生成', () => {
    test('应该能够生成可读的数据描述', () => {
      const formattedData = [{
        code: '600519.SH',
        name: '贵州茅台',
        data: [
          { date: '2024-01-01', close: 1800.0, volume: 1000000 },
          { date: '2024-01-02', close: 1820.0, volume: 1200000 }
        ],
        summary: {
          latest: { close: 1820.0, volume: 1200000 },
          min: { close: 1800.0, volume: 1000000 },
          max: { close: 1820.0, volume: 1200000 },
          avg: { close: 1810.0, volume: 1100000 }
        }
      }];

      const description = windService.generateDataDescription(formattedData);
      
      expect(description).toContain('贵州茅台');
      expect(description).toContain('600519.SH');
      expect(description).toContain('1820.0');
      expect(description).toContain('Wind 金融终端');
    });

    test('空数据应该返回提示信息', () => {
      const description = windService.generateDataDescription([]);
      expect(description).toBe('未获取到有效数据');
    });
  });

  describe('错误处理', () => {
    test('应该正确处理 API 错误响应', async () => {
      const mockErrorResponse = {
        errorCode: -1,
        message: 'API Error'
      };

      // 模拟 API 错误
      jest.spyOn(windService, 'fetchData').mockRejectedValueOnce(new Error('API Error'));

      await expect(windService.fetchData({
        codes: ['INVALID'],
        fields: ['close'],
        dataType: 'stock'
      })).rejects.toThrow('API Error');
    });

    test('应该处理无效的响应数据格式', () => {
      const invalidResponse = {
        errorCode: 0,
        data: null,
        fields: null,
        codes: null
      };

      expect(() => {
        windService.formatFinancialData(invalidResponse);
      }).toThrow('Wind API 返回数据格式错误');
    });
  });

  // 集成测试（需要真实的 Wind API 环境）
  describe('集成测试', () => {
    test('应该能够获取真实股票数据', async () => {
      // 跳过测试如果没有配置真实的 Wind API
      if (!process.env.WIND_API_URL || !process.env.WIND_USERNAME) {
        console.log('跳过集成测试：未配置 Wind API');
        return;
      }

      const request = {
        codes: ['000001.SZ'],
        fields: ['close', 'volume'],
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        frequency: 'D',
        dataType: 'stock'
      };

      const response = await windService.fetchData(request);
      
      expect(response.errorCode).toBe(0);
      expect(response.codes).toContain('000001.SZ');
      expect(response.fields).toEqual(['close', 'volume']);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    }, 15000); // 15秒超时

    test('应该能够处理大量数据请求', async () => {
      if (!process.env.WIND_API_URL || !process.env.WIND_USERNAME) {
        console.log('跳过集成测试：未配置 Wind API');
        return;
      }

      const request = {
        codes: ['000001.SZ', '600000.SH', '600036.SH'],
        fields: ['close', 'volume', 'pe_ttm', 'pb_lf'],
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        frequency: 'D',
        dataType: 'stock'
      };

      const response = await windService.fetchData(request);
      
      expect(response.errorCode).toBe(0);
      expect(response.codes).toHaveLength(3);
      expect(response.fields).toHaveLength(4);
    }, 30000); // 30秒超时
  });
});

// 性能测试
describe('性能测试', () => {
  test('缓存查询应该快速响应', () => {
    const windService = new WindAPIService({
      apiUrl: 'test',
      username: 'test', 
      password: 'test'
    });

    const request = {
      codes: ['600519.SH'],
      fields: ['close'],
      dataType: 'stock'
    };

    const startTime = Date.now();
    
    // 设置缓存
    const cacheKey = windService.getCacheKey(request);
    windService.setCache(cacheKey, { test: 'data' });
    
    // 获取缓存
    const cached = windService.getFromCache(cacheKey);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(cached).toBeDefined();
    expect(duration).toBeLessThan(10); // 应该在10ms内完成
  });

  test('数据格式化应该高效处理大量数据', () => {
    const windService = new WindAPIService({
      apiUrl: 'test',
      username: 'test',
      password: 'test'
    });

    // 生成大量测试数据
    const mockData = [];
    const times = [];
    for (let i = 0; i < 1000; i++) {
      mockData.push([100 + Math.random() * 10, 50000 + Math.random() * 10000]);
      times.push(`2024-${String(Math.floor(i/30) + 1).padStart(2, '0')}-${String((i%30) + 1).padStart(2, '0')}`);
    }

    const mockResponse = {
      errorCode: 0,
      data: mockData,
      fields: ['close', 'volume'],
      codes: ['600519.SH'],
      times
    };

    const startTime = Date.now();
    const formatted = windService.formatFinancialData(mockResponse);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(formatted).toHaveLength(1);
    expect(formatted[0].data).toHaveLength(1000);
    expect(duration).toBeLessThan(1000); // 应该在1秒内完成
  });
});

console.log('Wind API 集成测试完成');
console.log('使用 WIND_API_URL, WIND_USERNAME, WIND_PASSWORD 环境变量进行集成测试');
console.log('示例：WIND_API_URL=http://localhost:8080 WIND_USERNAME=test WIND_PASSWORD=test npm test');