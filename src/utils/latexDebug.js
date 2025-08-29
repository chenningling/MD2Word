/**
 * LaTeX 调试工具模块
 * 职责：提供 LaTeX 功能的调试和测试工具
 * 作用：帮助诊断和解决 LaTeX 渲染问题
 */

/**
 * 测试 MathJax 是否可用
 * @returns {Promise<object>} 测试结果
 */
export const testMathJax = async () => {
  console.log('[LaTeX Debug] 开始测试 MathJax 功能');
  
  const testResults = {
    mathJaxLoaded: false,
    tex2svgAvailable: false,
    renderTest: false,
    error: null,
    details: {}
  };
  
  try {
    // 检查 MathJax 是否加载
    testResults.mathJaxLoaded = !!(window.MathJax);
    testResults.details.mathJaxObject = !!window.MathJax;
    
    if (!window.MathJax) {
      testResults.error = 'window.MathJax 未定义';
      return testResults;
    }
    
    // 检查 tex2svg 方法是否可用
    testResults.tex2svgAvailable = !!(window.MathJax.tex2svg);
    testResults.details.tex2svg = !!window.MathJax.tex2svg;
    
    if (!window.MathJax.tex2svg) {
      testResults.error = 'MathJax.tex2svg 方法不可用';
      return testResults;
    }
    
    // 尝试渲染一个简单的公式
    console.log('[LaTeX Debug] 尝试渲染测试公式: E = mc^2');
    window.MathJax.texReset();
    const result = window.MathJax.tex2svg('E = mc^2', { display: false });
    
    if (result && result.firstChild) {
      testResults.renderTest = true;
      testResults.details.renderResult = result.firstChild.outerHTML.substring(0, 100);
      console.log('[LaTeX Debug] 测试渲染成功');
    } else {
      testResults.error = '渲染结果为空';
    }
    
  } catch (error) {
    testResults.error = error.message;
    console.error('[LaTeX Debug] 测试失败:', error);
  }
  
  console.log('[LaTeX Debug] MathJax 测试结果:', testResults);
  return testResults;
};

/**
 * 在控制台中添加 LaTeX 调试工具
 */
export const addDebugTools = () => {
  if (typeof window !== 'undefined') {
    window.latexDebug = {
      testMathJax,
      
      // 手动渲染公式
      renderFormula: async (latex, isDisplayMode = false) => {
        try {
          if (!window.MathJax || !window.MathJax.tex2svg) {
            return { error: 'MathJax 不可用' };
          }
          
          console.log(`[LaTeX Debug] 手动渲染公式: ${latex}`);
          window.MathJax.texReset();
          const result = window.MathJax.tex2svg(latex, { display: isDisplayMode });
          
          if (result && result.firstChild) {
            return {
              success: true,
              svg: result.firstChild.outerHTML
            };
          } else {
            return { error: '渲染结果为空' };
          }
        } catch (error) {
          return { error: error.message };
        }
      },
      
      // 测试公式识别
      testExtraction: async (text) => {
        try {
          const { extractLatexFormulas } = await import('./latexUtils');
          return extractLatexFormulas(text);
        } catch (error) {
          return { error: error.message };
        }
      }
    };
    
    console.log('[LaTeX Debug] 调试工具已添加到 window.latexDebug');
    console.log('[LaTeX Debug] 可用命令:');
    console.log('  window.latexDebug.testMathJax() - 测试 MathJax');
    console.log('  window.latexDebug.renderFormula("E = mc^2") - 手动渲染公式');
    console.log('  window.latexDebug.testExtraction("$E = mc^2$") - 测试公式识别');
  }
};

/**
 * 等待 MathJax 加载并测试
 * @returns {Promise<boolean>} 是否成功
 */
export const waitAndTestMathJax = async () => {
  console.log('[LaTeX Debug] 等待 MathJax 加载...');
  
  let attempts = 0;
  const maxAttempts = 50; // 5秒超时
  
  while (attempts < maxAttempts) {
    if (window.MathJax && window.MathJax.tex2svg) {
      console.log(`[LaTeX Debug] MathJax 加载完成 (${attempts * 100}ms)`);
      
      // 运行测试
      const testResult = await testMathJax();
      return testResult.renderTest;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  console.error('[LaTeX Debug] MathJax 加载超时');
  return false;
};
