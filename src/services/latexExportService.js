/**
 * LaTeX 导出服务模块
 * 职责：识别公式、调用后端转换、嵌入 OMML 到 docx
 * 作用：在 Word 文档导出过程中处理 LaTeX 公式，实现可编辑公式的导出
 */

import { extractLatexFormulas, FORMULA_TYPES } from '../utils/latexUtils';
import { checkApiHealth } from './apiService';

/**
 * LaTeX 导出服务配置
 */
const LATEX_EXPORT_CONFIG = {
  // API 配置
  api: {
    baseUrl: process.env.NODE_ENV === 'production' ? '/api/formula' : 'http://localhost:3001/api/formula',
    timeout: 30000, // 30 秒超时
    retryAttempts: 2,
    retryDelay: 1000 // 1 秒重试延迟
  },
  
  // 导出选项
  export: {
    enableFormulas: true,
    fallbackMode: 'text', // 'text' | 'image' | 'hide'
    maxFormulasPerRequest: 50, // 批量转换的最大公式数量
    cacheResults: true
  },
  
  // 调试选项
  debug: {
    logConversions: true,
    logTimings: true,
    logFailures: true
  }
};

/**
 * LaTeX 导出服务类
 */
class LatexExportService {
  constructor() {
    this.conversionCache = new Map();
    this.apiAvailable = null; // null=未检查, true=可用, false=不可用
    this.stats = {
      totalExports: 0,
      totalFormulas: 0,
      successfulConversions: 0,
      failedConversions: 0,
      cacheHits: 0,
      totalConversionTime: 0
    };
  }

  /**
   * 检查后端 API 可用性
   * @returns {Promise<boolean>} API 是否可用
   */
  async checkApiAvailability() {
    if (this.apiAvailable !== null) {
      return this.apiAvailable;
    }
    
    console.log('[LaTeX Export] 检查后端 API 可用性...');
    
    try {
      const isHealthy = await checkApiHealth();
      
      if (isHealthy) {
        // 进一步测试公式转换 API
        const testResponse = await fetch(`${LATEX_EXPORT_CONFIG.api.baseUrl}/stats`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (testResponse.ok) {
          this.apiAvailable = true;
          console.log('[LaTeX Export] 后端 API 可用');
        } else {
          throw new Error('公式 API 不可用');
        }
      } else {
        throw new Error('后端健康检查失败');
      }
    } catch (error) {
      console.warn('[LaTeX Export] 后端 API 不可用:', error.message);
      this.apiAvailable = false;
    }
    
    return this.apiAvailable;
  }

  /**
   * 处理 Markdown 文档中的 LaTeX 公式导出
   * @param {string} markdown - Markdown 文本
   * @param {Array} tokens - marked 解析后的 tokens
   * @returns {Promise<object>} 处理结果
   */
  async processLatexForExport(markdown, tokens) {
    const startTime = Date.now();
    
    console.log('[LaTeX Export] 开始处理文档中的 LaTeX 公式');
    
    try {
      this.stats.totalExports++;
      
      // Step 1: 提取所有 LaTeX 公式
      const formulas = extractLatexFormulas(markdown);
      
      if (formulas.length === 0) {
        console.log('[LaTeX Export] 文档中没有 LaTeX 公式');
        return {
          success: true,
          hasFormulas: false,
          formulas: [],
          tokens: tokens, // 返回原始 tokens
          conversionTime: Date.now() - startTime
        };
      }
      
      console.log(`[LaTeX Export] 发现 ${formulas.length} 个 LaTeX 公式`);
      this.stats.totalFormulas += formulas.length;
      
      // Step 2: 检查 API 可用性
      const apiAvailable = await this.checkApiAvailability();
      
      if (!apiAvailable) {
        console.warn('[LaTeX Export] 后端 API 不可用，使用降级模式');
        return this.handleFallbackMode(formulas, tokens, 'api_unavailable');
      }
      
      // Step 3: 转换公式
      const conversionResults = await this.convertFormulasToOmml(formulas);
      
      // Step 4: 处理转换结果
      const processedTokens = this.integrateFormulaResults(tokens, markdown, conversionResults);
      
      const totalTime = Date.now() - startTime;
      const successCount = conversionResults.filter(r => r.success).length;
      const failedCount = formulas.length - successCount;
      
      this.stats.successfulConversions += successCount;
      this.stats.failedConversions += failedCount;
      this.stats.totalConversionTime += totalTime;
      
      console.log('[LaTeX Export] 处理完成', {
        totalFormulas: formulas.length,
        successful: successCount,
        failed: failedCount,
        totalTime
      });
      
      return {
        success: true,
        hasFormulas: true,
        formulas: conversionResults,
        tokens: processedTokens,
        conversionTime: totalTime,
        stats: {
          total: formulas.length,
          successful: successCount,
          failed: failedCount
        }
      };
      
    } catch (error) {
      console.error('[LaTeX Export] 处理失败:', error);
      
      // 出错时使用降级模式
      const formulas = extractLatexFormulas(markdown);
      return this.handleFallbackMode(formulas, tokens, error.message);
    }
  }

  /**
   * 将公式转换为 OMML
   * @param {Array} formulas - 公式数组
   * @returns {Promise<Array>} 转换结果数组
   */
  async convertFormulasToOmml(formulas) {
    console.log(`[LaTeX Export] 开始转换 ${formulas.length} 个公式为 OMML`);
    
    // 分批处理，避免请求过大
    const batches = this.chunkArray(formulas, LATEX_EXPORT_CONFIG.export.maxFormulasPerRequest);
    let allResults = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[LaTeX Export] 处理批次 ${i + 1}/${batches.length}，包含 ${batch.length} 个公式`);
      
      try {
        const batchResults = await this.convertBatch(batch);
        allResults = allResults.concat(batchResults);
      } catch (error) {
        console.error(`[LaTeX Export] 批次 ${i + 1} 转换失败:`, error);
        
        // 批次失败时，为该批次的所有公式创建失败结果
        const failedResults = batch.map(formula => ({
          id: formula.id,
          success: false,
          latex: formula.latex,
          error: error.message,
          fallbackText: this.getFallbackText(formula),
          isDisplayMode: formula.type === FORMULA_TYPES.BLOCK
        }));
        
        allResults = allResults.concat(failedResults);
      }
    }
    
    console.log(`[LaTeX Export] 所有批次处理完成，总计 ${allResults.length} 个结果`);
    return allResults;
  }

  /**
   * 转换单个批次的公式
   * @param {Array} batch - 公式批次
   * @returns {Promise<Array>} 批次转换结果
   */
  async convertBatch(batch) {
    const startTime = Date.now();
    
    // 检查缓存
    const uncachedFormulas = [];
    const cachedResults = [];
    
    if (LATEX_EXPORT_CONFIG.export.cacheResults) {
      for (const formula of batch) {
        const cacheKey = `${formula.latex}_${formula.type}`;
        if (this.conversionCache.has(cacheKey)) {
          const cachedResult = this.conversionCache.get(cacheKey);
          cachedResults.push({
            id: formula.id,
            success: cachedResult.success,
            latex: cachedResult.latex || formula.latex,
            omml: cachedResult.omml,
            mathml: cachedResult.mathml,
            isDisplayMode: cachedResult.isDisplayMode,
            conversionTime: cachedResult.conversionTime
          });
          this.stats.cacheHits++;
        } else {
          uncachedFormulas.push(formula);
        }
      }
    } else {
      uncachedFormulas.push(...batch);
    }
    
    console.log(`[LaTeX Export] 批次缓存统计: ${cachedResults.length} 个缓存命中, ${uncachedFormulas.length} 个需要转换`);
    
    let convertedResults = [];
    
    if (uncachedFormulas.length > 0) {
      // 调用后端 API
      const requestBody = {
        formulas: uncachedFormulas.map(f => ({
          id: f.id,
          latex: f.latex,
          type: f.type
        }))
      };
      
      console.log('[LaTeX Export] 发送转换请求到后端', {
        count: uncachedFormulas.length,
        endpoint: `${LATEX_EXPORT_CONFIG.api.baseUrl}/convert`
      });
      
      const response = await this.makeApiRequest('/convert', 'POST', requestBody);
      
      if (!response.success) {
        throw new Error(`API 请求失败: ${response.error}`);
      }
      
      convertedResults = response.data?.results || response.results || [];
      console.log(`[LaTeX Export] API 响应解析:`, {
        responseSuccess: response.success,
        hasData: !!response.data,
        hasResults: !!response.data?.results,
        resultsLength: convertedResults.length,
        firstResult: convertedResults[0] || null
      });
      
      // 缓存成功的转换结果
      if (LATEX_EXPORT_CONFIG.export.cacheResults) {
        for (const result of convertedResults) {
          if (result.success) {
            const originalFormula = uncachedFormulas.find(f => f.id === result.id);
            if (originalFormula) {
              const cacheKey = `${originalFormula.latex}_${originalFormula.type}`;
              this.conversionCache.set(cacheKey, {
                success: result.success,
                omml: result.omml,
                mathml: result.mathml,
                isDisplayMode: result.isDisplayMode,
                latex: result.latex,
                conversionTime: result.conversionTime
              });
            }
          }
        }
      }
    }
    
    const allResults = [...cachedResults, ...convertedResults];
    const duration = Date.now() - startTime;
    
    console.log(`[LaTeX Export] 批次转换完成`, {
      total: allResults.length,
      successful: allResults.filter(r => r.success).length,
      failed: allResults.filter(r => !r.success).length,
      duration
    });
    
    return allResults;
  }

  /**
   * 发送 API 请求（带重试机制）
   * @param {string} endpoint - API 端点
   * @param {string} method - HTTP 方法
   * @param {object} body - 请求体
   * @returns {Promise<object>} 响应结果
   */
  async makeApiRequest(endpoint, method, body) {
    const url = `${LATEX_EXPORT_CONFIG.api.baseUrl}${endpoint}`;
    let lastError = null;
    
    for (let attempt = 1; attempt <= LATEX_EXPORT_CONFIG.api.retryAttempts + 1; attempt++) {
      try {
        console.log(`[LaTeX Export] API 请求尝试 ${attempt}/${LATEX_EXPORT_CONFIG.api.retryAttempts + 1}: ${method} ${url}`);
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          timeout: LATEX_EXPORT_CONFIG.api.timeout
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        console.log(`[LaTeX Export] API 请求成功: ${method} ${url}`);
        return data;
        
      } catch (error) {
        lastError = error;
        console.warn(`[LaTeX Export] API 请求失败 (尝试 ${attempt}):`, error.message);
        
        if (attempt <= LATEX_EXPORT_CONFIG.api.retryAttempts) {
          console.log(`[LaTeX Export] ${LATEX_EXPORT_CONFIG.api.retryDelay}ms 后重试...`);
          await this.delay(LATEX_EXPORT_CONFIG.api.retryDelay);
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || '未知错误'
    };
  }

  /**
   * 将转换结果集成到 tokens 中
   * @param {Array} tokens - 原始 tokens
   * @param {string} markdown - 原始 Markdown
   * @param {Array} conversionResults - 转换结果
   * @returns {Array} 处理后的 tokens
   */
  integrateFormulaResults(tokens, markdown, conversionResults) {
    console.log('[LaTeX Export] 开始集成转换结果到 tokens');
    
    // 创建公式映射表
    const formulaMap = new Map();
    conversionResults.forEach(result => {
      formulaMap.set(result.id, result);
    });
    
    // 深度复制 tokens 并处理公式
    const processedTokens = this.deepProcessTokens(tokens, formulaMap);
    
    console.log('[LaTeX Export] tokens 集成完成');
    return processedTokens;
  }

  /**
   * 深度处理 tokens，替换 LaTeX 公式为 OMML 标记
   * @param {Array} tokens - 原始 tokens
   * @param {Map} formulaMap - 公式转换结果映射
   * @returns {Array} 处理后的 tokens
   */
  deepProcessTokens(tokens, formulaMap) {
    if (!Array.isArray(tokens)) return tokens;
    
    return tokens.map(token => {
      const processedToken = { ...token };
      
      // 处理包含子 tokens 的情况
      if (token.tokens && Array.isArray(token.tokens)) {
        processedToken.tokens = this.deepProcessTokens(token.tokens, formulaMap);
      }
      
      // 处理文本内容
      if (token.type === 'text' || token.type === 'paragraph') {
        const originalText = token.text || token.raw || '';
        const processedText = this.replaceLatexInText(originalText, formulaMap);
        
        if (processedText !== originalText) {
          processedToken.text = processedText;
          processedToken.raw = processedText;
          processedToken.hasLatexFormulas = true;
        }
      }
      
      return processedToken;
    });
  }

  /**
   * 在文本中替换 LaTeX 公式为 OMML 标记
   * @param {string} text - 原始文本
   * @param {Map} formulaMap - 公式转换结果映射
   * @returns {string} 处理后的文本
   */
  replaceLatexInText(text, formulaMap) {
    if (!text) return text;
    
    let processedText = text;
    
    // 找到文本中的所有公式并替换
    const formulas = extractLatexFormulas(text);
    
    // 按位置倒序处理，避免索引错乱
    const sortedFormulas = [...formulas].sort((a, b) => b.startIndex - a.startIndex);
    
    for (const formula of sortedFormulas) {
      // 查找对应的转换结果 - 改进匹配逻辑
      const conversionResult = Array.from(formulaMap.values())
        .find(result => {
          const latexMatches = result.latex === formula.latex;
          const typeMatches = result.isDisplayMode === (formula.type === FORMULA_TYPES.BLOCK);
          
          console.log(`[LaTeX Export] 匹配检查: ${formula.latex.substring(0, 20)} | LaTeX匹配: ${latexMatches} | 类型匹配: ${typeMatches} | result.isDisplayMode: ${result.isDisplayMode} | formula.type: ${formula.type}`);
          
          return latexMatches && typeMatches;
        });
      
      console.log(`[LaTeX Export] 公式匹配结果:`, {
        formula: formula.latex.substring(0, 30),
        found: !!conversionResult,
        success: conversionResult?.success,
        availableResults: Array.from(formulaMap.values()).length
      });
      
      if (conversionResult && conversionResult.success) {
        // 替换为 OMML 标记
        const ommlPlaceholder = `{{OMML_FORMULA_${conversionResult.id}}}`;
        
        const beforeText = processedText.substring(0, formula.startIndex);
        const afterText = processedText.substring(formula.endIndex);
        
        processedText = beforeText + ommlPlaceholder + afterText;
        
        console.log(`[LaTeX Export] 文本中公式已标记: ${formula.latex.substring(0, 30)} → ${ommlPlaceholder}`);
      } else {
        // 转换失败，使用降级处理
        const fallbackText = this.getFallbackText(formula);
        
        const beforeText = processedText.substring(0, formula.startIndex);
        const afterText = processedText.substring(formula.endIndex);
        
        processedText = beforeText + fallbackText + afterText;
        
        console.warn(`[LaTeX Export] 公式转换失败，使用降级文本: ${formula.latex.substring(0, 30)} → ${fallbackText}`);
        console.warn(`[LaTeX Export] 调试信息:`, {
          conversionResult: conversionResult ? {
            id: conversionResult.id,
            success: conversionResult.success,
            isDisplayMode: conversionResult.isDisplayMode,
            hasOmml: !!conversionResult.omml
          } : null,
          formula: {
            latex: formula.latex,
            type: formula.type,
            expectedDisplayMode: formula.type === FORMULA_TYPES.BLOCK
          },
          availableResultsCount: Array.from(formulaMap.values()).length
        });
      }
    }
    
    return processedText;
  }

  /**
   * 处理降级模式
   * @param {Array} formulas - 公式数组
   * @param {Array} tokens - 原始 tokens
   * @param {string} reason - 降级原因
   * @returns {object} 降级处理结果
   */
  handleFallbackMode(formulas, tokens, reason) {
    console.log(`[LaTeX Export] 启用降级模式: ${reason}`);
    
    const fallbackResults = formulas.map(formula => ({
      id: formula.id,
      success: false,
      latex: formula.latex,
      error: reason,
      fallbackText: this.getFallbackText(formula),
      isDisplayMode: formula.type === FORMULA_TYPES.BLOCK
    }));
    
    return {
      success: true,
      hasFormulas: true,
      formulas: fallbackResults,
      tokens: tokens, // 返回原始 tokens
      fallbackMode: true,
      fallbackReason: reason
    };
  }

  /**
   * 获取公式的降级文本
   * @param {object} formula - 公式对象
   * @returns {string} 降级文本
   */
  getFallbackText(formula) {
    const mode = LATEX_EXPORT_CONFIG.export.fallbackMode;
    
    switch (mode) {
      case 'hide':
        return '';
      case 'image':
        return `[公式图片: ${formula.latex}]`; // 后续可扩展为实际图片
      case 'text':
      default:
        return formula.type === FORMULA_TYPES.BLOCK 
          ? `$$${formula.latex}$$` 
          : `$${formula.latex}$`;
    }
  }

  /**
   * 工具函数：数组分块
   * @param {Array} array - 原数组
   * @param {number} chunkSize - 块大小
   * @returns {Array} 分块后的数组
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 工具函数：延迟
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} 延迟 Promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取导出统计信息
   * @returns {object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.conversionCache.size,
      apiAvailable: this.apiAvailable,
      avgConversionTime: this.stats.totalFormulas > 0 
        ? (this.stats.totalConversionTime / this.stats.totalFormulas).toFixed(1) + 'ms'
        : '0ms'
    };
  }

  /**
   * 清空缓存
   */
  clearCache() {
    const oldSize = this.conversionCache.size;
    this.conversionCache.clear();
    console.log('[LaTeX Export] 缓存已清空', { oldSize });
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalExports: 0,
      totalFormulas: 0,
      successfulConversions: 0,
      failedConversions: 0,
      cacheHits: 0,
      totalConversionTime: 0
    };
    console.log('[LaTeX Export] 统计信息已重置');
  }
}

// 全局服务实例
let globalService = null;

/**
 * 获取全局 LaTeX 导出服务实例
 * @returns {LatexExportService} 服务实例
 */
export const getLatexExportService = () => {
  if (!globalService) {
    globalService = new LatexExportService();
  }
  return globalService;
};

/**
 * 便捷函数：处理 LaTeX 公式导出
 * @param {string} markdown - Markdown 文本
 * @param {Array} tokens - marked tokens
 * @returns {Promise<object>} 处理结果
 */
export const processLatexForExport = async (markdown, tokens) => {
  const service = getLatexExportService();
  return service.processLatexForExport(markdown, tokens);
};

/**
 * 便捷函数：获取导出统计
 * @returns {object} 统计信息
 */
export const getLatexExportStats = () => {
  const service = getLatexExportService();
  return service.getStats();
};

/**
 * 便捷函数：清空缓存
 */
export const clearLatexExportCache = () => {
  const service = getLatexExportService();
  service.clearCache();
};
