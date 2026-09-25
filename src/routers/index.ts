import { useAuthStore } from '@stores/auth'
import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    guestOnly?: boolean
  }
}

const routes = [
  { path: '/login', component: () => import('@pages/Login.vue'), meta: { title: 'Entrar', guestOnly: true } },
  { path: '/cadastro', component: () => import('@pages/Cadastro.vue'), meta: { title: 'Criar conta', guestOnly: true } },
  { path: '/recuperar-senha', component: () => import('@pages/RecuperarSenha.vue'), meta: { title: 'Recuperar senha', guestOnly: true } },
  // Sem guestOnly: o link do e-mail pode ser aberto numa aba que ainda tem sessão.
  { path: '/redefinir-senha', component: () => import('@pages/RedefinirSenha.vue'), meta: { title: 'Redefinir senha' } },
  {
    path: '/',
    component: () => import('@layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('@pages/Home.vue'), meta: { title: 'Início' } },
      { path: 'agenda', component: () => import('@pages/Agenda.vue'), meta: { title: 'Agenda' } },
      { path: 'modelo-atendimento/:id?', component: () => import('@pages/ModeloAtendimento.vue'), meta: { title: 'Modelo de atendimento' } },
      { path: 'configurar-agendamentos', component: () => import('@pages/ConfigurarAgendamentos.vue'), meta: { title: 'Configurar agendamentos' } },
      { path: 'perfil', component: () => import('@pages/Perfil.vue'), meta: { title: 'Perfil' } },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// RN-AU06: toda rota do painel exige sessão.
router.beforeEach(async (to) => {
  const isAuthenticated = await useAuthStore().ensureSession()

  if (to.meta.requiresAuth && !isAuthenticated)
    return { path: '/login', query: { redirect: to.fullPath } }

  if (to.meta.guestOnly && isAuthenticated)
    return '/'
})
