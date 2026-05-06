import { nodeOps } from "./nodeOps"
import { patch } from "./patch"
import { VNode } from "./types"

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