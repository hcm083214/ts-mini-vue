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
 * 创建公共实例代理，用于模板中访问 setupState 时自动解包 ref
 */
function createSetupContextProxy(instance: ComponentInstance): any {
    return new Proxy(instance.setupState, {
        get(target, key: string, receiver) {
            const result = Reflect.get(target, key, receiver)
            // 如果是 ref，自动解包
            if (isRef(result)) {
                return result.value
            }
            return result
        },
        set(target, key: string, value, receiver) {
            const oldValue = target[key]
            if (isRef(oldValue)) {
                // 如果旧值是 ref，设置其 value
                oldValue.value = value
                return true
            }
            return Reflect.set(target, key, value, receiver)
        }
    })
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
        update: null  // 添加 update effect
    }

    // 存储实例到 vnode
    vnode.component = instance

    // 执行 setup 函数
    if (component.setup) {
        const setupContext: ComponentContext = {
            emit: (event: string, ...args: any[]) => {
                console.log(`[emit] ${event}`, args)
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
            
            // 创建渲染函数
            const renderFn = new Function('h', 'toDisplayString', wrappedCode)
            
            // 创建公共实例代理
            const publicThis = createSetupContextProxy(instance)
            
            // 创建包装的 render 函数
            instance.render = function() {
                return renderFn.call(publicThis, createVNode, toDisplayString)
            }
        } catch (error) {
            console.error('Template compilation error:', error)
            console.error('Template:', component.template)
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
                    console.error('Render error:', error)
                }
            }
        } else {
            // 更新组件
            if (instance.render && instance.subTree) {
                try {
                    let subTree = instance.render()
                    
                    // 如果 render 返回的是数组，需要包装成 Fragment
                    if (Array.isArray(subTree)) {
                        subTree = createVNode(Fragment, null, subTree)
                    }
                    
                    const parent = instance.subTree.el?.parentNode as HTMLElement
                    if (parent && subTree) {
                        patch(instance.subTree, subTree, parent)
                    }
                    instance.subTree = subTree
                } catch (error) {
                    console.error('Update error:', error)
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
