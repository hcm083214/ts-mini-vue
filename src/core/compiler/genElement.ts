import { CodegenContext } from './generator'
import { genProps, genPropsWithoutDirective, genChildren, genChildrenWithoutFor } from './genElementImpl'
import { genForDirective } from './genFor'

/**
 * 判断标签是否是原生 HTML 元素
 * 参照 Vue 3 源码
 */
export function isNativeElement(tag: string): boolean {
  // 常见的原生 HTML 元素列表
  const nativeElements = [
    'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li',
    'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'form', 'input',
    'button', 'select', 'option', 'textarea', 'label', 'fieldset', 'legend',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'u', 's',
    'br', 'hr', 'pre', 'code', 'blockquote', 'cite', 'abbr', 'acronym',
    'address', 'article', 'aside', 'audio', 'canvas', 'caption', 'details',
    'dialog', 'embed', 'figure', 'footer', 'header', 'iframe', 'main',
    'mark', 'meter', 'nav', 'noscript', 'object', 'output', 'picture',
    'progress', 'section', 'source', 'summary', 'time', 'video', 'wbr',
    'svg', 'path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon',
    'text', 'g', 'defs', 'use', 'symbol', 'template', 'slot'
  ]
  return nativeElements.includes(tag.toLowerCase())
}

/**
 * 获取标签的代码表示
 * 参照 Vue 3 源码：原生元素使用字符串，组件使用 resolveComponent
 */
export function getTagCode(tag: string): string {
  if (isNativeElement(tag)) {
    // 原生 HTML 元素，使用字符串
    return `"${tag}"`
  } else {
    // 可能是组件，生成 resolveComponent 调用
    return `resolveComponent("${tag}")`
  }
}

/**
 * 生成元素节点代码
 * 格式：h(tag, props, children)
 */
export function genElement(node: ASTElement, context: CodegenContext) {
  const isTemplateWrapper = node._isTemplateWrapper === true
  
  const hasVIf = 'if' in node.directives
  const hasVElseIf = 'else-if' in node.directives
  const hasVElse = 'else' in node.directives
  const hasVFor = 'for' in node.directives
  
  const tagCode = getTagCode(node.tag)
  
  if (hasVFor) {
    genForDirective(node, context)
  } else if (hasVIf || hasVElseIf) {
    const condition = node.directives['if'] || node.directives['else-if'] || 'true'
    
    context.push(`${condition} ? `)
    
    if (isTemplateWrapper) {
      context.push(`h(Fragment, null, `)
      genChildren(node, context)
      context.push(`)`)
    } else {
      context.push(`h(${tagCode}, `)
      
      if (hasVIf) {
        genPropsWithoutDirective(node, context, 'if')
      } else {
        genPropsWithoutDirective(node, context, 'else-if')
      }
      
      context.push(`, `)
      genChildren(node, context)
      
      context.push(`)`)
    }
    
    if (node.elseNode) {
      context.push(` : `)
      genElement(node.elseNode, context)
    } else {
      context.push(` : null`)
    }
  } else if (hasVElse) {
    if (isTemplateWrapper) {
      context.push(`h(Fragment, null, `)
      genChildren(node, context)
      context.push(`)`)
    } else {
      context.push(`h(${tagCode}, `)
      genPropsWithoutDirective(node, context, 'else')
      context.push(`, `)
      genChildren(node, context)
      context.push(`)`)
    }
  } else {
    if (isTemplateWrapper) {
      context.push(`h(Fragment, null, `)
      genChildren(node, context)
      context.push(`)`)
    } else {
      context.push(`h(${tagCode}, `)
      genProps(node, context)
      context.push(`, `)
      genChildren(node, context)
      context.push(`)`)
    }
  }
}
