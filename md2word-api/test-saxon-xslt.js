/**
 * 测试 SaxonJS 与微软 MML2OMML.XSL 的兼容性
 */

const SaxonJS = require('saxon-js');
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

async function testSaxonXSLT() {
  console.log('🧪 开始测试 SaxonJS 与微软 XSL 的兼容性...\n');
  
  try {
    // 1. 检查 SaxonJS 版本
    console.log('📋 SaxonJS 版本信息:');
    console.log(`   版本: ${SaxonJS.version || '未知'}`);
    console.log(`   平台: ${SaxonJS.platform || '未知'}\n`);
    
    // 2. 读取 XSL 文件
    const xslPath = path.join(__dirname, 'MML2OMML.XSL');
    console.log('📁 XSL 文件信息:');
    console.log(`   路径: ${xslPath}`);
    
    if (!fs.existsSync(xslPath)) {
      throw new Error('MML2OMML.XSL 文件不存在');
    }
    
    const xslContent = fs.readFileSync(xslPath, 'utf8');
    console.log(`   大小: ${(xslContent.length / 1024).toFixed(2)} KB`);
    console.log(`   编码: UTF-8\n`);
    
    // 3. 检查 XSL 文件内容
    console.log('🔍 XSL 文件内容分析:');
    const hasMathNamespace = xslContent.includes('xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"');
    const hasMathMLNamespace = xslContent.includes('xmlns="http://www.w3.org/1998/Math/MathML"');
    console.log(`   包含 OMML 命名空间: ${hasMathNamespace ? '✅' : '❌'}`);
    console.log(`   包含 MathML 命名空间: ${hasMathMLNamespace ? '✅' : '❌'}`);
    console.log(`   主要模板数量: ${(xslContent.match(/<xsl:template/g) || []).length}\n`);
    
    // 4. 尝试使用 SaxonJS 转换
    console.log('⚡ 尝试 SaxonJS 转换...');
    
    // 准备转换参数
    const sourceText = testMathML;
    
    // 设置转换选项 - 使用正确的 SaxonJS API
    const options = {
      sourceText: sourceText,
      stylesheetText: xslContent,
      destination: 'serialized',
      outputProperties: {
        method: 'xml',
        indent: true,
        encoding: 'UTF-8'
      }
    };
    
    console.log('   转换选项:', JSON.stringify(options, null, 2));
    
    // 执行转换
    const result = SaxonJS.transform(options);
    
    console.log('✅ SaxonJS 转换成功!');
    console.log('   结果长度:', result.length);
    console.log('   结果预览:', result.substring(0, 200) + '...\n');
    
    // 5. 验证结果
    console.log('🔍 结果验证:');
    const isOMML = result.includes('<m:oMath') || result.includes('xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"');
    console.log(`   包含 OMML 标记: ${isOMML ? '✅' : '❌'}`);
    console.log(`   结果类型: ${typeof result}`);
    
    if (isOMML) {
      console.log('\n🎉 成功！SaxonJS 可以与微软 XSL 配合使用！');
      return true;
    } else {
      console.log('\n⚠️  转换结果不是预期的 OMML 格式');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('   错误详情:', error);
    
    // 分析错误类型
    if (error.message.includes('stylesheet')) {
      console.log('\n💡 可能的问题: XSL 文件格式不兼容');
    } else if (error.message.includes('source')) {
      console.log('\n💡 可能的问题: MathML 源格式问题');
    } else if (error.message.includes('SaxonJS')) {
      console.log('\n💡 可能的问题: SaxonJS 配置问题');
    }
    
    return false;
  }
}

// 运行测试
testSaxonXSLT().then(success => {
  if (success) {
    console.log('\n🚀 建议: 可以直接使用 SaxonJS + 微软 XSL 方案');
  } else {
    console.log('\n🔧 建议: 需要进一步调试或考虑替代方案');
  }
  process.exit(success ? 0 : 1);
});
