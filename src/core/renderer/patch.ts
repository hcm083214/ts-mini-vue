import { mountElement, unmounted } from "./mounter";
import { VNode, Component, ComponentInstance } from "./types";
import { createVNode, toDisplayString } from "./h";
import { compile } from "../compiler/index";

/**
 * 更新虚拟 DOM - 基于 Vue 3 源码及《Vue.js 设计与实现》简化实现
 * @param n1 旧的虚拟 DOM 节点
 * @param n2 新的虚拟 DOM 节点
 * @param container 容器元素
 */
export function patch(n1: VNode | null, n2: VNode, container: HTMLElement): void {
    // 如果新旧节点类型不同，卸载旧节点，将 n1 置为 null
    if (n1 && n1.type !== n2.type) {
        unmounted(n1.el);
        n1 = null;
    }

    const { type } = n2;

    if (typeof type === "string") {
        // 普通 HTML 元素
        if (!n1) {
            mountElement(n2, container);
        } else {
            // 更新元素
            patchElement(n1, n2);
        }
    } else if (typeof type === "object" && type !== null) {
        // 组件节点
        if (!n1) {
            // 挂载组件
            mountComponent(n2, container);
        } else {
            // 更新组件
            updateComponent(n1, n2);
        }
    }
}

/**
 * 更新元素节点
 * @param n1 旧虚拟节点
 * @param n2 新虚拟节点
 */
function patchElement(n1: VNode, n2: VNode): void {
    const el = (n2.el = n1.el as any);

    // 1. 更新属性
    patchProps(el, n1.props || {}, n2.props || {});

    // 2. 更新子节点
    patchChildren(n1, n2, el as HTMLElement);
}

/**
 * 更新元素属性
 * @param el 真实 DOM 元素
 * @param prevProps 旧属性
 * @param nextProps 新属性
 */
function patchProps(el: HTMLElement, prevProps: Record<string, any>, nextProps: Record<string, any>): void {
    // 移除旧属性中不再存在的属性
    for (const key in prevProps) {
        if (!(key in nextProps)) {
            // 移除属性
            if (key === 'class') {
                el.className = '';
            } else if (key === 'style') {
                el.style.cssText = '';
            } else {
                el.removeAttribute(key);
            }
        }
    }

    // 设置新属性
    for (const key in nextProps) {
        const prevValue = prevProps[key];
        const nextValue = nextProps[key];
        
        if (prevValue !== nextValue) {
            // 更新属性
            if (key === 'class') {
                el.className = nextValue || '';
            } else if (key === 'style') {
                el.style.cssText = nextValue || '';
            } else if (key.startsWith('on')) {
                // 事件处理
                const eventName = key.slice(2).toLowerCase();
                if (prevValue) {
                    el.removeEventListener(eventName, prevValue);
                }
                if (nextValue) {
                    el.addEventListener(eventName, nextValue);
                }
            } else {
                // 普通属性或特性
                try {
                    (el as any)[key] = nextValue;
                } catch {
                    el.setAttribute(key, nextValue);
                }
            }
        }
    }
}

/**
 * 更新子节点
 * @param n1 旧虚拟节点
 * @param n2 新虚拟节点
 * @param container 容器元素
 */
function patchChildren(n1: VNode, n2: VNode, container: HTMLElement): void {
    const c1 = n1.children;
    const c2 = n2.children;

    if (typeof c2 === 'string') {
        // 新子节点是文本
        if (typeof c1 === 'string') {
            // 旧子节点也是文本，直接更新文本内容
            if (c1 !== c2) {
                container.textContent = c2;
            }
        } else {
            // 旧子节点是数组或 null，清空后设置文本
            container.textContent = c2;
        }
    } else if (Array.isArray(c2)) {
        // 新子节点是数组
        if (Array.isArray(c1)) {
            // 旧子节点也是数组，进行 diff 更新
            // 简化实现：清空旧节点，重新挂载新节点
            container.innerHTML = '';
            c2.forEach(child => {
                patch(null, child, container);
            });
        } else {
            // 旧子节点是文本或 null，清空后挂载新节点
            container.innerHTML = '';
            c2.forEach(child => {
                patch(null, child, container);
            });
        }
    } else {
        // 新子节点是 null
        if (Array.isArray(c1)) {
            // 旧子节点是数组，清空所有子节点
            container.innerHTML = '';
        } else if (typeof c1 === 'string') {
            // 旧子节点是文本，清空文本
            container.textContent = '';
        }
    }
}

/**
 * 挂载组件
 * @param vnode 组件虚拟节点
 * @param container 容器元素
 */
function mountComponent(vnode: VNode, container: HTMLElement): void {
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
            const subTree = instance.render();
            
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
function updateComponent(n1: VNode, n2: VNode): void {
    const instance = (n2.component = n1.component) as ComponentInstance;
    
    // 更新 props
    instance.props = resolveProps(n2.type as Component, n2.props || {});
    
    // 触发重新渲染（简化实现）
    // 在实际 Vue 中，这里会通过响应式系统自动触发更新
    if (instance.render && instance.isMounted && instance.subTree) {
        const subTree = instance.render.call(instance.setupState);
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
