import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('@pages/Login.vue'), meta: { title: 'Entrar' } },
  {
    path: '/',
    component: () => import('@layouts/AppLayout.vue'),
    children: [
      { path: '', component: () => import('@pages/Home.vue'), meta: { title: 'Início' } },
      { path: 'agenda', component: () => import('@pages/Agenda.vue'), meta: { title: 'Agenda' } },
      { path: 'modelo-atendimento', component: () => import('@pages/ModeloAtendimento.vue'), meta: { title: 'Modelo de atendimento' } },
      { path: 'configurar-agendamentos', component: () => import('@pages/ConfigurarAgendamentos.vue'), meta: { title: 'Configurar agendamentos' } },
      { path: 'perfil', component: () => import('@pages/Perfil.vue'), meta: { title: 'Perfil' } },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
