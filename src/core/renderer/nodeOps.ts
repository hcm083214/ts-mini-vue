function insert(el: HTMLElement, parent: HTMLElement, anchor: HTMLElement | null) {
    parent.insertBefore(el, anchor)
}

function remove(el: HTMLElement) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}

function createElement(tag: string): HTMLElement {
    return document.createElement(tag)
}

function setElementText(el: HTMLElement, text: string) {
    el.textContent = text
}

function shouldSetAsProps(el: HTMLElement, key: string, value: any) { // 特殊处理
    if (key === 'form' && el.tagName === 'INPUT') return false // 兜底 
    return key in el
}

function patchProp(el: HTMLElement, key: string, prevValue: any, nextValue: any) {
    if (key === 'class') {
        el.className = nextValue || ''
    } else if (key === 'style') {
        el.style.cssText = nextValue
    } else if (shouldSetAsProps(el, key, nextValue)) {
        const type = typeof (el as any)[key];
        if (type === 'boolean' && nextValue === '') {
            (el as any)[key] = true;
        } else {
            (el as any)[key] = nextValue;
        }
    } else {
        el.setAttribute(key, nextValue)
    }
}

export const nodeOps = { insert, remove, createElement, setElementText, patchProp }