console.log('Testing LaTeX string processing:');

// 测试不同的LaTeX字符串格式
const testCases = [
  '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
  '\\begin{pmatrix} a & b \\ c & d \\end{pmatrix}',
  '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} e \\\\ f \\end{pmatrix}'
];

testCases.forEach((latex, index) => {
  console.log(`\nTest case ${index + 1}:`);
  console.log('Original:', latex);
  console.log('Length:', latex.length);
  console.log('Contains \\\\:', latex.includes('\\\\'));
  console.log('Contains \\:', latex.includes('\\'));
  console.log('Raw string representation:', JSON.stringify(latex));
});
