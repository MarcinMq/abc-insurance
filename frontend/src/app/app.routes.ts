import { Routes } from '@angular/router';
import { authGuard, agentGuard, guestGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'policies',
    canActivate: [authGuard],
    loadComponent: () => import('./features/policies/policy-list/policy-list.component').then(m => m.PolicyListComponent)
  },
  {
    path: 'policies/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/policies/policy-detail/policy-detail.component').then(m => m.PolicyDetailComponent)
  },
  {
    path: 'claims',
    canActivate: [authGuard],
    loadComponent: () => import('./features/claims/claim-list/claim-list.component').then(m => m.ClaimListComponent)
  },
  {
    path: 'claims/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/claims/claim-form/claim-form.component').then(m => m.ClaimFormComponent)
  },
  {
    path: 'claims/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/claims/claim-detail/claim-detail.component').then(m => m.ClaimDetailComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/admin-panel.component').then(m => m.AdminPanelComponent)
  },
  {
    path: 'agent/queue',
    canActivate: [authGuard, agentGuard],
    loadComponent: () => import('./features/agent/agent-queue/agent-queue.component').then(m => m.AgentQueueComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
