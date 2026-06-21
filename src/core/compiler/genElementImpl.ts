import { ASTElement } from './parser'
import { CodegenContext, genNode } from './generator'

/**
 * 生成元素属性
 */
export function genProps(node: ASTElement, context: CodegenContext) {
  const props = node.props
  const directives = node.directives

  const hasProps = Object.keys(props).length > 0
  const hasDirectives = Object.keys(directives).length > 0

  if (!hasProps && !hasDirectives) {
    context.push(`null`)
  } else {
    context.push(`{`)
    
    const propEntries: Array<{ key: string; value: string }> = []
    
    for (const key in props) {
      const value = props[key]
      
      if (key.startsWith(':')) {
        const propName = key.slice(1)
        propEntries.push({ key: propName, value: value !== undefined ? String(value) : 'undefined' })
      } else if (key.startsWith('@')) {
        const eventName = key.slice(1)
        // 参照 Vue 3 源码：将 kebab-case 转换为 camelCase
        // enlarge-text -> enlargeText -> onEnlargeText
        const camelCaseName = eventName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        const propKey = `on${camelCaseName.charAt(0).toUpperCase()}${camelCaseName.slice(1)}`
        const exprValue = value !== undefined ? String(value) : ''
        
        if (isSimpleIdentifier(exprValue)) {
          propEntries.push({ key: propKey, value: exprValue })
        } else if (isFunctionExpression(exprValue)) {
          propEntries.push({ key: propKey, value: exprValue })
        } else {
          propEntries.push({ key: propKey, value: `function($event) { ${exprValue} }` })
        }
      } else {
        propEntries.push({ key, value: JSON.stringify(value) })
      }
    }

    for (const directiveName in directives) {
      const directiveValue = directives[directiveName]
      
      if (directiveName === 'show') {
        const condition = directiveValue || 'true'
        
        const existingStyleIndex = propEntries.findIndex(p => p.key === 'style')
        
        if (existingStyleIndex !== -1) {
          const existingStyle = propEntries[existingStyleIndex].value
          propEntries[existingStyleIndex].value = `[${existingStyle}, { display: ${condition} ? '' : 'none' }]`
        } else {
          propEntries.push({ key: 'style', value: `{ display: ${condition} ? '' : 'none' }` })
        }
      } else if (directiveName === 'model') {
        const modelValue = directiveValue || ''
        const inputType = props['type']
        
        if (inputType === 'checkbox') {
          const checkboxValue = props['value'] !== undefined ? props['value'] : 'on'
          
          propEntries.push({
            key: 'checked',
            value: `Array.isArray(${modelValue}) ? ${modelValue}.includes(${JSON.stringify(checkboxValue)}) : ${modelValue}`
          })
          
          propEntries.push({
            key: 'onChange',
            value: `function($event) {
              var _val = ${JSON.stringify(checkboxValue)};
              var _checked = $event.target.checked;
              if (Array.isArray(${modelValue})) {
                var _index = ${modelValue}.indexOf(_val);
                if (_checked && _index === -1) {
                  ${modelValue}.push(_val);
                } else if (!_checked && _index > -1) {
                  ${modelValue}.splice(_index, 1);
                }
              } else {
                ${modelValue} = _checked;
              }
            }`
          })
        } else if (inputType === 'radio') {
          const radioValue = props['value'] !== undefined ? props['value'] : ''
          
          propEntries.push({
            key: 'checked',
            value: `${modelValue} === ${JSON.stringify(radioValue)}`
          })
          
          propEntries.push({
            key: 'onChange',
            value: `function($event) { ${modelValue} = ${JSON.stringify(radioValue)} }`
          })
        } else {
          propEntries.push({
            key: 'value',
            value: modelValue
          })
          
          propEntries.push({
            key: 'onInput',
            value: `function($event) { ${modelValue} = $event.target.value }`
          })
        }
      } else {
        propEntries.push({ key: `v-${directiveName}`, value: JSON.stringify(directiveValue || '') })
      }
    }

    const mergedProps = mergeProps(propEntries)
    
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
export function genPropsWithoutDirective(node: ASTElement, context: CodegenContext, excludeDirective: string) {
  const props = node.props
  const directives = node.directives

  const hasProps = Object.keys(props).length > 0
  const hasDirectives = Object.keys(directives).filter(k => k !== excludeDirective).length > 0

  if (!hasProps && !hasDirectives) {
    context.push(`null`)
  } else {
    context.push(`{`)
    
    const propEntries: Array<{ key: string; value: string }> = []
    
    for (const key in props) {
      const value = props[key]
      
      if (key.startsWith(':')) {
        const propName = key.slice(1)
        propEntries.push({ key: propName, value: value !== undefined ? String(value) : 'undefined' })
      } else if (key.startsWith('@')) {
        const eventName = key.slice(1)
        // 参照 Vue 3 源码：将 kebab-case 转换为 camelCase
        // enlarge-text -> enlargeText -> onEnlargeText
        const camelCaseName = eventName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        const propKey = `on${camelCaseName.charAt(0).toUpperCase()}${camelCaseName.slice(1)}`
        const exprValue = value !== undefined ? String(value) : ''
        
        if (isSimpleIdentifier(exprValue)) {
          propEntries.push({ key: propKey, value: exprValue })
        } else if (isFunctionExpression(exprValue)) {
          propEntries.push({ key: propKey, value: exprValue })
        } else {
          propEntries.push({ key: propKey, value: `function($event) { ${exprValue} }` })
        }
      } else {
        propEntries.push({ key, value: JSON.stringify(value) })
      }
    }

    for (const directiveName in directives) {
      if (directiveName === excludeDirective) continue
      
      const directiveValue = directives[directiveName]
      
      if (directiveName === 'show') {
        const condition = directiveValue || 'true'
        
        const existingStyleIndex = propEntries.findIndex(p => p.key === 'style')
        
        if (existingStyleIndex !== -1) {
          const existingStyle = propEntries[existingStyleIndex].value
          propEntries[existingStyleIndex].value = `[${existingStyle}, { display: ${condition} ? '' : 'none' }]`
        } else {
          propEntries.push({ key: 'style', value: `{ display: ${condition} ? '' : 'none' }` })
        }
      } else if (directiveName === 'model') {
        const modelValue = directiveValue || ''
        const inputType = props['type']
        
        if (inputType === 'checkbox') {
          const checkboxValue = props['value'] !== undefined ? props['value'] : 'on'
          
          propEntries.push({
            key: 'checked',
            value: `Array.isArray(${modelValue}) ? ${modelValue}.includes(${JSON.stringify(checkboxValue)}) : ${modelValue}`
          })
          
          propEntries.push({
            key: 'onChange',
            value: `function($event) {
              var _val = ${JSON.stringify(checkboxValue)};
              var _checked = $event.target.checked;
              if (Array.isArray(${modelValue})) {
                var _index = ${modelValue}.indexOf(_val);
                if (_checked && _index === -1) {
                  ${modelValue}.push(_val);
                } else if (!_checked && _index > -1) {
                  ${modelValue}.splice(_index, 1);
                }
              } else {
                ${modelValue} = _checked;
              }
            }`
          })
        } else if (inputType === 'radio') {
          const radioValue = props['value'] !== undefined ? props['value'] : ''
          
          propEntries.push({
            key: 'checked',
            value: `${modelValue} === ${JSON.stringify(radioValue)}`
          })
          
          propEntries.push({
            key: 'onChange',
            value: `function($event) { ${modelValue} = ${JSON.stringify(radioValue)} }`
          })
        } else {
          propEntries.push({
            key: 'value',
            value: modelValue
          })
          
          propEntries.push({
            key: 'onInput',
            value: `function($event) { ${modelValue} = $event.target.value }`
          })
        }
      } else {
        propEntries.push({ key: `v-${directiveName}`, value: JSON.stringify(directiveValue || '') })
      }
    }

    const mergedProps = mergeProps(propEntries)
    
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
 * 生成子节点
 */
export function genChildren(node: ASTElement, context: CodegenContext) {
  if (!node.children || node.children.length === 0) {
    context.push(`null`)
    return
  }

  const hasVForChild = node.children.some(child => 
    child.type === 'Element' && 'for' in child.directives
  )

  if (node.children.length === 1 && !hasVForChild) {
    genNode(node.children[0], context)
  } else {
    context.push(`[`)
    context.indent()
    context.newLine()

    node.children.forEach((child, index) => {
      if (child.type === 'Element' && 'for' in child.directives) {
        context.push(`...`)
      }
      
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
 * 生成子节点（排除嵌套的 v-for 元素）
 */
export function genChildrenWithoutFor(node: ASTElement, context: CodegenContext) {
  if (!node.children || node.children.length === 0) {
    context.push(`null`)
    return
  }

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

/**
 * 判断字符串是否是简单的标识符
 */
export function isSimpleIdentifier(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str)
}

/**
 * 判断字符串是否是函数表达式
 */
export function isFunctionExpression(str: string): boolean {
  if (/\s*=>\s*/.test(str)) {
    return true
  }
  if (/^\s*function\s*\(/.test(str)) {
    return true
  }
  return false
}

/**
 * 合并同名属性
 */
export function mergeProps(entries: Array<{ key: string; value: string }>): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = []
  const propMap = new Map<string, string[]>()
  
  for (const entry of entries) {
    if (!propMap.has(entry.key)) {
      propMap.set(entry.key, [])
    }
    propMap.get(entry.key)!.push(entry.value)
  }
  
  for (const [key, values] of propMap) {
    if (values.length === 1) {
      result.push({ key, value: values[0] })
    } else {
      if (key === 'class') {
        result.push({ key, value: `[${values.join(', ')}]` })
      } else if (key === 'style') {
        result.push({ key, value: `[${values.join(', ')}]` })
      } else {
        result.push({ key, value: values[values.length - 1] })
      }
    }
  }
  
  return result
}
