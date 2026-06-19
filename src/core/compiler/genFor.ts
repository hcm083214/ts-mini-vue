import { ASTElement } from './parser'
import { CodegenContext } from './generator'
import { genProps, genPropsWithoutDirective, genChildren, genChildrenWithoutFor } from './genElementImpl'
import { getTagCode } from './genElement'

/**
 * 生成 v-for 指令代码
 */
export function genForDirective(node: ASTElement, context: CodegenContext) {
  const forExpression = node.directives['for']
  const tagCode = getTagCode(node.tag)
  
  if (!forExpression) {
    context.push(`h(${tagCode}, `)
    genProps(node, context)
    context.push(`, `)
    genChildren(node, context)
    context.push(`)`)
    return
  }
  
  const parsed = parseForExpression(forExpression)
  
  if (!parsed) {
    context.push(`h(${tagCode}, `)
    genProps(node, context)
    context.push(`, `)
    genChildren(node, context)
    context.push(`)`)
    return
  }
  
  const { source, value, key, index } = parsed
  
  const isNumberLiteral = /^\d+$/.test(source.trim())
  const isObjectIteration = key !== undefined
  
  if (isNumberLiteral) {
    const params = ['_', 'i']
    const paramStr = params.join(', ')
    
    context.push(`Array.from({ length: ${source} }, (${paramStr}) => { `)
    context.push(`const ${value} = i + 1; return `)
  } else if (isObjectIteration) {
    const params = [key!]
    if (index) params.push(index)
    const paramStr = params.join(', ')
    
    context.push(`Object.keys(${source}).map((${paramStr}) => { `)
    context.push(`const ${value} = ${source}[${key}]; return `)
  } else {
    const params = [value]
    if (index) params.push(index)
    const paramStr = params.join(', ')
    
    context.push(`(${source}).map((${paramStr}) => { return `)
  }
  
  const isTemplateWrapper = node._isTemplateWrapper === true
  
  if (isTemplateWrapper) {
    context.push(`h(Fragment, null, `)
    genChildrenWithoutFor(node, context)
    context.push(`)`)
  } else {
    context.push(`h(${tagCode}, `)
    genPropsWithoutDirective(node, context, 'for')
    context.push(`, `)
    genChildrenWithoutFor(node, context)
    context.push(`)`)
  }
  
  context.push(` })`)
}

/**
 * 解析 v-for 表达式
 */
export function parseForExpression(expression: string): {
  source: string
  value: string
  key?: string
  index?: string
} | null {
  const inMatch = expression.match(/^(.*)\s+(?:in|of)\s+(.*)$/)
  
  if (!inMatch) {
    return null
  }
  
  const leftPart = inMatch[1].trim()
  const source = inMatch[2].trim()
  
  let value: string
  let key: string | undefined
  let index: string | undefined
  
  if (leftPart.startsWith('(') && leftPart.endsWith(')')) {
    const inner = leftPart.slice(1, -1).trim()
    const parts = inner.split(',').map(p => p.trim())
    
    if (parts.length === 1) {
      value = parts[0]
    } else if (parts.length === 2) {
      value = parts[0]
      index = parts[1]
    } else if (parts.length === 3) {
      value = parts[0]
      key = parts[1]
      index = parts[2]
    } else {
      return null
    }
  } else {
    value = leftPart
  }
  
  const isValidIdentifier = (name: string) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)
  
  if (!isValidIdentifier(value)) {
    return null
  }
  if (key && !isValidIdentifier(key)) {
    return null
  }
  if (index && !isValidIdentifier(index)) {
    return null
  }
  
  return { source, value, key, index }
}
