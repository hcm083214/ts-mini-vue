import { VNode, Fragment } from "../runtime-core/vnode"
import { mountElement, unmounted, mountFragment, patchProp } from "./nodeOps"
import { mountComponent, updateComponent } from "../runtime-core/component"

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

    if (type === Fragment) {
        // 片段节点（Fragment），处理子节点数组
        if (!n1) {
            // 挂载片段
            mountFragment(n2, container);
        } else {
            // 更新片段
            patchFragment(n1, n2, container);
        }
    } else if (typeof type === "string") {
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
 * 更新片段节点
 * @param n1 旧片段虚拟节点
 * @param n2 新片段虚拟节点
 * @param container 容器元素
 */
function patchFragment(n1: VNode, n2: VNode, container: HTMLElement): void {
    const c1 = n1.children as VNode[];
    const c2 = n2.children as VNode[];

    if (Array.isArray(c1) && Array.isArray(c2)) {
        // 简化实现：使用 patchKeyedChildren 进行 diff
        patchKeyedChildren(c1, c2, container);
    } else if (Array.isArray(c2)) {
        // 旧的不是数组，新的是数组，清空后重新挂载
        container.innerHTML = '';
        c2.forEach(child => {
            patch(null, child, container);
        });
    }
    
    // 更新 Fragment 的 el 为第一个子节点的 el
    if (c2 && c2.length > 0 && c2[0]) {
        n2.el = c2[0].el;
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
            // 调用 patchProp 传入 null 作为新值来移除
            patchProp(el, key, prevProps[key], null)
        }
    }

    // 设置新属性
    for (const key in nextProps) {
        const prevValue = prevProps[key]
        const nextValue = nextProps[key]

        if (prevValue !== nextValue) {
            // 调用统一的 patchProp 函数
            patchProp(el, key, prevValue, nextValue)
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
                if (typeof child === 'string') {
                    // 字符串类型，创建文本节点
                    const textNode = document.createTextNode(child);
                    container.appendChild(textNode);
                } else if (child !== null && child !== undefined) {
                    // VNode 类型，递归 patch
                    patch(null, child as VNode, container);
                }
            });
        } else {
            // 旧子节点是文本或 null，清空后挂载新节点
            container.innerHTML = '';
            c2.forEach(child => {
                if (typeof child === 'string') {
                    // 字符串类型，创建文本节点
                    const textNode = document.createTextNode(child);
                    container.appendChild(textNode);
                } else if (child !== null && child !== undefined) {
                    // VNode 类型，递归 patch
                    patch(null, child as VNode, container);
                }
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
 * 带 key 的子节点 diff 算法
 * 参照 Vue 3 源码的双端比较算法简化实现
 * @param c1 旧子节点数组
 * @param c2 新子节点数组
 * @param container 容器元素
 */
function patchKeyedChildren(
    c1: VNode[],
    c2: VNode[],
    container: HTMLElement
): void {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1; // 旧子节点末尾索引
    let e2 = l2 - 1; // 新子节点末尾索引

    // 1. 从头部开始同步
    while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];

        if (isSameVNodeType(n1, n2)) {
            patch(n1, n2, container);
        } else {
            break;
        }
        i++;
    }

    // 2. 从尾部开始同步
    while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];

        if (isSameVNodeType(n1, n2)) {
            patch(n1, n2, container);
        } else {
            break;
        }
        e1--;
        e2--;
    }

    // 3. 旧子节点已遍历完，新子节点还有剩余，需要挂载新节点
    if (i > e1) {
        if (i <= e2) {
            const nextPos = e2 + 1;
            const anchor = nextPos < l2 ? c2[nextPos].el : null;

            while (i <= e2) {
                patch(null, c2[i], container);
                i++;
            }
        }
    }
    // 4. 新子节点已遍历完，旧子节点还有剩余，需要卸载旧节点
    else if (i > e2) {
        while (i <= e1) {
            unmounted(c1[i].el);
            i++;
        }
    }
    // 5. 中间部分需要 diff
    else {
        const s1 = i; // 旧子节点起始索引
        const s2 = i; // 新子节点起始索引

        // 构建新子节点的 key -> index 映射
        const keyToNewIndexMap: Map<string | number, number> = new Map();
        for (let i = s2; i <= e2; i++) {
            const child = c2[i];
            if (child.key != null) {
                keyToNewIndexMap.set(child.key, i);
            }
        }

        // 遍历旧子节点，尝试在新子节点中找到对应节点进行 patch
        let patched = 0;
        const toBePatched = e2 - s2 + 1; // 需要 patch 的新节点数量
        let moved = false;
        let maxNewIndexSoFar = 0;

        // 用于记录新索引到旧索引的映射，后续用于判断是否需要移动
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

        for (let i = s1; i <= e1; i++) {
            const prevChild = c1[i];

            if (patched >= toBePatched) {
                // 所有新节点都已 patch，剩余的旧节点需要卸载
                unmounted(prevChild.el);
                continue;
            }

            let newIndex: number | undefined;

            if (prevChild.key != null) {
                // 有 key，通过 key 查找
                newIndex = keyToNewIndexMap.get(prevChild.key);
            } else {
                // 没有 key，遍历新子节点查找相同类型的节点
                for (let j = s2; j <= e2; j++) {
                    if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
                        newIndex = j;
                        break;
                    }
                }
            }

            if (newIndex === undefined) {
                // 找不到对应节点，卸载旧节点
                unmounted(prevChild.el);
            } else {
                // 找到对应节点，更新映射关系
                newIndexToOldIndexMap[newIndex - s2] = i + 1; // +1 因为 0 表示未设置

                if (newIndex >= maxNewIndexSoFar) {
                    maxNewIndexSoFar = newIndex;
                } else {
                    moved = true;
                }

                // patch 节点
                patch(prevChild, c2[newIndex], container);
                patched++;
            }
        }

        // 处理新增和移动的节点
        const increasingNewIndexSequence = moved
            ? getSequence(newIndexToOldIndexMap)
            : [];
        let j = increasingNewIndexSequence.length - 1;

        // 从后往前遍历，方便插入节点
        for (let i = toBePatched - 1; i >= 0; i--) {
            const nextIndex = s2 + i;
            const nextChild = c2[nextIndex];

            if (newIndexToOldIndexMap[i] === 0) {
                // 新节点，需要挂载
                patch(null, nextChild, container);
            } else if (moved) {
                // 需要移动的节点
                // 简化实现：先卸载再重新挂载
                // 实际 Vue 3 中使用 insertBefore 进行移动
                if (j < 0 || i !== increasingNewIndexSequence[j]) {
                    // 节点需要移动
                    // 这里简化处理，实际应该使用 DOM 操作方法移动节点
                } else {
                    j--;
                }
            }
        }
    }
}

/**
 * 判断两个 VNode 是否是相同类型
 * @param n1 第一个节点
 * @param n2 第二个节点
 */
function isSameVNodeType(n1: VNode, n2: VNode): boolean {
    return n1.type === n2.type && n1.key === n2.key;
}

/**
 * 获取最长递增子序列
 * 用于优化节点移动操作
 * @param arr 输入数组
 * @returns 最长递增子序列的索引数组
 */
function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;

    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }

    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }

    return result;
}
