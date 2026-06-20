// 响应式系统 (Reactivity) - 基于 mVue.ts 实现
const isObject = (val: any): val is object => val !== null && typeof val === 'object';
type TrackTarget = object;
type TrackKey = string | symbol;

const targetMap = new WeakMap<TrackTarget, Map<TrackKey, Set<ReactiveEffect>>>();
let activeEffect: ReactiveEffect | undefined;
let shouldTrack = false;

// 缓存 reactive 对象，避免同一对象被多次 Proxy 包装
const reactiveMap = new WeakMap<object, any>();

class ReactiveEffect {
  fn: () => void;
  deps: Set<ReactiveEffect>[] = [];

  constructor(fn: () => void) {
    this.fn = fn;
  }

  run() {

    // 清理旧的依赖关系
    this.deps.forEach(dep => dep.delete(this));
    this.deps.length = 0;

    try {
      activeEffect = this;
      shouldTrack = true;

      return this.fn();
    } finally {
      shouldTrack = false;
      activeEffect = undefined;
    }
  }

  effect() {
    this.run();
  }
}

function track(target: TrackTarget, key: TrackKey) {
  if (!shouldTrack || !activeEffect) {
    return;
  }


  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  if (!deps.has(activeEffect)) {
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
  } else {
  }
}

function trigger(target: TrackTarget, key: TrackKey) {

  const depsMap = targetMap.get(target);

  if (!depsMap) {
    console.warn(`[trigger] No depsMap found for target`);
    return;
  }

  const deps = depsMap.get(key);

  if (deps) {
    const effectsToRun = new Set(deps);
    effectsToRun.forEach(effectFn => {
      if ((effectFn as any).scheduler) {
        (effectFn as any).scheduler();
      } else {
        effectFn.effect();
      }
    });
  } else {
    console.warn(`[trigger] 无法触发依赖: ${target} `);
  }
}

// 响应式对象
function reactive<T extends object>(obj: T): T {
  // 如果已经存在缓存，直接返回
  const existingProxy = reactiveMap.get(obj);
  if (existingProxy) {
    return existingProxy;
  }
  
  const proxy = new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key as TrackKey);
      const res = Reflect.get(target, key, receiver);
      return isObject(res) ? reactive(res) : res;
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver);
      trigger(target, key as TrackKey);
      return res;
    }
  });
  
  // 缓存 Proxy 对象
  reactiveMap.set(obj, proxy);
  
  return proxy;
}

// 创建 Ref
interface Ref<T> {
  value: T;
  __v_isRef?: boolean;  // Ref 标识符
}

export function ref<T>(val: T): Ref<T> {
  const refObj = reactive({ value: val }) as Ref<T>;
  // 添加 Ref 标识符，用于判断是否为 Ref 对象
  Object.defineProperty(refObj, '__v_isRef', {
    value: true,
    enumerable: false,  // 不可枚举，避免被遍历到
    writable: false
  });
  return refObj;
}

/**
 * 判断一个值是否是 Ref 对象
 */
export function isRef(value: any): value is Ref<any> {
  return value && typeof value === 'object' && '__v_isRef' in value
}

// 创建 Computed
interface ComputedRef<T> {
  value: T;
}

function computed<T>(getter: () => T): ComputedRef<T> {
  const res = ref<T>(undefined as any as T);
  const effect = new ReactiveEffect(() => {
    res.value = getter();
  });
  effect.effect();
  return res as ComputedRef<T>;
}

// 执行副作用函数 (Watch Effect)
function watchEffect(fn: () => void): () => void {
  const effect = new ReactiveEffect(fn);
  effect.effect();
  return () => {
    effect.deps.forEach(dep => dep.delete(effect));
    effect.deps.length = 0;
  };
}

// 生命周期钩子（保持兼容）
const onMountedCallbacks: (() => void)[] = []
const onUnmountedCallbacks: (() => void)[] = []

export function onMounted(fn: () => void) {
  onMountedCallbacks.push(fn)
  setTimeout(fn, 0)
}

export function onUnmounted(fn: () => void) {
  onUnmountedCallbacks.push(fn)
}

export function triggerMounted() {
  onMountedCallbacks.forEach(cb => cb())
  onMountedCallbacks.length = 0
}

export function triggerUnmounted() {
  onUnmountedCallbacks.forEach(cb => cb())
  onUnmountedCallbacks.length = 0
}

// Watch 回调类型
type WatchCallback<T = any> = (newValue: T, oldValue: T, onCleanup: (cleanupFn: () => void) => void) => void;

// Watch 选项
interface WatchOptions {
  immediate?: boolean;
  deep?: boolean;
  flush?: 'pre' | 'post' | 'sync';
}

// Watch 数据源类型
type WatchSource<T = any> = Ref<T> | (() => T);

/**
 * watch 实现 - 基于 Vue 3 源码设计
 * @param source 数据源（ref 或 getter 函数）
 * @param cb 回调函数
 * @param options 选项
 */
function watch<T>(
  source: WatchSource<T>,
  cb: WatchCallback<T>,
  options: WatchOptions = {}
): () => void {
  const { immediate = false, deep = false, flush = 'pre' } = options;

  let oldValue: T;
  let newValue: T;
  let cleanup: (() => void) | undefined;

  // 清理函数注册器
  const onCleanup = (fn: () => void) => {
    cleanup = fn;
  };

  // 执行清理函数
  const executeCleanup = () => {
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
  };

  // 获取 getter 函数
  const getter: () => T = isRef(source)
    ? () => source.value
    : source as () => T;

  // job 函数 - 在依赖变化时执行
  const job = () => {
    // 获取新值
    newValue = getter();

    // 执行清理
    executeCleanup();

    // 触发回调
    cb(newValue, oldValue, onCleanup);

    // 更新旧值
    oldValue = newValue;
  };

  // 创建调度器
  let scheduler: (job: () => void) => void;
  if (flush === 'sync') {
    scheduler = (job) => job();
  } else if (flush === 'post') {
    scheduler = (job) => Promise.resolve().then(job);
  } else {
    // pre - 默认行为，使用微任务但在组件更新前执行
    scheduler = (job) => Promise.resolve().then(job);
  }

  // 创建 ReactiveEffect
  let effect: ReactiveEffect;

  effect = new ReactiveEffect(() => {
    // 如果是深度监听，递归访问对象属性以触发 track
    const value = getter();
    if (deep && isObject(value)) {
      traverse(value);
    }
    return value;
  });

  // 设置调度器
  (effect as any).scheduler = () => scheduler(job);

  // 初始化
  const run = () => {
    effect.run();
  };

  // 首次执行获取初始值
  oldValue = getter();

  // 如果 immediate 为 true，立即执行回调
  if (immediate) {
    job();
  }

  // 启动依赖追踪
  run();

  // 返回停止函数
  return () => {
    effect.deps.forEach(dep => dep.delete(effect));
    effect.deps.length = 0;
  };
}

/**
 * 递归遍历对象，触发所有属性的 track（用于深度监听）
 */
function traverse(value: any, seen = new Set()): any {
  if (!isObject(value) || seen.has(value)) {
    return value;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        traverse((value as Record<string, any>)[key], seen);
      }
    }
  }
  return value;
}

// 导出所有响应式 API（除了已单独导出的函数）
export {
  reactive,
  computed,
  watchEffect,
  watch,
  ReactiveEffect
}
