/**
 * 词法分析器 - 将模板字符串转换为 token 数组
 */

import { parseProps, ASTPropValue } from './parser'

export interface Token {
  type: 'TAG_START' | 'TAG_END' | 'TEXT' | 'INTERPOLATION' | 'COMMENT';
  value: string;
  props?: Record<string, ASTPropValue>;
  directives?: Record<string, string>;
}

/**
 * 词法分析：将模板字符串转换为 token 数组
 */
export function tokenize(template: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < template.length) {
    const char = template[i];
    
    if (char === '<') {
      // 检测注释 <!-- -->
      if (template.slice(i, i + 4) === '<!--') {
        const endCommentIndex = template.indexOf('-->', i + 4);
        if (endCommentIndex !== -1) {
          // 提取注释内容（不包括 <!-- 和 -->）
          const commentContent = template.slice(i + 4, endCommentIndex);
          tokens.push({ type: 'COMMENT', value: commentContent });
          i = endCommentIndex + 3; // 跳过 '-->'
          continue;
        }
      }
      
      if (template[i + 1] === '/') {
        // 使用捕获组准确提取结束标签名，支持连字符
        const match = template.slice(i).match(/^<\/([a-zA-Z][\w-]*)>/);
        if (match) {
          tokens.push({ type: 'TAG_END', value: match[1] });
          i += match[0].length;
        } else {
          // 如果匹配失败，将当前字符视为普通文本
          tokens.push({ type: 'TEXT', value: char });
          i++;
        }
      } else {
        // 标签名支持字母、数字、下划线和连字符（用于自定义组件如 m-component）
        // 需要正确处理属性值中包含 > 的情况（如 :disabled="count >= 2"）
        // 策略：先找到标签名，然后逐字符解析直到找到真正的结束 >
        
        const tagMatch = template.slice(i).match(/^<([a-zA-Z][\w-]*)/);
        if (!tagMatch) {
          i++;
          continue;
        }
        
        const tagName = tagMatch[1];
        let pos = i + tagMatch[0].length; // 跳过 <tagName
        
        // 逐字符查找真正的结束 >，需要考虑引号内的内容
        let inQuote = false;
        let quoteChar = '';
        let isSelfClosing = false;
        
        while (pos < template.length) {
          const char = template[pos];
          
          if (inQuote) {
            // 在引号内，只有遇到相同的引号才退出
            if (char === quoteChar) {
              inQuote = false;
            }
          } else {
            // 不在引号内
            if (char === '"' || char === "'") {
              inQuote = true;
              quoteChar = char;
            } else if (char === '>') {
              // 找到结束标签
              break;
            } else if (char === '/' && template[pos + 1] === '>') {
              // 自闭合标签 />
              isSelfClosing = true;
              pos++; // 跳过 /
              break;
            }
          }
          
          pos++;
        }
        
        // 提取属性字符串
        const attrsStr = template.slice(i + tagMatch[0].length, pos).trim();
        
        const { props, directives } = parseProps(attrsStr);
        tokens.push({ type: 'TAG_START', value: tagName, props, directives });
        
        // 🔥 关键修复：如果是自闭合标签，立即添加 TAG_END token
        if (isSelfClosing) {
          tokens.push({ type: 'TAG_END', value: tagName });
        }
        
        i = pos + 1; // 跳过 >
      }
    } else if (char === '{') {
      const match = template.slice(i).match(/^\{\{([^}]+)\}\}/);
      if (match) {
        const trimmedValue = match[1].trim();
        tokens.push({ type: 'INTERPOLATION', value: trimmedValue });
        i += match[0].length;
      } else {
        // 如果插值表达式匹配失败，将当前字符作为普通文本
        tokens.push({ type: 'TEXT', value: char });
        i++;
      }
    } else {
      const match = template.slice(i).match(/^[^{<]+/);
      if (match) {
        tokens.push({ type: 'TEXT', value: match[0] });
        i += match[0].length;
      } else {
        // 如果匹配失败，推进一个字符以避免死循环
        i++;
      }
    }
  }
  
  return tokens;
}