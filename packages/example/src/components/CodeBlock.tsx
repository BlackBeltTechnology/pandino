import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { codeStyles } from '../theme';

type SupportedLanguage = 'typescript' | 'javascript' | 'json' | 'text';

interface CodeBlockProps {
  code: string;
  language?: SupportedLanguage;
  showLineNumbers?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'typescript', showLineNumbers = false }) => {
  const customStyle = {
    backgroundColor: 'inherit', // Let darcula theme control the background
    margin: 0,
    padding: 0,
    borderRadius: codeStyles.borderRadius,
    border: codeStyles.border,
    fontFamily: codeStyles.fontFamily,
    fontSize: codeStyles.fontSize,
    fontWeight: codeStyles.fontWeight,
    overflow: 'auto',
  };

  const customizedDarculaTheme = {
    ...darcula,
    'code[class*="language-"]': {
      ...darcula['code[class*="language-"]'],
      fontFamily: codeStyles.fontFamily,
      fontSize: codeStyles.fontSize,
      fontWeight: codeStyles.fontWeight,
    },
    'pre[class*="language-"]': {
      ...darcula['pre[class*="language-"]'],
      fontFamily: codeStyles.fontFamily,
      fontSize: codeStyles.fontSize,
      fontWeight: codeStyles.fontWeight,
    },
  };

  return (
    <SyntaxHighlighter
      language={language}
      style={customizedDarculaTheme}
      customStyle={customStyle}
      showLineNumbers={showLineNumbers}
      wrapLongLines={true}
      codeTagProps={{
        style: {
          fontFamily: codeStyles.fontFamily,
          fontSize: codeStyles.fontSize,
          fontWeight: codeStyles.fontWeight,
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;
