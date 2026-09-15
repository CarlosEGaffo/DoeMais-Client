import { Routes } from '@angular/router';
import { authGuard, superadminGuard } from './core/auth.guard';
export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar | DoaMais',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/shell').then((m) => m.AdminShell),
    children: [
      {
        path: 'solicitacoes',
        title: 'Solicitações | DoaMais',
        loadComponent: () =>
          import('./features/admin/participations').then((m) => m.Participations),
      },
      {
        path: 'sistema',
        title: 'Usuários e organizações | DoaMais',
        canActivate: [superadminGuard],
        loadComponent: () => import('./features/admin/system').then((m) => m.SystemAdmin),
      },
      {
        path: '',
        pathMatch: 'full',
        title: 'Visão geral | DoaMais',
        loadComponent: () => import('./features/admin/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'campanhas',
        title: 'Campanhas | DoaMais',
        loadComponent: () => import('./features/admin/campaigns').then((m) => m.Campaigns),
      },
      {
        path: 'doacoes',
        title: 'Doações | DoaMais',
        loadComponent: () => import('./features/admin/donations').then((m) => m.Donations),
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    title: 'Campanhas | DoaMais',
    loadComponent: () => import('./features/public/home').then((m) => m.PublicHome),
  },
  {
    path: 'campanhas',
    title: 'Campanhas | DoaMais',
    loadComponent: () => import('./features/public/home').then((m) => m.PublicHome),
  },
  {
    path: 'campanhas/:id',
    title: 'Conheça a campanha | DoaMais',
    loadComponent: () => import('./features/public/home').then((m) => m.PublicHome),
  },
  {
    path: 'faq',
    title: 'Perguntas frequentes | DoaMais',
    data: { faqOnly: true },
    loadComponent: () => import('./features/public/home').then((m) => m.PublicHome),
  },
  { path: '**', redirectTo: '' },
];
