// 模拟前端发送LaTeX到后端的过程
console.log('=== 测试前端LaTeX处理流程 ===\n');

// 模拟前端的LaTeX字符串（从浏览器中看到的）
const frontendLatex = '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} e \\\\ f \\end{pmatrix}';

console.log('1. 前端原始LaTeX字符串:');
console.log('Raw:', frontendLatex);
console.log('Length:', frontendLatex.length);
console.log('Contains \\\\:', frontendLatex.includes('\\\\'));
console.log('Contains \\:', frontendLatex.includes('\\'));
console.log('JSON.stringify:', JSON.stringify(frontendLatex));
console.log('');

// 模拟JSON.stringify处理（前端发送请求时会这样做）
const jsonString = JSON.stringify(frontendLatex);
console.log('2. JSON.stringify后的字符串:');
console.log('Raw:', jsonString);
console.log('Length:', jsonString.length);
console.log('Contains \\\\:', jsonString.includes('\\\\'));
console.log('Contains \\:', jsonString.includes('\\'));
console.log('');

// 模拟JSON.parse处理（后端接收时会这样做）
const parsedLatex = JSON.parse(jsonString);
console.log('3. JSON.parse后的字符串:');
console.log('Raw:', parsedLatex);
console.log('Length:', parsedLatex.length);
console.log('Contains \\\\:', parsedLatex.includes('\\\\'));
console.log('Contains \\:', parsedLatex.includes('\\'));
console.log('');

// 模拟后端接收到的LaTeX字符串
const backendLatex = parsedLatex;
console.log('4. 后端接收到的LaTeX字符串:');
console.log('Raw:', backendLatex);
console.log('Length:', backendLatex.length);
console.log('Contains \\\\:', backendLatex.includes('\\\\'));
console.log('Contains \\:', backendLatex.includes('\\'));
console.log('');

// 检查是否有问题
if (!backendLatex.includes('\\\\')) {
  console.log('❌ 问题发现：后端接收到的LaTeX字符串中缺少双反斜杠！');
  console.log('这会导致LaTeX解析错误：Misplaced &');
} else {
  console.log('✅ LaTeX字符串处理正常');
}

console.log('\n=== 测试完成 ===');
