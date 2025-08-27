import React, { createContext, useContext, useState, useEffect } from 'react';

// 默认格式设置
const defaultFormatSettings = {
  template: 'default',
  content: {
    heading1: { fontFamily: '微软雅黑', fontSize: 16, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'center', spacingBefore: 12, spacingAfter: 8 },
    heading2: { fontFamily: '微软雅黑', fontSize: 14, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 10, spacingAfter: 6 },
    heading3: { fontFamily: '微软雅黑', fontSize: 12, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 8, spacingAfter: 6 },
    heading4: { fontFamily: '微软雅黑', fontSize: 11, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 6, spacingAfter: 4 },
    paragraph: { fontFamily: '宋体', fontSize: 12, bold: false, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', firstLineIndent: 2, paragraphSpacing: 6 },
    quote: { fontFamily: '楷体', fontSize: 12, bold: false, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left' },
  },
  // 新增：西文/数字默认字体设置
  latin: {
    enabled: true,
    fontFamily: 'Times New Roman'
  },
  page: {
    margin: {
      top: 2.54,
      right: 3.18,
      bottom: 2.54,
      left: 3.18
    },
    size: 'A4'
  }
};

// 预设模板定义
const predefinedTemplates = {
  default: defaultFormatSettings,
  
  academic: {
    template: 'academic',
    content: {
      heading1: { fontFamily: '黑体', fontSize: 16, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'center', spacingBefore: 14, spacingAfter: 10 },
      heading2: { fontFamily: '黑体', fontSize: 14, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 12, spacingAfter: 8 },
      heading3: { fontFamily: '黑体', fontSize: 12, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 10, spacingAfter: 6 },
      heading4: { fontFamily: '黑体', fontSize: 10.5, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 8, spacingAfter: 6 },
      paragraph: { fontFamily: '宋体', fontSize: 12, bold: false, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'justify', firstLineIndent: 2, paragraphSpacing: 6 },
      quote: { fontFamily: '楷体', fontSize: 12, bold: false, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left' },
    },
    latin: {
      enabled: true,
      fontFamily: 'Times New Roman'
    },
    page: {
      margin: {
        top: 2.5,
        right: 3.0,
        bottom: 2.5,
        left: 3.0
      },
      size: 'A4'
    }
  },
  
  legal: {
    template: 'legal',
    content: {
      heading1: { fontFamily: '黑体', fontSize: 16, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'center', spacingBefore: 14, spacingAfter: 10 },
      heading2: { fontFamily: '黑体', fontSize: 14, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 12, spacingAfter: 8 },
      heading3: { fontFamily: '黑体', fontSize: 12, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 10, spacingAfter: 6 },
      heading4: { fontFamily: '黑体', fontSize: 10.5, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 8, spacingAfter: 6 },
      paragraph: { fontFamily: '仿宋', fontSize: 12, bold: false, lineHeight: 1.8, lineHeightUnit: 'multiple', align: 'justify', firstLineIndent: 2, paragraphSpacing: 0 },
      quote: { fontFamily: '楷体', fontSize: 12, bold: false, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left' },
    },
    latin: {
      enabled: true,
      fontFamily: 'Times New Roman'
    },
    page: {
      margin: {
        top: 2.5,
        right: 2.5,
        bottom: 2.5,
        left: 2.5
      },
      size: 'A4'
    }
  },
  
  business: {
    template: 'business',
    content: {
      heading1: { fontFamily: '小标宋体', fontSize: 22, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'center', spacingBefore: 12, spacingAfter: 8 },
      heading2: { fontFamily: '黑体', fontSize: 16, bold: true, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 10, spacingAfter: 6 },
      heading3: { fontFamily: '黑体', fontSize: 16, bold: false, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 8, spacingAfter: 6 },
      heading4: { fontFamily: '黑体', fontSize: 14, bold: false, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', spacingBefore: 6, spacingAfter: 4 },
      paragraph: { fontFamily: '仿宋', fontSize: 16, bold: false, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left', firstLineIndent: 2, paragraphSpacing: 3 },
      quote: { fontFamily: '楷体', fontSize: 16, bold: false, lineHeight: 1.5, lineHeightUnit: 'multiple', align: 'left' },
    },
    latin: {
      enabled: true,
      fontFamily: 'Times New Roman'
    },
    page: {
      margin: {
        top: 3.7,
        right: 2.8,
        bottom: 2.5,
        left: 2.8
      },
      size: 'A4'
    }
  }
};

// 创建上下文
const DocumentContext = createContext();

// 提供上下文的组件
export const DocumentProvider = ({ children }) => {
  // 文档内容状态
  const [markdown, setMarkdown] = useState('');
  // 格式设置状态 - 使用深拷贝确保不会修改原始默认设置
  const [formatSettings, setFormatSettings] = useState(JSON.parse(JSON.stringify(defaultFormatSettings)));
  // 自定义模板状态
  const [customTemplates, setCustomTemplates] = useState([]);
  // 添加一个ref来标记是否已完成初始加载
  const initialLoadDone = React.useRef(false);

  // 从本地存储加载内容
  useEffect(() => {
    const savedMarkdown = localStorage.getItem('md2word-content');
    if (savedMarkdown) {
      setMarkdown(savedMarkdown);
    }

    const savedSettings = localStorage.getItem('md2word-settings');
    if (savedSettings) {
      try {
        setFormatSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }

    const savedTemplates = localStorage.getItem('md2word-templates');
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates);
        console.log('加载自定义模板:', parsedTemplates);
        if (Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
          setCustomTemplates(parsedTemplates);
        }
      } catch (e) {
        console.error('Failed to parse saved templates:', e);
      }
    }
    
    // 标记初始加载完成
    initialLoadDone.current = true;
  }, []);

  // 在自定义模板加载完成后，尝试应用上次选择的模板
  useEffect(() => {
    // 确保自定义模板已经加载完成
    if (initialLoadDone.current) {
      const lastSelectedTemplate = localStorage.getItem('md2word-last-template');
      if (lastSelectedTemplate) {
        // 检查模板是否存在（可能是预设模板或自定义模板）
        const isPreset = ['default', 'academic', 'legal', 'business'].includes(lastSelectedTemplate);
        const isCustom = customTemplates.some(template => template.id === lastSelectedTemplate);
        
        if (isPreset || isCustom) {
          // 应用上次选择的模板
          applyTemplate(lastSelectedTemplate);
        }
      }
    }
  }, [customTemplates]);

  // 保存内容到本地存储
  useEffect(() => {
    if (markdown) {
      localStorage.setItem('md2word-content', markdown);
    }
  }, [markdown]);

  // 保存设置到本地存储
  useEffect(() => {
    localStorage.setItem('md2word-settings', JSON.stringify(formatSettings));
  }, [formatSettings]);

  // 保存自定义模板到本地存储
  useEffect(() => {
    // 只有当customTemplates不为空或者已经完成初始加载时才保存
    if (customTemplates.length > 0 || initialLoadDone.current) {
      localStorage.setItem('md2word-templates', JSON.stringify(customTemplates));
      console.log('保存自定义模板:', customTemplates);
    }
  }, [customTemplates]);

  // 更新文档内容
  const updateMarkdown = (newContent) => {
    setMarkdown(newContent);
  };

  // 更新格式设置
  const updateFormatSettings = (newSettings) => {
    setFormatSettings({ ...formatSettings, ...newSettings });
  };

  // 根据模板ID获取模板设置
  const getTemplateSettings = (templateId) => {
    // 检查是否是预设模板
    if (predefinedTemplates[templateId]) {
      // 返回预设模板的深拷贝，确保不会修改原始模板
      return JSON.parse(JSON.stringify(predefinedTemplates[templateId]));
    }
    
    // 检查是否是自定义模板
    const customTemplate = customTemplates.find(template => template.id === templateId);
    if (customTemplate) {
      return customTemplate.settings;
    }
    
    // 如果找不到模板，返回默认设置的深拷贝
    return JSON.parse(JSON.stringify(defaultFormatSettings));
  };

  // 应用模板设置
  const applyTemplate = (templateId) => {
    // 获取原始模板设置（不使用本地存储的修改版本）
    let templateSettings;
    
    // 检查是否是预设模板
    if (predefinedTemplates[templateId]) {
      // 对于预设模板，直接使用预定义的设置
      templateSettings = JSON.parse(JSON.stringify(predefinedTemplates[templateId]));
    } else {
      // 对于自定义模板，使用保存的设置
      const customTemplate = customTemplates.find(template => template.id === templateId);
      if (customTemplate) {
        templateSettings = customTemplate.settings;
      } else {
        // 如果找不到模板，使用默认设置
        templateSettings = defaultFormatSettings;
      }
    }
    
    // 确保设置template属性，这样选择器可以正确显示
    setFormatSettings({
      ...templateSettings,
      template: templateId
    });
    
    // 保存用户选择的模板到localStorage
    localStorage.setItem('md2word-last-template', templateId);
  };

  // 添加自定义模板
  const addCustomTemplate = (template) => {
    // 确保模板有正确的ID和名称
    const newTemplate = {
      id: template.id || `custom_${Date.now()}`,
      name: template.name || '自定义模板',
      settings: { ...template.settings }
    };
    
    setCustomTemplates(prevTemplates => [...prevTemplates, newTemplate]);
  };

  // 删除自定义模板
  const deleteCustomTemplate = (templateId) => {
    setCustomTemplates(customTemplates.filter(template => template.id !== templateId));
  };

  // 更新自定义模板
  const updateCustomTemplate = (templateId, updatedTemplate) => {
    setCustomTemplates(
      customTemplates.map(template => 
        template.id === templateId ? { ...template, ...updatedTemplate } : template
      )
    );
  };

  return (
    <DocumentContext.Provider
      value={{
        markdown,
        updateMarkdown,
        formatSettings,
        updateFormatSettings,
        customTemplates,
        addCustomTemplate,
        deleteCustomTemplate,
        updateCustomTemplate,
        getTemplateSettings,
        applyTemplate
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

// 自定义Hook，方便使用上下文
export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};

export default DocumentContext; 