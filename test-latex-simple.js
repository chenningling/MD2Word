/**
 * 简化的 LaTeX 公式识别测试
 */

// 复制 latexUtils.js 中的正则表达式和函数
const LATEX_PATTERNS = {
  // 行内公式：$...$（不允许跨行，不允许连续的$符号）
  INLINE: /\$(?!\$)([^$\n]*?[^$\s][^$\n]*?)\$/g,
  
  // 块级公式：$$...$$（允许跨行，改进正则表达式以更好地处理换行）
  BLOCK: /\$\$\s*([\s\S]*?)\s*\$\$/g,
  
  // 组合模式：用于一次性匹配所有公式
  COMBINED: /(\$\$[\s\S]*?\$\$|\$[^$\n]*?[^$\s][^$\n]*?\$)/g,
  
  // 验证模式：检查公式语法的基本有效性
  VALIDATION: /^[\s\S]*[\w})\]]\s*$/
};

const FORMULA_TYPES = {
  INLINE: 'inline',
  BLOCK: 'block'
};

// 简化的验证函数
const validateLatexSyntax = (latex) => {
  if (!latex || !latex.trim()) {
    return false;
  }
  return LATEX_PATTERNS.VALIDATION.test(latex);
};

// 简化的公式提取函数
const extractLatexFormulas = (text) => {
  console.log('[测试] 开始提取 LaTeX 公式，文本长度:', text.length);
  
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

console.log('开始测试 LaTeX 公式识别...\n');

// 测试用例
const testCases = [
  {
    name: '单行公式（工作正常）',
    content: '$$\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u$$'
  },
  {
    name: '多行公式（有问题）', 
    content: `$$
\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u
$$`
  },
  {
    name: '带额外空格的多行公式',
    content: `$$   
    \\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u   
$$`
  },
  {
    name: '行内公式',
    content: '$E = mc^2$'
  },
  {
    name: '混合内容',
    content: `这是一个测试文档。

单行公式：$$\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u$$

多行公式：
$$
\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u
$$

行内公式：$E = mc^2$
`
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n=== 测试 ${index + 1}: ${testCase.name} ===`);
  console.log('原始内容:');
  console.log(JSON.stringify(testCase.content));
  console.log('内容长度:', testCase.content.length);
  
  try {
    const formulas = extractLatexFormulas(testCase.content);
    
    console.log(`发现 ${formulas.length} 个公式:`);
    formulas.forEach((formula, i) => {
      console.log(`  公式 ${i + 1}:`);
      console.log(`    ID: ${formula.id}`);
      console.log(`    类型: ${formula.type}`);
      console.log(`    原始: ${JSON.stringify(formula.raw)}`);
      console.log(`    LaTeX: ${JSON.stringify(formula.latex)}`);
      console.log(`    位置: ${formula.startIndex}-${formula.endIndex}`);
      console.log(`    有效: ${formula.isValid}`);
    });
    
    if (formulas.length === 0) {
      console.log('❌ 没有识别到公式！');
      
      // 手动测试正则表达式
      console.log('\n--- 手动正则测试 ---');
      const blockPattern = /\$\$\s*([\s\S]*?)\s*\$\$/g;
      
      console.log('测试块级公式匹配...');
      blockPattern.lastIndex = 0; 
      let blockMatch;
      while ((blockMatch = blockPattern.exec(testCase.content)) !== null) {
        console.log('块级匹配结果:', {
          fullMatch: blockMatch[0],
          captured: blockMatch[1],
          index: blockMatch.index
        });
      }
    } else {
      console.log('✅ 识别成功！');
    }
    
  } catch (error) {
    console.error('❌ 识别过程出错:', error);
  }
});

console.log('\n测试完成。');
