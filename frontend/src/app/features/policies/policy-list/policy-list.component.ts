import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PolicyService } from '../../../core/services/policy.service';
import { AuthService } from '../../../core/services/auth.service';
import { Policy, CATEGORY_ICONS, CATEGORY_COLORS } from '../../../shared/models/policy.model';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-wrapper animate-fade-up">

      <!-- Header -->
      <div class="page-top">
        <div>
          <h1 class="page-title">Polisy ubezpieczeniowe</h1>
          <p class="page-sub">{{ totalCount }} polis w systemie</p>
        </div>
      </div>

      <!-- Filters bar -->
      <div class="filters-bar">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input [formControl]="searchCtrl" placeholder="Szukaj polisy, klienta..." />
        </div>
        <div class="filter-chips">
          <button *ngFor="let s of statusOptions" class="filter-chip"
                  [class.active]="statusCtrl.value === s.value"
                  (click)="toggleStatus(s.value)">
            {{ s.label }}
          </button>
        </div>
        <div class="cat-select-wrap">
          <mat-icon class="cat-icon">category</mat-icon>
          <select [formControl]="categoryCtrl" class="cat-select">
            <option value="">Wszystkie kategorie</option>
            <option value="auto">Pojazd</option>
            <option value="property">Majątkowe</option>
            <option value="health">Zdrowotne</option>
            <option value="life">Na życie</option>
            <option value="travel">Podróżne</option>
            <option value="liability">OC</option>
          </select>
          <mat-icon class="cat-arrow">expand_more</mat-icon>
        </div>
      </div>

      <!-- Skeleton loader -->
      <div *ngIf="loading" class="skeleton-grid">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="skeleton-card">
          <div class="skeleton sk-header"></div>
          <div class="sk-body">
            <div class="skeleton sk-line-lg"></div>
            <div class="skeleton sk-line-sm"></div>
            <div class="skeleton sk-line-sm"></div>
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div class="policies-grid" *ngIf="!loading">
        <div *ngFor="let policy of policies; let i = index" class="policy-card"
             [routerLink]="['/policies', policy.id]"
             [style.animation-delay]="i * 40 + 'ms'">

          <!-- Card top banner -->
          <div class="card-banner" [style.background]="getGradient(policy)">
            <mat-icon class="banner-icon">{{ getIcon(policy) }}</mat-icon>
            <div class="banner-right">
              <div class="banner-num">{{ policy.policy_number }}</div>
              <div class="banner-status" [style.background]="getStatusBg(policy.status)">
                {{ policy.status_display }}
              </div>
            </div>
          </div>

          <!-- Card body -->
          <div class="card-body">
            <div class="policy-name">{{ policy.product?.name || policy.product_name }}</div>

            <div class="policy-stats">
              <div class="pstat">
                <div class="pstat-label">Suma ubezp.</div>
                <div class="pstat-value">{{ policy.coverage_amount | currency:'PLN':'symbol':'1.0-0':'pl' }}</div>
              </div>
              <div class="pstat-divider"></div>
              <div class="pstat">
                <div class="pstat-label">Składka/mies.</div>
                <div class="pstat-value">{{ policy.premium_monthly | currency:'PLN':'symbol':'1.0-0':'pl' }}</div>
              </div>
            </div>

            <div class="policy-dates">
              <mat-icon>calendar_today</mat-icon>
              {{ policy.start_date | date:'d MMM y' }} — {{ policy.end_date | date:'d MMM y' }}
            </div>

            <div class="expiry-bar" *ngIf="policy.status === 'active'">
              <div class="expiry-track">
                <div class="expiry-fill"
                     [style.width]="getExpiryPercent(policy) + '%'"
                     [class.expiry-warn]="(policy.days_to_expiry ?? 999) < 30">
                </div>
              </div>
              <span [class.text-warn]="(policy.days_to_expiry ?? 999) < 30">
                {{ policy.days_to_expiry }}d do wygaśnięcia
              </span>
            </div>
          </div>

          <!-- Card footer -->
          <div class="card-footer">
            <span class="card-owner" *ngIf="auth.isAgent">
              <mat-icon>person</mat-icon>{{ policy.customer_name }}
            </span>
            <span class="card-arrow">→</span>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="policies.length === 0" class="empty-state-full">
          <div class="empty-icon"><mat-icon>policy</mat-icon></div>
          <h3>Brak polis</h3>
          <p>Nie znaleziono żadnych polis spełniających kryteria.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { max-width: 1280px; margin: 0 auto; }
    .page-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 26px; font-weight: 800; letter-spacing: -.02em; }
    .page-sub { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

    /* Filters */
    .filters-bar {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      background: white; padding: 12px 16px; border-radius: 14px;
      border: 1px solid var(--border); margin-bottom: 20px;
      box-shadow: var(--shadow-sm);
    }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: var(--surface-3); border-radius: 10px;
      padding: 8px 12px; flex: 1; min-width: 200px;
    }
    .search-box mat-icon { color: var(--text-muted); font-size: 18px; }
    .search-box input {
      border: none; background: none; outline: none; font-size: 14px;
      color: var(--text-primary); font-family: inherit; width: 100%;
    }
    .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-chip {
      padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
      border: 1.5px solid var(--border); background: white; cursor: pointer;
      color: var(--text-secondary); transition: all .15s;
    }
    .filter-chip:hover { border-color: #4f46e5; color: #4f46e5; }
    .filter-chip.active { background: #4f46e5; color: white; border-color: #4f46e5; }
    .cat-select-wrap {
      display: flex; align-items: center;
      border: 1.5px solid var(--border); border-radius: 10px;
      background: var(--surface-3); overflow: hidden;
      transition: border-color .2s;
    }
    .cat-select-wrap:focus-within { border-color: #4f46e5; background: white; }
    .cat-icon { color: var(--text-muted); margin: 0 8px; font-size: 16px; flex-shrink: 0; }
    .cat-arrow { color: var(--text-muted); margin: 0 8px; font-size: 16px; pointer-events: none; flex-shrink: 0; }
    .cat-select {
      border: none; background: none; padding: 8px 4px;
      font-size: 13px; color: var(--text-primary); outline: none;
      font-family: inherit; cursor: pointer; appearance: none; min-width: 140px;
    }

    /* Skeleton */
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(300px,1fr)); gap: 16px; }
    .skeleton-card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
    .sk-header { height: 100px; border-radius: 0; }
    .sk-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .sk-line-lg { height: 16px; width: 70%; }
    .sk-line-sm { height: 12px; width: 50%; }

    /* Policy grid */
    .policies-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(300px,1fr)); gap: 16px; }
    .policy-card {
      background: white; border-radius: 16px; overflow: hidden;
      border: 1px solid var(--border); cursor: pointer;
      transition: transform .2s, box-shadow .2s;
      animation: fadeInUp .4s ease both;
      box-shadow: var(--shadow-sm);
    }
    .policy-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

    /* Banner */
    .card-banner {
      padding: 20px; display: flex; justify-content: space-between; align-items: flex-start;
    }
    .banner-icon { font-size: 32px; width: 32px; height: 32px; color: rgba(255,255,255,.9); }
    .banner-right { text-align: right; }
    .banner-num { font-size: 11px; color: rgba(255,255,255,.65); font-weight: 600; margin-bottom: 4px; }
    .banner-status {
      font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
      display: inline-block; color: white;
    }

    /* Body */
    .card-body { padding: 16px 16px 12px; }
    .policy-name { font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); }
    .policy-stats { display: flex; gap: 16px; align-items: center; margin-bottom: 12px; }
    .pstat { flex: 1; }
    .pstat-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); font-weight: 600; }
    .pstat-value { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
    .pstat-divider { width: 1px; height: 32px; background: var(--border); }
    .policy-dates {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--text-muted); margin-bottom: 10px;
    }
    .policy-dates mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Expiry bar */
    .expiry-bar { display: flex; flex-direction: column; gap: 4px; }
    .expiry-track { height: 4px; background: var(--surface-3); border-radius: 99px; overflow: hidden; }
    .expiry-fill { height: 100%; background: linear-gradient(90deg,#4f46e5,#06b6d4); border-radius: 99px; transition: width .3s; }
    .expiry-warn { background: linear-gradient(90deg,#f59e0b,#ef4444) !important; }
    .expiry-bar span { font-size: 11px; color: var(--text-muted); }
    .text-warn { color: #f59e0b !important; font-weight: 600; }

    /* Footer */
    .card-footer {
      padding: 10px 16px; border-top: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
    }
    .card-owner { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-muted); }
    .card-owner mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .card-arrow mat-icon { color: var(--text-muted); font-size: 18px; transition: color .15s; }
    .policy-card:hover .card-arrow mat-icon { color: #4f46e5; }

    /* Empty */
    .empty-state-full {
      grid-column: 1 / -1; text-align: center; padding: 64px 24px;
      background: white; border-radius: 16px; border: 1px solid var(--border);
    }
    .empty-icon mat-icon { font-size: 64px; width: 64px; height: 64px; opacity: .2; display: block; margin: 0 auto 16px; }
    .empty-state-full h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .empty-state-full p { color: var(--text-secondary); }
  `],
})
export class PolicyListComponent implements OnInit {
  policies: Policy[] = [];
  loading = false;
  totalCount = 0;

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');
  categoryCtrl = new FormControl('');

  statusOptions = [
    { value: 'active', label: 'Aktywna' },
    { value: 'pending', label: 'Oczekująca' },
    { value: 'expired', label: 'Wygasła' },
    { value: 'cancelled', label: 'Anulowana' },
  ];

  private gradients: Record<string, string> = {
    auto: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    property: 'linear-gradient(135deg,#047857,#10b981)',
    health: 'linear-gradient(135deg,#b91c1c,#ef4444)',
    life: 'linear-gradient(135deg,#6d28d9,#a855f7)',
    travel: 'linear-gradient(135deg,#0e7490,#06b6d4)',
    liability: 'linear-gradient(135deg,#c2410c,#f97316)',
  };
  private icons: Record<string, string> = {
    auto: 'directions_car', property: 'home', health: 'health_and_safety',
    life: 'favorite', travel: 'flight', liability: 'shield',
  };

  constructor(private policyService: PolicyService, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadPolicies();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.loadPolicies());
    this.categoryCtrl.valueChanges.subscribe(() => this.loadPolicies());
  }

  loadPolicies(): void {
    this.loading = true;
    this.policyService.getPolicies({
      status: this.statusCtrl.value || undefined,
      category: this.categoryCtrl.value || undefined,
      search: this.searchCtrl.value || undefined,
    }).subscribe({
      next: r => { this.policies = r.results; this.totalCount = r.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  toggleStatus(val: string): void {
    this.statusCtrl.setValue(this.statusCtrl.value === val ? '' : val);
    this.loadPolicies();
  }

  getGradient(p: Policy): string {
    const cat = (p.product as any)?.category || p.product_category || '';
    return this.gradients[cat] || 'linear-gradient(135deg,#4f46e5,#06b6d4)';
  }
  getIcon(p: Policy): string {
    const cat = (p.product as any)?.category || p.product_category || '';
    return this.icons[cat] || 'policy';
  }
  getStatusBg(status: string): string {
    const m: Record<string, string> = {
      active: 'rgba(16,185,129,.3)', pending: 'rgba(99,102,241,.3)',
      expired: 'rgba(100,116,139,.3)', cancelled: 'rgba(239,68,68,.3)', suspended: 'rgba(245,158,11,.3)',
    };
    return m[status] || 'rgba(0,0,0,.2)';
  }
  getExpiryPercent(p: Policy): number {
    const days = p.days_to_expiry ?? 365;
    return Math.max(0, Math.min(100, (days / 365) * 100));
  }
}
