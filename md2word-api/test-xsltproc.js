/**
 * 使用 xsltproc 命令行工具测试微软 MML2OMML.XSL
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 测试用的简单MathML
const testMathML = `
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <msup>
    <mi>E</mi>
    <mn>2</mn>
  </msup>
  <mo>=</mo>
  <msup>
    <mi>m</mi>
    <mn>2</mn>
  </msup>
  <msup>
    <mi>c</mi>
    <mn>4</mn>
  </msup>
</math>
`;

async function testXsltproc() {
  console.log('🧪 开始测试 xsltproc 与微软 XSL 的兼容性...\n');
  
  try {
    // 1. 检查 xsltproc 是否可用
    console.log('📋 xsltproc 检查:');
    const xsltprocPath = '/usr/bin/xsltproc';
    if (!fs.existsSync(xsltprocPath)) {
      throw new Error('xsltproc 不可用');
    }
    console.log(`   路径: ${xsltprocPath} ✅\n`);
    
    // 2. 创建临时MathML文件
    const tempMathMLPath = path.join(__dirname, 'temp_mathml.xml');
    const mathmlContent = `<?xml version="1.0" encoding="UTF-8"?>
${testMathML}`;
    
    fs.writeFileSync(tempMathMLPath, mathmlContent, 'utf8');
    console.log('📁 临时MathML文件:');
    console.log(`   路径: ${tempMathMLPath}`);
    console.log(`   内容: ${testMathML.trim()}\n`);
    
    // 3. 检查 XSL 文件
    const xslPath = path.join(__dirname, 'MML2OMML.XSL');
    console.log('📁 XSL 文件信息:');
    console.log(`   路径: ${xslPath}`);
    
    if (!fs.existsSync(xslPath)) {
      throw new Error('MML2OMML.XSL 文件不存在');
    }
    
    const xslContent = fs.readFileSync(xslPath, 'utf8');
    console.log(`   大小: ${(xslContent.length / 1024).toFixed(2)} KB`);
    console.log(`   编码: UTF-8\n`);
    
    // 4. 使用 xsltproc 转换
    console.log('⚡ 尝试 xsltproc 转换...');
    
    const command = `xsltproc "${xslPath}" "${tempMathMLPath}"`;
    console.log(`   命令: ${command}`);
    
    exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      // 清理临时文件
      if (fs.existsSync(tempMathMLPath)) {
        fs.unlinkSync(tempMathMLPath);
      }
      
      if (error) {
        console.error('\n❌ xsltproc 转换失败:');
        console.error(`   错误: ${error.message}`);
        if (stderr) {
          console.error(`   详细错误: ${stderr}`);
        }
        console.log('\n🔧 建议: 需要进一步调试或考虑替代方案');
        process.exit(1);
      }
      
      console.log('✅ xsltproc 转换成功!');
      console.log(`   结果长度: ${stdout.length}`);
      console.log(`   结果预览: ${stdout.substring(0, 200)}...\n`);
      
      // 5. 验证结果
      console.log('🔍 结果验证:');
      const isOMML = stdout.includes('<m:oMath') || stdout.includes('xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"');
      console.log(`   包含 OMML 标记: ${isOMML ? '✅' : '❌'}`);
      
      if (isOMML) {
        console.log('\n🎉 成功！xsltproc 可以与微软 XSL 配合使用！');
        console.log('\n🚀 建议: 可以使用 xsltproc + 微软 XSL 方案');
        
        // 保存结果到文件
        const resultPath = path.join(__dirname, 'test_result.xml');
        fs.writeFileSync(resultPath, stdout, 'utf8');
        console.log(`   结果已保存到: ${resultPath}`);
      } else {
        console.log('\n⚠️  转换结果不是预期的 OMML 格式');
        console.log('\n🔧 建议: 需要进一步调试或考虑替代方案');
      }
      
      process.exit(isOMML ? 0 : 1);
    });
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('   错误详情:', error);
    process.exit(1);
  }
}

// 运行测试
testXsltproc();
