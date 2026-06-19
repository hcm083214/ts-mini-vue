import { ASTInterpolation, ASTText, ASTComment } from './parser'
import { CodegenContext } from './generator'

/**
 * 生成插值表达式
 */
export function genInterpolation(node: ASTInterpolation, context: CodegenContext) {
  context.push(`toDisplayString(${node.content})`)
}

/**
 * 生成文本节点
 */
export function genText(node: ASTText, context: CodegenContext) {
  context.push(JSON.stringify(node.content))
}

/**
 * 生成注释节点
 */
export function genComment(node: ASTComment, context: CodegenContext) {
  context.push(`null /* ${node.content} */`)
}
