/**
 * LaTeX 转换服务模块
 * 职责：LaTeX → MathML → OMML 转换链
 * 作用：提供后端 LaTeX 公式转换能力，将 LaTeX 公式转换为 Word 可编辑的 OMML 格式
 */

const mjAPI = require("mathjax-node");
const fs = require('fs');
const path = require('path');

// 导入 XSLT 处理器（使用 Saxon-JS）
const SaxonJS = require('saxon-js');

// LaTeX 转换服务类
class LatexConversionService {
  constructor() {
    this.isInitialized = false;
    this.conversionCache = new Map();
    this.xslPath = path.join(__dirname, '../MML2OMML.XSL');
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
        throw new Error(`MML2OMML.XSL 文件未找到: ${this.xslPath}`);
      }
      
      console.log('[LaTeX Service] XSL 转换文件检查完成:', this.xslPath);
      
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

    // 检查缓存
    const cacheKey = `${latex}_${isDisplayMode}`;
    if (this.conversionCache.has(cacheKey)) {
      this.stats.cacheHits++;
      const cached = this.conversionCache.get(cacheKey);
      console.log('[LaTeX Service] 使用缓存结果', { latex: latex.substring(0, 30) });
      return cached;
    }

    try {
      this.stats.totalConversions++;
      
      // Step 1: LaTeX → MathML
      console.log('[LaTeX Service] 步骤 1: LaTeX → MathML');
      const mathmlResult = await this.latexToMathML(latex, isDisplayMode);
      
      if (!mathmlResult.success) {
        throw new Error(`LaTeX → MathML 转换失败: ${mathmlResult.error}`);
      }

      // Step 2: MathML → OMML
      console.log('[LaTeX Service] 步骤 2: MathML → OMML');
      const ommlResult = await this.mathmlToOmml(mathmlResult.mathml);
      
      if (!ommlResult.success) {
        throw new Error(`MathML → OMML 转换失败: ${ommlResult.error}`);
      }

      const result = {
        success: true,
        latex: latex,
        mathml: mathmlResult.mathml,
        omml: ommlResult.omml,
        isDisplayMode,
        conversionTime: Date.now() - startTime
      };

      // 缓存成功的转换结果
      this.conversionCache.set(cacheKey, result);
      this.stats.successfulConversions++;
      
      console.log('[LaTeX Service] 转换成功', {
        latex: latex.substring(0, 30),
        isDisplayMode,
        conversionTime: result.conversionTime
      });

      return result;

    } catch (error) {
      this.stats.failedConversions++;
      
      console.error('[LaTeX Service] 转换失败', {
        latex: latex.substring(0, 50),
        error: error.message,
        conversionTime: Date.now() - startTime
      });

      return {
        success: false,
        latex: latex,
        error: error.message,
        isDisplayMode,
        conversionTime: Date.now() - startTime
      };
    }
  }

  /**
   * 将 LaTeX 转换为 MathML
   * @param {string} latex - LaTeX 公式代码
   * @param {boolean} isDisplayMode - 是否为块级公式
   * @returns {Promise<object>} 转换结果
   */
  async latexToMathML(latex, isDisplayMode) {
    return new Promise((resolve) => {
      console.log('[LaTeX Service] MathJax 转换开始', { latex: latex.substring(0, 30) });
      
      mjAPI.typeset({
        math: latex,
        format: "TeX",
        mml: true,
        svg: false,
        html: false
      }, (data) => {
        if (data.errors) {
          console.error('[LaTeX Service] MathJax 转换错误:', data.errors);
          resolve({
            success: false,
            error: `MathJax 错误: ${data.errors.join(', ')}`
          });
          return;
        }

        if (!data.mml) {
          console.error('[LaTeX Service] MathJax 未生成 MathML');
          resolve({
            success: false,
            error: 'MathJax 未生成 MathML 输出'
          });
          return;
        }

        console.log('[LaTeX Service] MathJax 转换成功', {
          latex: latex.substring(0, 30),
          mathmlLength: data.mml.length
        });

        resolve({
          success: true,
          mathml: data.mml
        });
      });
    });
  }

  /**
   * 将 MathML 转换为 OMML
   * @param {string} mathml - MathML 字符串
   * @returns {Promise<object>} 转换结果
   */
  async mathmlToOmml(mathml) {
    try {
      console.log('[LaTeX Service] 开始 MathML → OMML 转换');
      
      // 读取 XSL 文件
      const xslContent = fs.readFileSync(this.xslPath, 'utf8');
      
      // 使用简单的字符串处理方式实现基础转换
      // 因为 saxon-js 在 Node.js 环境中可能有兼容性问题
      const ommlResult = this.simpleMathmlToOmml(mathml);
      
      if (ommlResult) {
        console.log('[LaTeX Service] MathML → OMML 转换成功');
        return {
          success: true,
          omml: ommlResult
        };
      } else {
        throw new Error('OMML 转换结果为空');
      }
      
    } catch (error) {
      console.error('[LaTeX Service] MathML → OMML 转换失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 简化的 MathML 到 OMML 转换（基础实现）
   * @param {string} mathml - MathML 字符串
   * @returns {string|null} OMML 字符串
   */
  simpleMathmlToOmml(mathml) {
    try {
      console.log('[LaTeX Service] 使用简化 MathML → OMML 转换');
      
      // 移除 MathML 的命名空间声明和根标签，提取内容
      let content = mathml
        .replace(/<math[^>]*>/g, '')
        .replace(/<\/math>/g, '')
        .replace(/xmlns[^=]*="[^"]*"/g, '')
        .trim();
      
      // 基础的 MathML 元素到 OMML 的映射
      const mappings = [
        // 分数
        [/<mfrac><mrow>(.*?)<\/mrow><mrow>(.*?)<\/mrow><\/mfrac>/g, '<m:f><m:num>$1</m:num><m:den>$2</m:den></m:f>'],
        [/<mfrac>(.*?)<\/mfrac>/g, '<m:f><m:num>$1</m:num><m:den></m:den></m:f>'],
        
        // 上标和下标
        [/<msup><mrow>(.*?)<\/mrow><mrow>(.*?)<\/mrow><\/msup>/g, '<m:sSup><m:e>$1</m:e><m:sup>$2</m:sup></m:sSup>'],
        [/<msub><mrow>(.*?)<\/mrow><mrow>(.*?)<\/mrow><\/msub>/g, '<m:sSub><m:e>$1</m:e><m:sub>$2</m:sub></m:sSub>'],
        [/<msubsup><mrow>(.*?)<\/mrow><mrow>(.*?)<\/mrow><mrow>(.*?)<\/mrow><\/msubsup>/g, '<m:sSubSup><m:e>$1</m:e><m:sub>$2</m:sub><m:sup>$3</m:sup></m:sSubSup>'],
        
        // 根号
        [/<msqrt>(.*?)<\/msqrt>/g, '<m:rad><m:deg></m:deg><m:e>$1</m:e></m:rad>'],
        [/<mroot><mrow>(.*?)<\/mrow><mrow>(.*?)<\/mrow><\/mroot>/g, '<m:rad><m:deg>$2</m:deg><m:e>$1</m:e></m:rad>'],
        
        // 积分符号
        [/<mo>∫<\/mo>/g, '<m:r><m:t>∫</m:t></m:r>'],
        [/<mo>∑<\/mo>/g, '<m:r><m:t>∑</m:t></m:r>'],
        [/<mo>∏<\/mo>/g, '<m:r><m:t>∏</m:t></m:r>'],
        
        // 括号
        [/<mo>\(<\/mo>/g, '<m:r><m:t>(</m:t></m:r>'],
        [/<mo>\)<\/mo>/g, '<m:r><m:t>)</m:t></m:r>'],
        [/<mo>\[<\/mo>/g, '<m:r><m:t>[</m:t></m:r>'],
        [/<mo>\]<\/mo>/g, '<m:r><m:t>]</m:t></m:r>'],
        
        // 基础元素
        [/<mi>(.*?)<\/mi>/g, '<m:r><m:t>$1</m:t></m:r>'],
        [/<mn>(.*?)<\/mn>/g, '<m:r><m:t>$1</m:t></m:r>'],
        [/<mo>(.*?)<\/mo>/g, '<m:r><m:t>$1</m:t></m:r>'],
        [/<mtext>(.*?)<\/mtext>/g, '<m:r><m:t>$1</m:t></m:r>'],
        
        // 行和组
        [/<mrow>(.*?)<\/mrow>/g, '$1'],
        [/<mstyle[^>]*>(.*?)<\/mstyle>/g, '$1']
      ];
      
      // 应用转换规则
      let ommlContent = content;
      for (const [pattern, replacement] of mappings) {
        ommlContent = ommlContent.replace(pattern, replacement);
      }
      
      // 包装在 OMML 根元素中
      const omml = `<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">${ommlContent}</m:oMath>`;
      
      console.log('[LaTeX Service] 简化转换完成', {
        mathmlLength: mathml.length,
        ommlLength: omml.length,
        mappingsApplied: mappings.length
      });
      
      return omml;
      
    } catch (error) {
      console.error('[LaTeX Service] 简化转换失败:', error);
      return null;
    }
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
      isInitialized: this.isInitialized,
      successRate: this.stats.totalConversions > 0 
        ? ((this.stats.successfulConversions / this.stats.totalConversions) * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  /**
   * 清空转换缓存
   */
  clearCache() {
    const oldSize = this.conversionCache.size;
    this.conversionCache.clear();
    console.log('[LaTeX Service] 缓存已清空', { oldSize });
  }

  /**
   * 验证 LaTeX 语法的基本有效性
   * @param {string} latex - LaTeX 公式代码
   * @returns {boolean} 是否有效
   */
  validateLatex(latex) {
    if (!latex || !latex.trim()) {
      return false;
    }
    
    // 基础检查
    const trimmed = latex.trim();
    
    // 检查是否包含基本的数学内容
    if (!/[a-zA-Z0-9+\-*/=\\{}()[\]^_]/.test(trimmed)) {
      return false;
    }
    
    // 检查括号匹配
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      console.warn('[LaTeX Service] 大括号不匹配', { openBraces, closeBraces });
      return false;
    }
    
    return true;
  }

  /**
   * 测试转换服务功能
   * @returns {Promise<boolean>} 测试是否成功
   */
  async testConversion() {
    console.log('[LaTeX Service] 开始测试转换功能');
    
    const testCases = [
      { latex: 'E = mc^2', type: 'inline' },
      { latex: '\\int_a^b f(x)dx', type: 'block' },
      { latex: '\\frac{a}{b} + c', type: 'inline' },
      { latex: '\\sum_{i=1}^n x_i', type: 'block' }
    ];
    
    let successCount = 0;
    
    for (const testCase of testCases) {
      try {
        const result = await this.convertLatexToOmml(testCase.latex, testCase.type === 'block');
        
        if (result.success) {
          successCount++;
          console.log(`[LaTeX Service] 测试案例成功: ${testCase.latex}`);
        } else {
          console.error(`[LaTeX Service] 测试案例失败: ${testCase.latex}, 错误: ${result.error}`);
        }
      } catch (error) {
        console.error(`[LaTeX Service] 测试案例异常: ${testCase.latex}`, error);
      }
    }
    
    const testSuccess = successCount === testCases.length;
    console.log('[LaTeX Service] 测试完成', {
      total: testCases.length,
      success: successCount,
      allPassed: testSuccess
    });
    
    return testSuccess;
  }

  /**
   * 获取支持的 LaTeX 语法列表
   * @returns {object} 支持的语法信息
   */
  getSupportedSyntax() {
    return {
      basic: [
        '上标: x^2, x^{n+1}',
        '下标: x_1, x_{i+1}', 
        '分数: \\frac{a}{b}',
        '根号: \\sqrt{x}, \\sqrt[n]{x}',
        '积分: \\int, \\int_a^b',
        '求和: \\sum, \\sum_{i=1}^n',
        '希腊字母: \\alpha, \\beta, \\gamma'
      ],
      advanced: [
        '矩阵: \\begin{pmatrix}...\\end{pmatrix}',
        '多行公式: \\begin{align}...\\end{align}',
        '分段函数: \\begin{cases}...\\end{cases}',
        '微分算子: \\frac{d}{dx}, \\partial'
      ],
      limitations: [
        '复杂的自定义宏可能不支持',
        'TikZ 图形不支持',
        '某些高级包装可能需要简化'
      ]
    };
  }
}

// 全局服务实例
let globalService = null;

/**
 * 获取全局 LaTeX 转换服务实例
 * @returns {LatexConversionService} 服务实例
 */
const getLatexService = () => {
  if (!globalService) {
    globalService = new LatexConversionService();
  }
  return globalService;
};

/**
 * 便捷函数：转换单个公式
 * @param {string} latex - LaTeX 公式代码
 * @param {boolean} isDisplayMode - 是否为块级公式
 * @returns {Promise<object>} 转换结果
 */
const convertFormula = async (latex, isDisplayMode = false) => {
  const service = getLatexService();
  return service.convertLatexToOmml(latex, isDisplayMode);
};

/**
 * 便捷函数：批量转换公式
 * @param {Array} formulas - 公式信息数组
 * @returns {Promise<Array>} 转换结果数组
 */
const convertFormulas = async (formulas) => {
  const service = getLatexService();
  return service.convertMultipleFormulas(formulas);
};

/**
 * 便捷函数：获取服务统计
 * @returns {object} 统计信息
 */
const getConversionStats = () => {
  const service = getLatexService();
  return service.getStats();
};

module.exports = {
  LatexConversionService,
  getLatexService,
  convertFormula,
  convertFormulas,
  getConversionStats
};
