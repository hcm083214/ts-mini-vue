import { ASTNode, ASTElement, ASTInterpolation, ASTText, ASTComment, ASTRoot } from './parser'

/**
 * 代码生成器 - 将 AST 转换为可执行的 JavaScript 代码字符串
 * 参照 Vue 3 源码及《Vue.js 设计与实现》的设计思路
 */

interface CodegenContext {
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
  // 创建代码生成上下文
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

  // 生成渲染函数
  genFunctionPreamble(context)
  genNode(ast, context)

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
 * 根据节点类型分发处理逻辑
 */
function genNode(node: ASTNode, context: CodegenContext) {
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
      // 对于未知类型，不做处理
      break
  }
}

/**
 * 生成根节点代码
 * 包裹在 render 函数中
 */
function genRoot(node: ASTRoot, context: CodegenContext) {
  // 生成 render 函数的声明
  context.push(`return function render() {`)
  context.indent()
  context.newLine()

  // 生成根节点的子节点
  if (node.children.length === 1) {
    // 如果只有一个子节点，直接返回
    context.push(`return `)
    genNode(node.children[0], context)
  } else if (node.children.length > 1) {
    // 多个子节点需要包裹在数组或 fragment 中
    // 简化处理：使用数组（实际 Vue 3 会使用 Fragment）
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
    // 没有子节点，返回 null
    context.push(`return null`)
  }

  context.deindent()
  context.newLine()
  context.push(`}`)
}

/**
 * 生成元素节点代码
 * 格式：h(tag, props, children)
 */
function genElement(node: ASTElement, context: CodegenContext) {
  // 调用 h 函数创建虚拟节点
  context.push(`h("${node.tag}", `)

  // 生成属性对象
  genProps(node, context)

  // 生成子节点
  context.push(`, `)
  genChildren(node, context)

  context.push(`)`)
}

/**
 * 生成元素属性
 */
function genProps(node: ASTElement, context: CodegenContext) {
  const props = node.props
  const directives = node.directives

  // 合并普通属性和指令
  const hasProps = Object.keys(props).length > 0
  const hasDirectives = Object.keys(directives).length > 0

  if (!hasProps && !hasDirectives) {
    // 没有属性和指令，传递 null
    context.push(`null`)
  } else {
    // 生成属性对象
    context.push(`{`)
    
    const allKeys = [...Object.keys(props), ...Object.keys(directives).map(k => `v-${k}`)]
    let isFirst = true

    // 生成普通属性
    for (const key in props) {
      if (!isFirst) context.push(`, `)
      const value = props[key]
      
      if (key.startsWith(':')) {
        // 动态绑定属性（如 :class、:id）
        // 去掉冒号前缀，值作为 JS 表达式
        const propName = key.slice(1)
        context.push(`"${propName}": ${value}`)
      } else if (key.startsWith('@')) {
        // 事件绑定（如 @click）
        // 去掉 @ 前缀，值作为事件处理函数名
        const eventName = key.slice(1)
        context.push(`"on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}": ${value}`)
      } else {
        // 静态属性
        context.push(`"${key}": ${JSON.stringify(value)}`)
      }
      
      isFirst = false
    }

    // 生成指令（简化处理，仅保留指令信息）
    for (const directiveName in directives) {
      if (!isFirst) context.push(`, `)
      const directiveValue = directives[directiveName]
      // 在实际 Vue 中，指令会被特殊处理
      // 这里简化为添加一个标记
      context.push(`"v-${directiveName}": ${JSON.stringify(directiveValue || '')}`)
      isFirst = false
    }

    context.push(`}`)
  }
}

/**
 * 生成子节点
 */
function genChildren(node: ASTElement, context: CodegenContext) {
  if (!node.children || node.children.length === 0) {
    context.push(`null`)
    return
  }

  if (node.children.length === 1) {
    // 单个子节点，直接生成
    genNode(node.children[0], context)
  } else {
    // 多个子节点，生成数组
    context.push(`[`)
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
  }
}

/**
 * 生成插值表达式
 * 格式：toDisplayString(expression)
 */
function genInterpolation(node: ASTInterpolation, context: CodegenContext) {
  // 使用 toDisplayString 确保安全的字符串输出
  // 在真实 Vue 中，这会处理 undefined、null 等情况
  context.push(`toDisplayString(${node.content})`)
}

/**
 * 生成文本节点
 */
function genText(node: ASTText, context: CodegenContext) {
  // 转义特殊字符并生成字符串字面量
  const content = JSON.stringify(node.content)
  context.push(content)
}

/**
 * 生成注释节点
 * 在运行时通常会被忽略或生成注释 VNode
 */
function genComment(node: ASTComment, context: CodegenContext) {
  // 简化处理：生成 null（注释在生产环境中通常被移除）
  // 如果需要保留注释，可以生成：h(Comment, null, "comment content")
  context.push(`null /* ${node.content} */`)
}
