import React, { useMemo } from 'react';
import { marked } from 'marked';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';

const PreviewContainer = styled.div`
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PreviewHeader = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  color: #333;
  background-color: #fafafa;
`;

const PreviewContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 20px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05) inset;
`;

const WordDocument = styled.div`
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: ${props => `${props.marginTop}cm ${props.marginRight}cm ${props.marginBottom}cm ${props.marginLeft}cm`};
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  
  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.heading1.fontFamily};
    font-weight: ${props => props.heading1.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading1.lineHeight};
    text-align: ${props => props.heading1.align};
  }
  
  h1 {
    font-size: ${props => props.heading1.fontSize}pt;
  }
  
  h2 {
    font-size: ${props => props.heading2.fontSize}pt;
    font-family: ${props => props.heading2.fontFamily};
    font-weight: ${props => props.heading2.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading2.lineHeight};
    text-align: ${props => props.heading2.align};
  }
  
  h3 {
    font-size: ${props => props.heading3.fontSize}pt;
    font-family: ${props => props.heading3.fontFamily};
    font-weight: ${props => props.heading3.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading3.lineHeight};
    text-align: ${props => props.heading3.align};
  }
  
  p {
    font-family: ${props => props.paragraph.fontFamily};
    font-size: ${props => props.paragraph.fontSize}pt;
    font-weight: ${props => props.paragraph.bold ? 'bold' : 'normal'};
    line-height: ${props => props.paragraph.lineHeight};
    text-align: ${props => props.paragraph.align};
    margin-bottom: 1em;
  }
  
  blockquote {
    font-family: ${props => props.quote.fontFamily};
    font-size: ${props => props.quote.fontSize}pt;
    font-weight: ${props => props.quote.bold ? 'bold' : 'normal'};
    line-height: ${props => props.quote.lineHeight};
    text-align: ${props => props.quote.align};
    border-left: 4px solid #ddd;
    padding-left: 1em;
    margin-left: 0;
    color: #666;
  }
`;

const WordPreview = () => {
  const { markdown, formatSettings } = useDocument();
  
  // 使用marked将markdown转换为HTML
  const htmlContent = useMemo(() => {
    return { __html: marked(markdown) };
  }, [markdown]);

  const { content, page } = formatSettings;
  
  return (
    <PreviewContainer>
      <PreviewHeader>Word 预览</PreviewHeader>
      <PreviewContent>
        <WordDocument 
          marginTop={page.margin.top}
          marginRight={page.margin.right}
          marginBottom={page.margin.bottom}
          marginLeft={page.margin.left}
          heading1={content.heading1}
          heading2={content.heading2}
          heading3={content.heading3}
          paragraph={content.paragraph}
          quote={content.quote}
          dangerouslySetInnerHTML={htmlContent}
        />
      </PreviewContent>
    </PreviewContainer>
  );
};

export default WordPreview; 