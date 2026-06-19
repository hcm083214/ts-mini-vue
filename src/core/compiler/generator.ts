import { ASTNode, ASTElement, ASTInterpolation, ASTText, ASTComment, ASTRoot } from './parser'
import { genElement } from './genElement'
import { genForDirective } from './genFor'
import { genInterpolation, genText, genComment } from './genNodes'

/**
 * 代码生成器上下文
 */
export interface CodegenContext {
  code: string
  level: number
  push(code: string): void
  indent(): void
  deindent(): void
  newLine(): void
}

/**
 * 生成代码的主入口函数
 * @param ast 抽象语法树根节点
 * @returns 可执行的 JavaScript 渲染函数字符串
 */
export function generate(ast: ASTRoot): string {
  const context: CodegenContext = {
    code: '',
    level: 0,
    push(code: string) {
      this.code += code
    },
    indent() {
      this.level++
    },
    deindent() {
      this.level--
    },
    newLine() {
      this.push('\n' + '  '.repeat(this.level))
    }
  }

  genFunctionPreamble(context)
  genRoot(ast, context)

  return context.code
}

/**
 * 生成函数前缀（导入语句等）
 */
function genFunctionPreamble(context: CodegenContext) {
  // 在真实 Vue 3 中，这里会生成 import 语句
  // 例如：import { h, toDisplayString } from 'vue'
  // 简化版本：我们假设 h 和 toDisplayString 在全局作用域可用
}

/**
 * 生成根节点代码
 */
function genRoot(node: ASTRoot, context: CodegenContext) {
  context.push(`return function render() {`)
  context.indent()
  context.newLine()

  if (node.children.length === 1) {
    context.push(`return `)
    genNode(node.children[0], context)
  } else if (node.children.length > 1) {
    context.push(`return [`)
    context.indent()
    context.newLine()
    
    node.children.forEach((child, index) => {
      genNode(child, context)
      if (index < node.children.length - 1) {
        context.push(`,`)
        context.newLine()
      }
    })
    
    context.deindent()
    context.newLine()
    context.push(`]`)
  } else {
    context.push(`return null`)
  }

  context.deindent()
  context.newLine()
  context.push(`}`)
}

/**
 * 根据节点类型分发处理逻辑
 */
export function genNode(node: ASTNode, context: CodegenContext) {
  switch (node.type) {
    case 'Root':
      genRoot(node, context)
      break
    case 'Element':
      genElement(node, context)
      break
    case 'Interpolation':
      genInterpolation(node, context)
      break
    case 'Text':
      genText(node, context)
      break
    case 'Comment':
      genComment(node, context)
      break
    default:
      break
  }
}
