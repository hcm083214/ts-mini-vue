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
        // 使用 [\s\S] 替代 . 以匹配包括换行符在内的所有字符
        // 标签名支持字母、数字、下划线和连字符（用于自定义组件如 m-component）
        const match = template.slice(i).match(/^<([a-zA-Z][\w-]*)([\s\S]*?)(\/?)>/);
        if (match) {
          const tagName = match[1]; // 直接从捕获组获取标签名
          const attrsStr = match[2] || ''; // 属性字符串（可能为空，包含换行符）
          const isSelfClosing = match[3] === '/'; // 检测是否是自闭合标签
          
          const { props, directives } = parseProps(attrsStr);
          tokens.push({ type: 'TAG_START', value: tagName, props, directives });
          
          // 🔥 关键修复：如果是自闭合标签，立即添加 TAG_END token
          if (isSelfClosing) {
            tokens.push({ type: 'TAG_END', value: tagName });
          }
          
          i += match[0].length;
        }
      }
    } else if (char === '{') {
      const match = template.slice(i).match(/^\{\{([^}]+)\}\}/);
      if (match) {
        const trimmedValue = match[1].trim();
        tokens.push({ type: 'INTERPOLATION', value: trimmedValue });
        i += match[0].length;
      }
    } else {
      const match = template.slice(i).match(/^[^{<]+/);
      if (match) {
        tokens.push({ type: 'TEXT', value: match[0] });
        i += match[0].length;
      }
    }
  }
  return tokens;
}