import { createRouter,createWebHistory, useRouter, useRoute } from './core'
import TestCom from './test/TestCom'
import WatchTestCom from './test/WatchTestCom'
import Card from "./test/Card";

const routes = [
  { path: '/', component: TestCom },
  { path: '/watch', component: WatchTestCom },
  { path: '/card', component: Card },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router