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

/**
 * 标准化 class 值（参照 Vue 3 源码）
 * 支持字符串、数组、对象等多种格式
 */
function normalizeClass(value: any): string {
    if (!value) return ''
    
    if (typeof value === 'string') {
        return value
    }
    
    if (Array.isArray(value)) {
        return value.map(item => normalizeClass(item)).filter(Boolean).join(' ')
    }
    
    if (typeof value === 'object') {
        let result = ''
        for (const key in value) {
            if (value[key]) {
                result += (result ? ' ' : '') + key
            }
        }
        return result
    }
    
    return String(value)
}

/**
 * 标准化 style 值（参照 Vue 3 源码）
 * 支持字符串、数组、对象等多种格式
 */
function normalizeStyle(value: any): string {
    if (!value) return ''
    
    if (typeof value === 'string') {
        return value
    }
    
    if (Array.isArray(value)) {
        // 数组类型：递归处理每个元素并拼接
        return value.map(item => normalizeStyle(item)).filter(Boolean).join('; ')
    }
    
    if (typeof value === 'object') {
        // 对象类型：将键值对转换为 CSS 样式字符串
        let result = ''
        for (const key in value) {
            const val = value[key]
            if (val != null) {
                // 将驼峰命名转换为短横线命名（如 fontSize -> font-size）
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
                result += (result ? '; ' : '') + `${cssKey}: ${val}`
            }
        }
        return result
    }
    
    return String(value)
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
        
        // 添加新的事件监听器，确保 nextValue 是函数
        if (nextValue && typeof nextValue === 'function') {
            el.addEventListener(eventName, nextValue)
        } else if (nextValue) {
            console.warn(`[patchProp] Event handler for ${eventName} is not a function:`, typeof nextValue, nextValue)
        }
    } else if (key === 'class') {
        // 使用 normalizeClass 处理各种类型的 class 值
        el.className = normalizeClass(nextValue)
    } else if (key === 'style') {
        // 使用 normalizeStyle 处理各种类型的 style 值
        el.style.cssText = normalizeStyle(nextValue)
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
        children.forEach((child, index) => {
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
