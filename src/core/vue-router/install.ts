// vue-router/install.ts - Vue Router 插件安装
// 参照 Vue Router 4 源码

import type { Router } from './types'
import { RouterView } from './routerView'
import { RouterLink } from './routerLink'

export function createWebHistory() {
  return {
    type: 'history' as const
  }
}

export function createWebHashHistory() {
  return {
    type: 'hash' as const
  }
}

export function installRouter(app: any, router: Router) {
  ;(window as any).__ROUTER__ = router
  
  app.component('RouterView', RouterView)
  app.component('RouterLink', RouterLink)
  
  app.config.globalProperties.$router = router
  app.config.globalProperties.$route = router.currentRoute.value
}
