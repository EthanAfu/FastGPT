import { addLog } from '../system/log';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';

// Memory storage fallback
class MemoryRedis {
  private store = new Map<string, any>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  async hmset(key: string, data: Record<string, any>) {
    // Convert all values to strings to match Redis behavior
    const stringData: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      stringData[k] = String(v);
    }
    this.store.set(key, stringData);
    return 'OK';
  }

  async hgetall(key: string) {
    const data = this.store.get(key);
    if (!data || typeof data !== 'object') {
      return {};
    }
    return data;
  }

  async expire(key: string, seconds: number) {
    const timeout = setTimeout(() => {
      this.store.delete(key);
      this.timeouts.delete(key);
    }, seconds * 1000);
    this.timeouts.set(key, timeout);
    return 1;
  }

  async del(...keys: string[]) {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.has(key)) {
        this.store.delete(key);
        const timeout = this.timeouts.get(key);
        if (timeout) {
          clearTimeout(timeout);
          this.timeouts.delete(key);
        }
        deleted++;
      }
    }
    return deleted;
  }

  async keys(pattern: string) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  async ping() {
    return 'PONG';
  }

  on(event: string, callback: (error?: any) => void) {
    if (event === 'connect') {
      callback();
    }
  }
}

// Global memory storage instance
let memoryRedis: MemoryRedis | null = null;

export const newQueueRedisConnection = () => {
  if (!REDIS_URL) {
    console.log('No Redis URL configured, using memory storage for queue');
    if (!memoryRedis) {
      memoryRedis = new MemoryRedis();
    }
    return memoryRedis as any;
  }

  const redis = new Redis(REDIS_URL);
  redis.on('connect', () => {
    console.log('Redis connected');
  });
  redis.on('error', (error) => {
    console.error('Redis connection error', error);
  });
  return redis;
};

export const newWorkerRedisConnection = () => {
  if (!REDIS_URL) {
    console.log('No Redis URL configured, using memory storage for worker');
    if (!memoryRedis) {
      memoryRedis = new MemoryRedis();
    }
    return memoryRedis as any;
  }

  const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null
  });
  redis.on('connect', () => {
    console.log('Redis connected');
  });
  redis.on('error', (error) => {
    console.error('Redis connection error', error);
  });
  return redis;
};

export const FASTGPT_REDIS_PREFIX = 'fastgpt:';
export const getGlobalRedisConnection = () => {
  if (global.redisClient) return global.redisClient;

  // Check if Redis URL is empty or invalid
  if (!REDIS_URL) {
    console.log('No Redis URL configured, using memory storage');
    if (!memoryRedis) {
      memoryRedis = new MemoryRedis();
    }
    return memoryRedis as any;
  }

  try {
    global.redisClient = new Redis(REDIS_URL, { keyPrefix: FASTGPT_REDIS_PREFIX });

    global.redisClient.on('connect', () => {
      addLog.info('Redis connected');
    });
    global.redisClient.on('error', (error) => {
      addLog.error('Redis connection error', error);
    });

    return global.redisClient;
  } catch (error) {
    console.log('Redis connection failed, using memory storage');
    if (!memoryRedis) {
      memoryRedis = new MemoryRedis();
    }
    return memoryRedis as any;
  }
};

export const getAllKeysByPrefix = async (key: string) => {
  const redis = getGlobalRedisConnection();

  if (!REDIS_URL) {
    // For memory storage, search without prefix
    const keys = await redis.keys(`${key}:*`);
    return keys;
  } else {
    // For Redis, use prefix
    const keys = (await redis.keys(`${FASTGPT_REDIS_PREFIX}${key}:*`)).map((key: string) =>
      key.replace(FASTGPT_REDIS_PREFIX, '')
    );
    return keys;
  }
};
