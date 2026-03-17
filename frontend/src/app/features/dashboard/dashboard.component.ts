import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PolicyService } from '../../core/services/policy.service';
import { ClaimService } from '../../core/services/claim.service';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { Policy } from '../../shared/models/policy.model';
import { Claim, STATUS_CONFIG } from '../../shared/models/claim.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatBadgeModule,
    MatListModule, MatChipsModule, MatProgressBarModule,
  ],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1>Dzień dobry, {{ auth.currentUser?.full_name?.split(' ')[0] }}!</h1>
        <p class="subtitle">{{ today | date:'EEEE, d MMMM y':'':'pl' }}</p>
      </div>

      <!-- Karty podsumowania -->
      <div class="stats-grid">
        <mat-card class="stat-card stat-blue" routerLink="/policies">
          <mat-card-content>
            <div class="stat-icon"><mat-icon>policy</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ activePoliciesCount }}</div>
              <div class="stat-label">Aktywne polisy</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card stat-orange" routerLink="/claims">
          <mat-card-content>
            <div class="stat-icon"><mat-icon>report_problem</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ openClaimsCount }}</div>
              <div class="stat-label">Otwarte szkody</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card stat-green" routerLink="/claims">
          <mat-card-content>
            <div class="stat-icon"><mat-icon>payments</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ totalPaidAmount | currency:'PLN':'symbol':'1.0-0':'pl' }}</div>
              <div class="stat-label">Wypłacono łącznie</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card stat-red" *ngIf="auth.isAgent" routerLink="/agent/queue">
          <mat-card-content>
            <div class="stat-icon"><mat-icon>inbox</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ pendingClaimsCount }}</div>
              <div class="stat-label">Do rozpatrzenia</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="dashboard-grid">
        <!-- Ostatnie polisy -->
        <mat-card class="panel">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>policy</mat-icon> Moje polisy
            </mat-card-title>
            <a mat-button color="primary" routerLink="/policies">
              Zobacz wszystkie
            </a>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="recentPolicies.length === 0" class="empty-state">
              <mat-icon>policy</mat-icon>
              <p>Brak aktywnych polis</p>
            </div>
            <mat-list *ngIf="recentPolicies.length > 0">
              <mat-list-item *ngFor="let policy of recentPolicies"
                             [routerLink]="['/policies', policy.id]" class="clickable">
                <mat-icon matListItemIcon [style.color]="getPolicyCategoryColor(policy)">
                  {{ getPolicyCategoryIcon(policy) }}
                </mat-icon>
                <span matListItemTitle>{{ policy.product?.name || policy.product_name }}</span>
                <span matListItemLine>
                  Polisa {{ policy.policy_number }} ·
                  do {{ policy.end_date | date:'d MMM y' }}
                </span>
                <mat-chip matListItemMeta
                         [style.background-color]="getStatusBgColor(policy.status)"
                         [style.color]="'white'">
                  {{ policy.status_display }}
                </mat-chip>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <!-- Ostatnie szkody -->
        <mat-card class="panel">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>report_problem</mat-icon> Ostatnie szkody
            </mat-card-title>
            <a mat-button color="primary" routerLink="/claims">
              Zobacz wszystkie
            </a>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="recentClaims.length === 0" class="empty-state">
              <mat-icon>check_circle</mat-icon>
              <p>Brak zgłoszonych szkód</p>
              <a mat-raised-button color="primary" routerLink="/claims/new">
                <mat-icon>add</mat-icon> Zgłoś szkodę
              </a>
            </div>
            <mat-list *ngIf="recentClaims.length > 0">
              <mat-list-item *ngFor="let claim of recentClaims"
                             [routerLink]="['/claims', claim.id]" class="clickable">
                <mat-icon matListItemIcon
                          [style.color]="getClaimStatusColor(claim.status)">
                  {{ getClaimStatusIcon(claim.status) }}
                </mat-icon>
                <span matListItemTitle>{{ claim.claim_number }}</span>
                <span matListItemLine>
                  {{ claim.incident_type_display }} ·
                  {{ claim.incident_date | date:'d MMM y' }}
                </span>
                <mat-chip matListItemMeta
                         [style.background-color]="getClaimStatusColor(claim.status)"
                         [style.color]="'white'">
                  {{ claim.status_display }}
                </mat-chip>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
          <mat-card-actions *ngIf="recentClaims.length > 0">
            <a mat-raised-button color="accent" routerLink="/claims/new">
              <mat-icon>add</mat-icon> Zgłoś nową szkodę
            </a>
          </mat-card-actions>
        </mat-card>

        <!-- Powiadomienia -->
        <mat-card class="panel notifications-panel">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>notifications</mat-icon> Powiadomienia
            </mat-card-title>
            <button mat-button (click)="markAllRead()">Oznacz jako przeczytane</button>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="notifications.length === 0" class="empty-state">
              <mat-icon>notifications_none</mat-icon>
              <p>Brak nowych powiadomień</p>
            </div>
            <mat-list>
              <mat-list-item *ngFor="let notif of notifications"
                             [class.unread]="!notif.is_read"
                             (click)="markRead(notif)">
                <mat-icon matListItemIcon [class.unread-icon]="!notif.is_read">
                  {{ getNotifIcon(notif.notification_type) }}
                </mat-icon>
                <span matListItemTitle>{{ notif.title }}</span>
                <span matListItemLine>{{ notif.created_at | date:'d MMM, HH:mm' }}</span>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 28px; }
    .page-header h1 { font-size: 28px; font-weight: 700; margin: 0; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px; margin-bottom: 24px; }
    .stat-card { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .stat-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .stat-icon { width: 52px; height: 52px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; }
    .stat-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: white; }
    .stat-value { font-size: 28px; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 13px; color: #666; margin-top: 4px; }
    .stat-blue .stat-icon { background: #1565C0; }
    .stat-orange .stat-icon { background: #E65100; }
    .stat-green .stat-icon { background: #2E7D32; }
    .stat-red .stat-icon { background: #C62828; }
    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .notifications-panel { grid-column: 1 / -1; }
    .panel mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .panel mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 16px; }
    .empty-state { display: flex; flex-direction: column; align-items: center;
      padding: 32px; color: #999; gap: 8px; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }
    .clickable { cursor: pointer; }
    .clickable:hover { background: #f5f7fa; }
    .unread { background: #F3F8FF; }
    .unread-icon { color: #1565C0 !important; }
    @media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
  `],
})
export class DashboardComponent implements OnInit {
  today = new Date();
  recentPolicies: Policy[] = [];
  recentClaims: Claim[] = [];
  notifications: Notification[] = [];
  activePoliciesCount = 0;
  openClaimsCount = 0;
  pendingClaimsCount = 0;
  totalPaidAmount = 0;

  private readonly categoryIcons: Record<string, string> = {
    auto: 'directions_car', property: 'home', health: 'health_and_safety',
    life: 'favorite', travel: 'flight', liability: 'shield',
  };
  private readonly categoryColors: Record<string, string> = {
    auto: '#1565C0', property: '#2E7D32', health: '#C62828',
    life: '#6A1B9A', travel: '#00838F', liability: '#E65100',
  };

  constructor(
    public auth: AuthService,
    private policyService: PolicyService,
    private claimService: ClaimService,
    private notifService: NotificationService
  ) {}

  ngOnInit(): void {
    forkJoin({
      policies: this.policyService.getPolicies({ page: 1 }),
      claims: this.claimService.getClaims({ page: 1 }),
      notifications: this.notifService.getNotifications(),
    }).subscribe(({ policies, claims, notifications }) => {
      this.recentPolicies = policies.results.slice(0, 5);
      this.activePoliciesCount = policies.results.filter((p) => p.status === 'active').length;

      this.recentClaims = claims.results.slice(0, 5);
      this.openClaimsCount = claims.results.filter(
        (c) => !['closed', 'paid', 'rejected'].includes(c.status)
      ).length;
      this.totalPaidAmount = claims.results
        .filter((c) => c.status === 'paid' && c.approved_amount)
        .reduce((sum, c) => sum + Number(c.approved_amount), 0);

      this.notifications = (notifications as any).results?.slice(0, 10) || [];
    });

    if (this.auth.isAgent) {
      this.claimService.getQueue().subscribe((res) => {
        this.pendingClaimsCount = res.count;
      });
    }
  }

  getPolicyCategoryIcon(policy: Policy): string {
    const cat = (policy.product as any)?.category || policy.product_category || '';
    return this.categoryIcons[cat] || 'policy';
  }

  getPolicyCategoryColor(policy: Policy): string {
    const cat = (policy.product as any)?.category || policy.product_category || '';
    return this.categoryColors[cat] || '#666';
  }

  getStatusBgColor(status: string): string {
    const colors: Record<string, string> = {
      active: '#2E7D32', pending: '#1565C0', expired: '#616161',
      cancelled: '#C62828', suspended: '#E65100',
    };
    return colors[status] || '#666';
  }

  getClaimStatusColor(status: string): string {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || '#666';
  }

  getClaimStatusIcon(status: string): string {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.icon || 'info';
  }

  getNotifIcon(type: string): string {
    const icons: Record<string, string> = {
      claim_submitted: 'send', claim_status_changed: 'update',
      policy_status_changed: 'policy', policy_expiring: 'schedule',
      additional_info: 'info', claim_approved: 'check_circle',
      claim_rejected: 'cancel', claim_paid: 'payments',
    };
    return icons[type] || 'notifications';
  }

  markRead(notif: Notification): void {
    if (!notif.is_read) {
      this.notifService.markRead(notif.id).subscribe(() => {
        notif.is_read = true;
        this.notifService.refreshCount();
      });
    }
  }

  markAllRead(): void {
    this.notifService.markAllRead().subscribe(() => {
      this.notifications.forEach((n) => (n.is_read = true));
      this.notifService.refreshCount();
    });
  }
}
