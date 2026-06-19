import { CodegenContext } from './generator'
import { genProps, genPropsWithoutDirective, genChildren, genChildrenWithoutFor } from './genElementImpl'
import { genForDirective } from './genFor'

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
      context.push(`h("${node.tag}", `)
      
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
      context.push(`h("${node.tag}", `)
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
      context.push(`h("${node.tag}", `)
      genProps(node, context)
      context.push(`, `)
      genChildren(node, context)
      context.push(`)`)
    }
  }
}
