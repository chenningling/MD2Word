/**
 * LaTeX 转换服务模块
 * 职责：LaTeX → MathML → OMML 转换链
 * 作用：提供后端 LaTeX 公式转换能力，将 LaTeX 公式转换为 Word 可编辑的 OMML 格式
 */

const mjAPI = require("mathjax-node");
const fs = require('fs');
const path = require('path');
const SaxonJS = require('saxon-js');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// LaTeX 转换服务类
class LatexConversionService {
  constructor() {
    this.isInitialized = false;
    this.conversionCache = new Map();
    this.xslPath = path.join(__dirname, '..', 'MML2OMML.XSL');
    this.stats = {
      totalConversions: 0,
      successfulConversions: 0,
      failedConversions: 0,
      cacheHits: 0,
      avgConversionTime: 0
    };
    
    // 异步初始化，但不在构造函数中等待
    this.initPromise = this.init();
  }

  /**
   * 初始化转换服务
   */
  async init() {
    console.log('[LaTeX Service] 初始化 LaTeX 转换服务...');
    
    try {
      // 初始化 MathJax
      mjAPI.config({
        MathJax: {
          tex2jax: {
            inlineMath: [['$', '$']],
            displayMath: [['$$', '$$']],
            processEscapes: true,
            processEnvironments: true
          },
          TeX: {
            extensions: ['AMSmath.js', 'AMSsymbols.js', 'autoload-all.js']
          }
        }
      });
      
      // 直接启动 MathJax（不等待回调）
      mjAPI.start();
      console.log('[LaTeX Service] MathJax 启动完成');
      
      // 检查 XSL 文件是否存在
      if (!fs.existsSync(this.xslPath)) {
        console.warn(`[LaTeX Service] MML2OMML.XSL 文件未找到: ${this.xslPath}`);
      } else {
        console.log('[LaTeX Service] XSL 转换文件检查完成:', this.xslPath);
      }
      
      this.isInitialized = true;
      console.log('[LaTeX Service] 服务初始化完成');
      
    } catch (error) {
      console.error('[LaTeX Service] 初始化失败:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * 将单个 LaTeX 公式转换为 OMML
   * @param {string} latex - LaTeX 公式代码
   * @param {boolean} isDisplayMode - 是否为块级公式
   * @returns {Promise<object>} 转换结果
   */
  async convertLatexToOmml(latex, isDisplayMode = false) {
    const startTime = Date.now();
    
    console.log('[LaTeX Service] 开始转换公式', {
      latex: latex.substring(0, 50) + (latex.length > 50 ? '...' : ''),
      isDisplayMode,
      timestamp: startTime
    });

    // 等待初始化完成
    if (!this.isInitialized) {
      console.log('[LaTeX Service] 等待服务初始化...');
      try {
        await this.initPromise;
      } catch (error) {
        throw new Error(`LaTeX 转换服务初始化失败: ${error.message}`);
      }
    }

    if (!this.isInitialized) {
      throw new Error('LaTeX 转换服务初始化失败');
    }

    try {
      // 1. LaTeX → MathML 转换
      const mathmlResult = await this.convertLatexToMathml(latex, isDisplayMode);
      if (!mathmlResult.success) {
        throw new Error(`MathML 转换失败: ${mathmlResult.error}`);
      }

      // 2. MathML → OMML 转换
      let ommlResult;
      try {
        // 优先尝试使用微软官方 XSL
        ommlResult = await this.convertMathMLToOmmlWithMicrosoftXSL(mathmlResult.mathml);
        console.log('[LaTeX Service] 使用微软官方 XSL 转换成功');
      } catch (xslError) {
        console.warn('[LaTeX Service] 微软 XSL 转换失败，回退到自制转换器:', xslError.message);
        // 回退到自制转换器
        ommlResult = await this.simpleMathmlToOmml(mathmlResult.mathml);
        if (!ommlResult) {
          throw new Error('OMML 转换失败');
        }
      }

      const duration = Date.now() - startTime;
      
      const result = {
        success: true,
        latex,
        mathml: mathmlResult.mathml,
        omml: ommlResult,
        isDisplayMode,
        conversionTime: duration
      };

      // 缓存结果
      this.cacheResult(latex, isDisplayMode, result);
      
      console.log('[LaTeX Service] OMML 转换完成', {
        mathmlLength: mathmlResult.mathml.length,
        ommlLength: ommlResult.length,
        ommlPreview: ommlResult.substring(0, 200)
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[LaTeX Service] 转换失败:', error.message);
      
      return {
        success: false,
        latex,
        error: error.message,
        isDisplayMode,
        conversionTime: duration
      };
    }
  }

  /**
   * 将 LaTeX 转换为 MathML
   * @param {string} latex - LaTeX 公式
   * @param {boolean} isDisplayMode - 是否为块级公式
   * @returns {Promise<object>} MathML 转换结果
   */
  convertLatexToMathml(latex, isDisplayMode = false) {
    return new Promise((resolve, reject) => {
      try {
        const options = {
          math: latex,
          format: "TeX",
          mml: true,
          svg: false,
          html: false,
          css: false,
          width: isDisplayMode ? 800 : 400,
          useGlobalCache: false
        };

        mjAPI.typeset(options, (result) => {
          if (result.errors && result.errors.length > 0) {
            console.error('[LaTeX Service] MathJax 转换错误:', result.errors);
            reject(new Error(`MathJax 转换失败: ${result.errors.join(', ')}`));
            return;
          }

          if (!result.mml) {
            reject(new Error('MathJax 未返回 MathML 结果'));
            return;
          }

          resolve({
            success: true,
            mathml: result.mml,
            isDisplayMode
          });
        });

      } catch (error) {
        reject(new Error(`MathJax 调用失败: ${error.message}`));
      }
    });
  }

  /**
   * 使用 XSLT 引擎将 MathML 转换为 OMML
   * @param {string} mathml - MathML 字符串
   * @returns {Promise<string|null>} OMML 字符串
   */
  async simpleMathmlToOmml(mathml) {
    try {
      console.log('[LaTeX Service] 开始使用 XSLT 转换 MathML → OMML');
      
      // 尝试使用简化的 XSL 转换
      const result = await this.performSimpleXsltTransform(mathml);
      if (result) {
        return result;
      }
      
      // 如果简化转换失败，回退到规则转换
      console.log('[LaTeX Service] XSLT 转换失败，使用回退转换');
      return this.fallbackMathmlToOmml(mathml);
      
    } catch (error) {
      console.error('[LaTeX Service] XSLT 转换失败，回退到简化转换:', error);
      return this.fallbackMathmlToOmml(mathml);
    }
  }
  
  /**
   * 执行简化的 XSLT 转换（使用内联样式表）
   * @param {string} mathml - MathML 字符串
   * @returns {Promise<string|null>} OMML 字符串
   */
  async performSimpleXsltTransform(mathml) {
    try {
      // 由于 SaxonJS 格式兼容性问题，我们使用基于规则的转换
      // 这种方法模拟了 XSLT 的转换逻辑，但使用 JavaScript 实现
      console.log('[LaTeX Service] 使用基于规则的转换（模拟 XSLT）');
      
      return this.performRuleBasedTransform(mathml);
      
    } catch (error) {
      console.log('[LaTeX Service] 基于规则的转换失败:', error.message);
      return null;
    }
  }
  
  /**
   * 基于规则的转换（模拟 XSLT 逻辑）
   * @param {string} mathml - MathML 字符串
   * @returns {string|null} OMML 字符串
   */
  performRuleBasedTransform(mathml) {
    try {
      let content = mathml
        .replace(/<math[^>]*>/g, '')
        .replace(/<\/math>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log('[LaTeX Service] 开始基于规则的转换，内容长度:', content.length);
      
      // 1. 处理积分符号（使用 nary 结构）
      content = content.replace(/<msubsup>\s*<mo[^>]*>&#x222B;.*?<\/mo>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<\/msubsup>/g,
        '<m:nary><m:naryPr><m:chr m:val="∫"/><m:limLoc m:val="subSup"/><m:grow m:val="1"/><m:subHide m:val="off"/><m:supHide m:val="off"/></m:naryPr><m:sub><m:r><m:t>$1</m:t></m:r></m:sub><m:sup><m:r><m:t>$2</m:t></m:r></m:sup><m:e/></m:nary>');
      
      // 处理求和符号（使用 nary 结构）
      content = content.replace(/<msubsup>\s*<mo[^>]*>&#x2211;[^<]*<\/mo>\s*<mi>([^<]*)<\/mi>\s*<mi>([^<]*)<\/mi>\s*<\/msubsup>/g,
        '<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="subSup"/><m:grow m:val="1"/><m:subHide m:val="off"/><m:supHide m:val="off"/></m:naryPr><m:sub><m:r><m:t>$1</m:t></m:r></m:sub><m:sup><m:r><m:t>$2</m:t></m:r></m:sup><m:e/></m:nary>');
      
      // 2. 处理上标（支持多行格式）
      content = content.replace(/<msup>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<mn>\s*([^<]*)\s*<\/mn>\s*<\/msup>/g,
        '<m:sSup><m:e><m:r><m:t>$1</m:t></m:r></m:e><m:sup><m:r><m:t>$2</m:t></m:r></m:sup></m:sSup>');
      
      // 3. 处理下标
      content = content.replace(/<msub>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<\/msub>/g,
        '<m:sSub><m:e><m:r><m:t>$1</m:t></m:r></m:e><m:sub><m:r><m:t>$2</m:t></m:r></m:sub></m:sSub>');
      
      // 4. 处理分数
      content = content.replace(/<mfrac>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<\/mfrac>/g,
        '<m:f><m:fPr><m:type m:val="bar"/></m:fPr><m:num><m:r><m:t>$1</m:t></m:r></m:num><m:den><m:r><m:t>$2</m:t></m:r></m:den></m:f>');
      
      // 5. 处理根号
      content = content.replace(/<msqrt>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<\/msqrt>/g,
        '<m:rad><m:radPr><m:degHide m:val="on"/></m:radPr><m:deg/><m:e><m:r><m:t>$1</m:t></m:r></m:e></m:rad>');
      
      // 6. 处理基本元素
      content = content.replace(/<mi>\s*([^<]*)\s*<\/mi>/g, '<m:r><m:t>$1</m:t></m:r>');
      content = content.replace(/<mn>\s*([^<]*)\s*<\/mn>/g, '<m:r><m:t>$1</m:t></m:r>');
      content = content.replace(/<mo>\s*([^<]*)\s*<\/mo>/g, '<m:r><m:t>$1</m:t></m:r>');
      content = content.replace(/<mtext>\s*([^<]*)\s*<\/mtext>/g, '<m:r><m:t>$1</m:t></m:r>');
      
      // 7. 清理包装标签
      content = content.replace(/<\/?mrow[^>]*>/g, '');
      content = content.replace(/<\/?mstyle[^>]*>/g, '');
      
      // 8. 最终清理和验证
      content = content
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!content || !content.includes('<m:')) {
        console.warn('[LaTeX Service] 基于规则的转换结果无效');
        return null;
      }
      
      const omml = `<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">${content}</m:oMath>`;
      console.log('[LaTeX Service] 基于规则的转换成功，结果长度:', omml.length);
      return omml;
      
    } catch (error) {
      console.error('[LaTeX Service] 基于规则的转换失败:', error);
      return null;
    }
  }
  
  /**
   * 回退转换方法（保留原有的转换逻辑作为备用）
   * @param {string} mathml - MathML 字符串
   * @returns {string|null} OMML 字符串
   */
  fallbackMathmlToOmml(mathml) {
    try {
      console.log('[LaTeX Service] 使用回退转换方法');
      let content = mathml
        .replace(/<math[^>]*>/g, '')
        .replace(/<\/math>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // 简化的转换规则
      content = content.replace(/<msup>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<mn>\s*([^<]*)\s*<\/mn>\s*<\/msup>/g,
        '<m:sSup><m:e><m:r><m:t>$1</m:t></m:r></m:e><m:sup><m:r><m:t>$2</m:t></m:r></m:sup></m:sSup>');
      
      content = content.replace(/<msub>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<mi>\s*([^<]*)\s*<\/mi>\s*<\/msub>/g,
        '<m:sSub><m:e><m:r><m:t>$1</m:t></m:r></m:e><m:sub><m:r><m:t>$2</m:t></m:r></m:sub></m:sSub>');
      
      content = content.replace(/<mi>\s*([^<]*)\s*<\/mi>/g, '<m:r><m:t>$1</m:t></m:r>');
      content = content.replace(/<mn>\s*([^<]*)\s*<\/mn>/g, '<m:r><m:t>$1</m:t></m:r>');
      content = content.replace(/<mo>\s*([^<]*)\s*<\/mo>/g, '<m:r><m:t>$1</m:t></m:r>');
      
      if (!content || !content.includes('<m:')) {
        return null;
      }
      
      return `<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">${content}</m:oMath>`;
      
    } catch (error) {
      console.error('[LaTeX Service] 回退转换也失败:', error);
      return null;
    }
  }

  /**
   * 使用微软官方 XSL 转换 MathML 到 OMML
   * @param {string} mathml - MathML 字符串
   * @returns {Promise<string>} OMML 字符串
   */
  async convertMathMLToOmmlWithMicrosoftXSL(mathml) {
    try {
      console.log('[LaTeX Service] 使用微软官方 XSL 转换 MathML 到 OMML');
      
      // 创建临时 MathML 文件
      const tempMathMLPath = path.join(__dirname, '..', 'temp_mathml.xml');
      const mathmlContent = `<?xml version="1.0" encoding="UTF-8"?>
${mathml}`;
      
      fs.writeFileSync(tempMathMLPath, mathmlContent, 'utf8');
      
      // 使用 xsltproc 转换
      const xslPath = path.join(__dirname, '..', 'MML2OMML.XSL');
      const command = `xsltproc "${xslPath}" "${tempMathMLPath}"`;
      
      const { stdout, stderr } = await execAsync(command, { 
        maxBuffer: 1024 * 1024,
        timeout: 30000 
      });
      
      // 清理临时文件
      if (fs.existsSync(tempMathMLPath)) {
        fs.unlinkSync(tempMathMLPath);
      }
      
      if (stderr) {
        console.warn('[LaTeX Service] xsltproc 警告:', stderr);
      }
      
      // 验证结果
      if (!stdout.includes('<m:oMath')) {
        throw new Error('转换结果不是有效的 OMML 格式');
      }
      
      console.log('[LaTeX Service] 微软 XSL 转换成功');
      return stdout;
      
    } catch (error) {
      console.error('[LaTeX Service] 微软 XSL 转换失败:', error.message);
      throw error;
    }
  }

  /**
   * 缓存转换结果
   * @param {string} latex - LaTeX 公式
   * @param {boolean} isDisplayMode - 是否为块级公式
   * @param {object} result - 转换结果
   */
  cacheResult(latex, isDisplayMode, result) {
    const cacheKey = `${latex}_${isDisplayMode}`;
    this.conversionCache.set(cacheKey, result);
    
    // 限制缓存大小
    if (this.conversionCache.size > 1000) {
      const firstKey = this.conversionCache.keys().next().value;
      this.conversionCache.delete(firstKey);
    }
  }

  /**
   * 从缓存获取转换结果
   * @param {string} latex - LaTeX 公式
   * @param {boolean} isDisplayMode - 是否为块级公式
   * @returns {object|null} 缓存的转换结果
   */
  getCachedResult(latex, isDisplayMode) {
    const cacheKey = `${latex}_${isDisplayMode}`;
    const cached = this.conversionCache.get(cacheKey);
    
    if (cached) {
      this.stats.cacheHits++;
      console.log('[LaTeX Service] 缓存命中:', cacheKey);
    }
    
    return cached;
  }

  /**
   * 批量转换多个 LaTeX 公式
   * @param {Array} formulas - 公式信息数组
   * @returns {Promise<Array>} 转换结果数组
   */
  async convertMultipleFormulas(formulas) {
    console.log(`[LaTeX Service] 开始批量转换 ${formulas.length} 个公式`);
    const startTime = Date.now();
    
    const results = [];
    
    for (const formula of formulas) {
      try {
        const result = await this.convertLatexToOmml(formula.latex, formula.type === 'block');
        
        results.push({
          id: formula.id,
          ...result
        });
        
      } catch (error) {
        console.error('[LaTeX Service] 批量转换中的公式失败', {
          formulaId: formula.id,
          error: error.message
        });
        
        results.push({
          id: formula.id,
          success: false,
          latex: formula.latex,
          error: error.message,
          isDisplayMode: formula.type === 'block'
        });
      }
    }
    
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    // 更新统计信息
    this.updateStats(duration, successCount, failedCount);
    
    console.log('[LaTeX Service] 批量转换完成', {
      total: results.length,
      success: successCount,
      failed: failedCount,
      duration
    });
    
    return results;
  }

  /**
   * 更新性能统计信息
   * @param {number} duration - 转换耗时
   * @param {number} successCount - 成功数量
   * @param {number} failedCount - 失败数量
   */
  updateStats(duration, successCount, failedCount) {
    const oldTotal = this.stats.totalConversions;
    const oldAvg = this.stats.avgConversionTime;
    
    this.stats.totalConversions += (successCount + failedCount);
    this.stats.successfulConversions += successCount;
    this.stats.failedConversions += failedCount;
    
    // 计算平均转换时间
    this.stats.avgConversionTime = oldTotal > 0 
      ? ((oldAvg * oldTotal) + duration) / this.stats.totalConversions
      : duration;
  }

  /**
   * 获取服务统计信息
   * @returns {object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.conversionCache.size,
      isInitialized: this.isInitialized
    };
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.conversionCache.clear();
    console.log('[LaTeX Service] 缓存已清空');
  }

  /**
   * 检查服务健康状态
   * @returns {object} 健康状态信息
   */
  getHealthStatus() {
    return {
      isInitialized: this.isInitialized,
      xslFileExists: fs.existsSync(this.xslPath),
      xslPath: this.xslPath,
      cacheSize: this.conversionCache.size,
      stats: this.getStats()
    };
  }
}

// 创建单例实例
const latexService = new LatexConversionService();

// 导出函数接口
module.exports = {
  // 主要转换函数
  convertFormula: (latex, isDisplayMode) => latexService.convertLatexToOmml(latex, isDisplayMode),
  convertFormulas: (formulas) => latexService.convertMultipleFormulas(formulas),
  
  // 统计和状态函数
  getConversionStats: () => latexService.getStats(),
  getLatexService: () => latexService,
  
  // 健康检查
  checkHealth: () => latexService.getHealthStatus(),
  
  // 缓存管理
  clearCache: () => latexService.clearCache(),
  
  // 测试功能
  testConversion: async () => {
    try {
      const testResult = await latexService.convertLatexToOmml('x^2 + y^2 = z^2', false);
      return testResult.success;
    } catch (error) {
      console.error('[LaTeX Service] 测试转换失败:', error);
      return false;
    }
  }
};
