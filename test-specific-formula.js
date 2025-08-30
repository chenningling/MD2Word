const axios = require('axios');

async function testSpecificFormula() {
  try {
    console.log('=== 测试特定公式转换 ===');
    
    const latex = 'ax^2+bx+c=0';
    console.log(`原始LaTeX: ${latex}`);
    
    const response = await axios.post('http://localhost:3001/api/latex-to-omml', {
      latex: latex,
      displayMode: true
    });
    
    if (response.data.success) {
      console.log('\n✅ 转换成功');
      console.log('返回的OMML:');
      console.log(response.data.omml);
      
      // 分析OMML结构
      const omml = response.data.omml;
      
      // 提取文本内容以验证顺序
      const textMatches = omml.match(/<m:t[^>]*>([^<]*)<\/m:t>/g) || [];
      const texts = textMatches.map(match => match.replace(/<m:t[^>]*>([^<]*)<\/m:t>/, '$1'));
      
      console.log('\n📝 提取的文本片段:');
      texts.forEach((text, index) => {
        console.log(`  ${index + 1}: "${text}"`);
      });
      
      console.log(`\n🔍 合并后的文本: "${texts.join('')}"`);
      console.log(`🎯 期望的文本: "ax2+bx+c=0"`);
      
      // 检查是否包含上标结构
      const supMatches = omml.match(/<m:sSup>.*?<\/m:sSup>/gs) || [];
      console.log(`\n📊 上标结构数量: ${supMatches.length}`);
      
      if (supMatches.length > 0) {
        console.log('上标结构:');
        supMatches.forEach((sup, index) => {
          const supTexts = sup.match(/<m:t[^>]*>([^<]*)<\/m:t>/g) || [];
          const supContent = supTexts.map(match => match.replace(/<m:t[^>]*>([^<]*)<\/m:t>/, '$1')).join('');
          console.log(`  ${index + 1}: 包含 "${supContent}"`);
        });
      }
      
    } else {
      console.log('❌ 转换失败:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

testSpecificFormula();
