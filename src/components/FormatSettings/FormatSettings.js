import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Select, Form, InputNumber, Button, Radio, Collapse, Typography, Modal, Input, message, Switch } from 'antd';
import { CloseOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, RedoOutlined, InfoCircleOutlined, RightOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';
import { FONT_OPTIONS, getPreviewFontFamily } from '../../utils/fontUtils';

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
  position: relative;
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
  padding-bottom: 60px; /* 为悬浮按钮留出空间 */
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

// 添加悬浮保存按钮样式
const FloatingSaveButton = styled(Button)`
  position: absolute;
  bottom: 26px; /* 上移10px，从16px改为26px */
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  border-radius: 16px;
  padding: 0 14px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0.95;
  transition: all 0.3s;
  font-size: 13px;
  font-weight: 500;
  
  &:hover {
    opacity: 1;
    transform: translateX(-50%) scale(1.02);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
  }
  
  .anticon {
    margin-right: 3px; /* 减少图标与文字的距离 */
    font-size: 13px;
  }
`;

// 添加自定义样式，确保删除按钮正常工作
const StyledSelect = styled(Select)`
  .ant-select-item-option-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .template-delete-btn, .fontsize-delete-btn {
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
  { id: 'business', name: '企业公文' },
];

// 字体列表迁移至字体工具

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

// 添加自定义字体选项组件（使用公共映射）
const FontOption = ({ value, children }) => {
  const fontFamily = getPreviewFontFamily(value);
  return <div style={{ fontFamily }}>{children}</div>;
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
  
  // 获取中文字号名称
  const getChineseFontSizeName = (fontSize) => {
    // 中文字号映射表
    const fontSizeMap = {
      42: '初号',
      36: '小初',
      26: '一号',
      24: '小一',
      22: '二号',
      18: '小二',
      16: '三号',
      15: '小三',
      14: '四号',
      12: '小四',
      10.5: '五号',
      9: '小五',
      7.5: '六号',
      6.5: '小六',
      5.5: '七号'
    };
    // 如果是标准字号，返回中文名称，否则返回数字+pt
    return fontSizeMap[fontSize] ? `${fontSizeMap[fontSize]} (${fontSize}pt)` : `${fontSize}pt`;
  };

  // 行间距单位显示
  const getLineHeightWithUnit = (settings) => {
    if (settings.lineHeightUnit === 'pt') {
      return `${settings.lineHeight}磅`;
    } else {
      // 默认或multiple
      return `${settings.lineHeight}倍`;
    }
  };
  
  // 基本信息
  const basicInfo = `${settings.fontFamily} ${getChineseFontSizeName(settings.fontSize)} ${settings.bold ? '粗体' : ''}`;
  // 对齐和行间距
  const layoutInfo = `${getAlignLabel(settings.align)} · 行距${getLineHeightWithUnit(settings)}`;
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
  white-space: nowrap; // 确保文本在一行显示
  overflow: hidden; // 防止内容溢出
  
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
  // 添加设置是否被修改的状态
  const [isSettingsChanged, setIsSettingsChanged] = useState(false);
  // 添加西文字体选择器展开状态
  const [latinFontExpanded, setLatinFontExpanded] = useState(false);

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
    // 重置设置变更状态
    setIsSettingsChanged(false);
  };

  // 处理内容设置变更
  const handleContentSettingChange = (elementType, field, value) => {
    const newSettings = { ...formatSettings };
    newSettings.content[elementType][field] = value;
    updateFormatSettings(newSettings);
    // 标记设置已被修改，但只有在已选择模板的情况下
    if (selectedTemplate) {
      setIsSettingsChanged(true);
    }
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

  // 处理删除自定义字号
  const handleDeleteCustomFontSize = (e, sizeValue, elementType) => {
    // 阻止事件冒泡，避免触发Select的onChange
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.preventDefault) e.preventDefault();
    
    // 从自定义字号列表中删除
    const updatedCustomSizes = customFontSizes.filter(size => size.value !== sizeValue);
    setCustomFontSizes(updatedCustomSizes);
    
    // 更新localStorage
    localStorage.setItem('md2word-custom-fontsizes', JSON.stringify(updatedCustomSizes));
    
    // 如果当前元素正在使用被删除的字号，则将其设置为小四(12pt)
    const currentElementSettings = formatSettings.content[elementType];
    if (currentElementSettings && currentElementSettings.fontSize === sizeValue) {
      handleContentSettingChange(elementType, 'fontSize', 12); // 12pt是小四字号
    }
    
    // 添加成功提示
    message.success('已删除自定义字号');
    
    // 返回false阻止事件冒泡
    return false;
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
    // 标记设置已被修改，但只有在已选择模板的情况下
    if (selectedTemplate) {
      setIsSettingsChanged(true);
    }
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
    // 标记设置已被修改，但只有在已选择模板的情况下
    if (selectedTemplate) {
      setIsSettingsChanged(true);
    }
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
    // 重置设置变更状态
    setIsSettingsChanged(false);
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
            {FONT_OPTIONS.map(font => (
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
          <StyledSelect
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
            filterOption={(input, option) => {
              // 简单的过滤逻辑，只使用值进行匹配
              if (!input || !option) return true;
              
              const optionValue = String(option.value);
              const inputValue = String(input);
              
              return optionValue.indexOf(inputValue) >= 0;
            }}
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
                <Option 
                  key={size.value} 
                  value={size.value}
                  label={size.label}
                >
                  {size.label}
                </Option>
              ))}
            </Select.OptGroup>
            
            {customFontSizes.length > 0 && (
              <Select.OptGroup label="我的自定义字号">
                {customFontSizes.map(size => (
                  <Option 
                    key={`custom-${size.value}`} 
                    value={size.value}
                    label={size.label}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{size.label}</span>
                      <DeleteOutlined 
                        className="fontsize-delete-btn"
                        onClick={(e) => handleDeleteCustomFontSize(e, size.value, elementType)} 
                      />
                    </div>
                  </Option>
                ))}
              </Select.OptGroup>
            )}
          </StyledSelect>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <InputNumber 
              value={settings.lineHeight} 
              onChange={(value) => handleContentSettingChange(elementType, 'lineHeight', value)}
              min={settings.lineHeightUnit === 'pt' ? 6 : 1}
              max={settings.lineHeightUnit === 'pt' ? 72 : 3}
              step={settings.lineHeightUnit === 'pt' ? 1 : 0.1}
              style={{ flex: 1 }}
            />
            <Select
              value={settings.lineHeightUnit || 'multiple'}
              style={{ width: 80 }}
              onChange={unit => {
                // 新增：切换单位时自动调整默认值
                let newValue = settings.lineHeight;
                if (unit === 'pt' && settings.lineHeightUnit !== 'pt') {
                  newValue = 20;
                } else if (unit === 'multiple' && settings.lineHeightUnit !== 'multiple') {
                  newValue = 1.5;
                }
                handleContentSettingChange(elementType, 'lineHeightUnit', unit);
                handleContentSettingChange(elementType, 'lineHeight', newValue);
              }}
            >
              <Option value="multiple">倍数</Option>
              <Option value="pt">磅数</Option>
            </Select>
          </div>
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
            
            {/* 西文/数字默认字体设置 */}
            <div style={{
              marginBottom: '16px',
              padding: '10px',
              background: '#f5f5f5',
              border: '1px solid #e8e8e8',
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Text strong>数字/西文默认字体</Text>
                <Switch
                  checked={formatSettings.latin?.enabled ?? true}
                  onChange={(checked) => {
                    const newSettings = { ...formatSettings };
                    newSettings.latin = newSettings.latin || { enabled: true, fontFamily: 'Times New Roman' };
                    newSettings.latin.enabled = checked;
                    updateFormatSettings(newSettings);
                    if (selectedTemplate) setIsSettingsChanged(true);
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
                开启后，文章中的西文与数字将统一默认使用 <span style={{ fontWeight: 500, color: '#666' }}>{formatSettings.latin?.fontFamily ?? 'Times New Roman'}</span> 字体。
                <Button 
                  type="link" 
                  size="small" 
                  style={{ padding: 0, height: 'auto', fontSize: 12, marginLeft: 2 }}
                  onClick={() => setLatinFontExpanded(!latinFontExpanded)}
                >
                  {latinFontExpanded ? '收起' : '更改字体'}
                  <RightOutlined 
                    style={{ 
                      marginLeft: -8, 
                      transform: latinFontExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                </Button>
              </div>
              {latinFontExpanded && (
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  alignItems: 'center', 
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8',
                  marginBottom: 6
                }}>
                  <div style={{ width: 80, color: 'rgba(0,0,0,0.65)', fontSize: 12 }}>西文字体</div>
                  <Select
                    style={{ flex: 1 }}
                    size="small"
                    value={formatSettings.latin?.fontFamily ?? 'Times New Roman'}
                    onChange={(value) => {
                      const newSettings = { ...formatSettings };
                      newSettings.latin = newSettings.latin || { enabled: true, fontFamily: 'Times New Roman' };
                      newSettings.latin.fontFamily = value;
                      updateFormatSettings(newSettings);
                      if (selectedTemplate) setIsSettingsChanged(true);
                    }}
                    optionLabelProp="label"
                  >
                    {FONT_OPTIONS.map(font => (
                      <Option key={`latin-${font.value}`} value={font.value} label={font.label}>
                        <div style={{ fontFamily: getPreviewFontFamily(font.value) }}>{font.label}</div>
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
            
            <CollapseHint>
              <InfoCircleOutlined />
              <Text type="secondary">点击元素面板展开编辑格式</Text>
            </CollapseHint>
            
            <StyledCollapse defaultActiveKey={[]}>
              {renderElementSettings('paragraph', '正文段落')}
              {renderElementSettings('heading1', '一级标题')}
              {renderElementSettings('heading2', '二级标题')}
              {renderElementSettings('heading3', '三级标题')}
              {renderElementSettings('heading4', '四级标题')}
              {renderElementSettings('quote', '引用文本')}
            </StyledCollapse>
            
            {/* 特定模板提示信息 */}
            {['academic', 'legal', 'business'].includes(selectedTemplate) && (
              <div style={{ 
                marginTop: '16px', 
                padding: '10px 12px', 
                backgroundColor: '#fffbe6', 
                border: '1px solid #ffe58f', 
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <InfoCircleOutlined style={{ color: '#faad14', marginRight: '8px', marginTop: '3px' }} />
                <div>
                  <Text strong style={{ fontSize: '14px' }}>模板使用提示</Text>
                  <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.65)', marginTop: '4px' }}>
                    当前预设模板仅供参考，不代表权威的标准化排版规范。请根据您的实际工作需求和单位要求对格式进行适当调整。
                  </div>
                </div>
              </div>
            )}
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
      
      {/* 添加悬浮保存按钮 - 恢复图标但减少间距 */}
      {isSettingsChanged && (
        <FloatingSaveButton
          type="primary"
          icon={<PlusOutlined />}
          onClick={showSaveTemplateModal}
          title="保存为模板"
        >
          保存为模板
        </FloatingSaveButton>
      )}
    </SettingsContainer>
  );
};

export default FormatSettings; 