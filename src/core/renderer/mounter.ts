import { nodeOps } from "./nodeOps"
import { Component, ComponentInstance, Fragment, VNode } from "./types";
import { createVNode, toDisplayString } from "./h";
import { compile } from "../compiler/index";
import { patch } from "./patch";

/**
 * 挂载组件
 * @param vnode 组件虚拟节点
 * @param container 容器元素
 */
export function mountComponent(vnode: VNode, container: HTMLElement): void {
    const component = vnode.type as Component;
    
    // 创建组件实例
    const instance: ComponentInstance = {
        vnode,
        props: resolveProps(component, vnode.props || {}),
        setupState: {},
        render: null as any,  // 初始为 null，稍后设置
        isMounted: false,
        subTree: null
    };

    // 存储实例到 vnode
    vnode.component = instance;

    // 执行 setup 函数
    if (component.setup) {
        const setupContext = {
            emit: (event: string, ...args: any[]) => {
                console.log(`[emit] ${event}`, args);
            }
        };
        
        const setupResult = component.setup(instance.props, setupContext);
        
        if (typeof setupResult === 'function') {
            // setup 返回渲染函数
            instance.render = setupResult as () => VNode | null;
        } else if (setupResult && typeof setupResult === 'object') {
            // setup 返回状态对象
            instance.setupState = setupResult;
        }
    }

    // 如果有 template 但没有 render 函数，需要编译模板
    if (!instance.render && component.template) {
        try {
            // 编译模板为渲染函数字符串
            const renderCode = compile(component.template);
            
            // 编译后的代码格式是: "return function render() { ... }"
            // 我们需要提取函数体，然后在新的上下文中执行
            
            // 提取函数体（使用更宽松的正则）
            const match = renderCode.match(/return\s+function\s+render\s*\(\)\s*\{([\s\S]*)\}\s*$/);
            
            if (!match) {
                throw new Error('Failed to parse render function');
            }
            
            const functionBody = match[1].trim();
            
            // 创建一个包装函数，将 setupState 的属性作为局部变量
            const setupKeys = Object.keys(instance.setupState);
            
            // 构建函数参数
            const params = ['h', 'toDisplayString', ...setupKeys];
            
            // 创建渲染函数，直接返回渲染结果
            // functionBody 应该是 "return h(...)" 这样的形式
            const wrappedCode = `${functionBody}`;
            
            try {
                // 创建渲染函数生成器
                const renderFn = new Function(...params, wrappedCode);
                
                // 创建一个包装的 render 函数，每次调用时重新执行
                instance.render = function() {
                    // 重新获取最新的 setupValues
                    const currentSetupValues = setupKeys.map(key => (instance.setupState as any)[key]);
                    return renderFn(createVNode, toDisplayString, ...currentSetupValues);
                };
            } catch (creationError) {
                throw creationError;
            }
        } catch (error) {
            console.error('Template compilation error:', error);
            console.error('Template:', component.template);
        }
    }
    
    // 如果还是没有 render 函数，尝试使用 component.render
    if (!instance.render && component.render) {
        instance.render = component.render;
    }

    // 执行渲染函数获取子树
    if (instance.render) {
        try {
            // 在渲染时，将 setupState 中的变量注入到作用域
            let subTree = instance.render();
            
            // 如果 render 返回的是数组，需要包装成 Fragment
            if (Array.isArray(subTree)) {
                subTree = createVNode(Fragment, null, subTree);
            }
            
            instance.subTree = subTree;
            
            // 递归 patch 子树
            if (subTree) {
                patch(null, subTree, container);
            }
            
            // 标记为已挂载
            instance.isMounted = true;
        } catch (error) {
            console.error('Render error:', error);
        }
    }
}

/**
 * 更新组件
 * @param n1 旧虚拟节点
 * @param n2 新虚拟节点
 */
export function updateComponent(n1: VNode, n2: VNode): void {
    const instance = (n2.component = n1.component) as ComponentInstance;
    
    // 更新 props
    instance.props = resolveProps(n2.type as Component, n2.props || {});
    
    // 触发重新渲染（简化实现）
    // 在实际 Vue 中，这里会通过响应式系统自动触发更新
    if (instance.render && instance.isMounted && instance.subTree) {
        let subTree = instance.render.call(instance.setupState);
        
        // 如果 render 返回的是数组，需要包装成 Fragment
        if (Array.isArray(subTree)) {
            subTree = createVNode(Fragment, null, subTree);
        }
        
        const parent = instance.subTree.el?.parentNode as HTMLElement;
        if (parent && subTree) {
            patch(instance.subTree, subTree, parent);
        }
        instance.subTree = subTree;
    }
}

/**
 * 解析组件 props
 * @param component 组件定义
 * @param rawProps 原始属性
 */
function resolveProps(component: Component, rawProps: Record<string, any>): Record<string, any> {
    // 简化实现：直接返回所有属性
    // 在实际 Vue 中，需要根据 component.props 定义进行过滤和转换
    return { ...rawProps };
}

/**
 * 挂载片段节点
 * @param vnode 片段虚拟节点
 * @param container 容器元素
 */
export function mountFragment(vnode: VNode, container: HTMLElement): void {
    const children = vnode.children as VNode[];
    if (Array.isArray(children)) {
        children.forEach(child => {
            patch(null, child, container);
        });
    }
}

export interface RendererOptions {
    patchProp(el: HTMLElement, key: string, prevValue: any, nextValue: any): void
    insert(el: HTMLElement, parent: HTMLElement, anchor: HTMLElement | null): void
    remove(el: HTMLElement): void
    createElement(tag: string): HTMLElement
    setElementText(el: HTMLElement, text: string): void
}

export function mountElement(vnode: VNode, container: HTMLElement) {
    const { patchProp, insert, createElement, setElementText } = nodeOps
    // 调用 createElement 函数创建元素
    const el = vnode.el = createElement(vnode.type as string)
    
    if (typeof vnode.children === 'string') {
        // 调用 setElementText 设置元素的文本节点
        setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
        // 遍历 children 数组
        vnode.children.forEach(child => {
            patch(null, child, el) // 递归调用 patch 函数挂载子节点
        })
    } else if (vnode.children && typeof vnode.children === 'object') {
        // 单个子节点（VNode 对象）
        patch(null, vnode.children as VNode, el)
    }
    
    if (vnode.props) {
        // 遍历 props 对象
        for (const key in vnode.props) {
            // 调用 patchProp 函数处理属性
            patchProp(el, key, null, vnode.props[key])
        }
    }
    
    // 调用 insert 函数将元素插入到容器内
    insert(el, container, null)
}

export function unmounted(el: HTMLElement | null) {
    if (el) {
        const parent = el.parentNode;
        if (parent) {
            parent.removeChild(el);
        }
    }
}