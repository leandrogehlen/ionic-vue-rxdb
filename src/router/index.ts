import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    redirect: '/contacts'
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: () => import ('../views/contacts/Index.vue')
  },
  {
    path: '/contacts/:id',
    name: 'editContact',
    component: () => import ('../views/contacts/Form.vue')
  },{
    path: '/contacts/new',
    name: 'newContact',
    component: () => import ('../views/contacts/Form.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
