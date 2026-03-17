import { Routes } from '@angular/router';
import { authGuard, guestGuard, agentGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'policies',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/policies/policy-list/policy-list.component').then(
            (m) => m.PolicyListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/policies/policy-detail/policy-detail.component').then(
            (m) => m.PolicyDetailComponent
          ),
      },
    ],
  },
  {
    path: 'claims',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/claims/claim-list/claim-list.component').then(
            (m) => m.ClaimListComponent
          ),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/claims/claim-form/claim-form.component').then(
            (m) => m.ClaimFormComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/claims/claim-detail/claim-detail.component').then(
            (m) => m.ClaimDetailComponent
          ),
      },
    ],
  },
  {
    path: 'agent',
    canActivate: [authGuard, agentGuard],
    children: [
      {
        path: 'queue',
        loadComponent: () =>
          import('./features/agent/agent-queue/agent-queue.component').then(
            (m) => m.AgentQueueComponent
          ),
      },
      {
        path: 'claims/:id',
        loadComponent: () =>
          import('./features/claims/claim-detail/claim-detail.component').then(
            (m) => m.ClaimDetailComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
