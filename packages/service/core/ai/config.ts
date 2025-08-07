import OpenAI from '@fastgpt/global/core/ai';
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  StreamChatType,
  UnStreamChatType
} from '@fastgpt/global/core/ai/type';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { addLog } from '../../common/system/log';
import { i18nT } from '../../../web/i18n/utils';
import { type OpenaiAccountType } from '@fastgpt/global/support/user/team/type';
import { getLLMModel } from './model';
import { type LLMModelItemType } from '@fastgpt/global/core/ai/model.d';
import http from 'http';
import https from 'https';

const aiProxyBaseUrl = process.env.AIPROXY_API_ENDPOINT
  ? `${process.env.AIPROXY_API_ENDPOINT}/v1`
  : undefined;
const openaiBaseUrl = aiProxyBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const openaiBaseKey = process.env.AIPROXY_API_TOKEN || process.env.CHAT_API_KEY || '';

// 创建本地连接专用的 HTTP(S) Agent，强制使用 IPv4
const createLocalAgent = (isHttps: boolean) => {
  const agentOptions = {
    family: 4, // 强制使用 IPv4
    rejectUnauthorized: false
  };

  if (isHttps) {
    return new https.Agent(agentOptions);
  }
  return new http.Agent({ family: 4 });
};

export const getAIApi = (props?: { userKey?: OpenaiAccountType; timeout?: number }) => {
  const { userKey, timeout } = props || {};

  const baseUrl = userKey?.baseUrl || global?.systemEnv?.oneapiUrl || openaiBaseUrl;
  const apiKey = userKey?.key || global?.systemEnv?.chatApiKey || openaiBaseKey;

  // 检查是否为本地连接
  const isLocal =
    baseUrl?.includes('localhost') ||
    baseUrl?.includes('127.0.0.1') ||
    baseUrl?.includes('0.0.0.0') ||
    baseUrl?.includes('host.docker.internal');

  if (isLocal) {
    // 本地连接：使用完全不带代理的配置
    addLog.debug('Using direct connection for local service', { baseUrl });

    const isHttps = baseUrl.startsWith('https');
    const localAgent = createLocalAgent(isHttps);

    // 为本地连接创建自定义 fetch 函数
    const customFetch = (url: string | URL, init?: RequestInit) => {
      // 将 URL 中的 localhost 替换为 127.0.0.1 强制使用 IPv4
      let fetchUrl = typeof url === 'string' ? url : url.toString();
      fetchUrl = fetchUrl.replace(/localhost/g, '127.0.0.1');

      // 确保移除可能的代理设置
      const cleanInit: RequestInit = {
        ...init,
        // @ts-ignore - Node.js 特定的属性
        agent: localAgent
      };

      // 使用原生 fetch，但在调用前临时清除代理环境变量
      const originalProxies = {
        HTTP_PROXY: process.env.HTTP_PROXY,
        HTTPS_PROXY: process.env.HTTPS_PROXY,
        ALL_PROXY: process.env.ALL_PROXY,
        http_proxy: process.env.http_proxy,
        https_proxy: process.env.https_proxy
      };

      // 临时清除代理环境变量并设置 NO_PROXY
      process.env.HTTP_PROXY = '';
      process.env.HTTPS_PROXY = '';
      process.env.ALL_PROXY = '';
      process.env.http_proxy = '';
      process.env.https_proxy = '';
      process.env.NO_PROXY = 'localhost,127.0.0.1,::1';

      const fetchPromise = fetch(fetchUrl, cleanInit);

      // 在 fetch 完成后恢复环境变量
      fetchPromise.finally(() => {
        if (originalProxies.HTTP_PROXY !== undefined)
          process.env.HTTP_PROXY = originalProxies.HTTP_PROXY;
        if (originalProxies.HTTPS_PROXY !== undefined)
          process.env.HTTPS_PROXY = originalProxies.HTTPS_PROXY;
        if (originalProxies.ALL_PROXY !== undefined)
          process.env.ALL_PROXY = originalProxies.ALL_PROXY;
        if (originalProxies.http_proxy !== undefined)
          process.env.http_proxy = originalProxies.http_proxy;
        if (originalProxies.https_proxy !== undefined)
          process.env.https_proxy = originalProxies.https_proxy;
      });

      return fetchPromise;
    };

    return new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey || 'ollama',
      timeout,
      maxRetries: 2,
      httpAgent: localAgent,
      fetch: customFetch
    });
  } else {
    // 非本地连接使用全局代理设置
    return new OpenAI({
      baseURL: baseUrl,
      apiKey,
      httpAgent: global.httpsAgent,
      timeout,
      maxRetries: 2
    });
  }
};

export const getAxiosConfig = (props?: { userKey?: OpenaiAccountType }) => {
  const { userKey } = props || {};

  const baseUrl = userKey?.baseUrl || global?.systemEnv?.oneapiUrl || openaiBaseUrl;
  const apiKey = userKey?.key || global?.systemEnv?.chatApiKey || openaiBaseKey;

  return {
    baseUrl,
    authorization: `Bearer ${apiKey}`
  };
};

export const createChatCompletion = async ({
  modelData,
  body,
  userKey,
  timeout,
  options
}: {
  modelData?: LLMModelItemType;
  body: ChatCompletionCreateParamsNonStreaming | ChatCompletionCreateParamsStreaming;
  userKey?: OpenaiAccountType;
  timeout?: number;
  options?: OpenAI.RequestOptions;
}): Promise<
  {
    getEmptyResponseTip: () => string;
  } & (
    | {
        response: StreamChatType;
        isStreamResponse: true;
      }
    | {
        response: UnStreamChatType;
        isStreamResponse: false;
      }
  )
> => {
  // Rewrite model
  const modelConstantsData = modelData || getLLMModel(body.model);
  if (!modelConstantsData) {
    return Promise.reject(`${body.model} not found`);
  }
  body.model = modelConstantsData.model;

  // 对于自定义模型，使用模型配置中的 requestUrl 和 requestAuth
  let customUserKey = userKey;
  if (modelConstantsData.requestUrl) {
    let baseUrl = modelConstantsData.requestUrl;
    // 将 localhost 替换为 127.0.0.1 以强制使用 IPv4
    baseUrl = baseUrl.replace(/localhost/g, '127.0.0.1');
    // 确保 Ollama 的 URL 以 /v1 结尾（OpenAI 兼容路径）
    if (baseUrl.includes('127.0.0.1:11434') && !baseUrl.includes('/v1')) {
      baseUrl = baseUrl.replace(/\/$/, '') + '/v1';
    }
    customUserKey = {
      baseUrl,
      key: modelConstantsData.requestAuth || 'ollama'
    };
  }

  const formatTimeout = timeout ? timeout : 600000;
  const ai = getAIApi({
    userKey: customUserKey,
    timeout: formatTimeout
  });

  const actualBaseUrl = customUserKey?.baseUrl || userKey?.baseUrl || openaiBaseUrl;

  try {
    addLog.debug(`Start create chat completion`, {
      model: body.model,
      baseUrl: actualBaseUrl
    });

    const response = await ai.chat.completions.create(body, {
      ...options,
      headers: {
        ...options?.headers
      }
    });

    const isStreamResponse =
      typeof response === 'object' &&
      response !== null &&
      ('iterator' in response || 'controller' in response);

    const getEmptyResponseTip = () => {
      addLog.warn(`LLM response empty`, {
        baseUrl: actualBaseUrl,
        requestBody: body
      });
      if (userKey?.baseUrl) {
        return `您的 OpenAI key 没有响应: ${JSON.stringify(body)}`;
      }
      return i18nT('chat:LLM_model_response_empty');
    };

    if (isStreamResponse) {
      return {
        response,
        isStreamResponse: true,
        getEmptyResponseTip
      };
    }

    return {
      response,
      isStreamResponse: false,
      getEmptyResponseTip
    };
  } catch (error) {
    addLog.error(`LLM response error`, error);
    addLog.warn(`LLM response error`, {
      baseUrl: actualBaseUrl,
      requestBody: body,
      error: getErrText(error)
    });

    // 提供更详细的错误信息
    const errorMsg = getErrText(error);

    if (actualBaseUrl?.includes('localhost') || actualBaseUrl?.includes('127.0.0.1')) {
      return Promise.reject(`本地 Ollama 连接失败，请检查 Ollama 服务是否正在运行: ${errorMsg}`);
    }

    if (userKey?.baseUrl) {
      return Promise.reject(`您的 OpenAI key 出错了: ${errorMsg}`);
    }
    return Promise.reject(error);
  }
};
