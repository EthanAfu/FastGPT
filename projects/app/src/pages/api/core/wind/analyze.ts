import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import {
  getWindAPIService,
  extractStockCodes,
  inferIndicators,
  WindFrequency,
  WindDataTypeEnum
} from '@fastgpt/service/core/wind/service';
import { analyzeQuestion } from '@fastgpt/service/core/wind/questionAnalyzer';

type AnalyzeQuery = {
  question: string;
  codes?: string[];
  indicators?: string[];
  startDate?: string;
  endDate?: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, tmbId } = await authUserPer({ req, authToken: true });

    const { question, codes, indicators, startDate, endDate } = req.body as AnalyzeQuery;

    if (!question) {
      throw new Error('请输入您的问题');
    }

    // 获取Wind服务
    const windService = getWindAPIService();

    // 分析用户问题
    const questionAnalysis = analyzeQuestion(question);

    // 提取股票代码
    let stockCodes = codes || extractStockCodes(question);
    if (stockCodes.length === 0) {
      // 如果没有找到股票代码，使用默认的热门股票
      stockCodes = ['600519.SH', '000858.SZ', '002594.SZ']; // 茅台、五粮液、比亚迪
    }

    // 推断需要的指标
    const queryIndicators = indicators || inferIndicators(question);

    // 获取Wind数据
    const windRequest = {
      codes: stockCodes,
      fields: queryIndicators,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      frequency: WindFrequency.DAILY,
      dataType: WindDataTypeEnum.STOCK
    };

    console.log('Wind请求参数:', windRequest);

    // 调用Wind API获取数据
    const windResponse = await windService.fetchData(windRequest);

    // 格式化数据
    const formattedData = windService.formatFinancialData(windResponse);

    // 执行智能分析
    const analysisResult = await windService.analyzeAndRecommend(question, formattedData);

    // 返回分析结果
    res.json({
      success: true,
      data: {
        question,
        questionAnalysis: {
          type: questionAnalysis.questionType,
          stocks: stockCodes,
          indicators: queryIndicators,
          keywords: questionAnalysis.keywords
        },
        marketData: formattedData,
        analysis: analysisResult.analysis,
        recommendation: analysisResult.recommendation,
        confidence: analysisResult.confidence,
        reasons: analysisResult.reasons
      }
    });
  } catch (error: any) {
    console.error('Wind分析错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '分析失败'
    });
  }
}

export default NextAPI(handler);
