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
  // 检查是否是带控制流指令的 <template> 元素
  const isTemplateWrapper = node._isTemplateWrapper === true
  
  // 检查是否有 v-if、v-else-if 或 v-else 指令
  const hasVIf = 'if' in node.directives
  const hasVElseIf = 'else-if' in node.directives
  const hasVElse = 'else' in node.directives
  
  if (hasVIf || hasVElseIf) {
    // 有 v-if 或 v-else-if 指令，生成条件表达式
    const condition = node.directives['if'] || node.directives['else-if'] || 'true'
    
    context.push(`${condition} ? `)
    
    if (isTemplateWrapper) {
      // 对于 <template v-if>，不生成 template 元素，直接生成子元素（包装成 Fragment）
      context.push(`h(Fragment, null, `)
      genChildren(node, context)
      context.push(`)`)
    } else {
      // 普通元素，正常生成
      context.push(`h("${node.tag}", `)
      
      // 生成属性对象（不包含 v-if 或 v-else-if）
      if (hasVIf) {
        genPropsWithoutDirective(node, context, 'if')
      } else {
        genPropsWithoutDirective(node, context, 'else-if')
      }
      
      // 生成子节点
      context.push(`, `)
      genChildren(node, context)
      
      context.push(`)`)
    }
    
    // 检查是否有对应的 v-else 或 v-else-if
    if (node.elseNode) {
      context.push(` : `)
      genElement(node.elseNode, context)
    } else {
      context.push(` : null`)
    }
  } else if (hasVElse) {
    // 只有 v-else 指令（作为条件链的末尾）
    if (isTemplateWrapper) {
      // 对于 <template v-else>，不生成 template 元素，直接生成子元素（包装成 Fragment）
      context.push(`h(Fragment, null, `)
      genChildren(node, context)
      context.push(`)`)
    } else {
      // 普通元素，正常生成（但不包含 v-else 属性）
      context.push(`h("${node.tag}", `)
      
      // 生成属性对象（排除 v-else 指令）
      genPropsWithoutDirective(node, context, 'else')
      
      // 生成子节点
      context.push(`, `)
      genChildren(node, context)
      
      context.push(`)`)
    }
  } else {
    // 没有条件指令，正常生成
    if (isTemplateWrapper) {
      // 对于不带条件指令的 <template>，也作为 Fragment 处理
      context.push(`h(Fragment, null, `)
      genChildren(node, context)
      context.push(`)`)
    } else {
      context.push(`h("${node.tag}", `)
      
      // 生成属性对象
      genProps(node, context)
      
      // 生成子节点
      context.push(`, `)
      genChildren(node, context)
      
      context.push(`)`)
    }
  }
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
    
    // 先收集所有需要生成的属性，处理同名属性的合并
    const propEntries: Array<{ key: string; value: string }> = []
    
    // 处理普通属性
    for (const key in props) {
      const value = props[key]
      
      if (key.startsWith(':')) {
        // 动态绑定属性（如 :class、:id）
        // 去掉冒号前缀，值作为 JS 表达式
        const propName = key.slice(1)
        // 确保 value 不为 undefined
        propEntries.push({ key: propName, value: value !== undefined ? String(value) : 'undefined' })
      } else if (key.startsWith('@')) {
        // 事件绑定（如 @click）
        // 去掉 @ 前缀，值作为事件处理函数名
        const eventName = key.slice(1)
        const propKey = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`
        const exprValue = value !== undefined ? String(value) : ''
        
        // 关键修复：区分简单标识符和复杂表达式
        // - 如果是简单标识符（如 "increment"），直接使用该标识符作为事件处理器
        // - 如果是复杂表达式（如 "isActive = !isActive"），包装在函数中
        if (isSimpleIdentifier(exprValue)) {
          // 直接使用标识符，它会被 with(this) 作用域解析
          propEntries.push({ 
            key: propKey, 
            value: exprValue
          })
        } else {
          // 使用普通函数包装表达式，确保能访问 with(this) 作用域
          propEntries.push({ 
            key: propKey, 
            value: `function($event) { ${exprValue} }`
          })
        }
      } else {
        // 静态属性
        propEntries.push({ key, value: JSON.stringify(value) })
      }
    }

    // 处理指令
    for (const directiveName in directives) {
      const directiveValue = directives[directiveName]
      
      if (directiveName === 'show') {
        // v-show 指令：转换为 style.display 条件表达式
        // 生成：style: [existingStyle, { display: condition ? '' : 'none' }]
        const condition = directiveValue || 'true'
        
        // 检查是否已有 style 属性
        const existingStyleIndex = propEntries.findIndex(p => p.key === 'style')
        
        if (existingStyleIndex !== -1) {
          // 已有 style 属性，需要合并
          const existingStyle = propEntries[existingStyleIndex].value
          // 将现有 style 包装成数组，并添加 v-show 的条件样式
          propEntries[existingStyleIndex].value = `[${existingStyle}, { display: ${condition} ? '' : 'none' }]`
        } else {
          // 没有 style 属性，直接添加
          propEntries.push({ 
            key: 'style', 
            value: `{ display: ${condition} ? '' : 'none' }`
          })
        }
      } else {
        // 其他指令：保留为 v-xxx 属性（简化处理）
        propEntries.push({ 
          key: `v-${directiveName}`, 
          value: JSON.stringify(directiveValue || '') 
        })
      }
    }

    // 合并同名属性（特别是 class）
    const mergedProps = mergeProps(propEntries)
    
    // 生成合并后的属性
    let isFirst = true
    for (const entry of mergedProps) {
      if (!isFirst) context.push(`, `)
      context.push(`"${entry.key}": ${entry.value}`)
      isFirst = false
    }

    context.push(`}`)
  }
}

/**
 * 生成元素属性（排除指定指令）
 */
function genPropsWithoutDirective(node: ASTElement, context: CodegenContext, excludeDirective: string) {
  const props = node.props
  const directives = node.directives

  // 合并普通属性和指令（排除指定的指令）
  const hasProps = Object.keys(props).length > 0
  const hasDirectives = Object.keys(directives).filter(k => k !== excludeDirective).length > 0

  if (!hasProps && !hasDirectives) {
    // 没有属性和指令，传递 null
    context.push(`null`)
  } else {
    // 生成属性对象
    context.push(`{`)
    
    // 先收集所有需要生成的属性，处理同名属性的合并
    const propEntries: Array<{ key: string; value: string }> = []
    
    // 处理普通属性
    for (const key in props) {
      const value = props[key]
      
      if (key.startsWith(':')) {
        // 动态绑定属性（如 :class、:id）
        // 去掉冒号前缀，值作为 JS 表达式
        const propName = key.slice(1)
        // 确保 value 不为 undefined
        propEntries.push({ key: propName, value: value !== undefined ? String(value) : 'undefined' })
      } else if (key.startsWith('@')) {
        // 事件绑定（如 @click）
        // 去掉 @ 前缀，值作为事件处理函数名
        const eventName = key.slice(1)
        const propKey = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`
        const exprValue = value !== undefined ? String(value) : ''
        
        // 关键修复：区分简单标识符和复杂表达式
        // - 如果是简单标识符（如 "increment"），直接使用该标识符作为事件处理器
        // - 如果是复杂表达式（如 "isActive = !isActive"），包装在函数中
        if (isSimpleIdentifier(exprValue)) {
          // 直接使用标识符，它会被 with(this) 作用域解析
          propEntries.push({ 
            key: propKey, 
            value: exprValue
          })
        } else {
          // 使用普通函数包装表达式，确保能访问 with(this) 作用域
          propEntries.push({ 
            key: propKey, 
            value: `function($event) { ${exprValue} }`
          })
        }
      } else {
        // 静态属性
        propEntries.push({ key, value: JSON.stringify(value) })
      }
    }

    // 处理指令（简化处理，仅保留指令信息，排除指定的指令）
    for (const directiveName in directives) {
      if (directiveName === excludeDirective) continue
      
      const directiveValue = directives[directiveName]
      propEntries.push({ 
        key: `v-${directiveName}`, 
        value: JSON.stringify(directiveValue || '') 
      })
    }

    // 合并同名属性（特别是 class）
    const mergedProps = mergeProps(propEntries)
    
    // 生成合并后的属性
    let isFirst = true
    for (const entry of mergedProps) {
      if (!isFirst) context.push(`, `)
      context.push(`"${entry.key}": ${entry.value}`)
      isFirst = false
    }

    context.push(`}`)
  }
}

/**
 * 判断字符串是否是简单的标识符（只包含字母、数字、下划线、美元符号）
 */
function isSimpleIdentifier(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str)
}

/**
 * 合并同名属性（参照 Vue 3 源码）
 * 特别处理 class 和 style 的合并
 */
function mergeProps(entries: Array<{ key: string; value: string }>): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = []
  const propMap = new Map<string, string[]>()
  
  // 按 key 分组
  for (const entry of entries) {
    if (!propMap.has(entry.key)) {
      propMap.set(entry.key, [])
    }
    propMap.get(entry.key)!.push(entry.value)
  }
  
  // 合并相同 key 的值
  for (const [key, values] of propMap) {
    if (values.length === 1) {
      // 只有一个值，直接使用
      result.push({ key, value: values[0] })
    } else {
      // 多个值需要合并
      if (key === 'class') {
        // class 属性：使用数组包裹所有值，运行时由 normalizeClass 处理
        result.push({ key, value: `[${values.join(', ')}]` })
      } else if (key === 'style') {
        // style 属性：使用数组包裹所有值，运行时由 normalizeStyle 处理
        result.push({ key, value: `[${values.join(', ')}]` })
      } else {
        // 其他属性：后面的覆盖前面的
        result.push({ key, value: values[values.length - 1] })
      }
    }
  }
  
  return result
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
