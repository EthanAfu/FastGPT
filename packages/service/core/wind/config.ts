import type { WindConfig} from './service';
import { getWindAPIService, initWindAPI } from './service';

// Wind API 配置
const windConfig: WindConfig = {
  apiUrl: process.env.WIND_API_URL || 'http://localhost:8080',
  username: process.env.WIND_USERNAME || '',
  password: process.env.WIND_PASSWORD || '',
  timeout: Number(process.env.WIND_TIMEOUT) || 30000
};

// 初始化 Wind API 服务
export async function initWind() {
  if (!windConfig.apiUrl) {
    console.warn('Wind API 配置不完整，将跳过初始化');
    return null;
  }

  try {
    const success = await initWindAPI();
    if (success) {
      console.log('Wind API 服务初始化成功');
      return getWindAPIService();
    } else {
      console.warn('Wind API 服务连接失败');
      return null;
    }
  } catch (error) {
    console.error('Wind API 服务初始化失败:', error);
    return null;
  }
}

// 检查 Wind API 是否可用
export function isWindEnabled(): boolean {
  return !!(windConfig.username && windConfig.password && windConfig.apiUrl);
}

export { windConfig };