/**
 * 测试后端 LaTeX 公式转换 API
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/formula';

async function testLatexConversion() {
  console.log('开始测试后端 LaTeX 转换...\n');
  
  // 测试用例 - 对应您提到的问题
  const testCases = [
    {
      name: '单行公式（正常工作）',
      formulas: [
        {
          id: 'test_1',
          latex: '\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u',
          type: 'block'
        }
      ]
    },
    {
      name: '多行公式（可能有问题）',
      formulas: [
        {
          id: 'test_2',
          latex: '\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u', // 注意：这里使用清理后的LaTeX，不包含前后的换行
          type: 'block'
        }
      ]
    },
    {
      name: '行内公式',
      formulas: [
        {
          id: 'test_3',
          latex: 'E = mc^2',
          type: 'inline'
        }
      ]
    }
  ];

  try {
    // 检查后端健康状态
    console.log('1. 检查后端健康状态...');
    const healthResponse = await axios.get(`${API_BASE}/stats`);
    console.log('健康状态:', healthResponse.data);
    console.log('');

    // 测试各个用例
    for (const testCase of testCases) {
      console.log(`2. 测试: ${testCase.name}`);
      console.log('输入公式:', testCase.formulas.map(f => ({
        id: f.id,
        latex: f.latex,
        type: f.type
      })));
      
      try {
        const response = await axios.post(`${API_BASE}/convert`, {
          formulas: testCase.formulas
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('响应状态:', response.status);
        console.log('响应成功:', response.data.success);
        
        if (response.data.success && response.data.data && response.data.data.results) {
          const results = response.data.data.results;
          console.log(`转换结果 (共${results.length}个):`);
          
          results.forEach((result, index) => {
            console.log(`  结果 ${index + 1}:`);
            console.log(`    ID: ${result.id}`);
            console.log(`    成功: ${result.success}`);
            console.log(`    LaTeX: ${result.latex}`);
            console.log(`    显示模式: ${result.isDisplayMode}`);
            
            if (result.success) {
              console.log(`    MathML长度: ${result.mathml ? result.mathml.length : 'N/A'}`);
              console.log(`    OMML长度: ${result.omml ? result.omml.length : 'N/A'}`);
              console.log(`    转换时间: ${result.conversionTime}ms`);
              
              // 显示OMML的预览
              if (result.omml) {
                console.log(`    OMML预览: ${result.omml.substring(0, 150)}...`);
              }
            } else {
              console.log(`    错误: ${result.error}`);
            }
          });
        } else {
          console.log('转换失败:', response.data);
        }
        
      } catch (error) {
        console.error(`测试失败: ${testCase.name}`, error.message);
        if (error.response) {
          console.error('响应数据:', error.response.data);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('连接后端失败:', error.message);
    console.log('请确保后端API服务正在运行 (npm start in md2word-api/)');
  }
}

// 运行测试
testLatexConversion();
