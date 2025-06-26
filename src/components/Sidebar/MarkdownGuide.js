import React, { useState } from 'react';
import { Typography, Divider, Table, Button, message, Tooltip } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;

const GuideContainer = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

const CodeBlockWrapper = styled.div`
  position: relative;
`;

const CodeBlock = styled.pre`
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  overflow-x: auto;
  font-size: 12px;
  margin: 0;
  position: relative;
`;

const CopyButton = styled(Button)`
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0.4;
  padding: 0;
  height: 22px;
  min-width: 22px;
  width: 22px;
  background-color: transparent;
  border: none;
  color: #999;
  box-shadow: none;
  
  &:hover {
    opacity: 0.8;
    background-color: rgba(0, 0, 0, 0.05);
    color: #666;
  }
  
  &:focus {
    background-color: transparent;
    border: none;
    color: #999;
  }
  
  .anticon {
    font-size: 14px;
  }
`;

const ExampleBlock = styled.div`
  margin-top: 8px;
  margin-bottom: 16px;
  border-left: 4px solid #1890ff;
  padding-left: 16px;
`;

const GuideTitle = styled(Title)`
  font-size: 18px !important;
  margin-top: 0 !important;
  margin-bottom: 12px !important;
`;

const SectionTitle = styled(Title)`
  margin-top: 16px !important;
  font-size: 16px !important;
`;

// 创建自定义标题样式组件，使其更紧凑
const CompactHeading = styled.div`
  font-weight: bold;
  display: inline-block;
  margin: 0;
  padding: 0;
  line-height: 1.2;
`;

const H1 = styled(CompactHeading)`
  font-size: 18px;
`;

const H2 = styled(CompactHeading)`
  font-size: 16px;
`;

const H3 = styled(CompactHeading)`
  font-size: 14px;
`;

const H4 = styled(CompactHeading)`
  font-size: 13px;
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    padding: 8px;
    font-size: 13px;
  }
  
  .ant-table-tbody > tr > td {
    padding: 8px;
    font-size: 12px;
  }
  
  .ant-table-cell ul, .ant-table-cell ol {
    margin-top: 0;
    margin-bottom: 0;
    padding-left: 16px;
  }
  
  .ant-table-cell li {
    line-height: 1.3;
  }
  
  .ant-table-cell li ul, .ant-table-cell li ol {
    padding-left: 14px;
    margin-top: 0;
    margin-bottom: 0;
  }
`;

const MarkdownGuide = () => {
  // 复制状态管理
  const [copiedStates, setCopiedStates] = useState({});
  
  // 复制到剪贴板的函数
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // 复制成功
        message.success('复制成功！');
        
        // 更新复制状态
        setCopiedStates(prev => ({
          ...prev,
          [key]: true
        }));
        
        // 2秒后重置状态
        setTimeout(() => {
          setCopiedStates(prev => ({
            ...prev,
            [key]: false
          }));
        }, 2000);
      },
      () => {
        // 复制失败
        message.error('复制失败，请手动复制');
      }
    );
  };
  
  // 表格示例数据
  const tableColumns = [
    {
      title: 'Markdown语法',
      dataIndex: 'syntax',
      key: 'syntax',
      width: '30%',
      render: (text, record) => (
        <CodeBlockWrapper>
          <CodeBlock>{text}</CodeBlock>
          <Tooltip title={copiedStates[record.key] ? "已复制" : "复制语法"}>
            <CopyButton 
              type="text" 
              size="small" 
              icon={copiedStates[record.key] ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => copyToClipboard(text, record.key)} 
            />
          </Tooltip>
        </CodeBlockWrapper>
      )
    },
    {
      title: '效果',
      dataIndex: 'result',
      key: 'result',
      width: '30%',
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      width: '40%',
    }
  ];
  
  const headingData = [
    {
      key: '1',
      syntax: '# 一级标题',
      result: <H1>一级标题</H1>,
      description: '使用 # 加空格表示一级标题'
    },
    {
      key: '2',
      syntax: '## 二级标题',
      result: <H2>二级标题</H2>,
      description: '使用 ## 加空格表示二级标题'
    },
    {
      key: '3',
      syntax: '### 三级标题',
      result: <H3>三级标题</H3>,
      description: '使用 ### 加空格表示三级标题'
    },
    {
      key: '4',
      syntax: '#### 四级标题',
      result: <H4>四级标题</H4>,
      description: '使用 #### 加空格表示四级标题'
    }
  ];
  
  const textStyleData = [
    {
      key: '1',
      syntax: '**粗体文本**',
      result: <Text strong>粗体文本</Text>,
      description: '使用两个星号包围文本'
    },
    {
      key: '2',
      syntax: '*斜体文本*',
      result: <Text italic>斜体文本</Text>,
      description: '使用一个星号包围文本'
    },
    {
      key: '3',
      syntax: '~~删除线~~',
      result: <Text delete>删除线</Text>,
      description: '使用两个波浪线包围文本'
    }
  ];
  
  const listData = [
    {
      key: '1',
      syntax: '- 无序列表项\n- 无序列表项\n- 无序列表项',
      result: (
        <ul>
          <li>无序列表项</li>
          <li>无序列表项</li>
          <li>无序列表项</li>
        </ul>
      ),
      description: '使用 - 加空格表示无序列表项'
    },
    {
      key: '2',
      syntax: '1. 有序列表项\n2. 有序列表项\n3. 有序列表项',
      result: (
        <ol>
          <li>有序列表项</li>
          <li>有序列表项</li>
          <li>有序列表项</li>
        </ol>
      ),
      description: '使用数字加点和空格表示有序列表项'
    },
    {
      key: '3',
      syntax: '- 一级列表\n\t- 二级列表\n\t\t- 三级列表',
      result: (
        <div style={{lineHeight: '1.3'}}>
          • 一级列表
          <div style={{paddingLeft: '12px'}}>
            ○ 二级列表
            <div style={{paddingLeft: '12px'}}>
              ■ 三级列表
            </div>
          </div>
        </div>
      ),
      description: '使用Tab键缩进创建嵌套列表'
    }
  ];
  
  const otherData = [
    {
      key: '1',
      syntax: '> 引用文本',
      result: <blockquote>引用文本</blockquote>,
      description: '使用 > 加空格表示引用'
    },
    {
      key: '2',
      syntax: '[链接文本](https://example.com)',
      result: <a href="https://example.com">链接文本</a>,
      description: '使用 [文本](URL) 表示链接'
    },
    {
      key: '3',
      syntax: '![图片描述](图片URL)',
      result: '显示图片',
      description: '使用 ![描述](URL) 插入图片'
    }
  ];
  
  const tableExampleData = [
    {
      key: '1',
      syntax: '| 表头1 | 表头2 | 表头3 |\n| --- | --- | --- |\n| 单元格1 | 单元格2 | 单元格3 |\n| 单元格4 | 单元格5 | 单元格6 |',
      result: (
        <div style={{ fontSize: '12px', width: '100%', overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: 'auto', tableLayout: 'auto', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center', minWidth: '60px' }}>表头1</th>
                <th style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center', minWidth: '60px' }}>表头2</th>
                <th style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center', minWidth: '60px' }}>表头3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>单元格1</td>
                <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>单元格2</td>
                <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>单元格3</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>单元格4</td>
                <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>单元格5</td>
                <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>单元格6</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      description: '使用 | 分隔表格列，使用 --- 分隔表头和内容'
    }
  ];

  return (
    <GuideContainer>
      <GuideTitle level={4}>Markdown基本语法</GuideTitle>
      <Paragraph>
        Markdown是一种轻量级标记语言，用于简单的文本格式化。以下是一些常用的Markdown语法示例。
      </Paragraph>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <SectionTitle level={4}>标题</SectionTitle>
      <StyledTable 
        columns={tableColumns} 
        dataSource={headingData} 
        pagination={false}
        bordered
        size="small"
      />
      
      <SectionTitle level={4}>文本样式</SectionTitle>
      <StyledTable 
        columns={tableColumns} 
        dataSource={textStyleData} 
        pagination={false}
        bordered
        size="small"
      />
      
      <SectionTitle level={4}>列表</SectionTitle>
      <StyledTable 
        columns={tableColumns} 
        dataSource={listData} 
        pagination={false}
        bordered
        size="small"
      />
      
      <SectionTitle level={4}>表格</SectionTitle>
      <StyledTable 
        columns={tableColumns} 
        dataSource={tableExampleData} 
        pagination={false}
        bordered
        size="small"
      />
      
      <SectionTitle level={4}>其他元素</SectionTitle>
      <StyledTable 
        columns={tableColumns} 
        dataSource={otherData} 
        pagination={false}
        bordered
        size="small"
      />
      
      <Divider style={{ margin: '12px 0' }} />
      
      <Paragraph>
        <Text strong>提示：</Text> 在Markdown中，需要空一行才能开始新的段落。点击代码块右上角的复制按钮可以快速复制语法示例。嵌套列表使用Tab键缩进，导出Word时自动使用不同样式的项目符号。
      </Paragraph>
    </GuideContainer>
  );
};

export default MarkdownGuide; 