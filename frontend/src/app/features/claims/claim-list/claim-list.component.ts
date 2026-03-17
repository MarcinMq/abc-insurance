import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthService } from '../../../core/services/auth.service';
import { Claim, STATUS_CONFIG, ClaimStatus } from '../../../shared/models/claim.model';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatPaginatorModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-wrapper animate-fade-up">

      <!-- Header -->
      <div class="page-top">
        <div>
          <h1 class="page-title">Szkody</h1>
          <p class="page-sub">{{ totalCount }} zgłoszeń łącznie</p>
        </div>
        <a class="btn-primary" routerLink="/claims/new" *ngIf="!auth.isAgent">
          <mat-icon>add</mat-icon> Nowe zgłoszenie
        </a>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input [formControl]="searchCtrl" placeholder="Numer szkody, opis, lokalizacja..." />
        </div>
        <div class="filter-chips">
          <button *ngFor="let s of statusOptions" class="filter-chip"
                  [class.active]="statusCtrl.value === s.value"
                  (click)="toggleFilter(statusCtrl, s.value)">
            <span class="chip-dot" [style.background]="s.color"></span>
            {{ s.label }}
          </button>
        </div>
        <div class="select-wrap">
          <mat-icon class="select-icon">category</mat-icon>
          <select [formControl]="incidentTypeCtrl" class="native-select">
            <option value="">Wszystkie typy</option>
            <option *ngFor="let t of incidentTypes" [value]="t.value">{{ t.label }}</option>
          </select>
          <mat-icon class="select-arrow">expand_more</mat-icon>
        </div>
      </div>

      <!-- Skeleton -->
      <div *ngIf="loading" class="skeleton-list">
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton-row">
          <div class="skeleton sk-circle"></div>
          <div class="sk-lines">
            <div class="skeleton sk-line-lg"></div>
            <div class="skeleton sk-line-sm"></div>
          </div>
          <div class="skeleton sk-badge"></div>
          <div class="skeleton sk-amount"></div>
        </div>
      </div>

      <!-- Claims table -->
      <div class="claims-table" *ngIf="!loading">
        <div class="table-header">
          <span class="col-num">Nr szkody</span>
          <span class="col-type">Typ zdarzenia</span>
          <span class="col-policy">Polisa</span>
          <span class="col-date">Data</span>
          <span class="col-amount">Kwota</span>
          <span class="col-customer" *ngIf="auth.isAgent">Klient</span>
          <span class="col-status">Status</span>
          <span class="col-action"></span>
        </div>

        <div *ngFor="let claim of claims; let i = index"
             class="table-row" [routerLink]="['/claims', claim.id]"
             [style.animation-delay]="i * 30 + 'ms'">

          <span class="col-num">
            <span class="claim-num-dot" [style.background]="getStatusColor(claim.status)"></span>
            <strong>{{ claim.claim_number }}</strong>
          </span>

          <span class="col-type">
            <span class="incident-icon" [class]="'inc-' + claim.incident_type">
              <mat-icon>{{ getIncidentIcon(claim.incident_type) }}</mat-icon>
            </span>
            {{ claim.incident_type_display }}
          </span>

          <span class="col-policy text-muted">{{ claim.policy_number }}</span>

          <span class="col-date text-muted">{{ claim.incident_date | date:'d MMM y' }}</span>

          <span class="col-amount">
            <strong>{{ claim.estimated_damage | currency:'PLN':'symbol':'1.0-0':'pl' }}</strong>
          </span>

          <span class="col-customer text-muted" *ngIf="auth.isAgent">
            {{ claim.reported_by_name }}
          </span>

          <span class="col-status">
            <span class="status-pill"
                  [style.background]="getStatusColor(claim.status) + '18'"
                  [style.color]="getStatusColor(claim.status)"
                  [style.border]="'1px solid ' + getStatusColor(claim.status) + '40'">
              <mat-icon>{{ getStatusIcon(claim.status) }}</mat-icon>
              {{ claim.status_display }}
            </span>
          </span>

          <span class="col-action">
            <span class="row-arrow"><mat-icon>chevron_right</mat-icon></span>
          </span>
        </div>

        <!-- Empty -->
        <div *ngIf="claims.length === 0" class="empty-table">
          <mat-icon>inbox</mat-icon>
          <h3>Brak zgłoszeń</h3>
          <p>Nie znaleziono szkód spełniających kryteria wyszukiwania.</p>
          <a class="btn-primary" routerLink="/claims/new" *ngIf="!auth.isAgent">
            <mat-icon>add</mat-icon> Pierwsze zgłoszenie
          </a>
        </div>
      </div>

      <!-- Pagination -->
      <mat-paginator
        *ngIf="totalCount > 20"
        [length]="totalCount"
        [pageSize]="20"
        [pageSizeOptions]="[20, 50]"
        (page)="onPageChange($event)"
        class="paginator">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .page-wrapper { max-width: 1280px; margin: 0 auto; }
    .page-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 26px; font-weight: 800; letter-spacing: -.02em; }
    .page-sub { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg,#4f46e5,#06b6d4); color: white;
      text-decoration: none; padding: 10px 18px; border-radius: 12px;
      font-size: 13px; font-weight: 700; box-shadow: 0 4px 16px rgba(79,70,229,.3);
      transition: all .2s;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,.4); }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }

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
      padding: 8px 12px; flex: 1; min-width: 220px;
    }
    .search-box mat-icon { color: var(--text-muted); font-size: 18px; flex-shrink: 0; }
    .search-box input {
      border: none; background: none; outline: none;
      font-size: 14px; color: var(--text-primary); font-family: inherit; width: 100%;
    }

    .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
      border: 1.5px solid var(--border); background: white; cursor: pointer;
      color: var(--text-secondary); transition: all .15s; white-space: nowrap;
    }
    .filter-chip:hover { border-color: #4f46e5; color: #4f46e5; }
    .filter-chip.active { background: #4f46e5; color: white; border-color: #4f46e5; }
    .filter-chip.active .chip-dot { background: rgba(255,255,255,.7) !important; }
    .chip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

    /* Native select wrapper */
    .select-wrap {
      display: flex; align-items: center; gap: 6px;
      background: var(--surface-3); border-radius: 10px;
      padding: 8px 10px; min-width: 160px; position: relative;
    }
    .select-icon { color: var(--text-muted); font-size: 16px; flex-shrink: 0; }
    .native-select {
      border: none; background: none; outline: none;
      font-size: 13px; font-weight: 500; color: var(--text-primary);
      font-family: inherit; flex: 1; cursor: pointer;
      -webkit-appearance: none; appearance: none; padding-right: 4px;
    }
    .select-arrow { color: var(--text-muted); font-size: 16px; flex-shrink: 0; pointer-events: none; }

    /* Skeleton */
    .skeleton-list { display: flex; flex-direction: column; gap: 4px;
      background: white; border-radius: 16px; padding: 8px;
      border: 1px solid var(--border); }
    .skeleton-row {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 16px; border-radius: 10px;
    }
    .sk-circle { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
    .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .sk-line-lg { height: 14px; width: 60%; }
    .sk-line-sm { height: 11px; width: 40%; }
    .sk-badge { width: 80px; height: 26px; border-radius: 20px; }
    .sk-amount { width: 70px; height: 14px; }

    /* Table */
    .claims-table {
      background: white; border-radius: 16px; border: 1px solid var(--border);
      overflow: hidden; box-shadow: var(--shadow-sm);
    }
    .table-header {
      display: grid;
      grid-template-columns: 160px 1fr 120px 100px 120px 80px;
      gap: 0; padding: 12px 20px;
      background: var(--surface-3);
      border-bottom: 1px solid var(--border);
      font-size: 11px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .06em;
    }
    .table-header.with-customer {
      grid-template-columns: 160px 1fr 120px 100px 120px 140px 150px 40px;
    }

    .table-row {
      display: grid;
      grid-template-columns: 160px 1fr 120px 100px 120px 150px 40px;
      gap: 0; padding: 14px 20px; cursor: pointer;
      border-bottom: 1px solid var(--border);
      align-items: center; transition: background .12s;
      animation: fadeInUp .3s ease both;
    }
    .table-row:last-child { border-bottom: none; }
    .table-row:hover { background: #f8faff; }

    .col-num { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .claim-num-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .col-num strong { font-size: 13px; color: #4f46e5; }
    .col-type { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .incident-icon {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      background: var(--surface-3);
    }
    .incident-icon mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--text-secondary); }
    .col-policy, .col-date, .col-customer { font-size: 13px; }
    .col-amount { font-size: 13px; }
    .col-amount strong { color: var(--text-primary); }
    .text-muted { color: var(--text-secondary); }
    .col-status { }
    .status-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
      white-space: nowrap;
    }
    .status-pill mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .col-action { display: flex; justify-content: flex-end; }
    .row-arrow mat-icon { color: var(--text-muted); font-size: 20px; transition: color .12s; }
    .table-row:hover .row-arrow mat-icon { color: #4f46e5; }

    /* Columns for agent view */
    .col-customer { display: none; }
    /* show when auth.isAgent — handled via *ngIf */

    /* Empty */
    .empty-table {
      padding: 64px 24px; text-align: center; color: var(--text-muted);
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-table mat-icon { font-size: 56px; width: 56px; height: 56px; opacity: .2; }
    .empty-table h3 { font-size: 18px; font-weight: 700; color: var(--text-secondary); }

    /* Paginator */
    .paginator { border-top: 1px solid var(--border); }

    @media (max-width: 900px) {
      .table-header, .table-row { grid-template-columns: 1fr 1fr 120px 40px; }
      .col-policy, .col-date, .col-amount, .col-customer { display: none; }
    }
  `],
})
export class ClaimListComponent implements OnInit {
  claims: Claim[] = [];
  loading = false;
  totalCount = 0;
  currentPage = 1;

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');
  incidentTypeCtrl = new FormControl('');

  statusOptions = [
    { value: 'submitted',    label: 'Zgłoszona',    color: '#3b82f6' },
    { value: 'under_review', label: 'W ocenie',     color: '#f59e0b' },
    { value: 'approved',     label: 'Zatwierdzona', color: '#10b981' },
    { value: 'rejected',     label: 'Odrzucona',    color: '#ef4444' },
    { value: 'paid',         label: 'Wypłacona',    color: '#06b6d4' },
  ];

  incidentTypes = [
    { value: 'accident',        label: 'Wypadek' },
    { value: 'theft',           label: 'Kradzież' },
    { value: 'fire',            label: 'Pożar' },
    { value: 'flood',           label: 'Powódź' },
    { value: 'vandalism',       label: 'Wandalizm' },
    { value: 'illness',         label: 'Choroba' },
    { value: 'injury',          label: 'Uraz' },
    { value: 'natural_disaster',label: 'Klęska żywiołowa' },
    { value: 'other',           label: 'Inne' },
  ];

  private incidentIcons: Record<string, string> = {
    accident: 'car_crash', theft: 'lock_open', fire: 'local_fire_department',
    flood: 'water', vandalism: 'broken_image', illness: 'sick',
    injury: 'personal_injury', natural_disaster: 'storm', other: 'help',
  };

  constructor(private claimService: ClaimService, public auth: AuthService) {}

  ngOnInit(): void {
    this.loadClaims();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.currentPage = 1; this.loadClaims(); });
    this.incidentTypeCtrl.valueChanges
      .subscribe(() => { this.currentPage = 1; this.loadClaims(); });
  }

  loadClaims(): void {
    this.loading = true;
    this.claimService.getClaims({
      status:        this.statusCtrl.value  || undefined,
      incident_type: this.incidentTypeCtrl.value || undefined,
      search:        this.searchCtrl.value  || undefined,
      page:          this.currentPage,
    }).subscribe({
      next: r  => { this.claims = r.results; this.totalCount = r.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  toggleFilter(ctrl: FormControl, val: string): void {
    ctrl.setValue(ctrl.value === val ? '' : val);
    this.currentPage = 1;
    this.loadClaims();
  }

  onPageChange(e: PageEvent): void {
    this.currentPage = e.pageIndex + 1;
    this.loadClaims();
  }

  getStatusColor(s: ClaimStatus): string { return STATUS_CONFIG[s]?.color || '#666'; }
  getStatusIcon(s: ClaimStatus): string  { return STATUS_CONFIG[s]?.icon  || 'info'; }
  getIncidentIcon(t: string): string     { return this.incidentIcons[t]  || 'help'; }
}
