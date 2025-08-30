/**
 * LaTeX 渲染器模块
 * 职责：在 Word 预览中渲染 LaTeX 公式为 SVG
 * 作用：提供高质量的数学公式预览，集成到现有的 WordPreview 组件中
 */

import { waitForMathJax, isMathJaxReady, getLatexErrorMessage, LATEX_CONFIG } from '../../utils/latexUtils';

/**
 * LaTeX 渲染器类
 */
export class LaTeXRenderer {
  constructor() {
    this.isInitialized = false;
    this.renderQueue = [];
    this.renderCache = new Map();
    this.init();
  }

  /**
   * 初始化渲染器
   */
  async init() {
    console.log('[LaTeX Renderer] 初始化渲染器...');
    
    try {
      const success = await waitForMathJax(LATEX_CONFIG.renderer.timeout);
      if (success) {
        this.isInitialized = true;
        console.log('[LaTeX Renderer] 初始化成功');
        
        // 处理等待队列中的渲染任务
        await this.processRenderQueue();
      } else {
        console.error('[LaTeX Renderer] 初始化失败：MathJax 加载超时');
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('[LaTeX Renderer] 初始化失败:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 渲染单个 LaTeX 公式为 SVG
   * @param {string} latex - LaTeX 公式代码
   * @param {boolean} isDisplayMode - 是否为块级公式
   * @returns {Promise<object>} 渲染结果
   */
  async renderFormula(latex, isDisplayMode = false) {
    const startTime = Date.now();
    
    console.log('[LaTeX Renderer] 开始渲染公式', {
      latex: latex.substring(0, 50) + (latex.length > 50 ? '...' : ''),
      isDisplayMode,
      timestamp: startTime
    });

    // 检查缓存
    const cacheKey = `${latex}_${isDisplayMode}`;
    if (this.renderCache.has(cacheKey)) {
      const cached = this.renderCache.get(cacheKey);
      console.log('[LaTeX Renderer] 使用缓存结果', { latex: latex.substring(0, 30) });
      return cached;
    }

    // 如果 MathJax 未准备就绪，加入队列
    if (!this.isInitialized || !isMathJaxReady()) {
      console.log('[LaTeX Renderer] MathJax 未就绪，加入渲染队列');
      return new Promise((resolve) => {
        this.renderQueue.push({ latex, isDisplayMode, resolve });
      });
    }

      try {
    // 🔧 解码HTML实体，确保LaTeX代码正确
    const cleanLatex = decodeHtmlEntities(latex);
    
    // 🔍 最终检查：确保传给MathJax的代码已完全清理
    if (cleanLatex.includes('&amp;') || cleanLatex.includes('&lt;') || cleanLatex.includes('&gt;')) {
      console.warn(`[LaTeX Renderer] ⚠️ renderFormula函数警告：传给MathJax的公式仍包含HTML实体:`, {
        latex: cleanLatex,
        isDisplayMode,
        包含amp: cleanLatex.includes('&amp;'),
        包含lt: cleanLatex.includes('&lt;'),
        包含gt: cleanLatex.includes('&gt;')
      });
    }
    
    console.log(`[LaTeX Renderer] 🔍 renderFormula调用:`, {
      原始: latex.substring(0, 50) + (latex.length > 50 ? '...' : ''),
      清理后: cleanLatex.substring(0, 50) + (cleanLatex.length > 50 ? '...' : ''),
      isDisplayMode,
      解码生效: latex !== cleanLatex
    });
    
    // 使用 MathJax 渲染
    window.MathJax.texReset(); // 重置 MathJax 状态
    const mjxContainer = window.MathJax.tex2svg(cleanLatex, { display: isDisplayMode });
      
      if (!mjxContainer || !mjxContainer.firstChild) {
        throw new Error('MathJax 渲染结果为空');
      }

      const svg = mjxContainer.firstChild;
      const width = svg.style.width || svg.getAttribute('width');
      
      // 移除默认宽度属性，使用 CSS 控制
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      
      // 设置 SVG 样式
      svg.style.cssText = `
        max-width: 100% !important; 
        display: ${isDisplayMode ? 'block' : 'inline'};
        vertical-align: middle;
        margin: ${isDisplayMode ? '0.5em auto' : '0'};
      `;
      
      if (width) {
        svg.style.width = width;
      }

      const result = {
        success: true,
        svg: svg.outerHTML,
        width: width,
        isDisplayMode,
        originalLatex: latex,
        renderTime: Date.now() - startTime
      };

      // 缓存成功的渲染结果
      this.renderCache.set(cacheKey, result);
      
      console.log('[LaTeX Renderer] 渲染成功', {
        latex: latex.substring(0, 30),
        isDisplayMode,
        width,
        renderTime: result.renderTime
      });

      return result;

    } catch (error) {
      console.error('[LaTeX Renderer] 渲染失败', {
        latex: latex.substring(0, 50),
        error: error.message,
        renderTime: Date.now() - startTime
      });

      const result = {
        success: false,
        error: error.message,
        fallbackText: this.getFallbackText(latex, isDisplayMode),
        originalLatex: latex,
        isDisplayMode,
        renderTime: Date.now() - startTime
      };

      return result;
    }
  }

  /**
   * 批量渲染多个公式
   * @param {Array} formulas - 公式信息数组
   * @returns {Promise<Array>} 渲染结果数组
   */
  async renderFormulas(formulas) {
    console.log(`[LaTeX Renderer] 开始批量渲染 ${formulas.length} 个公式`);
    const startTime = Date.now();
    
    const results = [];
    
    for (const formula of formulas) {
      try {
        const isDisplayMode = formula.type === 'block';
        const result = await this.renderFormula(formula.latex, isDisplayMode);
        
        results.push({
          id: formula.id,
          ...result
        });
      } catch (error) {
        console.error('[LaTeX Renderer] 批量渲染中的公式失败', {
          formulaId: formula.id,
          error: error.message
        });
        
        results.push({
          id: formula.id,
          success: false,
          error: error.message,
          fallbackText: this.getFallbackText(formula.latex, formula.type === 'block')
        });
      }
    }
    
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    console.log('[LaTeX Renderer] 批量渲染完成', {
      total: results.length,
      success: successCount,
      failed: failedCount,
      duration
    });
    
    return results;
  }

  /**
   * 处理渲染队列
   */
  async processRenderQueue() {
    if (this.renderQueue.length === 0) return;
    
    console.log(`[LaTeX Renderer] 处理渲染队列，${this.renderQueue.length} 个任务`);
    
    const queue = [...this.renderQueue];
    this.renderQueue = [];
    
    for (const task of queue) {
      try {
        const result = await this.renderFormula(task.latex, task.isDisplayMode);
        task.resolve(result);
      } catch (error) {
        console.error('[LaTeX Renderer] 队列任务处理失败', error);
        task.resolve({
          success: false,
          error: error.message,
          fallbackText: this.getFallbackText(task.latex, task.isDisplayMode)
        });
      }
    }
  }

  /**
   * 获取降级显示文本
   * @param {string} latex - 原始 LaTeX 代码
   * @param {boolean} isDisplayMode - 是否为块级公式
   * @returns {string} 降级显示的文本
   */
  getFallbackText(latex, isDisplayMode) {
    const mode = LATEX_CONFIG.renderer.errorMode;
    
    switch (mode) {
      case 'hide':
        return '';
      case 'placeholder':
        return `[${isDisplayMode ? '块级' : '行内'}公式渲染失败]`;
      case 'text':
      default:
        return isDisplayMode ? `$$${latex}$$` : `$${latex}$`;
    }
  }

  /**
   * 清空渲染缓存
   */
  clearCache() {
    this.renderCache.clear();
    console.log('[LaTeX Renderer] 缓存已清空');
  }

  /**
   * 获取缓存统计信息
   * @returns {object} 缓存统计
   */
  getCacheStats() {
    return {
      size: this.renderCache.size,
      maxSize: 100, // 可配置的最大缓存数量
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }
}

/**
 * 全局 LaTeX 渲染器实例
 */
let globalRenderer = null;

/**
 * 获取全局渲染器实例
 * @returns {LaTeXRenderer} 渲染器实例
 */
export const getLatexRenderer = () => {
  if (!globalRenderer) {
    globalRenderer = new LaTeXRenderer();
  }
  return globalRenderer;
};

/**
 * 便捷函数：渲染单个公式
 * @param {string} latex - LaTeX 公式代码
 * @param {boolean} isDisplayMode - 是否为块级公式
 * @returns {Promise<object>} 渲染结果
 */
export const renderLatexFormula = (latex, isDisplayMode = false) => {
  const renderer = getLatexRenderer();
  return renderer.renderFormula(latex, isDisplayMode);
};

/**
 * 便捷函数：批量渲染公式
 * @param {Array} formulas - 公式信息数组
 * @returns {Promise<Array>} 渲染结果数组
 */
export const renderLatexFormulas = (formulas) => {
  const renderer = getLatexRenderer();
  return renderer.renderFormulas(formulas);
};

/**
 * 用于 Word 预览的公式处理函数
 * 使用字符串替换方法，简单直接地处理 LaTeX 公式
 * @param {string} html - 包含 LaTeX 公式的 HTML
 * @returns {Promise<string>} 处理后的 HTML
 */
export const processLatexInPreview = async (html) => {
  console.log('[LaTeX Renderer] 开始处理预览中的 LaTeX 公式', {
    htmlLength: html.length,
    htmlPreview: html.substring(0, 200) + (html.length > 200 ? '...' : '')
  });
  
  try {
    // 检查 MathJax 是否可用
    if (!window.MathJax || !window.MathJax.tex2svg) {
      console.error('[LaTeX Renderer] MathJax 未加载，跳过公式渲染');
      return html;
    }
    
    // 获取渲染器实例
    const renderer = getLatexRenderer();
    
    let processedHtml = html;
    let formulaId = 0;
    
    console.log('[LaTeX Renderer] 开始查找 HTML 中的公式...');
    
    // 处理块级公式 $$...$$
    const blockMatches = [...processedHtml.matchAll(/\$\$\s*\n?([\s\S]*?)\n?\s*\$\$/g)];
    console.log(`[LaTeX Renderer] HTML 中发现 ${blockMatches.length} 个块级公式`);
    
    for (const match of blockMatches) {
      try {
        const fullMatch = match[0];
        const latexCode = match[1].trim();
        
        if (!latexCode) continue;
        
        // 🔧 解码HTML实体
        const cleanLatexCode = decodeHtmlEntities(latexCode);
        
        if (latexCode !== cleanLatexCode) {
          console.log(`[LaTeX Renderer] 🔧 块级公式HTML实体解码:`, {
            原始: latexCode.substring(0, 100) + (latexCode.length > 100 ? '...' : ''),
            解码后: cleanLatexCode.substring(0, 100) + (cleanLatexCode.length > 100 ? '...' : ''),
            包含amp: latexCode.includes('&amp;'),
            包含lt: latexCode.includes('&lt;'),
            包含gt: latexCode.includes('&gt;')
          });
        }
        
        // 🔍 最终检查：确保传给MathJax的代码已完全清理
        if (cleanLatexCode.includes('&amp;') || cleanLatexCode.includes('&lt;') || cleanLatexCode.includes('&gt;')) {
          console.warn(`[LaTeX Renderer] ⚠️ 警告：传给MathJax的块级公式仍包含HTML实体:`, {
            latex: cleanLatexCode,
            包含amp: cleanLatexCode.includes('&amp;'),
            包含lt: cleanLatexCode.includes('&lt;'),
            包含gt: cleanLatexCode.includes('&gt;')
          });
        }
        
        console.log('[LaTeX Renderer] 渲染块级公式', {
          id: ++formulaId,
          latex: cleanLatexCode.substring(0, 50) + (cleanLatexCode.length > 50 ? '...' : '')
        });
        
        const renderResult = await renderer.renderFormula(cleanLatexCode, true);
        
        if (renderResult.success) {
          const formulaHtml = `<div class="latex-formula latex-block">${renderResult.svg}</div>`;
          processedHtml = processedHtml.replace(fullMatch, formulaHtml);
          
          console.log(`[LaTeX Renderer] 块级公式渲染成功 #${formulaId}`);
        } else {
          const errorHtml = `<div class="latex-error" title="渲染失败: ${renderResult.error}">$$${latexCode}$$</div>`;
          processedHtml = processedHtml.replace(fullMatch, errorHtml);
          
          console.warn(`[LaTeX Renderer] 块级公式渲染失败 #${formulaId}:`, renderResult.error);
        }
      } catch (error) {
        console.error(`[LaTeX Renderer] 块级公式处理异常 #${formulaId}:`, error);
      }
    }
    
    // 处理行内公式 $...$（避免匹配到 $$...$$）
    const inlineMatches = [...processedHtml.matchAll(/(?<!\$)\$(?!\$)([^$\n]*?[^$\s][^$\n]*?)\$(?!\$)/g)];
    console.log(`[LaTeX Renderer] 发现 ${inlineMatches.length} 个行内公式`);
    
    for (const match of inlineMatches) {
      try {
        const fullMatch = match[0];
        const latexCode = match[1].trim();
        
        if (!latexCode) continue;
        
        // 🔧 解码HTML实体
        const cleanLatexCode = decodeHtmlEntities(latexCode);
        
        if (latexCode !== cleanLatexCode) {
          console.log(`[LaTeX Renderer] 🔧 行内公式HTML实体解码:`, {
            原始: latexCode,
            解码后: cleanLatexCode,
            包含amp: latexCode.includes('&amp;'),
            包含lt: latexCode.includes('&lt;'),
            包含gt: latexCode.includes('&gt;')
          });
        }
        
        // 🔍 最终检查：确保传给MathJax的代码已完全清理
        if (cleanLatexCode.includes('&amp;') || cleanLatexCode.includes('&lt;') || cleanLatexCode.includes('&gt;')) {
          console.warn(`[LaTeX Renderer] ⚠️ 警告：传给MathJax的行内公式仍包含HTML实体:`, {
            latex: cleanLatexCode,
            包含amp: cleanLatexCode.includes('&amp;'),
            包含lt: cleanLatexCode.includes('&lt;'),
            包含gt: cleanLatexCode.includes('&gt;')
          });
        }
        
        console.log('[LaTeX Renderer] 渲染行内公式', {
          id: ++formulaId,
          latex: cleanLatexCode.substring(0, 30) + (cleanLatexCode.length > 30 ? '...' : '')
        });
        
        const renderResult = await renderer.renderFormula(cleanLatexCode, false);
        
        if (renderResult.success) {
          const formulaHtml = `<span class="latex-formula latex-inline">${renderResult.svg}</span>`;
          processedHtml = processedHtml.replace(fullMatch, formulaHtml);
          
          console.log(`[LaTeX Renderer] 行内公式渲染成功 #${formulaId}`);
        } else {
          const errorHtml = `<span class="latex-error" title="渲染失败: ${renderResult.error}">$${latexCode}$</span>`;
          processedHtml = processedHtml.replace(fullMatch, errorHtml);
          
          console.warn(`[LaTeX Renderer] 行内公式渲染失败 #${formulaId}:`, renderResult.error);
        }
      } catch (error) {
        console.error(`[LaTeX Renderer] 行内公式处理异常 #${formulaId}:`, error);
      }
    }
    
    console.log(`[LaTeX Renderer] 预览处理完成，共处理 ${formulaId} 个公式`);
    return processedHtml;
    
  } catch (error) {
    console.error('[LaTeX Renderer] 预览处理失败:', error);
    return html; // 返回原始 HTML
  }
};

/**
 * 为预览添加 LaTeX 相关的 CSS 样式
 * @returns {string} CSS 样式字符串
 */
export const getLatexPreviewStyles = () => {
  return `
    /* LaTeX 公式样式 */
    .latex-formula {
      font-family: "Latin Modern Math", "STIX Two Math", "TeX Gyre Termes Math", serif;
    }
    
    .latex-inline {
      display: inline;
      vertical-align: middle;
      margin: 0 2px;
    }
    
    .latex-block {
      display: block;
      text-align: center;
      margin: 1em auto;
      overflow-x: auto;
    }
    
    .latex-error {
      background-color: #ffe6e6;
      border: 1px solid #ff9999;
      padding: 2px 4px;
      border-radius: 3px;
      color: #cc0000;
      font-family: monospace;
      font-size: 0.9em;
    }
    
    .latex-placeholder {
      background-color: #f0f0f0;
      border: 1px dashed #ccc;
      padding: 2px 6px;
      border-radius: 3px;
      color: #666;
      font-style: italic;
      font-size: 0.9em;
    }
    
    /* SVG 数学公式的样式优化 */
    .latex-formula svg {
      max-width: 100%;
      height: auto;
    }
    
    .latex-block svg {
      margin: 0 auto;
    }
    
    /* 响应式设计：小屏幕上的公式处理 */
    @media (max-width: 768px) {
      .latex-block {
        font-size: 0.9em;
        overflow-x: scroll;
        padding: 0 10px;
      }
      
      .latex-inline {
        font-size: 0.95em;
      }
    }
  `;
};

/**
 * 解码HTML实体
 * @param {string} htmlString - 包含HTML实体的字符串
 * @returns {string} 解码后的字符串
 */
export const decodeHtmlEntities = (htmlString) => {
  return htmlString.replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&quot;/g, '"')
                   .replace(/&#39;/g, "'")
                   .replace(/&nbsp;/g, ' ');
};

/**
 * 检查并修复常见的 LaTeX 语法问题
 * @param {string} latex - 原始 LaTeX 代码
 * @returns {string} 修复后的 LaTeX 代码
 */
export const sanitizeLatex = (latex) => {
  let sanitized = latex.trim();
  
  // 修复常见问题
  const fixes = [
    // 修复双反斜杠 - 移除错误的修复逻辑，保持LaTeX字符串原样
    // [/\\\\\\/g, '\\\\'], // 这个逻辑是错误的，会导致LaTeX解析问题
    
    // 修复未闭合的大括号
    [/\{([^{}]*?)(?=\s|$)/g, (match, p1) => {
      const openCount = (match.match(/\{/g) || []).length;
      const closeCount = (match.match(/\}/g) || []).length;
      return match + '}'.repeat(Math.max(0, openCount - closeCount));
    }],
    
    // 转义特殊字符
    [/&/g, '\\&'],
    [/%/g, '\\%'],
    [/#/g, '\\#']
  ];
  
  for (const [pattern, replacement] of fixes) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  
  if (sanitized !== latex) {
    console.log('[LaTeX Renderer] 语法修复', {
      original: latex.substring(0, 30),
      sanitized: sanitized.substring(0, 30)
    });
  }
  
  return sanitized;
};

/**
 * 渲染器性能统计
 */
export class LatexRenderStats {
  constructor() {
    this.totalRenders = 0;
    this.successRenders = 0;
    this.failedRenders = 0;
    this.totalRenderTime = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  recordRender(renderTime, success, fromCache = false) {
    this.totalRenders++;
    this.totalRenderTime += renderTime;
    
    if (success) {
      this.successRenders++;
    } else {
      this.failedRenders++;
    }
    
    if (fromCache) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  getStats() {
    return {
      total: this.totalRenders,
      success: this.successRenders,
      failed: this.failedRenders,
      successRate: this.totalRenders > 0 ? (this.successRenders / this.totalRenders * 100).toFixed(1) + '%' : '0%',
      avgRenderTime: this.totalRenders > 0 ? (this.totalRenderTime / this.totalRenders).toFixed(1) + 'ms' : '0ms',
      cacheHitRate: (this.cacheHits + this.cacheMisses) > 0 ? (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(1) + '%' : '0%'
    };
  }

  reset() {
    this.totalRenders = 0;
    this.successRenders = 0;
    this.failedRenders = 0;
    this.totalRenderTime = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('[LaTeX Renderer] 统计数据已重置');
  }

  logStats() {
    const stats = this.getStats();
    console.log('[LaTeX Renderer] 性能统计', stats);
    return stats;
  }
}

// 全局统计实例
const globalStats = new LatexRenderStats();

/**
 * 获取全局渲染统计
 * @returns {LatexRenderStats} 统计实例
 */
export const getLatexRenderStats = () => globalStats;

/**
 * 测试 MathJax 渲染功能
 * @returns {Promise<boolean>} 测试是否成功
 */
export const testLatexRendering = async () => {
  console.log('[LaTeX Renderer] 开始测试渲染功能');
  
  try {
    const renderer = getLatexRenderer();
    
    // 测试简单的行内公式
    const inlineResult = await renderer.renderFormula('E = mc^2', false);
    if (!inlineResult.success) {
      throw new Error('行内公式测试失败');
    }
    
    // 测试简单的块级公式
    const blockResult = await renderer.renderFormula('\\int_a^b f(x)dx', true);
    if (!blockResult.success) {
      throw new Error('块级公式测试失败');
    }
    
    console.log('[LaTeX Renderer] 渲染功能测试成功');
    return true;
    
  } catch (error) {
    console.error('[LaTeX Renderer] 渲染功能测试失败:', error);
    return false;
  }
};
