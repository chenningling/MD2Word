/**
 * 完整的导出流程测试 - 模拟前端到后端的完整过程
 */

const axios = require('axios');

// 模拟前端的 LaTeX 提取函数
const LATEX_PATTERNS = {
  INLINE: /\$(?!\$)([^$\n]*?[^$\s][^$\n]*?)\$/g,
  BLOCK: /\$\$\s*([\s\S]*?)\s*\$\$/g,
  COMBINED: /(\$\$[\s\S]*?\$\$|\$[^$\n]*?[^$\s][^$\n]*?\$)/g,
  VALIDATION: /^[\s\S]*[\w})\]]\s*$/
};

const FORMULA_TYPES = {
  INLINE: 'inline',
  BLOCK: 'block'
};

const validateLatexSyntax = (latex) => {
  if (!latex || !latex.trim()) {
    return false;
  }
  return LATEX_PATTERNS.VALIDATION.test(latex);
};

const extractLatexFormulas = (text) => {
  console.log('[测试] 开始提取 LaTeX 公式，文本长度:', text.length);
  
  const formulas = [];
  let formulaId = 0;

  LATEX_PATTERNS.COMBINED.lastIndex = 0;
  
  let match;
  while ((match = LATEX_PATTERNS.COMBINED.exec(text)) !== null) {
    const fullMatch = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    
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
    
    console.log('[测试] 发现公式', {
      id: formulaInfo.id,
      type: formulaInfo.type,
      latex: latexCode.substring(0, 50) + (latexCode.length > 50 ? '...' : ''),
      position: `${startIndex}-${endIndex}`,
      isValid
    });
  }
  
  console.log(`[测试] 提取完成，共发现 ${formulas.length} 个公式`);
  return formulas;
};

// 模拟后端转换
async function convertFormulasToOmml(formulas) {
  const API_BASE = 'http://localhost:3001/api/formula';
  
  const requestBody = {
    formulas: formulas.map(f => ({
      id: f.id,
      latex: f.latex,
      type: f.type
    }))
  };
  
  console.log('[测试] 发送转换请求到后端:', requestBody);
  
  try {
    const response = await axios.post(`${API_BASE}/convert`, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.success && response.data.data && response.data.data.results) {
      return response.data.data.results;
    } else {
      throw new Error(`API 请求失败: ${response.data.error || '未知错误'}`);
    }
  } catch (error) {
    console.error('[测试] API 请求失败:', error.message);
    throw error;
  }
}

// 模拟文本中的公式替换
function replaceLatexInText(text, conversionResults) {
  console.log('[测试] 开始替换文本中的 LaTeX 公式');
  
  let processedText = text;
  const formulas = extractLatexFormulas(text);
  
  // 按位置倒序处理，避免索引错乱
  const sortedFormulas = [...formulas].sort((a, b) => b.startIndex - a.startIndex);
  
  for (const formula of sortedFormulas) {
    // 查找对应的转换结果
    const conversionResult = conversionResults.find(result => {
      const latexMatches = result.latex === formula.latex;
      const typeMatches = result.isDisplayMode === (formula.type === FORMULA_TYPES.BLOCK);
      
      console.log(`[测试] 匹配检查: ${formula.latex.substring(0, 20)} | LaTeX匹配: ${latexMatches} | 类型匹配: ${typeMatches} | result.isDisplayMode: ${result.isDisplayMode} | formula.type: ${formula.type}`);
      
      return latexMatches && typeMatches;
    });
    
    console.log(`[测试] 公式匹配结果:`, {
      formula: formula.latex.substring(0, 30),
      found: !!conversionResult,
      success: conversionResult?.success,
      availableResults: conversionResults.length
    });
    
    if (conversionResult && conversionResult.success) {
      // 替换为 OMML 标记
      const ommlPlaceholder = `__OMML_PLACEHOLDER_${conversionResult.id}__`;
      
      const beforeText = processedText.substring(0, formula.startIndex);
      const afterText = processedText.substring(formula.endIndex);
      
      processedText = beforeText + ommlPlaceholder + afterText;
      
      console.log(`[测试] 文本中公式已标记: ${formula.latex.substring(0, 30)} → ${ommlPlaceholder}`);
    } else {
      // 转换失败，保持原文
      console.warn(`[测试] 公式转换失败，保持原文: ${formula.latex.substring(0, 30)}`);
    }
  }
  
  return processedText;
}

// 主测试函数
async function testFullExportProcess() {
  console.log('开始完整的导出流程测试...\n');
  
  // 测试用例：包含您提到的两种公式
  const testMarkdowns = [
    {
      name: '包含单行公式的文档',
      content: `# 单行公式测试

这是一个包含单行公式的测试文档。

波动方程：$$\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u$$

这是公式后的文本。`
    },
    {
      name: '包含多行公式的文档',
      content: `# 多行公式测试

这是一个包含多行公式的测试文档。

波动方程：
$$
\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u
$$

这是公式后的文本。`
    },
    {
      name: '混合公式文档',
      content: `# 混合公式测试

这是一个包含多种公式的测试文档。

行内公式：质能方程 $E = mc^2$ 是著名的物理公式。

单行块级公式：$$\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u$$

多行块级公式：
$$
\\int_a^b f(x)dx = F(b) - F(a)
$$

再来一个行内公式：$\\alpha + \\beta = \\gamma$。`
    }
  ];
  
  for (const testCase of testMarkdowns) {
    console.log(`\n=== 测试: ${testCase.name} ===`);
    console.log('原始内容:');
    console.log(testCase.content);
    console.log('');
    
    try {
      // Step 1: 提取公式
      const formulas = extractLatexFormulas(testCase.content);
      
      if (formulas.length === 0) {
        console.log('❌ 没有发现公式，跳过后续测试');
        continue;
      }
      
      // Step 2: 转换公式
      console.log('[测试] 准备转换公式...');
      const conversionResults = await convertFormulasToOmml(formulas);
      
      console.log('[测试] 转换结果:');
      conversionResults.forEach((result, index) => {
        console.log(`  结果 ${index + 1}:`);
        console.log(`    ID: ${result.id}`);
        console.log(`    成功: ${result.success}`);
        console.log(`    LaTeX: ${result.latex}`);
        console.log(`    显示模式: ${result.isDisplayMode}`);
        if (result.success) {
          console.log(`    OMML长度: ${result.omml?.length || 'N/A'}`);
        } else {
          console.log(`    错误: ${result.error}`);
        }
      });
      
      // Step 3: 替换文本中的公式
      console.log('\n[测试] 替换文本中的公式...');
      const processedText = replaceLatexInText(testCase.content, conversionResults);
      
      console.log('[测试] 处理后的文本:');
      console.log(processedText);
      
      // Step 4: 分析结果
      const successCount = conversionResults.filter(r => r.success).length;
      const failedCount = conversionResults.length - successCount;
      
      console.log(`\n[测试] 处理统计:`);
      console.log(`  总公式数: ${formulas.length}`);
      console.log(`  成功转换: ${successCount}`);
      console.log(`  转换失败: ${failedCount}`);
      console.log(`  OMML标记数: ${(processedText.match(/__OMML_PLACEHOLDER_/g) || []).length}`);
      
      if (successCount === formulas.length) {
        console.log('✅ 所有公式转换成功！');
      } else {
        console.log('⚠️ 部分公式转换失败');
      }
      
    } catch (error) {
      console.error(`❌ 测试失败: ${testCase.name}`, error.message);
    }
  }
  
  console.log('\n完整导出流程测试结束');
}

// 运行测试
testFullExportProcess().catch(console.error);
