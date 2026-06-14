// runtime-core/component.ts - 组件相关逻辑
import { VNode, ComponentInstance, VNodeProps, Fragment } from './vnode'
import { createVNode, toDisplayString } from './h'
import { compile } from '../compiler/index'
import { patch } from '../runtime-dom/patch'
import { ReactiveEffect } from '../reactivity/index'
import { isRef } from '../reactivity/reactive'

/**
 * 组件上下文类型
 */
export interface ComponentContext {
    emit: (event: string, ...args: any[]) => void
}

/**
 * Setup 函数返回类型
 */
export type SetupResult = Record<string, any> | ((...args: any[]) => any)

/**
 * 组件类型
 */
export interface Component<P = Record<string, any>> {
    setup?: (props: P, context: ComponentContext) => SetupResult
    render?: () => VNode
    template?: string  // 支持模板字符串
    props?: string[]
    emits?: string[]
}

/**
 * 解析组件 props
 */
export function resolveProps(component: Component, rawProps: Record<string, any>): Record<string, any> {
    return { ...rawProps }
}


/**
 * 挂载组件
 */
export function mountComponent(vnode: VNode, container: HTMLElement): void {
    const component = vnode.type as Component
    
    // 创建组件实例
    const instance: ComponentInstance = {
        vnode,
        props: resolveProps(component, vnode.props || {}),
        setupState: {},
        render: null,  // 初始为 null，稍后设置
        isMounted: false,
        subTree: null,
        update: null,  // 添加 update effect
        container  // 保存容器引用
    }

    // 存储实例到 vnode
    vnode.component = instance

    // 执行 setup 函数
    if (component.setup) {
        const setupContext: ComponentContext = {
            emit: (event: string, ...args: any[]) => {
            }
        }
        
        const setupResult = component.setup(instance.props, setupContext)
        
        if (typeof setupResult === 'function') {
            // setup 返回渲染函数
            instance.render = setupResult as () => VNode | null
        } else if (setupResult && typeof setupResult === 'object') {
            // setup 返回状态对象，保持 ref 原样
            instance.setupState = setupResult
        }
    }

    // 如果有 template 但没有 render 函数，需要编译模板
    if (!instance.render && component.template) {
        try {
            // 编译模板为渲染函数字符串
            const renderCode = compile(component.template)
            
            // 调试：输出完整的编译结果
            console.log('[Component] Full compiled template:')
            console.log(renderCode)
            
            // 提取函数体
            const match = renderCode.match(/return\s+function\s+render\s*\(\)\s*\{([\s\S]*)\}\s*$/)
            
            if (!match) {
                throw new Error('Failed to parse render function')
            }
            
            const functionBody = match[1].trim()
            
            // 使用 with 语句包裹函数体
            const wrappedCode = `
                with(this) {
                    ${functionBody}
                }
            `
            
            // 创建渲染函数，传入 h、toDisplayString 和 Fragment
            const renderFn = new Function('h', 'toDisplayString', 'Fragment', wrappedCode)
            
            // 关键修复：创建 Proxy 代理 setupState，自动解包 ref
            // 参照 Vue 3 源码及《Vue.js 设计与实现》的实现
            const setupStateProxy = new Proxy(instance.setupState, {
                get(target, key, receiver) {
                    const value = Reflect.get(target, key, receiver)
                    // 如果值是 ref，自动解包（返回 .value）
                    if (isRef(value)) {
                        return value.value
                    }
                    return value
                },
                set(target, key, value, receiver) {
                    // 检查目标属性是否是 ref
                    const existingValue = Reflect.get(target, key, receiver)
                    if (isRef(existingValue)) {
                        // 如果是 ref，设置其 .value 属性
                        existingValue.value = value
                        return true
                    }
                    // 否则直接设置属性
                    return Reflect.set(target, key, value, receiver)
                },
                has(target, key) {
                    // 确保 in 操作符能正确判断属性是否存在
                    return key in target
                }
            })
            
            // 创建包装的 render 函数，使用 Proxy 代理后的 setupState 作为 this
            instance.render = function() {
                return renderFn.call(setupStateProxy, createVNode, toDisplayString, Fragment)
            }
        } catch (error) {
            // Template compilation error handling
        }
    }
    
    // 如果还是没有 render 函数，尝试使用 component.render
    if (!instance.render && component.render) {
        instance.render = component.render
    }

    // 创建更新 effect
    const effect = new ReactiveEffect(() => {
        
        if (!instance.isMounted) {
            // 首次挂载
            if (instance.render) {
                try {
                    let subTree = instance.render()
                    
                    
                    // 如果 render 返回的是数组，需要包装成 Fragment
                    if (Array.isArray(subTree)) {
                        subTree = createVNode(Fragment, null, subTree)
                    }
                    
                    instance.subTree = subTree
                    
                    // 递归 patch 子树
                    if (subTree) {
                        patch(null, subTree, container)
                    }
                    
                    // 标记为已挂载
                    instance.isMounted = true
                } catch (error) {
                    console.error('[mountComponent] Render error:', error)
                    // Render error handling
                }
            }
        } else {
            // 更新组件
            if (instance.render && instance.subTree && instance.container) {
                try {
                    
                    let newSubTree = instance.render()
                    
                    
                    // 如果 render 返回的是数组，需要包装成 Fragment
                    if (Array.isArray(newSubTree)) {
                        newSubTree = createVNode(Fragment, null, newSubTree)
                    }
                    
                    
                    // 使用保存的 container 进行 patch
                    if (newSubTree) {
                        patch(instance.subTree, newSubTree, instance.container)
                        instance.subTree = newSubTree
                    }
                    
                } catch (error) {
                    console.error('[mountComponent] Update error:', error)
                    // Update error handling
                }
            }
        }
    })
    
    // 存储 effect 到实例
    instance.update = effect
    
    // 执行 effect（会触发首次渲染并收集依赖）
    effect.run()
}

/**
 * 更新组件
 */
export function updateComponent(n1: VNode, n2: VNode): void {
    const instance = (n2.component = n1.component) as ComponentInstance
    
    // 更新 props
    instance.props = resolveProps(n2.type as Component, n2.props || {})
    
    // 触发重新渲染（通过 effect）
    if (instance.update) {
        instance.update.run()
    }
}
