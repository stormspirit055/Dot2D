import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入页面组件
import Home from '../views/HomePage.vue'
import DrawBoard from '../views/DrawBoard.vue'
import Plugins from '../views/Plugins.vue'

// 定义路由
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页',
    },
  },
  {
    path: '/drawboard',
    name: 'DrawBoard',
    component: DrawBoard,
    meta: {
      title: '绘图板',
    },
  },
  {
    path: '/plugins',
    name: 'Plugins',
    component: Plugins,
    meta: {
      title: '插件功能',
    },
  },
  {
    // 404 页面重定向到首页
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, _from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - Dot2D`
  }
  next()
})

export default router
