import { getErrText } from '@fastgpt/global/common/error/utils';
import {
  NodeInputKeyEnum,
  NodeOutputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@fastgpt/global/core/workflow/constants';
import {
  DispatchNodeResponseKeyEnum,
  SseResponseEventEnum
} from '@fastgpt/global/core/workflow/runtime/constants';
import { valueTypeFormat } from '@fastgpt/global/core/workflow/runtime/utils';
import { type DispatchNodeResultType } from '@fastgpt/global/core/workflow/runtime/type';
import type { ModuleDispatchProps } from '@fastgpt/global/core/workflow/runtime/type';
import {
  formatVariableValByType,
  getReferenceVariableValue,
  replaceEditorVariable,
  textAdaptGptResponse
} from '@fastgpt/global/core/workflow/runtime/utils';
import { addLog } from '../../../../common/system/log';
import { formatHttpError } from '../utils';

// Wind API 相关导入
import type {
  WindAPIService,
  WindDataRequest,
  FormattedFinancialData
} from '../../../wind/service';
import { getWindAPIService, extractStockCodes, inferIndicators } from '../../../wind/service';

// 临时类型定义
type WindDataTypeEnum = 'stock' | 'bond' | 'fund' | 'commodity' | 'forex' | 'macro';

type WindDataProps = ModuleDispatchProps<{
  [NodeInputKeyEnum.windDataType]: WindDataTypeEnum;
  [NodeInputKeyEnum.windStockCode]?: string;
  [NodeInputKeyEnum.windIndicator]: string;
  [NodeInputKeyEnum.windStartDate]?: string;
  [NodeInputKeyEnum.windEndDate]?: string;
  [NodeInputKeyEnum.windFrequency]?: string;
  [NodeInputKeyEnum.addInputParam]: Record<string, any>;
  [key: string]: any;
}>;

type WindDataResponse = DispatchNodeResultType<
  {
    [NodeOutputKeyEnum.windRawData]: any;
    [NodeOutputKeyEnum.windFormattedData]: string;
    [NodeOutputKeyEnum.windDataSummary]: FormattedFinancialData[];
    [key: string]: any;
  },
  {
    [NodeOutputKeyEnum.error]?: string;
  }
>;

export const dispatchWindData = async (props: WindDataProps): Promise<WindDataResponse> => {
  const {
    runningAppInfo: { id: appId, teamId, tmbId },
    chatId,
    responseChatItemId,
    variables,
    node,
    runtimeNodes,
    histories,
    workflowStreamResponse,
    params: {
      windDataType,
      windStockCode,
      windIndicator,
      windStartDate,
      windEndDate,
      windFrequency = 'D',
      [NodeInputKeyEnum.addInputParam]: dynamicInput,
      ...body
    }
  } = props;

  try {
    // 获取 Wind API 服务实例
    let windService: WindAPIService;
    try {
      windService = getWindAPIService();
    } catch (error) {
      console.error('Wind API 服务获取失败:', error);
      return {
        [DispatchNodeResponseKeyEnum.toolResponses]: {
          [NodeOutputKeyEnum.error]: 'Wind API 服务未配置或初始化失败'
        }
      };
    }

    // 合并所有变量用于变量替换
    const systemVariables = {
      appId,
      chatId,
      responseChatItemId,
      histories: histories?.slice(-10) || []
    };
    const concatVariables = {
      ...variables,
      ...body,
      ...systemVariables
    };
    const allVariables: Record<string, any> = {
      [NodeInputKeyEnum.addInputParam]: concatVariables,
      ...concatVariables
    };

    // 变量替换函数
    const replaceStringVariables = (text: string) => {
      return replaceEditorVariable({
        text,
        nodes: runtimeNodes,
        variables: allVariables
      });
    };

    // 处理股票代码
    let codes: string[] = [];
    if (windStockCode) {
      const processedStockCode = replaceStringVariables(windStockCode);
      codes = processedStockCode
        .split(',')
        .map((code) => code.trim())
        .filter(Boolean);
    }

    // 如果没有明确指定股票代码，尝试从用户输入中提取
    if (codes.length === 0) {
      const userInput = allVariables.userChatInput || '';
      codes = extractStockCodes(userInput);
    }

    // 验证是否有有效的证券代码
    if (codes.length === 0) {
      const errorMsg =
        '未能识别有效的证券代码。请输入正确的股票代码，如 600519.SH（贵州茅台）或 000001.SZ（平安银行）';

      if (workflowStreamResponse) {
        workflowStreamResponse?.({
          event: SseResponseEventEnum.answer,
          data: textAdaptGptResponse({
            text: `❌ ${errorMsg}`
          })
        });
      }

      return {
        [DispatchNodeResponseKeyEnum.toolResponses]: {
          [NodeOutputKeyEnum.error]: errorMsg
        }
      };
    }

    // 处理指标字段
    let indicators: string[] = [];
    if (windIndicator) {
      const processedIndicator = replaceStringVariables(windIndicator);
      indicators = processedIndicator
        .split(',')
        .map((indicator) => indicator.trim())
        .filter(Boolean);
    } else {
      // 如果没有明确指定指标，根据用户问题推断
      const userInput = allVariables.userChatInput || '';
      indicators = inferIndicators(userInput);
    }

    // 处理日期
    const processedStartDate = windStartDate ? replaceStringVariables(windStartDate) : undefined;
    const processedEndDate = windEndDate ? replaceStringVariables(windEndDate) : undefined;

    // 构建 Wind API 请求
    const windRequest: WindDataRequest = {
      codes,
      fields: indicators,
      startDate: processedStartDate,
      endDate: processedEndDate,
      frequency: windFrequency,
      dataType: windDataType
    };

    // 发送状态更新
    if (workflowStreamResponse) {
      workflowStreamResponse?.({
        event: SseResponseEventEnum.answer,
        data: textAdaptGptResponse({
          text: `正在从Wind获取数据: ${codes.join(', ')}\n指标: ${indicators.join(', ')}`
        })
      });
    }

    // 调用 Wind API
    console.log('Wind API 请求参数:', windRequest);
    const windResponse = await windService.fetchData(windRequest);

    // 格式化数据
    const formattedData = windService.formatFinancialData(windResponse);

    // 生成文本描述
    const dataDescription = windService.generateDataDescription(formattedData);

    // 如果请求中包含分析需求，执行智能分析
    let analysisResult = null;
    if (allVariables.userChatInput && allVariables.userChatInput.includes('分析')) {
      analysisResult = await windService.analyzeAndRecommend(
        allVariables.userChatInput,
        formattedData
      );

      // 发送分析结果
      if (workflowStreamResponse) {
        workflowStreamResponse?.({
          event: SseResponseEventEnum.answer,
          data: textAdaptGptResponse({
            text: analysisResult.analysis
          })
        });
      }
    }

    // 发送数据获取成功状态
    if (workflowStreamResponse) {
      workflowStreamResponse?.({
        event: SseResponseEventEnum.answer,
        data: textAdaptGptResponse({
          text: `✅ Wind 数据获取成功，共获取 ${formattedData.length} 只证券的数据`
        })
      });
    }

    // 记录日志
    addLog.info(`Wind API 调用成功`, {
      teamId,
      tmbId,
      appId,
      chatId,
      codes,
      indicators,
      dataCount: formattedData.length
    });

    // 处理动态输出
    const outputs: Record<string, any> = {
      [NodeOutputKeyEnum.windRawData]: windResponse,
      [NodeOutputKeyEnum.windFormattedData]: dataDescription,
      [NodeOutputKeyEnum.windDataSummary]: formattedData
    };

    // 处理额外的输出字段提取
    if (node.outputs) {
      for (const output of node.outputs) {
        if (
          output.key &&
          output.key !== NodeOutputKeyEnum.windRawData &&
          output.key !== NodeOutputKeyEnum.windFormattedData &&
          output.key !== NodeOutputKeyEnum.windDataSummary
        ) {
          // 这里可以实现从原始数据中提取特定字段的逻辑
          try {
            // 简单的字段提取逻辑
            if (windResponse.data && windResponse.fields) {
              const fieldIndex = windResponse.fields.indexOf(output.key);
              if (fieldIndex >= 0 && windResponse.data.length > 0) {
                outputs[output.key] = windResponse.data.map((row: any[]) => row[fieldIndex]);
              }
            }
          } catch (error) {
            console.warn(`提取字段 ${output.key} 失败:`, error);
          }
        }
      }
    }

    return {
      [DispatchNodeResponseKeyEnum.nodeResponse]: {
        totalPoints: 1,
        windDataUsage: 1
      },
      [DispatchNodeResponseKeyEnum.toolResponses]: outputs
    };
  } catch (error) {
    console.error('Wind API 调用失败:', error);

    // 记录错误日志
    addLog.error('Wind API 调用失败', {
      teamId,
      tmbId,
      appId,
      chatId,
      error: getErrText(error)
    });

    // 发送错误状态
    if (workflowStreamResponse) {
      workflowStreamResponse?.({
        event: SseResponseEventEnum.answer,
        data: textAdaptGptResponse({
          text: `❌ Wind 数据获取失败: ${getErrText(error)}`
        })
      });
    }

    return {
      [DispatchNodeResponseKeyEnum.toolResponses]: {
        [NodeOutputKeyEnum.error]: getErrText(error)
      }
    };
  }
};

// 智能分析节点执行器
export const dispatchWindAnalysis = async (props: WindDataProps): Promise<WindDataResponse> => {
  // TODO: 实现智能分析逻辑，结合 LLM 对 Wind 数据进行分析
  // 这个节点可以接收 Wind 数据，然后使用 LLM 进行智能分析和解读
  return dispatchWindData(props);
};
