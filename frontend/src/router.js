import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@/components/Auth/Login.vue'
import Register from '@/components/Auth/Register.vue' // Add this import
import Dashboard from '@/components/Dashboard.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register }, // Add this route
  { path: '/dashboard', component: Dashboard }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router