/**
 * LaTeX 公式识别测试脚本
 * 用于调试和验证单行vs多行公式的识别问题
 */

// 导入 LaTeX 工具函数
const { extractLatexFormulas, FORMULA_TYPES, validateLatexSyntax } = require('./src/utils/latexUtils');

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
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n=== 测试 ${index + 1}: ${testCase.name} ===`);
  console.log('原始内容:', JSON.stringify(testCase.content));
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
      
      // 验证语法
      if (formula.latex) {
        const isValidSyntax = validateLatexSyntax(formula.latex);
        console.log(`    语法检查: ${isValidSyntax}`);
      }
    });
    
    if (formulas.length === 0) {
      console.log('❌ 没有识别到公式！');
      
      // 手动测试正则表达式
      console.log('\n--- 手动正则测试 ---');
      const blockPattern = /\$\$\s*([\s\S]*?)\s*\$\$/g;
      const inlinePattern = /\$(?!\$)([^$\n]*?[^$\s][^$\n]*?)\$/g;
      
      console.log('块级公式匹配:', blockPattern.test(testCase.content));
      blockPattern.lastIndex = 0; // 重置
      const blockMatch = blockPattern.exec(testCase.content);
      if (blockMatch) {
        console.log('块级匹配结果:', blockMatch);
      }
      
      console.log('行内公式匹配:', inlinePattern.test(testCase.content));
      inlinePattern.lastIndex = 0; // 重置  
      const inlineMatch = inlinePattern.exec(testCase.content);
      if (inlineMatch) {
        console.log('行内匹配结果:', inlineMatch);
      }
    } else {
      console.log('✅ 识别成功！');
    }
    
  } catch (error) {
    console.error('❌ 识别过程出错:', error);
  }
});

console.log('\n测试完成。');
