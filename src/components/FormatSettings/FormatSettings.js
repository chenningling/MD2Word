import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Select, Form, InputNumber, Button, Radio, Collapse, Typography, Modal, Input, message } from 'antd';
import { CloseOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, RedoOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';

const { TabPane } = Tabs;
const { Option } = Select;
const { Panel } = Collapse;
const { Title, Text } = Typography;

const SettingsContainer = styled.div`
  background-color: white;
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-left: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
`;

// 使用与ModuleHeader一致的样式
const SettingsHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  height: 48px;
  box-sizing: border-box;
`;

const SettingsTitle = styled(Title)`
  margin: 0 !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  color: #333 !important;
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

// 添加自定义样式，确保删除按钮正常工作
const StyledSelect = styled(Select)`
  .ant-select-item-option-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .template-delete-btn {
    z-index: 100;
    position: relative;
    
    &:hover {
      color: #ff7875;
      background-color: rgba(255, 77, 79, 0.1);
    }
  }
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
  { value: '华文宋体', label: '华文宋体' },
  { value: '华文楷体', label: '华文楷体' },
  { value: '华文黑体', label: '华文黑体' },
  { value: '方正书宋', label: '方正书宋' },
  { value: '方正黑体', label: '方正黑体' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Cambria', label: 'Cambria' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Helvetica', label: 'Helvetica' },
];

// 中文字号映射表
const chineseFontSizes = [
  { value: 42, label: '初号 (42pt)' },
  { value: 36, label: '小初 (36pt)' },
  { value: 26, label: '一号 (26pt)' },
  { value: 24, label: '小一 (24pt)' },
  { value: 22, label: '二号 (22pt)' },
  { value: 18, label: '小二 (18pt)' },
  { value: 16, label: '三号 (16pt)' },
  { value: 15, label: '小三 (15pt)' },
  { value: 14, label: '四号 (14pt)' },
  { value: 12, label: '小四 (12pt)' },
  { value: 10.5, label: '五号 (10.5pt)' },
  { value: 9, label: '小五 (9pt)' },
  { value: 7.5, label: '六号 (7.5pt)' },
  { value: 6.5, label: '小六 (6.5pt)' },
  { value: 5.5, label: '七号 (5.5pt)' },
];

// 对齐方式
const alignOptions = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
  { value: 'justify', label: '两端对齐' },
];

// 添加自定义字体选项组件
const FontOption = ({ value, children }) => {
  // 字体映射，与WordPreview.js中保持一致
  const FONT_MAPPING = {
    '宋体': 'SimSun, "Source Serif Pro", serif',
    '微软雅黑': 'Microsoft YaHei, "Source Sans Pro", sans-serif',
    '黑体': 'SimHei, "Source Sans Pro", sans-serif',
    '仿宋': 'FangSong, "Source Serif Pro", serif',
    '楷体': 'KaiTi, "Source Serif Pro", serif',
    '华文宋体': 'STSong, "Source Serif Pro", serif',
    '华文楷体': 'STKaiti, "Source Serif Pro", serif',
    '华文黑体': 'STHeiti, "Source Sans Pro", sans-serif',
    '方正书宋': 'FZShuSong, "Source Serif Pro", serif',
    '方正黑体': 'FZHei, "Source Sans Pro", sans-serif',
    'Arial': 'Arial, "Source Sans Pro", sans-serif',
    'Times New Roman': '"Times New Roman", "Source Serif Pro", serif',
    'Calibri': 'Calibri, "Source Sans Pro", sans-serif',
    'Cambria': 'Cambria, "Source Serif Pro", serif',
    'Georgia': 'Georgia, "Source Serif Pro", serif',
    'Helvetica': 'Helvetica, "Source Sans Pro", sans-serif',
  };
  
  const fontFamily = FONT_MAPPING[value] || `${value}, sans-serif`;
  
  return (
    <div style={{ fontFamily: fontFamily }}>
      {children}
    </div>
  );
};

// 添加一个辅助函数，生成格式摘要
const getFormatSummary = (settings, elementType) => {
  // 获取对齐方式的标签
  const getAlignLabel = (align) => {
    const alignMap = {
      'left': '左对齐',
      'center': '居中',
      'right': '右对齐',
      'justify': '两端对齐'
    };
    return alignMap[align] || '左对齐';
  };
  
  // 基本信息
  const basicInfo = `${settings.fontFamily} ${settings.fontSize}pt ${settings.bold ? '粗体' : ''}`;
  
  // 对齐和行间距
  const layoutInfo = `${getAlignLabel(settings.align)} · 行距${settings.lineHeight}`;
  
  // 特殊设置
  let specialInfo = '';
  
  // 标题特有设置
  if (elementType.startsWith('heading')) {
    specialInfo = `段前${settings.spacingBefore}磅 · 段后${settings.spacingAfter}磅`;
  }
  
  // 段落特有设置
  if (elementType === 'paragraph') {
    const indentMap = {
      0: '无缩进',
      2: '首行缩进2字符',
      4: '首行缩进4字符'
    };
    specialInfo = `${indentMap[settings.firstLineIndent] || '无缩进'} · 段间距${settings.paragraphSpacing}磅`;
  }
  
  return [basicInfo, layoutInfo, specialInfo].filter(Boolean).join(' · ');
};

// 自定义Panel标题组件
const CustomPanelHeader = ({ title, settings, elementType }) => {
  const summary = getFormatSummary(settings, elementType);
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{title}</div>
      <div style={{ 
        fontSize: '12px', 
        color: '#888', 
        marginTop: '3px',
        lineHeight: '1.2',
        whiteSpace: 'normal',
        wordBreak: 'break-word'
      }}>
        {summary}
      </div>
    </div>
  );
};

const StyledCollapse = styled(Collapse)`
  .ant-collapse-header {
    padding-top: 12px !important;
    padding-bottom: 12px !important;
    min-height: 54px;
  }
  
  .ant-collapse-arrow {
    margin-top: 8px !important;
  }
`;

// 优化提示语样式
const CollapseHint = styled.div`
  margin-bottom: 10px;
  color: #8c8c8c;
  font-size: 12px;
  display: flex;
  align-items: center;
  padding: 4px 0;
  
  .anticon {
    margin-right: 6px;
    color: #1890ff;
  }
`;

const FormatSettings = ({ visible, toggleSettings }) => {
  const { formatSettings, updateFormatSettings, customTemplates, addCustomTemplate, deleteCustomTemplate, applyTemplate } = useDocument();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('content');
  const [selectedTemplate, setSelectedTemplate] = useState(formatSettings.template);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  // 添加自定义字号状态
  const [customFontSizes, setCustomFontSizes] = useState([]);

  // 当formatSettings.template变化时更新选择器显示
  useEffect(() => {
    setSelectedTemplate(formatSettings.template);
  }, [formatSettings.template]);

  // 从localStorage加载自定义字号
  useEffect(() => {
    const savedCustomFontSizes = localStorage.getItem('md2word-custom-fontsizes');
    if (savedCustomFontSizes) {
      try {
        setCustomFontSizes(JSON.parse(savedCustomFontSizes));
      } catch (e) {
        console.error('Failed to parse custom font sizes:', e);
      }
    }
  }, []);

  // 处理模板选择
  const handleTemplateChange = (value) => {
    setSelectedTemplate(value);
    // 应用选中的模板设置
    applyTemplate(value);
  };

  // 处理内容设置变更
  const handleContentSettingChange = (elementType, field, value) => {
    const newSettings = { ...formatSettings };
    newSettings.content[elementType][field] = value;
    updateFormatSettings(newSettings);
  };

  // 处理字号变更并保存自定义字号
  const handleFontSizeChange = (elementType, value) => {
    // 应用字号变更
    handleContentSettingChange(elementType, 'fontSize', value);
    
    // 检查是否是自定义输入的字号
    const isPresetSize = chineseFontSizes.some(size => size.value === value);
    const isExistingCustomSize = customFontSizes.some(size => size.value === value);
    
    // 如果是新的自定义字号，保存到本地
    if (!isPresetSize && !isExistingCustomSize && value >= 6 && value <= 72) {
      const newCustomSize = { 
        value: value, 
        label: `${value}pt (自定义)` 
      };
      
      // 添加到自定义列表（限制最多10个）
      const updatedCustomSizes = [newCustomSize, ...customFontSizes]
        .filter((size, index, self) => 
          index === self.findIndex(s => s.value === size.value)
        )
        .slice(0, 10);
      
      setCustomFontSizes(updatedCustomSizes);
      
      // 保存到localStorage
      localStorage.setItem('md2word-custom-fontsizes', JSON.stringify(updatedCustomSizes));
    }
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

  // 恢复默认页面边距
  const resetDefaultMargins = () => {
    const defaultMargins = {
      top: 2.54,
      right: 3.18,
      bottom: 2.54,
      left: 3.18
    };
    
    const newSettings = { ...formatSettings };
    newSettings.page.margin = { ...defaultMargins };
    updateFormatSettings(newSettings);
    message.success('已恢复默认页面边距');
  };

  // 打开保存模板对话框
  const showSaveTemplateModal = () => {
    setTemplateName('');
    setIsModalVisible(true);
  };

  // 保存当前设置为自定义模板
  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      message.error('请输入模板名称');
      return;
    }

    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: templateName.trim(),
      settings: { ...formatSettings }
    };
    
    addCustomTemplate(newTemplate);
    setIsModalVisible(false);
    message.success(`模板 "${templateName}" 已保存`);
    setSelectedTemplate(newTemplate.id);
  };

  // 处理删除自定义模板
  const handleDeleteTemplate = (e, templateId) => {
    // 完全阻止事件传播和默认行为
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();
    
    // 直接执行删除操作，不使用Modal确认
    deleteCustomTemplate(templateId);
    if (selectedTemplate === templateId) {
      // 如果删除的是当前选中的模板，切换到默认模板
      setSelectedTemplate('default');
      applyTemplate('default');
    }
    message.success('模板已删除');
    
    // 添加日志
    console.log('删除模板:', templateId);
    
    // 返回false阻止事件冒泡
    return false;
  };

  // 渲染元素类型设置
  const renderElementSettings = (elementType, title) => {
    const settings = formatSettings.content[elementType];
    const isHeading = elementType.startsWith('heading');
    const isParagraph = elementType === 'paragraph';
    
    // 创建自定义标题组件
    const customHeader = <CustomPanelHeader title={title} settings={settings} elementType={elementType} />;
    
    return (
      <Panel header={customHeader} key={elementType}>
        <FormItem label="字体">
          <Select 
            value={settings.fontFamily} 
            onChange={(value) => handleContentSettingChange(elementType, 'fontFamily', value)}
            style={{ width: '100%' }}
            optionLabelProp="label"
          >
            {fonts.map(font => (
              <Option key={font.value} value={font.value} label={font.label}>
                <FontOption value={font.value}>{font.label}</FontOption>
              </Option>
            ))}
          </Select>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            部分字体在预览中可能显示不准确，导出后生效
          </div>
        </FormItem>
        
        <FormItem label="字号">
          <Select
            value={settings.fontSize}
            onChange={(value) => {
              // 处理可能的字符串输入，转换为数字
              const numValue = parseFloat(value);
              if (!isNaN(numValue) && numValue >= 6 && numValue <= 72) {
                handleFontSizeChange(elementType, numValue);
              }
            }}
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => 
              option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
              String(option?.value).indexOf(input) >= 0
            }
            dropdownRender={(menu) => (
              <>
                {menu}
                <div
                  style={{
                    padding: '8px',
                    borderTop: '1px solid #e8e8e8',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    可以输入6-72之间的自定义字号值，按回车确认
                  </div>
                </div>
              </>
            )}
            onInputKeyDown={(e) => {
              if (e.key === 'Enter') {
                const inputValue = parseFloat(e.target.value);
                if (!isNaN(inputValue) && inputValue >= 6 && inputValue <= 72) {
                  handleFontSizeChange(elementType, inputValue);
                  // 关闭下拉框
                  document.activeElement.blur();
                }
              }
            }}
            dropdownMatchSelectWidth={false}
          >
            <Option key="custom-input" value="custom-input" style={{ display: 'none' }}></Option>
            <Select.OptGroup label="常用中文字号">
              {chineseFontSizes.map(size => (
                <Option key={size.value} value={size.value}>{size.label}</Option>
              ))}
            </Select.OptGroup>
            
            {customFontSizes.length > 0 && (
              <Select.OptGroup label="我的自定义字号">
                {customFontSizes.map(size => (
                  <Option key={`custom-${size.value}`} value={size.value}>{size.label}</Option>
                ))}
              </Select.OptGroup>
            )}
          </Select>
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
        
        {isHeading && (
          <>
            <FormItem label="段前间距 (磅)">
              <InputNumber 
                value={settings.spacingBefore} 
                onChange={(value) => handleContentSettingChange(elementType, 'spacingBefore', value)}
                min={0}
                max={72}
                step={1}
                style={{ width: '100%' }}
              />
            </FormItem>
            
            <FormItem label="段后间距 (磅)">
              <InputNumber 
                value={settings.spacingAfter} 
                onChange={(value) => handleContentSettingChange(elementType, 'spacingAfter', value)}
                min={0}
                max={72}
                step={1}
                style={{ width: '100%' }}
              />
            </FormItem>
          </>
        )}
        
        {isParagraph && (
          <>
            <FormItem label="首行缩进 (字符数)">
              <Select 
                value={settings.firstLineIndent} 
                onChange={(value) => handleContentSettingChange(elementType, 'firstLineIndent', value)}
                style={{ width: '100%' }}
              >
                <Option value={0}>无缩进</Option>
                <Option value={2}>2字符 (中文标准)</Option>
                <Option value={4}>4字符 (英文标准)</Option>
              </Select>
            </FormItem>
            
            <FormItem label="段落间距 (磅)">
              <InputNumber 
                value={settings.paragraphSpacing} 
                onChange={(value) => handleContentSettingChange(elementType, 'paragraphSpacing', value)}
                min={0}
                max={36}
                step={1}
                style={{ width: '100%' }}
              />
            </FormItem>
          </>
        )}
      </Panel>
    );
  };

  if (!visible) return null;

  return (
    <SettingsContainer>
      <SettingsHeader>
        <SettingsTitle level={4}>排版格式设置</SettingsTitle>
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={toggleSettings}
        />
      </SettingsHeader>
      <SettingsContent>
        <Tabs defaultActiveKey="content" activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="内容格式" key="content">
            <TemplateSelect>
              <StyledSelect
                style={{ width: '100%' }}
                placeholder="选择预设模板"
                value={selectedTemplate}
                onChange={handleTemplateChange}
                dropdownRender={menu => (
                  <div>
                    {menu}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
                      <Button 
                        type="text" 
                        icon={<PlusOutlined />}
                        onClick={showSaveTemplateModal}
                      >
                        保存当前设置为模板
                      </Button>
                    </div>
                  </div>
                )}
              >
                <Select.OptGroup label="预设模板">
                  {templates.map(template => (
                    <Option key={template.id} value={template.id}>
                      {template.name}
                    </Option>
                  ))}
                </Select.OptGroup>
                
                {customTemplates.length > 0 && (
                  <Select.OptGroup label="自定义模板">
                    {customTemplates.map(template => (
                      <Option key={template.id} value={template.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{template.name}</span>
                          <DeleteOutlined 
                            className="template-delete-btn"
                            onClick={(e) => handleDeleteTemplate(e, template.id)} 
                          />
                        </div>
                      </Option>
                    ))}
                  </Select.OptGroup>
                )}
              </StyledSelect>
            </TemplateSelect>
            
            <CollapseHint>
              <InfoCircleOutlined />
              <Text type="secondary">点击元素面板可展开编辑对应的格式设置</Text>
            </CollapseHint>
            
            <StyledCollapse defaultActiveKey={[]}>
              {renderElementSettings('paragraph', '正文段落')}
              {renderElementSettings('heading1', '一级标题')}
              {renderElementSettings('heading2', '二级标题')}
              {renderElementSettings('heading3', '三级标题')}
              {renderElementSettings('heading4', '四级标题')}
              {renderElementSettings('quote', '引用文本')}
            </StyledCollapse>
          </TabPane>
          
          <TabPane tab="页面设置" key="page">
            <Form layout="vertical">
              <FormItem label="页面大小">
                <Select
                  value={formatSettings.page.size}
                  onChange={(value) => handlePageSettingChange('size', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="A4">A4 (21厘米 × 29.7厘米)</Option>
                  <Option value="A3">A3 (29.7厘米 × 42厘米)</Option>
                  <Option value="8K">8开 (26厘米 × 36.8厘米)</Option>
                  <Option value="16K">16开 (18.4厘米 × 26厘米)</Option>
                </Select>
              </FormItem>
              
              <FormItem label="页面边距 (厘米)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <FormItem label="上" style={{ flex: 1, margin: 0 }}>
                      <InputNumber
                        min={1}
                        max={5}
                        step={0.01}
                        value={formatSettings.page.margin.top}
                        onChange={(value) => handlePageSettingChange('margin.top', value)}
                        style={{ width: '100%' }}
                      />
                    </FormItem>
                    <FormItem label="下" style={{ flex: 1, margin: 0 }}>
                      <InputNumber
                        min={1}
                        max={5}
                        step={0.01}
                        value={formatSettings.page.margin.bottom}
                        onChange={(value) => handlePageSettingChange('margin.bottom', value)}
                        style={{ width: '100%' }}
                      />
                    </FormItem>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <FormItem label="左" style={{ flex: 1, margin: 0 }}>
                      <InputNumber
                        min={1}
                        max={5}
                        step={0.01}
                        value={formatSettings.page.margin.left}
                        onChange={(value) => handlePageSettingChange('margin.left', value)}
                        style={{ width: '100%' }}
                      />
                    </FormItem>
                    <FormItem label="右" style={{ flex: 1, margin: 0 }}>
                      <InputNumber
                        min={1}
                        max={5}
                        step={0.01}
                        value={formatSettings.page.margin.right}
                        onChange={(value) => handlePageSettingChange('margin.right', value)}
                        style={{ width: '100%' }}
                      />
                    </FormItem>
                  </div>
                  <Button 
                    icon={<RedoOutlined />} 
                    onClick={resetDefaultMargins}
                    size="small"
                  >
                    恢复默认边距
                  </Button>
                </div>
              </FormItem>
            </Form>
          </TabPane>
        </Tabs>
      </SettingsContent>
      
      <Modal
        title="保存为模板"
        open={isModalVisible}
        onOk={saveAsTemplate}
        onCancel={() => setIsModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item 
            label="模板名称" 
            required
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input 
              placeholder="请输入模板名称" 
              value={templateName} 
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </SettingsContainer>
  );
};

export default FormatSettings; 