/**
 * Wind API 连接测试脚本
 * 测试本地wind-api-service连接是否正常
 */

import axios from 'axios';

const WIND_API_URL = 'http://127.0.0.1:8080';

async function testWindConnection() {
  console.log('=== 测试Wind API连接 ===\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    try {
      const healthResponse = await axios.get(`${WIND_API_URL}/health`, {
        timeout: 10000
      });
      console.log('✅ 健康检查成功:', healthResponse.status);
      console.log('   响应:', healthResponse.data);
    } catch (error) {
      console.log('❌ 健康检查失败，尝试根路径...');

      // 尝试根路径
      const rootResponse = await axios.get(`${WIND_API_URL}/`, {
        timeout: 10000
      });
      console.log('✅ 根路径访问成功:', rootResponse.status);
    }

    // 2. 测试数据接口
    console.log('\n2. 测试数据接口...');

    // 模拟一个简单的数据请求
    const testRequest = {
      codes: '600519.SH',
      fields: 'close,volume,pe_ttm',
      frequency: 'D',
      dataType: 'stock'
    };

    try {
      const dataResponse = await axios.post(`${WIND_API_URL}/api/data`, testRequest, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ 数据接口测试成功');
      console.log('   请求参数:', testRequest);
      console.log('   响应状态:', dataResponse.status);
      console.log(
        '   响应数据样例:',
        JSON.stringify(dataResponse.data, null, 2).slice(0, 200) + '...'
      );
    } catch (apiError: any) {
      console.log('⚠️ 数据接口测试失败');
      console.log('   错误信息:', apiError.message);

      if (apiError.response) {
        console.log('   HTTP状态:', apiError.response.status);
        console.log('   错误响应:', apiError.response.data);
      }

      console.log('\n💡 可能的解决方案:');
      console.log('   1. 检查您的wind-api-service是否正确实现了 /api/data 接口');
      console.log('   2. 确认请求格式是否匹配您的服务期望的格式');
      console.log('   3. 检查是否需要认证或其他headers');
    }
  } catch (error: any) {
    console.log('❌ Wind API服务连接失败');
    console.log('   错误信息:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 连接被拒绝，请检查:');
      console.log('   1. wind-api-service是否正在运行？');
      console.log('   2. 服务是否监听在 127.0.0.1:8080？');
      console.log('   3. 防火墙是否阻止了连接？');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 域名解析失败，请检查URL配置');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 连接超时，服务可能响应较慢');
    }
  }

  console.log('\n=== 测试完成 ===');
}

// 运行测试
testWindConnection();
