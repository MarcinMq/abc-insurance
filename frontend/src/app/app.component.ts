import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule,
    MatBadgeModule, MatSidenavModule, MatListModule, MatDividerModule, MatTooltipModule,
  ],
  template: `
    <ng-container *ngIf="auth.isLoggedIn$ | async; else guestLayout">
      <mat-sidenav-container class="app-container">

        <!-- ── Sidebar ── -->
        <mat-sidenav #sidenav mode="side" opened class="app-sidenav">
          <!-- Logo -->
          <div class="sidenav-logo">
            <div class="logo-icon">
              <mat-icon>shield</mat-icon>
            </div>
            <div>
              <div class="logo-name">ABC Insurance</div>
              <div class="logo-tagline">System ubezpieczeń</div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="nav-section">
            <div class="nav-label">Menu główne</div>
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="nav-active">
              <span class="nav-icon"><mat-icon>dashboard</mat-icon></span>
              <span class="nav-text">Dashboard</span>
            </a>
            <a class="nav-item" routerLink="/policies" routerLinkActive="nav-active">
              <span class="nav-icon"><mat-icon>policy</mat-icon></span>
              <span class="nav-text">Moje polisy</span>
            </a>
            <a class="nav-item" routerLink="/claims" routerLinkActive="nav-active">
              <span class="nav-icon"><mat-icon>report_problem</mat-icon></span>
              <span class="nav-text">Szkody</span>
            </a>
          </div>

          <ng-container *ngIf="auth.isAgent">
            <div class="nav-section">
              <div class="nav-label">Panel agenta</div>
              <a class="nav-item" routerLink="/agent/queue" routerLinkActive="nav-active">
                <span class="nav-icon"><mat-icon>inbox</mat-icon></span>
                <span class="nav-text">Kolejka szkód</span>
                <span class="nav-badge" *ngIf="(notifService.unreadCount$ | async)">
                  {{ notifService.unreadCount$ | async }}
                </span>
              </a>
            </div>
          </ng-container>

          <!-- User block -->
          <div class="sidenav-user">
            <div class="user-avatar">{{ getInitials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ auth.currentUser?.full_name }}</div>
              <div class="user-role">{{ getRoleLabel() }}</div>
            </div>
            <button class="logout-btn" (click)="auth.logout()" matTooltip="Wyloguj">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </mat-sidenav>

        <!-- ── Content ── -->
        <mat-sidenav-content class="content-area">
          <!-- Topbar -->
          <header class="topbar">
            <button class="topbar-menu-btn" (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
            <div class="topbar-spacer"></div>

            <a class="topbar-action" routerLink="/claims/new" matTooltip="Zgłoś szkodę"
               *ngIf="!auth.isAgent">
              <mat-icon>add_circle</mat-icon>
              <span>Zgłoś szkodę</span>
            </a>

            <button class="topbar-icon-btn" [matMenuTriggerFor]="notifMenu">
              <mat-icon>notifications</mat-icon>
              <span class="notif-dot" *ngIf="(notifService.unreadCount$ | async)">
                {{ notifService.unreadCount$ | async }}
              </span>
            </button>

            <mat-menu #notifMenu="matMenu" class="notif-menu">
              <div class="notif-header">
                <span>Powiadomienia</span>
                <button mat-button (click)="notifService.markAllRead()">Wszystkie przeczytane</button>
              </div>
              <button mat-menu-item routerLink="/dashboard">
                <mat-icon>open_in_new</mat-icon> Otwórz panel
              </button>
            </mat-menu>

            <div class="topbar-avatar" [matMenuTriggerFor]="userMenu">
              {{ getInitials() }}
            </div>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon>logout</mat-icon> Wyloguj się
              </button>
            </mat-menu>
          </header>

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
    /* Container */
    .app-container { height: 100vh; }

    /* ── Sidenav ── */
    .app-sidenav {
      width: 260px;
      background: linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #3730a3 100%);
      color: white;
      border: none !important;
      display: flex;
      flex-direction: column;
    }

    /* Logo */
    .sidenav-logo {
      display: flex; align-items: center; gap: 12px;
      padding: 24px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .logo-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #818cf8, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(129,140,248,.4);
    }
    .logo-icon mat-icon { color: white; font-size: 22px; }
    .logo-name { font-size: 15px; font-weight: 800; color: white; letter-spacing: -0.01em; }
    .logo-tagline { font-size: 11px; color: rgba(255,255,255,.45); }

    /* Nav sections */
    .nav-section { padding: 16px 12px 4px; }
    .nav-label {
      font-size: 10px; font-weight: 700; color: rgba(255,255,255,.3);
      text-transform: uppercase; letter-spacing: .1em;
      padding: 0 8px; margin-bottom: 6px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      color: rgba(255,255,255,.65); text-decoration: none;
      font-size: 14px; font-weight: 500; cursor: pointer;
      transition: all .15s ease; margin-bottom: 2px;
      position: relative;
    }
    .nav-item:hover { background: rgba(255,255,255,.1); color: white; }
    .nav-active {
      background: rgba(255,255,255,.15) !important;
      color: white !important;
      font-weight: 700 !important;
    }
    .nav-active::before {
      content: ''; position: absolute; left: 0; top: 50%;
      transform: translateY(-50%); width: 3px; height: 60%;
      background: #818cf8; border-radius: 0 3px 3px 0;
    }
    .nav-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .nav-text { flex: 1; }
    .nav-badge {
      background: #ef4444; color: white; font-size: 11px;
      font-weight: 700; padding: 2px 7px; border-radius: 20px;
      min-width: 20px; text-align: center;
    }

    /* User block */
    .sidenav-user {
      margin-top: auto;
      display: flex; align-items: center; gap: 10px;
      padding: 16px 16px 20px;
      border-top: 1px solid rgba(255,255,255,.1);
    }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #818cf8, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    }
    .user-info { flex: 1; overflow: hidden; }
    .user-name { font-size: 13px; font-weight: 600; color: white;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; color: rgba(255,255,255,.4); }
    .logout-btn {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,.4); padding: 6px; border-radius: 8px;
      transition: all .15s; display: flex; align-items: center;
    }
    .logout-btn:hover { background: rgba(255,255,255,.1); color: white; }
    .logout-btn mat-icon { font-size: 18px; }

    /* ── Content ── */
    .content-area { background: #f8fafc; }

    /* Topbar */
    .topbar {
      height: 60px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center;
      padding: 0 24px; gap: 8px;
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .topbar-menu-btn {
      background: none; border: none; cursor: pointer;
      color: #64748b; padding: 6px; border-radius: 8px;
      display: flex; align-items: center; transition: all .15s;
    }
    .topbar-menu-btn:hover { background: #f1f5f9; }
    .topbar-spacer { flex: 1; }
    .topbar-action {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: white; text-decoration: none; padding: 8px 16px;
      border-radius: 10px; font-size: 13px; font-weight: 600;
      transition: all .2s; box-shadow: 0 2px 8px rgba(79,70,229,.3);
    }
    .topbar-action:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,.4); }
    .topbar-action mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .topbar-icon-btn {
      position: relative; background: none; border: none; cursor: pointer;
      color: #64748b; padding: 8px; border-radius: 10px;
      display: flex; align-items: center; transition: all .15s;
    }
    .topbar-icon-btn:hover { background: #f1f5f9; color: #4f46e5; }
    .notif-dot {
      position: absolute; top: 4px; right: 4px;
      background: #ef4444; color: white; font-size: 10px; font-weight: 700;
      min-width: 18px; height: 18px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 4px;
    }
    .notif-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px 8px; font-weight: 700; font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }
    .topbar-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: white; font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 2px 8px rgba(79,70,229,.3);
    }

    /* Main content */
    .main-content {
      padding: 28px;
      min-height: calc(100vh - 60px);
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    public auth: AuthService,
    public notifService: NotificationService,
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.loadUserProfile();
      this.notifService.refreshCount();
      this.notifService.startPolling();
    }

    // Zatrzymaj polling gdy użytkownik się wyloguje
    this.auth.isLoggedIn$.subscribe((loggedIn) => {
      if (!loggedIn) {
        this.notifService.stopPolling();
      }
    });
  }

  ngOnDestroy(): void {
    this.notifService.stopPolling();
  }

  getInitials(): string {
    const name = this.auth.currentUser?.full_name || this.auth.currentUser?.username || '?';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getRoleLabel(): string {
    const map: Record<string, string> = {
      customer: 'Klient', agent: 'Agent ubezpieczeniowy', admin: 'Administrator',
    };
    return map[this.auth.currentUser?.role || ''] || '';
  }
}
