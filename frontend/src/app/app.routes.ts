import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';
import { unsavedGuard } from './pages/ticket-new.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        data: { title: 'Dashboard', subtitle: 'Bem-vindo de volta! Aqui está o relatório do seu atendimento.' },
        loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'chamados',
        data: { title: 'Chamados', subtitle: 'Acompanhe e gerencie os chamados de atendimento.' },
        loadComponent: () => import('./pages/ticket-list.component').then((m) => m.TicketListComponent),
      },
      {
        path: 'chamados/novo',
        canDeactivate: [unsavedGuard],
        data: { title: 'Criar Chamado', crumb: 'Chamados > Criar Chamados' },
        loadComponent: () => import('./pages/ticket-new.component').then((m) => m.TicketNewComponent),
      },
      {
        path: 'chamados/:id',
        data: { title: 'Detalhes do chamado', crumb: 'Chamados > Detalhes' },
        loadComponent: () => import('./pages/ticket-detail.component').then((m) => m.TicketDetailComponent),
      },
      {
        path: 'relatorios',
        canActivate: [roleGuard('ADMIN', 'TECHNICIAN')],
        data: { title: 'Relatório', subtitle: 'Acompanhe os indicadores e o desempenho do atendimento de TI.' },
        loadComponent: () => import('./pages/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'base-de-conhecimento',
        data: { title: 'Base de Conhecimento', subtitle: 'Encontre soluções e aprenda com artigos e procedimentos internos' },
        loadComponent: () => import('./pages/kb.component').then((m) => m.KbComponent),
      },
      {
        path: 'base-de-conhecimento/:slug',
        data: { title: 'Base de Conhecimento', crumb: 'Base de conhecimento > Artigo' },
        loadComponent: () => import('./pages/kb-article.component').then((m) => m.KbArticleComponent),
      },
      { path: 'configuracoes', pathMatch: 'full', redirectTo: 'configuracoes/geral' },
      {
        path: 'configuracoes/:secao',
        canActivate: [roleGuard('ADMIN')],
        data: { title: 'Configurações' },
        loadComponent: () => import('./pages/settings.component').then((m) => m.SettingsComponent),
      },
      { path: 'usuarios', redirectTo: 'configuracoes/usuarios' },
    ],
  },
  { path: '**', redirectTo: '' },
];
