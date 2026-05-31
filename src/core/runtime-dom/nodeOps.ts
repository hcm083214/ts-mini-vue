// runtime-dom/nodeOps.ts - DOM 操作封装
import { VNode } from "../runtime-core/vnode"
import { patch } from "./patch"

function insert(el: HTMLElement, parent: HTMLElement, anchor: HTMLElement | null) {
    parent.insertBefore(el, anchor)
}

function remove(el: HTMLElement) {
    const parent = el.parentNode
    if (parent) {
        parent.removeChild(el)
    }
}

function createElement(tag: string): HTMLElement {
    return document.createElement(tag)
}

function setElementText(el: HTMLElement, text: string) {
    el.textContent = text
}

function shouldSetAsProps(el: HTMLElement, key: string, value: any): boolean {
    if (key === 'form' && el.tagName === 'INPUT') return false
    return key in el
}

function patchProp(el: HTMLElement, key: string, prevValue: any, nextValue: any) {
    // 特殊处理事件绑定（以 on 开头的属性，如 onClick）
    if (key.startsWith('on')) {
        // 提取事件名称（去掉 'on' 前缀并转为小写）
        const eventName = key.slice(2).toLowerCase()
        
        // 移除旧的事件监听器
        if (prevValue) {
            el.removeEventListener(eventName, prevValue)
        }
        
        // 添加新的事件监听器
        if (nextValue) {
            el.addEventListener(eventName, nextValue)
        }
    } else if (key === 'class') {
        el.className = nextValue || ''
    } else if (key === 'style') {
        el.style.cssText = nextValue
    } else if (shouldSetAsProps(el, key, nextValue)) {
        const type = typeof (el as any)[key]
        if (type === 'boolean' && nextValue === '') {
            (el as any)[key] = true
        } else {
            (el as any)[key] = nextValue
        }
    } else {
        el.setAttribute(key, nextValue)
    }
}

export function mountElement(vnode: VNode, container: HTMLElement) {
    const el = vnode.el = createElement(vnode.type as string)
    
    if (typeof vnode.children === 'string') {
        setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
        vnode.children.forEach(child => {
            if (typeof child === 'string') {
                const textNode = document.createTextNode(child)
                el.appendChild(textNode)
            } else if (child !== null && child !== undefined) {
                patch(null, child as VNode, el)
            }
        })
    } else if (vnode.children && typeof vnode.children === 'object') {
        patch(null, vnode.children as VNode, el)
    }
    
    if (vnode.props) {
        for (const key in vnode.props) {
            patchProp(el, key, null, vnode.props[key])
        }
    }
    
    insert(el, container, null)
}

export function unmounted(el: HTMLElement | null) {
    if (el) {
        const parent = el.parentNode
        if (parent) {
            parent.removeChild(el)
        }
    }
}

export function mountFragment(vnode: VNode, container: HTMLElement): void {
    const children = vnode.children as VNode[]
    if (Array.isArray(children)) {
        children.forEach(child => {
            patch(null, child, container)
        })
        
        // Fragment 的 el 指向第一个子节点的 el
        if (children.length > 0 && children[0]) {
            vnode.el = children[0].el
        }
    }
}

// 导出 patchProp 供 patch.ts 使用
export { patchProp }

export const nodeOps = { insert, remove, createElement, setElementText, patchProp }
