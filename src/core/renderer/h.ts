import { VNode, VNodeProps, Fragment } from "./types";

/**
 * 创建虚拟节点 (Create Virtual Node)
 * 参照 Vue 3 的 h 函数实现
 * @param type 节点类型（字符串标签名或组件对象）
 * @param props 节点属性
 * @param children 子节点
 */
export function createVNode(
  type: string | Function | object | symbol,
  props?: VNodeProps | null,
  children?: VNode[] | string | null
): VNode {
  const vnode: VNode = {
    type,
    props: props || undefined,
    children: children || undefined,
    el: null as any, // 初始为 null，挂载后会被赋值为真实 DOM
    key: props?.key,
    tag: typeof type === 'string' ? type : undefined
  };

  return vnode;
}

/**
 * 简化版的 h 函数，支持多种调用方式
 * h('div', { id: 'app' }, 'hello')
 * h('div', { id: 'app' }, [h('span', null, 'child')])
 */
export function h(
  type: string | Function | object,
  propsOrChildren?: VNodeProps | VNode[] | string | null,
  children?: VNode[] | string | null
): VNode {
  // 处理参数重载
  if (arguments.length === 2) {
    // h(type, children) 或 h(type, props)
    if (propsOrChildren !== null && typeof propsOrChildren === 'object' && !Array.isArray(propsOrChildren)) {
      // 判断是 props 还是 children
      if (isVNode(propsOrChildren as any)) {
        // h(type, childVNode)
        return createVNode(type, null, [propsOrChildren as VNode]);
      } else {
        // h(type, props)
        return createVNode(type, propsOrChildren as VNodeProps, null);
      }
    } else {
      // h(type, children)
      return createVNode(type, null, propsOrChildren as VNode[] | string);
    }
  }

  // h(type, props, children)
  return createVNode(type, propsOrChildren as VNodeProps | null, children);
}

/**
 * 将值转换为显示字符串
 * 用于处理插值表达式 {{ value }}
 * 参照 Vue 3 的 toDisplayString 实现
 * @param val 任意值
 * @returns 安全的字符串表示
 */
export function toDisplayString(val: any): string {
  if (val == null) {
    return '';
  }
  if (Array.isArray(val)) {
    return val.map(item => toDisplayString(item)).join(', ');
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

/**
 * 判断是否为 VNode
 */
function isVNode(val: any): val is VNode {
  return val && val.type !== undefined;
}

// 导出 Fragment
export { Fragment }
