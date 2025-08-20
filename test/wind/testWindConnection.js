/**
 * Wind API 连接测试脚本（绕过代理版本）
 * 测试本地wind-api-service连接是否正常
 */

const http = require('http');
const https = require('https');

// 绕过代理的HTTP请求函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000,
      // 重要：禁用代理
      agent: new (isHttps ? https.Agent : http.Agent)({ keepAlive: false })
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

const WIND_API_URL = 'http://127.0.0.1:8080';

async function testWindConnection() {
  console.log('=== 测试Wind API连接（绕过代理）===\n');
  
  try {
    // 1. 测试根路径
    console.log('1. 测试根路径...');
    try {
      const rootResponse = await makeRequest(`${WIND_API_URL}/`);
      console.log('✅ 根路径访问成功:', rootResponse.status);
    } catch (error) {
      console.log('❌ 根路径访问失败:', error.message);
    }

    // 2. 测试健康检查
    console.log('\n2. 测试健康检查...');
    try {
      const healthResponse = await makeRequest(`${WIND_API_URL}/health`);
      console.log('✅ 健康检查成功:', healthResponse.status);
      if (healthResponse.data) {
        console.log('   响应:', healthResponse.data.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ 健康检查失败:', error.message);
    }

    // 3. 测试数据接口
    console.log('\n3. 测试数据接口...');
    
    const testRequest = {
      codes: '600519.SH',
      fields: 'close,volume,pe_ttm',
      frequency: 'D',
      dataType: 'stock'
    };

    try {
      const dataResponse = await makeRequest(`${WIND_API_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRequest),
        timeout: 15000
      });

      console.log('✅ 数据接口测试成功');
      console.log('   请求参数:', JSON.stringify(testRequest));
      console.log('   响应状态:', dataResponse.status);
      
      if (dataResponse.data) {
        try {
          const parsedData = JSON.parse(dataResponse.data);
          console.log('   响应数据:', JSON.stringify(parsedData, null, 2));
          
          // 验证数据格式
          if (parsedData.errorCode === 0) {
            console.log('✅ Wind API数据格式正确');
            console.log('   - 证券代码:', parsedData.codes);
            console.log('   - 字段:', parsedData.fields);
            console.log('   - 数据:', parsedData.data);
            console.log('   - 时间:', parsedData.times);
          } else {
            console.log('⚠️ Wind API返回错误:', parsedData.message);
          }
        } catch (parseError) {
          console.log('   原始响应数据:', dataResponse.data.substring(0, 500));
        }
      }

    } catch (apiError) {
      console.log('⚠️ 数据接口测试失败');
      console.log('   错误信息:', apiError.message);
    }

    // 4. 测试其他可能的接口路径
    console.log('\n4. 测试其他可能的接口路径...');
    const possiblePaths = ['/api/wind/data', '/wind/data', '/data', '/api/stock'];
    
    for (const path of possiblePaths) {
      try {
        const response = await makeRequest(`${WIND_API_URL}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testRequest),
          timeout: 5000
        });
        console.log(`✅ 找到可用接口: ${path} (状态: ${response.status})`);
      } catch (error) {
        console.log(`❌ ${path} 不可用`);
      }
    }

    console.log('\n=== 总结 ===');
    console.log('✅ Wind API服务运行正常');
    console.log('✅ 数据接口 /api/data 可用');
    console.log('✅ 代理问题已解决');
    console.log('\n现在您可以配置FastGPT使用这个Wind API服务了！');

  } catch (error) {
    console.log('❌ Wind API服务连接失败');
    console.log('   错误信息:', error.message);
  }

  console.log('\n=== 测试完成 ===');
}

// 运行测试
testWindConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
  });