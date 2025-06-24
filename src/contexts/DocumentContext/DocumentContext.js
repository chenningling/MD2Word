import React, { createContext, useContext, useState, useEffect } from 'react';

// 默认格式设置
const defaultFormatSettings = {
  template: 'default',
  content: {
    heading1: { fontFamily: '微软雅黑', fontSize: 16, bold: true, lineHeight: 1.5, align: 'left' },
    heading2: { fontFamily: '微软雅黑', fontSize: 14, bold: true, lineHeight: 1.5, align: 'left' },
    heading3: { fontFamily: '微软雅黑', fontSize: 12, bold: true, lineHeight: 1.5, align: 'left' },
    paragraph: { fontFamily: '宋体', fontSize: 12, bold: false, lineHeight: 1.5, align: 'left' },
    quote: { fontFamily: '楷体', fontSize: 12, bold: false, lineHeight: 1.5, align: 'left' },
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

// 创建上下文
const DocumentContext = createContext();

// 提供上下文的组件
export const DocumentProvider = ({ children }) => {
  // 文档内容状态
  const [markdown, setMarkdown] = useState('');
  // 格式设置状态
  const [formatSettings, setFormatSettings] = useState(defaultFormatSettings);
  // 自定义模板状态
  const [customTemplates, setCustomTemplates] = useState([]);

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
        setCustomTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error('Failed to parse saved templates:', e);
      }
    }
  }, []);

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
    localStorage.setItem('md2word-templates', JSON.stringify(customTemplates));
  }, [customTemplates]);

  // 更新文档内容
  const updateMarkdown = (newContent) => {
    setMarkdown(newContent);
  };

  // 更新格式设置
  const updateFormatSettings = (newSettings) => {
    setFormatSettings({ ...formatSettings, ...newSettings });
  };

  // 添加自定义模板
  const addCustomTemplate = (template) => {
    setCustomTemplates([...customTemplates, template]);
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
        updateCustomTemplate
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