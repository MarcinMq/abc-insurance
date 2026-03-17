import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule,
    MatBadgeModule, MatSidenavModule, MatListModule, MatDividerModule,
  ],
  template: `
    <ng-container *ngIf="auth.isLoggedIn(); else guestLayout">
      <mat-sidenav-container class="app-container">
        <mat-sidenav #sidenav mode="side" opened class="app-sidenav">
          <div class="sidenav-header">
            <img src="assets/logo.svg" alt="ABC Insurance" class="logo" />
            <span class="brand">ABC Insurance</span>
          </div>
          <mat-divider></mat-divider>
          <mat-nav-list>
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Panel główny</span>
            </a>
            <a mat-list-item routerLink="/policies" routerLinkActive="active-link">
              <mat-icon matListItemIcon>policy</mat-icon>
              <span matListItemTitle>Moje polisy</span>
            </a>
            <a mat-list-item routerLink="/claims" routerLinkActive="active-link">
              <mat-icon matListItemIcon>report_problem</mat-icon>
              <span matListItemTitle>Szkody</span>
            </a>
            <ng-container *ngIf="auth.isAgent">
              <mat-divider></mat-divider>
              <div class="nav-section-label">Panel agenta</div>
              <a mat-list-item routerLink="/agent/queue" routerLinkActive="active-link">
                <mat-icon matListItemIcon>inbox</mat-icon>
                <span matListItemTitle>Kolejka szkód</span>
              </a>
            </ng-container>
          </mat-nav-list>
          <div class="sidenav-footer">
            <div class="user-info">
              <mat-icon>account_circle</mat-icon>
              <div>
                <div class="user-name">{{ auth.currentUser?.full_name }}</div>
                <div class="user-role">{{ getRoleLabel() }}</div>
              </div>
            </div>
            <button mat-icon-button (click)="auth.logout()" matTooltip="Wyloguj">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </mat-sidenav>

        <mat-sidenav-content>
          <mat-toolbar color="primary" class="app-toolbar">
            <button mat-icon-button (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
            <span class="toolbar-spacer"></span>
            <button mat-icon-button routerLink="/claims/new" matTooltip="Zgłoś szkodę">
              <mat-icon>add_circle</mat-icon>
            </button>
            <button mat-icon-button [matMenuTriggerFor]="notifMenu">
              <mat-icon [matBadge]="(notifService.unreadCount$ | async) || null"
                        matBadgeColor="warn"
                        matBadgeSize="small">
                notifications
              </mat-icon>
            </button>
            <mat-menu #notifMenu="matMenu">
              <button mat-menu-item routerLink="/dashboard">
                <mat-icon>notifications</mat-icon> Wszystkie powiadomienia
              </button>
              <button mat-menu-item (click)="notifService.markAllRead()">
                <mat-icon>done_all</mat-icon> Oznacz jako przeczytane
              </button>
            </mat-menu>
          </mat-toolbar>
          <main class="main-content">
            <router-outlet></router-outlet>
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </ng-container>

    <ng-template #guestLayout>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .app-container { height: 100vh; }
    .app-sidenav { width: 260px; display: flex; flex-direction: column; }
    .sidenav-header { display: flex; align-items: center; gap: 12px; padding: 20px 16px; }
    .logo { width: 36px; height: 36px; }
    .brand { font-size: 18px; font-weight: 700; color: #1565C0; }
    .nav-section-label { padding: 8px 16px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; color: #666; letter-spacing: 0.8px; }
    .active-link { background-color: #E3F2FD !important; color: #1565C0 !important; }
    .active-link mat-icon { color: #1565C0; }
    .sidenav-footer { margin-top: auto; padding: 12px 16px; border-top: 1px solid #e0e0e0;
      display: flex; align-items: center; gap: 8px; }
    .user-info { display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden; }
    .user-name { font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; }
    .user-role { font-size: 11px; color: #666; }
    .app-toolbar { position: sticky; top: 0; z-index: 100; }
    .toolbar-spacer { flex: 1; }
    .main-content { padding: 24px; background: #f5f7fa; min-height: calc(100vh - 64px); }
  `],
})
export class AppComponent implements OnInit {
  constructor(
    public auth: AuthService,
    public notifService: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.loadUserProfile();
      this.notifService.refreshCount();
      this.notifService.startPolling();
    }
  }

  getRoleLabel(): string {
    const roleMap: Record<string, string> = {
      customer: 'Klient',
      agent: 'Agent ubezpieczeniowy',
      admin: 'Administrator',
    };
    return roleMap[this.auth.currentUser?.role || ''] || '';
  }
}
