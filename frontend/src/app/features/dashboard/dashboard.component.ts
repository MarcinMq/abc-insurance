import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController,
         BarElement, BarController, CategoryScale, LinearScale } from 'chart.js';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PolicyService } from '../../core/services/policy.service';
import { ClaimService } from '../../core/services/claim.service';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { Policy } from '../../shared/models/policy.model';
import { Claim, STATUS_CONFIG, ClaimStatus } from '../../shared/models/claim.model';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController,
               BarElement, BarController, CategoryScale, LinearScale);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, NgChartsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatDividerModule,
  ],
  template: `
    <div class="dash page-wrapper animate-fade-up">

      <!-- Header -->
      <div class="dash-header">
        <div>
          <h1>Dzień dobry, <span class="gradient-text">{{ getFirstName() }}</span> 👋</h1>
          <p class="subtitle">{{ today | date:'EEEE, d MMMM y':'':'pl' }}</p>
        </div>
        <a mat-raised-button class="btn-new-claim" routerLink="/claims/new" *ngIf="!auth.isAgent">
          <mat-icon>add</mat-icon> Nowe zgłoszenie szkody
        </a>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-indigo" routerLink="/policies">
          <div class="kpi-icon"><mat-icon>policy</mat-icon></div>
          <div class="kpi-body">
            <div class="kpi-value">{{ activePoliciesCount }}</div>
            <div class="kpi-label">Aktywne polisy</div>
          </div>
          <div class="kpi-arrow">→</div>
        </div>

        <div class="kpi-card kpi-cyan" routerLink="/claims">
          <div class="kpi-icon"><mat-icon>report_problem</mat-icon></div>
          <div class="kpi-body">
            <div class="kpi-value">{{ openClaimsCount }}</div>
            <div class="kpi-label">Otwarte szkody</div>
          </div>
          <div class="kpi-arrow">→</div>
        </div>

        <div class="kpi-card kpi-emerald">
          <div class="kpi-icon"><mat-icon>payments</mat-icon></div>
          <div class="kpi-body">
            <div class="kpi-value kpi-amount">{{ totalPaidAmount | currency:'PLN':'symbol':'1.0-0':'pl' }}</div>
            <div class="kpi-label">Wypłacono łącznie</div>
          </div>
          <div class="kpi-trend up"><mat-icon>trending_up</mat-icon></div>
        </div>

        <div class="kpi-card kpi-amber" routerLink="/agent/queue" *ngIf="auth.isAgent">
          <div class="kpi-icon"><mat-icon>inbox</mat-icon></div>
          <div class="kpi-body">
            <div class="kpi-value">{{ pendingClaimsCount }}</div>
            <div class="kpi-label">Do rozpatrzenia</div>
          </div>
          <div class="kpi-pulse" *ngIf="pendingClaimsCount > 0"></div>
        </div>

        <div class="kpi-card kpi-purple" *ngIf="!auth.isAgent">
          <div class="kpi-icon"><mat-icon>verified_user</mat-icon></div>
          <div class="kpi-body">
            <div class="kpi-value">{{ totalPoliciesCount }}</div>
            <div class="kpi-label">Wszystkie polisy</div>
          </div>
        </div>
      </div>

      <!-- Main grid -->
      <div class="main-grid">

        <!-- Doughnut chart: statusy szkód -->
        <div class="chart-card glass-card">
          <div class="card-header">
            <div>
              <div class="card-title">Status szkód</div>
              <div class="card-subtitle">Rozkład wszystkich zgłoszeń</div>
            </div>
          </div>
          <div class="chart-wrap" *ngIf="doughnutData.datasets[0].data.length > 0">
            <canvas baseChart
              [data]="doughnutData"
              [options]="doughnutOptions"
              type="doughnut">
            </canvas>
            <div class="chart-center-label">
              <div class="center-value">{{ totalClaimsCount }}</div>
              <div class="center-text">Łącznie</div>
            </div>
          </div>
          <div class="empty-chart" *ngIf="!totalClaimsCount">
            <mat-icon>pie_chart</mat-icon>
            <span>Brak danych</span>
          </div>
          <div class="legend-list">
            <div *ngFor="let item of claimStatusLegend" class="legend-item">
              <span class="legend-dot" [style.background]="item.color"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- Recent claims -->
        <div class="panel-card">
          <div class="card-header">
            <div>
              <div class="card-title">Ostatnie szkody</div>
              <div class="card-subtitle">Najnowsze zgłoszenia</div>
            </div>
            <a class="card-link" routerLink="/claims">Wszystkie →</a>
          </div>
          <div *ngIf="!recentClaims.length" class="empty-panel">
            <mat-icon>check_circle_outline</mat-icon>
            <p>Brak zgłoszonych szkód</p>
            <a routerLink="/claims/new" class="btn-mini">Zgłoś pierwszą</a>
          </div>
          <div class="claims-list">
            <div *ngFor="let claim of recentClaims" class="claim-row"
                 [routerLink]="['/claims', claim.id]">
              <div class="claim-status-dot" [style.background]="getClaimColor(claim.status)"></div>
              <div class="claim-info">
                <div class="claim-number">{{ claim.claim_number }}</div>
                <div class="claim-type">{{ claim.incident_type_display }}</div>
              </div>
              <div class="claim-right">
                <div class="claim-amount">{{ claim.estimated_damage | currency:'PLN':'symbol':'1.0-0':'pl' }}</div>
                <div class="status-badge-sm" [style.background]="getClaimColor(claim.status) + '20'"
                     [style.color]="getClaimColor(claim.status)">
                  {{ claim.status_display }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent policies -->
        <div class="panel-card">
          <div class="card-header">
            <div>
              <div class="card-title">Aktywne polisy</div>
              <div class="card-subtitle">Twoje ubezpieczenia</div>
            </div>
            <a class="card-link" routerLink="/policies">Wszystkie →</a>
          </div>
          <div *ngIf="!recentPolicies.length" class="empty-panel">
            <mat-icon>shield</mat-icon>
            <p>Brak aktywnych polis</p>
          </div>
          <div class="policies-list">
            <div *ngFor="let policy of recentPolicies" class="policy-row"
                 [routerLink]="['/policies', policy.id]">
              <div class="policy-icon" [style.background]="getCategoryGradient(policy)">
                <mat-icon>{{ getCategoryIcon(policy) }}</mat-icon>
              </div>
              <div class="policy-info">
                <div class="policy-name">{{ policy.product?.name || policy.product_name }}</div>
                <div class="policy-num">{{ policy.policy_number }}</div>
              </div>
              <div class="policy-right">
                <div class="policy-amount">{{ policy.coverage_amount | currency:'PLN':'symbol':'1.0-0':'pl' }}</div>
                <div class="policy-expiry" [class.expiry-soon]="(policy.days_to_expiry ?? 999) < 30">
                  <mat-icon>schedule</mat-icon> {{ policy.days_to_expiry }}d
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="panel-card notif-panel">
          <div class="card-header">
            <div>
              <div class="card-title">Powiadomienia</div>
              <div class="card-subtitle">Ostatnia aktywność</div>
            </div>
            <button class="card-link-btn" (click)="markAllRead()">
              <mat-icon>done_all</mat-icon> Przeczytaj wszystkie
            </button>
          </div>
          <div *ngIf="!notifications.length" class="empty-panel">
            <mat-icon>notifications_none</mat-icon>
            <p>Brak nowych powiadomień</p>
          </div>
          <div class="notif-list">
            <div *ngFor="let n of notifications" class="notif-item"
                 [class.notif-unread]="!n.is_read" (click)="markRead(n)">
              <div class="notif-icon-wrap" [class]="'notif-' + getNotifType(n.notification_type)">
                <mat-icon>{{ getNotifIcon(n.notification_type) }}</mat-icon>
              </div>
              <div class="notif-body">
                <div class="notif-title">{{ n.title }}</div>
                <div class="notif-time">{{ n.created_at | date:'d MMM, HH:mm' }}</div>
              </div>
              <div class="notif-unread-dot" *ngIf="!n.is_read"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dash { max-width: 1280px; margin: 0 auto; }

    /* Header */
    .dash-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 28px;
    }
    .dash-header h1 { font-size: 28px; font-weight: 800; letter-spacing: -.02em; }
    .subtitle { color: var(--text-secondary); margin-top: 4px; font-size: 14px; }
    .btn-new-claim {
      background: linear-gradient(135deg, #4f46e5, #06b6d4) !important;
      color: white !important; border-radius: 12px !important; font-weight: 700 !important;
      box-shadow: 0 4px 16px rgba(79,70,229,.3) !important;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    .kpi-card {
      position: relative; border-radius: 16px; padding: 20px;
      display: flex; align-items: center; gap: 16px;
      cursor: pointer; overflow: hidden;
      transition: transform .2s, box-shadow .2s;
      box-shadow: 0 4px 20px rgba(0,0,0,.08);
    }
    .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,.12); }
    .kpi-card::before {
      content: ''; position: absolute; inset: 0; opacity: .08;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='1'%3E%3Ccircle cx='55' cy='5' r='5'/%3E%3Ccircle cx='5' cy='55' r='5'/%3E%3C/g%3E%3C/svg%3E");
    }
    .kpi-indigo  { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; }
    .kpi-cyan    { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; }
    .kpi-emerald { background: linear-gradient(135deg, #059669, #10b981); color: white; }
    .kpi-amber   { background: linear-gradient(135deg, #d97706, #f59e0b); color: white; }
    .kpi-purple  { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; }
    .kpi-icon { font-size: 28px; opacity: .85; }
    .kpi-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: white; }
    .kpi-body { flex: 1; }
    .kpi-value { font-size: 30px; font-weight: 800; line-height: 1; color: white; }
    .kpi-amount { font-size: 20px; }
    .kpi-label { font-size: 12px; opacity: .8; color: white; margin-top: 4px; }
    .kpi-arrow { opacity: .5; }
    .kpi-arrow mat-icon { color: white; }
    .kpi-trend mat-icon { color: white; opacity: .7; }
    .kpi-pulse {
      position: absolute; top: 16px; right: 16px;
      width: 10px; height: 10px; border-radius: 50%; background: white;
    }
    .kpi-pulse::after {
      content: ''; position: absolute; inset: -4px;
      border-radius: 50%; background: rgba(255,255,255,.4);
      animation: pulse-ring 1.5s ease infinite;
    }
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }

    /* Main grid */
    .main-grid {
      display: grid;
      grid-template-columns: 340px 1fr 1fr;
      grid-template-rows: auto auto;
      gap: 20px;
    }
    .chart-card { grid-row: 1 / 3; }
    .notif-panel { grid-column: 2 / 4; }

    /* Card base */
    .chart-card, .panel-card {
      background: white; border-radius: 16px; padding: 24px;
      box-shadow: var(--shadow-md); border: 1px solid var(--border);
    }
    .card-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px;
    }
    .card-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
    .card-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .card-link {
      display: flex; align-items: center; gap: 2px;
      font-size: 12px; font-weight: 600; color: #4f46e5;
      text-decoration: none; transition: gap .15s;
    }
    .card-link mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .card-link:hover { gap: 6px; }
    .card-link-btn {
      display: flex; align-items: center; gap: 4px;
      background: none; border: none; cursor: pointer;
      font-size: 12px; font-weight: 600; color: #4f46e5; font-family: inherit;
    }
    .card-link-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Doughnut chart */
    .chart-wrap {
      position: relative; max-width: 200px; margin: 0 auto 20px;
    }
    .chart-center-label {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    }
    .center-value { font-size: 28px; font-weight: 800; color: var(--text-primary); }
    .center-text  { font-size: 11px; color: var(--text-muted); }
    .empty-chart {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 32px; color: var(--text-muted);
    }
    .empty-chart mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .3; }
    .legend-list { display: flex; flex-direction: column; gap: 8px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-label { flex: 1; color: var(--text-secondary); }
    .legend-value { font-weight: 700; color: var(--text-primary); }

    /* Claims list */
    .claims-list { display: flex; flex-direction: column; gap: 4px; }
    .claim-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px; cursor: pointer;
      transition: background .15s;
    }
    .claim-row:hover { background: var(--surface-3); }
    .claim-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .claim-info { flex: 1; min-width: 0; }
    .claim-number { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .claim-type { font-size: 12px; color: var(--text-muted); }
    .claim-right { text-align: right; flex-shrink: 0; }
    .claim-amount { font-size: 13px; font-weight: 700; color: var(--text-primary); }
    .status-badge-sm {
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
      display: inline-block; margin-top: 2px;
    }

    /* Policies list */
    .policies-list { display: flex; flex-direction: column; gap: 4px; }
    .policy-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px; cursor: pointer;
      transition: background .15s;
    }
    .policy-row:hover { background: var(--surface-3); }
    .policy-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .policy-icon mat-icon { color: white; font-size: 20px; }
    .policy-info { flex: 1; min-width: 0; }
    .policy-name { font-size: 13px; font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .policy-num { font-size: 11px; color: var(--text-muted); }
    .policy-right { text-align: right; flex-shrink: 0; }
    .policy-amount { font-size: 13px; font-weight: 700; }
    .policy-expiry {
      display: flex; align-items: center; gap: 2px; justify-content: flex-end;
      font-size: 11px; color: var(--text-muted); margin-top: 2px;
    }
    .policy-expiry mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .expiry-soon { color: #f59e0b !important; font-weight: 600; }

    /* Notifications */
    .notif-list {
      display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    }
    .notif-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px; border-radius: 10px; cursor: pointer;
      transition: background .15s; position: relative;
      border: 1px solid transparent;
    }
    .notif-item:hover { background: var(--surface-3); }
    .notif-unread { background: #f0f4ff; border-color: #e0e7ff; }
    .notif-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .notif-icon-wrap mat-icon { font-size: 18px; }
    .notif-positive { background: #d1fae5; color: #059669; }
    .notif-negative { background: #fee2e2; color: #dc2626; }
    .notif-info     { background: #dbeafe; color: #2563eb; }
    .notif-warning  { background: #fef3c7; color: #d97706; }
    .notif-body { flex: 1; min-width: 0; }
    .notif-title { font-size: 12px; font-weight: 600; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-time { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
    .notif-unread-dot {
      width: 8px; height: 8px; background: #4f46e5; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
    }

    /* Empty */
    .empty-panel {
      display: flex; flex-direction: column; align-items: center;
      padding: 24px; color: var(--text-muted); gap: 8px; text-align: center;
    }
    .empty-panel mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .25; }
    .empty-panel p { font-size: 13px; }
    .btn-mini {
      background: var(--primary); color: white; padding: 6px 14px;
      border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none;
    }

    @media (max-width: 1100px) {
      .main-grid { grid-template-columns: 1fr 1fr; }
      .chart-card { grid-row: auto; grid-column: 1 / -1; }
      .notif-panel { grid-column: 1 / -1; }
    }
    @media (max-width: 700px) {
      .main-grid { grid-template-columns: 1fr; }
      .notif-list { grid-template-columns: 1fr; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  today = new Date();
  recentPolicies: Policy[] = [];
  recentClaims: Claim[] = [];
  notifications: Notification[] = [];
  activePoliciesCount = 0;
  totalPoliciesCount = 0;
  openClaimsCount = 0;
  totalClaimsCount = 0;
  pendingClaimsCount = 0;
  totalPaidAmount = 0;

  claimStatusLegend: { label: string; color: string; value: number }[] = [];

  doughnutData: ChartData<'doughnut'> = {
    labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 2, borderColor: '#fff' }],
  };

  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw}`,
        },
      },
    },
  };

  private categoryGradients: Record<string, string> = {
    auto: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    property: 'linear-gradient(135deg,#047857,#10b981)',
    health: 'linear-gradient(135deg,#b91c1c,#ef4444)',
    life: 'linear-gradient(135deg,#6d28d9,#a855f7)',
    travel: 'linear-gradient(135deg,#0e7490,#06b6d4)',
    liability: 'linear-gradient(135deg,#c2410c,#f97316)',
  };
  private categoryIcons: Record<string, string> = {
    auto: 'directions_car', property: 'home', health: 'health_and_safety',
    life: 'favorite', travel: 'flight', liability: 'shield',
  };

  constructor(
    public auth: AuthService,
    private policyService: PolicyService,
    private claimService: ClaimService,
    private notifService: NotificationService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      policies: this.policyService.getPolicies(),
      claims: this.claimService.getClaims(),
      notifications: this.notifService.getNotifications(),
    }).subscribe(({ policies, claims, notifications }) => {
      this.totalPoliciesCount = policies.count;
      this.recentPolicies = policies.results.filter(p => p.status === 'active').slice(0, 5);
      this.activePoliciesCount = policies.results.filter(p => p.status === 'active').length;

      this.totalClaimsCount = claims.count;
      this.recentClaims = claims.results.slice(0, 5);
      this.openClaimsCount = claims.results.filter(
        c => !['closed', 'paid', 'rejected'].includes(c.status)
      ).length;
      this.totalPaidAmount = claims.results
        .filter(c => c.status === 'paid' && c.approved_amount)
        .reduce((s, c) => s + Number(c.approved_amount), 0);

      this.buildChart(claims.results);
      this.notifications = (notifications as any).results?.slice(0, 8) || [];
    });

    if (this.auth.isAgent) {
      this.claimService.getQueue().subscribe(r => { this.pendingClaimsCount = r.count; });
    }
  }

  buildChart(claims: Claim[]): void {
    const counts: Partial<Record<ClaimStatus, number>> = {};
    claims.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });

    const statusesToShow: ClaimStatus[] = ['submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed'];
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];

    statusesToShow.forEach(s => {
      if (counts[s]) {
        labels.push(STATUS_CONFIG[s].label);
        data.push(counts[s]!);
        colors.push(STATUS_CONFIG[s].color);
        this.claimStatusLegend.push({ label: STATUS_CONFIG[s].label, color: STATUS_CONFIG[s].color, value: counts[s]! });
      }
    });

    this.doughnutData = {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 3, borderColor: '#fff' }],
    };
  }

  getFirstName(): string { return this.auth.currentUser?.full_name?.split(' ')[0] ?? ''; }
  getClaimColor(s: ClaimStatus): string { return STATUS_CONFIG[s]?.color || '#666'; }
  getCategoryIcon(p: Policy): string {
    const cat = (p.product as any)?.category || p.product_category || '';
    return this.categoryIcons[cat] || 'policy';
  }
  getCategoryGradient(p: Policy): string {
    const cat = (p.product as any)?.category || p.product_category || '';
    return this.categoryGradients[cat] || 'linear-gradient(135deg,#4f46e5,#06b6d4)';
  }

  getNotifIcon(type: string): string {
    const m: Record<string, string> = {
      claim_submitted: 'send', claim_status_changed: 'update',
      policy_status_changed: 'policy', claim_approved: 'check_circle',
      claim_rejected: 'cancel', claim_paid: 'payments',
      additional_info: 'info', policy_expiring: 'schedule',
    };
    return m[type] || 'notifications';
  }
  getNotifType(type: string): string {
    if (['claim_approved', 'claim_paid'].includes(type)) return 'positive';
    if (['claim_rejected'].includes(type)) return 'negative';
    if (['additional_info', 'policy_expiring'].includes(type)) return 'warning';
    return 'info';
  }

  markRead(n: Notification): void {
    if (!n.is_read) {
      this.notifService.markRead(n.id).subscribe(() => {
        n.is_read = true; this.notifService.refreshCount();
      });
    }
  }
  markAllRead(): void {
    this.notifService.markAllRead().subscribe(() => {
      this.notifications.forEach(n => (n.is_read = true));
      this.notifService.refreshCount();
    });
  }
}
