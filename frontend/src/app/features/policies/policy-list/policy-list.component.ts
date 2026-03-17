import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Moje polisy</h1>
          <p class="subtitle">{{ totalCount }} polis łącznie</p>
        </div>
      </div>

      <!-- Filtry -->
      <div class="filters">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Szukaj</mat-label>
          <input matInput [formControl]="searchCtrl" placeholder="Numer polisy, imię..." />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusCtrl">
            <mat-option value="">Wszystkie</mat-option>
            <mat-option value="active">Aktywna</mat-option>
            <mat-option value="pending">Oczekująca</mat-option>
            <mat-option value="expired">Wygasła</mat-option>
            <mat-option value="cancelled">Anulowana</mat-option>
            <mat-option value="suspended">Zawieszona</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Kategoria</mat-label>
          <mat-select [formControl]="categoryCtrl">
            <mat-option value="">Wszystkie</mat-option>
            <mat-option value="auto">Pojazd</mat-option>
            <mat-option value="property">Majątkowe</mat-option>
            <mat-option value="health">Zdrowotne</mat-option>
            <mat-option value="life">Na życie</mat-option>
            <mat-option value="travel">Podróżne</mat-option>
            <mat-option value="liability">OC</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Siatka polis -->
      <div class="policies-grid" *ngIf="!loading">
        <mat-card *ngFor="let policy of policies" class="policy-card"
                  [routerLink]="['/policies', policy.id]">
          <div class="card-header" [style.background]="getCategoryColor(policy)">
            <mat-icon class="category-icon">{{ getCategoryIcon(policy) }}</mat-icon>
            <div class="policy-number">{{ policy.policy_number }}</div>
          </div>
          <mat-card-content>
            <h3>{{ policy.product?.name || policy.product_name }}</h3>
            <div class="policy-meta">
              <span class="meta-item">
                <mat-icon>event</mat-icon>
                {{ policy.start_date | date:'d MMM y' }} – {{ policy.end_date | date:'d MMM y' }}
              </span>
              <span class="meta-item">
                <mat-icon>shield</mat-icon>
                {{ policy.coverage_amount | currency:'PLN':'symbol':'1.0-0':'pl' }}
              </span>
              <span class="meta-item">
                <mat-icon>payments</mat-icon>
                {{ policy.premium_monthly | currency:'PLN':'symbol':'1.2-2':'pl' }}/mies.
              </span>
            </div>
            <div *ngIf="policy.days_to_expiry !== null && policy.days_to_expiry !== undefined
                        && policy.days_to_expiry <= 30 && policy.status === 'active'"
                 class="expiry-warning">
              <mat-icon>schedule</mat-icon>
              Wygasa za {{ policy.days_to_expiry }} dni
            </div>
          </mat-card-content>
          <mat-card-actions>
            <mat-chip [style.background-color]="getStatusColor(policy.status)"
                      [style.color]="'white'">
              {{ policy.status_display }}
            </mat-chip>
            <button mat-icon-button matTooltip="Szczegóły">
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>

        <div *ngIf="policies.length === 0" class="empty-state">
          <mat-icon>policy</mat-icon>
          <h3>Brak polis</h3>
          <p>Skontaktuj się z agentem w celu zawarcia umowy ubezpieczenia.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .search-field { flex: 1; min-width: 240px; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }
    .policies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px; }
    .policy-card { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
      overflow: hidden; }
    .policy-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .card-header { padding: 20px; color: white; display: flex; align-items: center;
      justify-content: space-between; }
    .category-icon { font-size: 32px; width: 32px; height: 32px; opacity: 0.9; }
    .policy-number { font-size: 13px; opacity: 0.8; font-weight: 600; }
    mat-card-content h3 { margin: 12px 0 8px; font-size: 16px; font-weight: 600; }
    .policy-meta { display: flex; flex-direction: column; gap: 6px; }
    .meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #555; }
    .meta-item mat-icon { font-size: 16px; width: 16px; height: 16px; color: #999; }
    .expiry-warning { display: flex; align-items: center; gap: 6px; color: #E65100;
      font-size: 13px; font-weight: 600; background: #FFF3E0; padding: 8px; border-radius: 4px;
      margin-top: 8px; }
    mat-card-actions { display: flex; justify-content: space-between; align-items: center;
      padding: 8px 16px 12px; }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; opacity: 0.3; }
  `],
})
export class PolicyListComponent implements OnInit {
  policies: Policy[] = [];
  loading = false;
  totalCount = 0;

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');
  categoryCtrl = new FormControl('');

  constructor(
    private policyService: PolicyService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPolicies();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.loadPolicies());
    this.statusCtrl.valueChanges.subscribe(() => this.loadPolicies());
    this.categoryCtrl.valueChanges.subscribe(() => this.loadPolicies());
  }

  loadPolicies(): void {
    this.loading = true;
    this.policyService.getPolicies({
      status: this.statusCtrl.value || undefined,
      category: this.categoryCtrl.value || undefined,
      search: this.searchCtrl.value || undefined,
    }).subscribe({
      next: (res) => {
        this.policies = res.results;
        this.totalCount = res.count;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getCategoryIcon(policy: Policy): string {
    const cat = (policy.product as any)?.category || policy.product_category || '';
    return (CATEGORY_ICONS as any)[cat] || 'policy';
  }

  getCategoryColor(policy: Policy): string {
    const cat = (policy.product as any)?.category || policy.product_category || '';
    return (CATEGORY_COLORS as any)[cat] || '#1565C0';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: '#2E7D32', pending: '#1565C0', expired: '#616161',
      cancelled: '#C62828', suspended: '#E65100',
    };
    return colors[status] || '#666';
  }
}
