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
    // console.log(`⏭️ [track] 跳过追踪: shouldTrack=${shouldTrack}, activeEffect=${!!activeEffect}`);
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
  }
}

function trigger(target: TrackTarget, key: TrackKey) {
  const depsMap = targetMap.get(target);

  if (!depsMap) {
    return;
  }
  
  const deps = depsMap.get(key);

  if (deps) {
    // 创建副本以防止无限循环或在迭代期间修改集合
    const effectsToRun = new Set(deps);
    effectsToRun.forEach(effectFn => {
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
}

function ref<T>(val: T): Ref<T> {
  return reactive({ value: val }) as Ref<T>;
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

function onMounted(fn: () => void) {
  onMountedCallbacks.push(fn)
  setTimeout(fn, 0)
}

function onUnmounted(fn: () => void) {
  onUnmountedCallbacks.push(fn)
}

function triggerMounted() {
  onMountedCallbacks.forEach(cb => cb())
  onMountedCallbacks.length = 0
}

function triggerUnmounted() {
  onUnmountedCallbacks.forEach(cb => cb())
  onUnmountedCallbacks.length = 0
}

export { 
  reactive, 
  ref, 
  computed, 
  watchEffect, 
  onMounted, 
  onUnmounted, 
  triggerMounted, 
  triggerUnmounted,
  ReactiveEffect
}