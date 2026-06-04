/**
 * 语法分析器 - 包含属性解析和 AST 构建
 */

// VNode 属性值类型
export type ASTPropValue = string | number | boolean | null | undefined;

export interface ASTElement {
  type: 'Element';
  tag: string;
  props: Record<string, ASTPropValue>;
  directives: Record<string, string>;
  children: ASTNode[];
  elseNode?: ASTElement;
  _toRemove?: boolean;
}

export interface ASTInterpolation {
  type: 'Interpolation';
  content: string;
}

export interface ASTText {
  type: 'Text';
  content: string;
}

export interface ASTComment {
  type: 'Comment';
  content: string;
}

export interface ASTRoot {
  type: 'Root';
  children: ASTNode[];
}

export type ASTNode = ASTElement | ASTInterpolation | ASTText | ASTComment | ASTRoot;

/**
 * 解析属性字符串
 */
export function parseProps(attrStr: string): { props: Record<string, ASTPropValue>; directives: Record<string, string> } {
  const props: Record<string, ASTPropValue> = {};
  const directives: Record<string, string> = {};
  if (!attrStr) return { props, directives };

  // 改进的正则：支持包含引号、花括号、冒号等复杂值的属性
  // 匹配模式：属性名（可选的 ="属性值"）
  // 属性值可以是双引号包裹的任何内容（包括嵌套的单引号、花括号等）
  const attrRegex = /([\w:@-]+)\s*=\s*"((?:[^"\\]|\\.)*)"|([\w:@-]+)\s*=\s*'((?:[^'\\]|\\.)*)'|([\w:@-]+)/g;
  let match;
  
  while ((match = attrRegex.exec(attrStr)) !== null) {
    let key: string;
    let value: string | undefined;
    
    if (match[1]) {
      // 双引号属性值
      key = match[1];
      value = match[2];
    } else if (match[3]) {
      // 单引号属性值
      key = match[3];
      value = match[4];
    } else {
      // 无值属性（布尔属性）
      key = match[5];
      value = undefined;
    }
    
    if (key.startsWith(':')) {
      // 动态绑定：保留原始键名（带冒号），在后续处理时再区分
      props[key] = value;
    } else if (key.startsWith('@')) {
      // 事件绑定
      props[key] = value;
    } else if (key.startsWith('v-')) {
      // 指令：v-else 没有值，其他指令可能有值
      const directiveName = key.slice(2); // else, if, for, etc.
      directives[directiveName] = value === undefined ? '' : value;
    } else {
      // 普通属性
      props[key] = value;
    }
  }
  return { props, directives };
}

/**
 * 语法分析：将 token 数组转换为 AST
 */
export function parse(tokens: Token[]): ASTRoot {
  const root: ASTRoot = { type: 'Root', children: [] };
  const stack: (ASTRoot | ASTElement)[] = [root];
  
  tokens.forEach(token => {
    const parent = stack[stack.length - 1];
    if (token.type === 'TAG_START') {
      const element: ASTElement = { 
        type: 'Element', 
        tag: token.value, 
        props: token.props || {}, 
        directives: token.directives || {},
        children: [] 
      };
      
      // 检查是否有 v-else 或 v-else-if 指令
      if ('else' in element.directives || 'else-if' in element.directives) {
        // 找到父元素的最后一个子元素（跳过 Text 节点）
        const siblings = parent.children
        let lastSibling = null
        
        // 从后往前查找，找到最近的 Element 类型的兄弟
        for (let i = siblings.length - 1; i >= 0; i--) {
          const sibling = siblings[i]
          if (sibling.type === 'Element') {
            lastSibling = sibling
            break
          }
        }
        
        // 如果最后一个兄弟元素是 Element 且有 v-if 或 v-else-if，建立关联
        if (lastSibling && lastSibling.type === 'Element') {
          // 检查最后一个兄弟是否有条件指令（v-if 或 v-else-if）
          const hasConditionDirective = 'if' in lastSibling.directives || 'else-if' in lastSibling.directives
          
          if (hasConditionDirective) {
            // 找到条件链的最后一个节点
            let chainEnd: ASTElement = lastSibling
            while (chainEnd.elseNode) {
              chainEnd = chainEnd.elseNode
            }
            
            // 将当前元素设置为链末尾的 elseNode
            chainEnd.elseNode = element
            // 标记这个元素稍后需要被移除
            element._toRemove = true
          }
        }
      }
      
      parent.children.push(element);
      stack.push(element);
    } else if (token.type === 'TAG_END') {
      stack.pop();
    } else if (token.type === 'INTERPOLATION') {
      parent.children.push({ type: 'Interpolation', content: token.value });
    } else if (token.type === 'TEXT') {
      parent.children.push({ type: 'Text', content: token.value });
    } else if (token.type === 'COMMENT') {
      parent.children.push({ type: 'Comment', content: token.value });
    }
  });
  
  // 清理被标记为需要移除的元素（v-else 元素）
  function cleanTree(node: ASTRoot | ASTElement): void {
    if (node.type === 'Root' || node.type === 'Element') {
      // 递归清理子节点
      node.children.forEach(child => {
        if (child.type === 'Element') {
          cleanTree(child)
        }
      })
      
      // 清理当前节点的子数组中标记为 _toRemove 的元素
      // 对于 Root 和 Element 都需要清理
      node.children = node.children.filter(child => {
        return !(child.type === 'Element' && child._toRemove)
      })
    }
  }
  
  cleanTree(root)
  
  return root;
}

import { Token } from './tokenizer'