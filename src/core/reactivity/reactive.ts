// 响应式系统 (Reactivity) - 基于 mVue.ts 实现
const isObject = (val: any): val is object => val !== null && typeof val === 'object';
type TrackTarget = object;
type TrackKey = string | symbol;

const targetMap = new WeakMap<TrackTarget, Map<TrackKey, Set<ReactiveEffect>>>();
let activeEffect: ReactiveEffect | undefined;
let shouldTrack = false;

class ReactiveEffect {
  fn: () => void;
  deps: Set<ReactiveEffect>[] = [];

  constructor(fn: () => void) {
    this.fn = fn;
  }

  run() {
    console.log('[ReactiveEffect.run] Starting effect run');
    
    // 清理旧的依赖关系
    this.deps.forEach(dep => dep.delete(this));
    this.deps.length = 0;
    
    try {
      activeEffect = this;
      shouldTrack = true;
      console.log('[ReactiveEffect.run] activeEffect set, shouldTrack:', shouldTrack);
      
      return this.fn();
    } finally {
      shouldTrack = false;
      activeEffect = undefined;
      console.log('[ReactiveEffect.run] Effect run complete, cleaned up');
    }
  }

  effect() {
    console.log('[ReactiveEffect.effect] Triggering effect');
    this.run();
  }
}

function track(target: TrackTarget, key: TrackKey) {
  if (!shouldTrack || !activeEffect) {
    console.log(`⏭️ [track] 跳过追踪: shouldTrack=${shouldTrack}, activeEffect=${!!activeEffect}`);
    return;
  }
  
  console.log(`📍 [track] Tracking: target=${target}, key=${String(key)}`);
  
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
    console.log(`✅ [track] Dependency tracked successfully`);
  } else {
    console.log(`ℹ️ [track] Dependency already exists`);
  }
}

function trigger(target: TrackTarget, key: TrackKey) {
  console.log(`🔔 [trigger] Triggering: target=${target}, key=${String(key)}`);
  
  const depsMap = targetMap.get(target);

  if (!depsMap) {
    console.warn(`[trigger] No depsMap found for target`);
    return;
  }
  
  const deps = depsMap.get(key);

  if (deps) {
    console.log(`🚀 [trigger] Found ${deps.size} effects to run`);
    // 创建副本以防止无限循环或在迭代期间修改集合
    const effectsToRun = new Set(deps);
    effectsToRun.forEach(effectFn => {
      console.log(`▶️ [trigger] Running effect`);
      effectFn.effect();
    });
  } else {
    console.warn(`[trigger] 无法触发依赖: ${target} `);
  }
}

// 响应式对象
function reactive<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, key, receiver) {
      // console.log(`📖 [Proxy.get] target=${target}, key=${String(key)}`);
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
function watchEffect(fn: () => void) {
  const effect = new ReactiveEffect(fn);
  effect.effect();
  return effect;
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

// 导出所有响应式 API（除了已单独导出的函数）
export { 
  reactive, 
  computed, 
  watchEffect,
  ReactiveEffect
}
