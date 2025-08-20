import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  FlowNodeTypeEnum
} from '../../node/constant';
import { type FlowNodeTemplateType } from '../../type/node.d';
import {
  WorkflowIOValueTypeEnum,
  NodeInputKeyEnum,
  NodeOutputKeyEnum,
  FlowNodeTemplateTypeEnum
} from '../../constants';
import { Input_Template_DynamicInput } from '../input';
import { Output_Template_AddOutput } from '../output';
import { i18nT } from '../../../../../web/i18n/utils';

// Wind 数据节点类型枚举
export enum WindNodeTypeEnum {
  windData = 'windData',
  windAnalysis = 'windAnalysis'
}

// Wind 数据类型枚举
export enum WindDataTypeEnum {
  stock = 'stock', // 股票
  bond = 'bond', // 债券
  fund = 'fund', // 基金
  commodity = 'commodity', // 商品期货
  forex = 'forex', // 外汇
  macro = 'macro' // 宏观数据
}

// Wind API 节点输入输出键
export const WindInputKeyEnum = NodeInputKeyEnum;
export const WindOutputKeyEnum = NodeOutputKeyEnum;

export const WindDataNode: FlowNodeTemplateType = {
  id: WindNodeTypeEnum.windData,
  templateType: FlowNodeTemplateTypeEnum.finance,
  flowNodeType: WindNodeTypeEnum.windData as any,
  showSourceHandle: true,
  showTargetHandle: true,
  avatar: 'core/workflow/template/windData',
  name: 'Wind数据获取',
  intro: '通过Wind API获取股票、债券、基金等金融数据',
  showStatus: true,
  isTool: true,
  catchError: true,
  courseUrl: '/docs/workflow/wind-data/',
  inputs: [
    {
      ...Input_Template_DynamicInput,
      description: '动态输入参数，可以接收上游节点的输出',
      customInputConfig: {
        selectValueTypeList: Object.values(WorkflowIOValueTypeEnum),
        showDescription: false,
        showDefaultValue: true
      }
    },
    {
      key: NodeInputKeyEnum.windDataType,
      renderTypeList: [FlowNodeInputTypeEnum.select],
      valueType: WorkflowIOValueTypeEnum.string,
      label: '数据类型',
      value: WindDataTypeEnum.stock,
      required: true,
      list: [
        { label: '股票数据', value: WindDataTypeEnum.stock },
        { label: '债券数据', value: WindDataTypeEnum.bond },
        { label: '基金数据', value: WindDataTypeEnum.fund },
        { label: '商品期货', value: WindDataTypeEnum.commodity },
        { label: '外汇数据', value: WindDataTypeEnum.forex },
        { label: '宏观数据', value: WindDataTypeEnum.macro }
      ]
    },
    {
      key: NodeInputKeyEnum.windStockCode,
      renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
      valueType: WorkflowIOValueTypeEnum.string,
      label: '证券代码',
      description: '输入股票/债券/基金代码，多个代码用逗号分隔',
      placeholder: '600519.SH,000858.SZ',
      required: false
    },
    {
      key: NodeInputKeyEnum.windIndicator,
      renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.textarea],
      valueType: WorkflowIOValueTypeEnum.string,
      label: '指标字段',
      description: 'Wind指标字段，如：close,volume,pe_ttm等',
      placeholder: 'close,volume,pe_ttm,pb_lf',
      required: true
    },
    {
      key: NodeInputKeyEnum.windStartDate,
      renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
      valueType: WorkflowIOValueTypeEnum.string,
      label: '开始日期',
      description: '数据开始日期，格式：YYYY-MM-DD',
      placeholder: '2024-01-01',
      required: false
    },
    {
      key: NodeInputKeyEnum.windEndDate,
      renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
      valueType: WorkflowIOValueTypeEnum.string,
      label: '结束日期',
      description: '数据结束日期，格式：YYYY-MM-DD',
      placeholder: '2024-12-31',
      required: false
    },
    {
      key: NodeInputKeyEnum.windFrequency,
      renderTypeList: [FlowNodeInputTypeEnum.select],
      valueType: WorkflowIOValueTypeEnum.string,
      label: '数据频率',
      value: 'D',
      required: false,
      list: [
        { label: '日频', value: 'D' },
        { label: '周频', value: 'W' },
        { label: '月频', value: 'M' },
        { label: '季频', value: 'Q' },
        { label: '年频', value: 'Y' }
      ]
    }
  ],
  outputs: [
    {
      ...Output_Template_AddOutput,
      label: '提取数据字段',
      description: '从Wind返回的数据中提取特定字段'
    },
    {
      id: NodeOutputKeyEnum.windRawData,
      key: NodeOutputKeyEnum.windRawData,
      required: true,
      label: '原始数据',
      description: 'Wind API返回的完整数据',
      valueType: WorkflowIOValueTypeEnum.object,
      type: FlowNodeOutputTypeEnum.static
    },
    {
      id: NodeOutputKeyEnum.windFormattedData,
      key: NodeOutputKeyEnum.windFormattedData,
      required: false,
      label: '格式化数据',
      description: '格式化后的数据，便于展示和分析',
      valueType: WorkflowIOValueTypeEnum.string,
      type: FlowNodeOutputTypeEnum.static
    },
    {
      id: NodeOutputKeyEnum.windDataSummary,
      key: NodeOutputKeyEnum.windDataSummary,
      required: false,
      label: '数据摘要',
      description: '数据的统计摘要信息',
      valueType: WorkflowIOValueTypeEnum.object,
      type: FlowNodeOutputTypeEnum.static
    },
    {
      id: NodeOutputKeyEnum.error,
      key: NodeOutputKeyEnum.error,
      label: '错误信息',
      description: 'Wind API调用错误信息',
      valueType: WorkflowIOValueTypeEnum.string,
      type: FlowNodeOutputTypeEnum.error
    }
  ]
};

// Wind 智能分析节点
export const WindAnalysisNode: FlowNodeTemplateType = {
  id: WindNodeTypeEnum.windAnalysis,
  templateType: FlowNodeTemplateTypeEnum.finance,
  flowNodeType: WindNodeTypeEnum.windAnalysis as any,
  showSourceHandle: true,
  showTargetHandle: true,
  avatar: 'core/workflow/template/windAnalysis',
  name: 'Wind智能分析',
  intro: '结合大模型对Wind金融数据进行智能分析和解读',
  showStatus: true,
  isTool: true,
  catchError: true,
  courseUrl: '/docs/workflow/wind-analysis/',
  inputs: [
    {
      key: 'windData',
      renderTypeList: [FlowNodeInputTypeEnum.reference],
      valueType: WorkflowIOValueTypeEnum.object,
      label: 'Wind数据',
      description: '输入Wind数据节点的输出',
      required: true
    },
    {
      key: 'analysisType',
      renderTypeList: [FlowNodeInputTypeEnum.select],
      valueType: WorkflowIOValueTypeEnum.string,
      label: '分析类型',
      value: 'comprehensive',
      required: true,
      list: [
        { label: '综合分析', value: 'comprehensive' },
        { label: '技术分析', value: 'technical' },
        { label: '基本面分析', value: 'fundamental' },
        { label: '风险分析', value: 'risk' },
        { label: '投资建议', value: 'recommendation' }
      ]
    },
    {
      key: NodeInputKeyEnum.aiModel,
      renderTypeList: [FlowNodeInputTypeEnum.selectLLMModel, FlowNodeInputTypeEnum.hidden],
      label: i18nT('common:core.workflow.AI model'),
      required: true,
      valueType: WorkflowIOValueTypeEnum.string,
      description: '用于分析的AI模型'
    },
    {
      key: NodeInputKeyEnum.aiSystemPrompt,
      renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
      valueType: WorkflowIOValueTypeEnum.string,
      label: i18nT('common:core.workflow.System prompt'),
      description: '分析任务的系统提示词',
      placeholder: '你是一名专业的金融分析师，请基于提供的Wind数据进行专业分析...',
      value: `你是一名专业的金融分析师，拥有丰富的股票、债券、基金分析经验。

请基于用户提供的Wind金融数据，进行专业的分析和解读：

1. **数据解读**: 分析关键指标的含义和数值表现
2. **趋势分析**: 识别数据中的趋势和变化模式  
3. **对比分析**: 与同行业或历史数据进行对比
4. **风险评估**: 识别潜在的投资风险因素
5. **投资建议**: 基于分析给出合理的投资建议

请用专业但易懂的语言进行分析，并给出具体的数据支撑。`,
      required: false
    },
    {
      key: 'customPrompt',
      renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.textarea],
      valueType: WorkflowIOValueTypeEnum.string,
      label: '自定义分析要求',
      description: '用户的具体分析需求',
      placeholder: '请分析该股票的投资价值...',
      required: false
    }
  ],
  outputs: [
    {
      id: 'analysisResult',
      key: 'analysisResult',
      required: true,
      label: '分析结果',
      description: 'AI生成的分析报告',
      valueType: WorkflowIOValueTypeEnum.string,
      type: FlowNodeOutputTypeEnum.static
    },
    {
      id: 'riskLevel',
      key: 'riskLevel',
      required: false,
      label: '风险等级',
      description: '投资风险等级评估',
      valueType: WorkflowIOValueTypeEnum.string,
      type: FlowNodeOutputTypeEnum.static
    },
    {
      id: 'recommendation',
      key: 'recommendation',
      required: false,
      label: '投资建议',
      description: '基于分析的投资建议',
      valueType: WorkflowIOValueTypeEnum.string,
      type: FlowNodeOutputTypeEnum.static
    },
    {
      id: NodeOutputKeyEnum.error,
      key: NodeOutputKeyEnum.error,
      label: '错误信息',
      description: '分析过程中的错误信息',
      valueType: WorkflowIOValueTypeEnum.string,
      type: FlowNodeOutputTypeEnum.error
    }
  ]
};
