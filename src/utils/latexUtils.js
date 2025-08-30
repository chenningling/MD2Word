/**
 * LaTeX 公式处理工具模块
 * 职责：识别、解析和验证 LaTeX 公式
 * 作用：为预览渲染和导出转换提供统一的公式识别服务
 */

// LaTeX 公式匹配的正则表达式
export const LATEX_PATTERNS = {
  // 行内公式：$...$（不允许跨行，不允许连续的$符号）
  INLINE: /\$(?!\$)([^$\n]*?[^$\s][^$\n]*?)\$/g,
  
  // 块级公式：$$...$$（允许跨行，改进正则表达式以更好地处理换行）
  BLOCK: /\$\$\s*([\s\S]*?)\s*\$\$/g,
  
  // 组合模式：用于一次性匹配所有公式
  COMBINED: /(\$\$[\s\S]*?\$\$|\$[^$\n]*?[^$\s][^$\n]*?\$)/g,
  
  // 验证模式：检查公式语法的基本有效性
  VALIDATION: /^[\s\S]*[\w})\]]\s*$/
};

/**
 * LaTeX 公式类型枚举
 */
export const FORMULA_TYPES = {
  INLINE: 'inline',
  BLOCK: 'block'
};

/**
 * 识别文本中的所有 LaTeX 公式
 * @param {string} text - 输入文本
 * @returns {Array} 公式信息数组
 */
export const extractLatexFormulas = (text) => {
  console.log('[LaTeX Utils] 开始提取 LaTeX 公式，文本长度:', text.length);
  
  const formulas = [];
  let formulaId = 0;

  // 重置正则表达式的 lastIndex
  LATEX_PATTERNS.COMBINED.lastIndex = 0;
  
  let match;
  while ((match = LATEX_PATTERNS.COMBINED.exec(text)) !== null) {
    const fullMatch = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    
    // 判断公式类型
    const isBlockFormula = fullMatch.startsWith('$$');
    const type = isBlockFormula ? FORMULA_TYPES.BLOCK : FORMULA_TYPES.INLINE;
    
    // 提取纯 LaTeX 代码（去掉分隔符）
    let latexCode;
    if (isBlockFormula) {
      latexCode = fullMatch.slice(2, -2).trim(); // 去掉 $$
    } else {
      latexCode = fullMatch.slice(1, -1).trim(); // 去掉 $
    }
    
    // 基础语法验证
    const isValid = validateLatexSyntax(latexCode);
    
    const formulaInfo = {
      id: `formula_${++formulaId}`,
      type,
      raw: fullMatch,
      latex: latexCode,
      startIndex,
      endIndex,
      isValid,
      processed: false
    };
    
    formulas.push(formulaInfo);
    
    console.log('[LaTeX Utils] 发现公式', {
      id: formulaInfo.id,
      type: formulaInfo.type,
      latex: latexCode.substring(0, 50) + (latexCode.length > 50 ? '...' : ''),
      position: `${startIndex}-${endIndex}`,
      isValid
    });
  }
  
  console.log(`[LaTeX Utils] 提取完成，共发现 ${formulas.length} 个公式`);
  return formulas;
};

/**
 * 验证 LaTeX 公式语法的基本有效性
 * @param {string} latex - LaTeX 公式代码
 * @returns {boolean} 是否有效
 */
export const validateLatexSyntax = (latex) => {
  if (!latex || !latex.trim()) {
    return false;
  }
  
  // 基础检查：不能只包含空白字符
  if (!LATEX_PATTERNS.VALIDATION.test(latex)) {
    return false;
  }
  
  // 检查括号匹配
  const brackets = [
    ['{', '}'],
    ['\\(', '\\)'], 
    ['\\[', '\\]'],
    ['(', ')']
  ];
  
  for (const [open, close] of brackets) {
    const openCount = (latex.match(new RegExp(escapeRegExp(open), 'g')) || []).length;
    const closeCount = (latex.match(new RegExp(escapeRegExp(close), 'g')) || []).length;
    
    if (openCount !== closeCount) {
      console.warn('[LaTeX Utils] 括号不匹配', { open, close, openCount, closeCount, latex: latex.substring(0, 30) });
      return false;
    }
  }
  
  return true;
};

/**
 * 转义正则表达式特殊字符
 * @param {string} string - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * 生成公式占位符
 * @param {string} formulaId - 公式ID
 * @param {string} type - 公式类型
 * @returns {string} 占位符字符串
 */
export const generateFormulaPlaceholder = (formulaId, type) => {
  return `<span class="latex-placeholder" data-formula-id="${formulaId}" data-type="${type}">正在渲染公式...</span>`;
};

/**
 * 替换文本中的 LaTeX 公式为占位符
 * @param {string} text - 原始文本
 * @param {Array} formulas - 公式信息数组
 * @returns {string} 替换后的文本
 */
export const replaceFormulasWithPlaceholders = (text, formulas) => {
  console.log('[LaTeX Utils] 开始替换公式为占位符');
  
  let result = text;
  let offset = 0;
  
  // 按位置倒序处理，避免索引错乱
  const sortedFormulas = [...formulas].sort((a, b) => b.startIndex - a.startIndex);
  
  for (const formula of sortedFormulas) {
    const placeholder = generateFormulaPlaceholder(formula.id, formula.type);
    
    const beforeText = result.substring(0, formula.startIndex);
    const afterText = result.substring(formula.endIndex);
    
    result = beforeText + placeholder + afterText;
    
    console.log('[LaTeX Utils] 替换公式', {
      id: formula.id,
      originalLength: formula.raw.length,
      placeholderLength: placeholder.length,
      position: formula.startIndex
    });
  }
  
  console.log(`[LaTeX Utils] 占位符替换完成，处理了 ${formulas.length} 个公式`);
  return result;
};

/**
 * 检查 MathJax 是否已准备就绪
 * @returns {boolean} MathJax 是否可用
 */
export const isMathJaxReady = () => {
  const isReady = window.MathJax && 
                  window.MathJax.tex2svg && 
                  window.MathJax.startup && 
                  window.MathJax.startup.document.state() >= 10;
  
  if (!isReady) {
    console.warn('[LaTeX Utils] MathJax 尚未准备就绪');
  }
  
  return isReady;
};

/**
 * 等待 MathJax 准备就绪
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<boolean>} MathJax 是否成功加载
 */
export const waitForMathJax = (timeout = 10000) => {
  return new Promise((resolve) => {
    console.log('[LaTeX Utils] 等待 MathJax 加载...');
    
    const startTime = Date.now();
    const checkInterval = 100;
    
    const checkReady = () => {
      if (isMathJaxReady()) {
        console.log('[LaTeX Utils] MathJax 加载完成，耗时:', Date.now() - startTime, 'ms');
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        console.error('[LaTeX Utils] MathJax 加载超时');
        resolve(false);
        return;
      }
      
      setTimeout(checkReady, checkInterval);
    };
    
    checkReady();
  });
};

/**
 * LaTeX 公式配置选项
 */
export const LATEX_CONFIG = {
  // 渲染选项
  renderer: {
    engine: 'mathjax',
    timeout: 5000,
    errorMode: 'text' // 'text' | 'hide' | 'placeholder'
  },
  
  // 语法支持
  syntax: {
    inline: ['$...$'],
    block: ['$$...$$'],
    amsmath: true,
    unicode: true
  },
  
  // 预览设置
  preview: {
    theme: 'default',
    scale: 1.0,
    color: 'inherit'
  }
};

/**
 * 获取 LaTeX 错误信息的用户友好描述
 * @param {Error} error - 错误对象
 * @returns {string} 用户友好的错误描述
 */
export const getLatexErrorMessage = (error) => {
  if (error.message.includes('Undefined control sequence')) {
    return '未定义的 LaTeX 命令';
  }
  
  if (error.message.includes('Missing') && error.message.includes('inserted')) {
    return 'LaTeX 语法错误：缺少匹配符号';
  }
  
  if (error.message.includes('Extra')) {
    return 'LaTeX 语法错误：多余的符号';
  }
  
  return 'LaTeX 语法错误';
};

/**
 * 从 HTML 中提取 LaTeX 公式
 * @param {string} html - HTML 内容
 * @returns {Array} 公式信息数组
 */
export const extractLatexFormulasFromHtml = (html) => {
  console.log('[LaTeX Utils] 从 HTML 中提取 LaTeX 公式');
  
  // 创建临时 DOM 元素
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const formulas = [];
  let formulaId = 0;
  
  // 查找所有文本节点
  const walker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // 跳过 script、style、pre、code 等标签内的文本
        const skipTags = ['SCRIPT', 'STYLE', 'PRE', 'CODE'];
        let parent = node.parentNode;
        while (parent && parent !== tempDiv) {
          if (skipTags.includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  // 在每个文本节点中查找公式
  textNodes.forEach(textNode => {
    const text = textNode.textContent;
    if (!text) return;
    
    // 重置正则表达式
    LATEX_PATTERNS.COMBINED.lastIndex = 0;
    
    let match;
    while ((match = LATEX_PATTERNS.COMBINED.exec(text)) !== null) {
      const fullMatch = match[0];
      const isBlockFormula = fullMatch.startsWith('$$');
      const type = isBlockFormula ? FORMULA_TYPES.BLOCK : FORMULA_TYPES.INLINE;
      
      let latexCode;
      if (isBlockFormula) {
        latexCode = fullMatch.slice(2, -2).trim();
      } else {
        latexCode = fullMatch.slice(1, -1).trim();
      }
      
      const isValid = validateLatexSyntax(latexCode);
      
      const formulaInfo = {
        id: `html_formula_${++formulaId}`,
        type,
        raw: fullMatch,
        latex: latexCode,
        textNode: textNode,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        isValid,
        processed: false
      };
      
      formulas.push(formulaInfo);
      
      console.log('[LaTeX Utils] HTML 中发现公式', {
        id: formulaInfo.id,
        type: formulaInfo.type,
        latex: latexCode.substring(0, 30) + (latexCode.length > 30 ? '...' : ''),
        isValid
      });
    }
  });
  
  console.log(`[LaTeX Utils] HTML 公式提取完成，共发现 ${formulas.length} 个公式`);
  return formulas;
};

/**
 * 测试用例：常见的 LaTeX 公式示例
 */
export const LATEX_TEST_CASES = {
  inline: [
    '$E = mc^2$',
    '$\\alpha + \\beta = \\gamma$',
    '$\\frac{a}{b} + c$',
    '$\\sqrt{x^2 + y^2}$'
  ],
  
  block: [
    '$$\\int_a^b f(x)dx = F(b) - F(a)$$',
    '$$\\sum_{i=1}^n x_i = x_1 + x_2 + \\cdots + x_n$$',
    '$$\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u$$',
    '$$\\begin{cases} x = 1 \\\\ y = 2 \\end{cases}$$'
  ]
};
