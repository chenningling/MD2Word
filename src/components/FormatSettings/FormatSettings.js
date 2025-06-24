import React, { useState } from 'react';
import { Layout, Tabs, Select, Form, InputNumber, Button, Radio, Collapse, Typography } from 'antd';
import { CloseOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';

const { Sider } = Layout;
const { TabPane } = Tabs;
const { Option } = Select;
const { Panel } = Collapse;
const { Title } = Typography;

const StyledSider = styled(Sider)`
  background-color: white;
  height: 100%;
  overflow: auto;
  border-left: 1px solid #f0f0f0;
  
  .ant-layout-sider-children {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
`;

const SettingsTitle = styled(Title)`
  margin: 0 !important;
  font-size: 16px !important;
`;

const SettingsContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow: auto;
`;

const TemplateSelect = styled.div`
  margin-bottom: 20px;
`;

const FormItem = styled(Form.Item)`
  margin-bottom: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  gap: 8px;
`;

// 预设模板列表
const templates = [
  { id: 'default', name: '默认样式' },
  { id: 'academic', name: '研究论文' },
  { id: 'legal', name: '法律文书' },
  { id: 'business', name: '公司公文' },
];

// 字体列表
const fonts = [
  { value: '宋体', label: '宋体' },
  { value: '微软雅黑', label: '微软雅黑' },
  { value: '黑体', label: '黑体' },
  { value: '仿宋', label: '仿宋' },
  { value: '楷体', label: '楷体' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
];

// 对齐方式
const alignOptions = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
  { value: 'justify', label: '两端对齐' },
];

const FormatSettings = ({ visible, toggleSettings }) => {
  const { formatSettings, updateFormatSettings, customTemplates, addCustomTemplate } = useDocument();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('content');
  const [selectedTemplate, setSelectedTemplate] = useState(formatSettings.template);

  // 处理模板选择
  const handleTemplateChange = (value) => {
    setSelectedTemplate(value);
    // 这里应该根据选择的模板更新设置
    // 在实际应用中，需要从预设模板或自定义模板中获取设置
    // 这里简化处理
    updateFormatSettings({ template: value });
  };

  // 处理内容设置变更
  const handleContentSettingChange = (elementType, field, value) => {
    const newSettings = { ...formatSettings };
    newSettings.content[elementType][field] = value;
    updateFormatSettings(newSettings);
  };

  // 处理页面设置变更
  const handlePageSettingChange = (field, value) => {
    const newSettings = { ...formatSettings };
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newSettings.page[parent][child] = value;
    } else {
      newSettings.page[field] = value;
    }
    updateFormatSettings(newSettings);
  };

  // 保存当前设置为自定义模板
  const saveAsTemplate = () => {
    // 实际应用中应该弹出对话框让用户输入模板名称
    const templateName = `自定义模板 ${customTemplates.length + 1}`;
    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: templateName,
      settings: { ...formatSettings }
    };
    addCustomTemplate(newTemplate);
  };

  // 渲染元素类型设置
  const renderElementSettings = (elementType, title) => {
    const settings = formatSettings.content[elementType];
    
    return (
      <Panel header={title} key={elementType}>
        <FormItem label="字体">
          <Select 
            value={settings.fontFamily} 
            onChange={(value) => handleContentSettingChange(elementType, 'fontFamily', value)}
            style={{ width: '100%' }}
          >
            {fonts.map(font => (
              <Option key={font.value} value={font.value}>{font.label}</Option>
            ))}
          </Select>
        </FormItem>
        
        <FormItem label="字号">
          <InputNumber 
            value={settings.fontSize} 
            onChange={(value) => handleContentSettingChange(elementType, 'fontSize', value)}
            min={8}
            max={72}
            style={{ width: '100%' }}
          />
        </FormItem>
        
        <FormItem label="粗体">
          <Radio.Group 
            value={settings.bold} 
            onChange={(e) => handleContentSettingChange(elementType, 'bold', e.target.value)}
          >
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </FormItem>
        
        <FormItem label="行间距">
          <InputNumber 
            value={settings.lineHeight} 
            onChange={(value) => handleContentSettingChange(elementType, 'lineHeight', value)}
            min={1}
            max={3}
            step={0.1}
            style={{ width: '100%' }}
          />
        </FormItem>
        
        <FormItem label="对齐方式">
          <Select 
            value={settings.align} 
            onChange={(value) => handleContentSettingChange(elementType, 'align', value)}
            style={{ width: '100%' }}
          >
            {alignOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </FormItem>
      </Panel>
    );
  };

  if (!visible) return null;

  return (
    <StyledSider width={300}>
      <SettingsHeader>
        <SettingsTitle level={4}>排版格式设置</SettingsTitle>
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={toggleSettings} 
        />
      </SettingsHeader>
      
      <SettingsContent>
        <TemplateSelect>
          <FormItem label="预设模板">
            <Select 
              value={selectedTemplate} 
              onChange={handleTemplateChange}
              style={{ width: '100%' }}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <ButtonGroup>
                    <Button 
                      type="text" 
                      icon={<SaveOutlined />} 
                      onClick={saveAsTemplate}
                    >
                      保存当前设置为模板
                    </Button>
                  </ButtonGroup>
                </>
              )}
            >
              {templates.map(template => (
                <Option key={template.id} value={template.id}>{template.name}</Option>
              ))}
              {customTemplates.map(template => (
                <Option key={template.id} value={template.id}>{template.name}</Option>
              ))}
            </Select>
          </FormItem>
        </TemplateSelect>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="内容设置" key="content">
            <Collapse defaultActiveKey={['heading1']}>
              {renderElementSettings('heading1', '一级标题')}
              {renderElementSettings('heading2', '二级标题')}
              {renderElementSettings('heading3', '三级标题')}
              {renderElementSettings('paragraph', '正文')}
              {renderElementSettings('quote', '引用')}
            </Collapse>
          </TabPane>
          
          <TabPane tab="页面布局" key="page">
            <FormItem label="纸张大小">
              <Select 
                value={formatSettings.page.size} 
                onChange={(value) => handlePageSettingChange('size', value)}
                style={{ width: '100%' }}
              >
                <Option value="A4">A4</Option>
                <Option value="Letter">Letter</Option>
                <Option value="Legal">Legal</Option>
              </Select>
            </FormItem>
            
            <FormItem label="页边距 (厘米)">
              <Form.Item label="上" style={{ marginBottom: 8 }}>
                <InputNumber 
                  value={formatSettings.page.margin.top} 
                  onChange={(value) => handlePageSettingChange('margin.top', value)}
                  min={0}
                  max={10}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item label="右" style={{ marginBottom: 8 }}>
                <InputNumber 
                  value={formatSettings.page.margin.right} 
                  onChange={(value) => handlePageSettingChange('margin.right', value)}
                  min={0}
                  max={10}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item label="下" style={{ marginBottom: 8 }}>
                <InputNumber 
                  value={formatSettings.page.margin.bottom} 
                  onChange={(value) => handlePageSettingChange('margin.bottom', value)}
                  min={0}
                  max={10}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item label="左" style={{ marginBottom: 8 }}>
                <InputNumber 
                  value={formatSettings.page.margin.left} 
                  onChange={(value) => handlePageSettingChange('margin.left', value)}
                  min={0}
                  max={10}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </FormItem>
          </TabPane>
        </Tabs>
      </SettingsContent>
    </StyledSider>
  );
};

export default FormatSettings; 