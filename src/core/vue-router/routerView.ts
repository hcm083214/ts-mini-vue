// vue-router/routerView.ts - RouterView 组件
// 参照 Vue Router 4 源码

import { h, type Component } from '../runtime-core/h'
import { useRouter } from './router'
import type { RouteRecord } from './types'
import { onMounted, onUnmounted } from '../reactivity/reactive'
import { watchEffect } from '../reactivity/index'

export const RouterView = {
  name: 'RouterView',
  setup(props: { name?: string }, { slots }: { slots?: Record<string, any> }) {
    const router = useRouter()
    const viewDepth = (props as any).depth || 0
    
    let currentComponent: Component | null = null
    let currentRouteRecord: RouteRecord | null = null
    let unsubscribe: () => void
    
    function renderCurrentComponent() {
      const route = router.currentRoute.value
      const matched = route.matched
      
      if (matched.length > viewDepth) {
        currentRouteRecord = matched[viewDepth]
        currentComponent = currentRouteRecord.component
      } else {
        currentRouteRecord = null
        currentComponent = null
      }
      
      if (currentComponent) {
        return h(currentComponent, { route: router.currentRoute.value })
      }
      
      if (slots && slots.default) {
        return slots.default()
      }
      
      return null
    }
    
    unsubscribe = watchEffect(() => {
      renderCurrentComponent()
    })
    
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })
    
    return () => {
      return renderCurrentComponent()
    }
  }
}
