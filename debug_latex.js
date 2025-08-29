/**
 * 调试 LaTeX 处理问题的测试脚本
 */

const { extractLatexFormulas } = require('./src/utils/latexUtils');

// 测试简单的 Markdown
const testMarkdown = `# 测试

$$a + b = c$$

这是行内公式：$E = mc^2$

$$x^2 + y^2 = z^2$$`;

console.log('=== LaTeX 公式提取测试 ===');
console.log('原始 Markdown:');
console.log(testMarkdown);
console.log('\n提取的公式:');

const formulas = extractLatexFormulas(testMarkdown);
formulas.forEach((formula, index) => {
  console.log(`${index + 1}. ${formula.type}: "${formula.latex}" (${formula.startIndex}-${formula.endIndex})`);
});

console.log(`\n总计: ${formulas.length} 个公式`);

// 测试 marked 解析
const marked = require('marked');
console.log('\n=== Marked 解析测试 ===');
const tokens = marked.lexer(testMarkdown);
console.log('解析的 tokens:');
tokens.forEach((token, index) => {
  console.log(`${index + 1}. ${token.type}: "${token.text || token.raw || 'N/A'}"`);
});

