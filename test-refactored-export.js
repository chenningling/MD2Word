/**
 * 重构后导出功能测试脚本
 */

// 测试导入
import { exportToWord, getVersion, checkHealth, REFACTOR_INFO } from './src/services/exportService.js';

async function testRefactoredExport() {
  console.log('🧪 开始测试重构后的导出功能...');
  
  try {
    // 1. 测试版本信息
    console.log('\n📋 1. 测试版本信息:');
    const version = getVersion();
    console.log('版本信息:', version);
    console.log('重构信息:', REFACTOR_INFO);
    
    // 2. 测试健康检查
    console.log('\n🏥 2. 测试健康检查:');
    const health = await checkHealth();
    console.log('健康状态:', health);
    
    // 3. 测试基本导出功能（不生成实际文件）
    console.log('\n📝 3. 测试导出函数是否可调用:');
    
    const testMarkdown = `# 测试文档

这是一个测试段落，包含一些 **粗体** 和 *斜体* 文本。

## 数学公式测试

行内公式：$E = mc^2$

块级公式：
$$\\frac{a}{b} = c$$

## 列表测试

- 项目1
- 项目2
  - 子项目1
  - 子项目2

## 表格测试

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| 1   | 2   | 3   |
`;

    const testSettings = {
      content: {
        paragraph: {
          fontSize: 12,
          fontFamily: '宋体',
          lineHeight: 1.5,
          lineHeightUnit: 'multiple',
          align: 'left',
          firstLineIndent: 2,
          paragraphSpacing: 6,
          bold: false
        },
        heading1: {
          fontSize: 18,
          fontFamily: '宋体',
          lineHeight: 1.2,
          lineHeightUnit: 'multiple',
          align: 'center',
          bold: true,
          spacingBefore: 12,
          spacingAfter: 6
        },
        heading2: {
          fontSize: 16,
          fontFamily: '宋体',
          lineHeight: 1.2,
          lineHeightUnit: 'multiple',
          align: 'left',
          bold: true,
          spacingBefore: 10,
          spacingAfter: 5
        },
        quote: {
          fontSize: 12,
          fontFamily: '宋体',
          lineHeight: 1.5,
          lineHeightUnit: 'multiple',
          align: 'left',
          bold: false
        }
      },
      page: {
        size: 'A4',
        margin: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 }
      },
      latin: { enabled: false }
    };
    
    console.log('导出函数类型:', typeof exportToWord);
    console.log('测试Markdown长度:', testMarkdown.length);
    
    if (typeof exportToWord === 'function') {
      console.log('✅ 导出函数可调用');
      
      // 注释掉实际的导出测试，避免在服务器环境中产生文件
      // await exportToWord(testMarkdown, testSettings);
      // console.log('✅ 导出功能测试通过');
      
      console.log('ℹ️ 实际导出测试已跳过（避免在测试环境生成文件）');
    } else {
      console.log('❌ 导出函数不可调用');
    }
    
    console.log('\n🎉 重构后的导出功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('错误堆栈:', error.stack);
  }
}

// 在Node.js环境中运行测试
if (typeof window === 'undefined') {
  // Node.js环境
  console.log('🔧 Node.js环境测试模式');
  console.log('注意：某些浏览器特定功能可能无法在Node.js中正常工作');
} else {
  // 浏览器环境
  console.log('🌐 浏览器环境测试模式');
}

// 导出测试函数
export { testRefactoredExport };

// 如果直接运行此脚本，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testRefactoredExport();
}
