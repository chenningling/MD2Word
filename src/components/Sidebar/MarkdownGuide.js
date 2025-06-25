import React from 'react';
import { Typography, Divider, Table } from 'antd';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;

const GuideContainer = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

const CodeBlock = styled.pre`
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  overflow-x: auto;
  font-size: 12px;
  margin: 0;
`;

const ExampleBlock = styled.div`
  margin-top: 8px;
  margin-bottom: 16px;
  border-left: 4px solid #1890ff;
  padding-left: 16px;
`;

const SectionTitle = styled(Title)`
  margin-top: 16px !important;
  font-size: 16px !important;
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
`;

const MarkdownGuide = () => {
  // 表格示例数据
  const tableColumns = [
    {
      title: 'Markdown语法',
      dataIndex: 'syntax',
      key: 'syntax',
      width: '30%',
      render: text => <CodeBlock>{text}</CodeBlock>
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
      result: <Title level={1}>一级标题</Title>,
      description: '使用 # 加空格表示一级标题'
    },
    {
      key: '2',
      syntax: '## 二级标题',
      result: <Title level={2}>二级标题</Title>,
      description: '使用 ## 加空格表示二级标题'
    },
    {
      key: '3',
      syntax: '### 三级标题',
      result: <Title level={3}>三级标题</Title>,
      description: '使用 ### 加空格表示三级标题'
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
        <Table
          pagination={false}
          size="small"
          columns={[
            { title: '表头1', dataIndex: 'col1', key: 'col1' },
            { title: '表头2', dataIndex: 'col2', key: 'col2' },
            { title: '表头3', dataIndex: 'col3', key: 'col3' }
          ]}
          dataSource={[
            { key: '1', col1: '单元格1', col2: '单元格2', col3: '单元格3' },
            { key: '2', col1: '单元格4', col2: '单元格5', col3: '单元格6' }
          ]}
        />
      ),
      description: '使用 | 分隔表格列，使用 --- 分隔表头和内容'
    }
  ];

  return (
    <GuideContainer>
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
        <Text strong>提示：</Text> 在Markdown中，需要空一行才能开始新的段落。
      </Paragraph>
    </GuideContainer>
  );
};

export default MarkdownGuide; 