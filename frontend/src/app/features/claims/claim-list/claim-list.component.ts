import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
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
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatChipsModule,
    MatPaginatorModule, MatProgressSpinnerModule, MatCardModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Szkody</h1>
          <p class="subtitle">{{ totalCount }} zgłoszeń łącznie</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/claims/new"
           *ngIf="!auth.isAgent">
          <mat-icon>add</mat-icon> Zgłoś szkodę
        </a>
      </div>

      <!-- Filtry -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Szukaj</mat-label>
              <input matInput [formControl]="searchCtrl"
                     placeholder="Numer szkody, opis, lokalizacja..." />
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="statusCtrl">
                <mat-option value="">Wszystkie</mat-option>
                <mat-option *ngFor="let s of statusOptions" [value]="s.value">
                  {{ s.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Typ zdarzenia</mat-label>
              <mat-select [formControl]="incidentTypeCtrl">
                <mat-option value="">Wszystkie</mat-option>
                <mat-option *ngFor="let t of incidentTypes" [value]="t.value">
                  {{ t.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tabela -->
      <mat-card>
        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="claims" *ngIf="!loading" class="full-width">
            <ng-container matColumnDef="claim_number">
              <th mat-header-cell *matHeaderCellDef>Nr szkody</th>
              <td mat-cell *matCellDef="let claim">
                <a [routerLink]="['/claims', claim.id]" class="link">
                  <strong>{{ claim.claim_number }}</strong>
                </a>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let claim">
                <mat-chip [style.background-color]="getStatusColor(claim.status)"
                          [style.color]="'white'" class="status-chip">
                  <mat-icon class="chip-icon">{{ getStatusIcon(claim.status) }}</mat-icon>
                  {{ claim.status_display }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="incident_type">
              <th mat-header-cell *matHeaderCellDef>Typ zdarzenia</th>
              <td mat-cell *matCellDef="let claim">{{ claim.incident_type_display }}</td>
            </ng-container>

            <ng-container matColumnDef="policy">
              <th mat-header-cell *matHeaderCellDef>Polisa</th>
              <td mat-cell *matCellDef="let claim">{{ claim.policy_number }}</td>
            </ng-container>

            <ng-container matColumnDef="incident_date">
              <th mat-header-cell *matHeaderCellDef>Data zdarzenia</th>
              <td mat-cell *matCellDef="let claim">
                {{ claim.incident_date | date:'d MMM y' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="estimated_damage">
              <th mat-header-cell *matHeaderCellDef>Kwota szkody</th>
              <td mat-cell *matCellDef="let claim">
                {{ claim.estimated_damage | currency:'PLN':'symbol':'1.2-2':'pl' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="reported_by" *ngIf="auth.isAgent">
              <th mat-header-cell *matHeaderCellDef>Klient</th>
              <td mat-cell *matCellDef="let claim">{{ claim.reported_by_name }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let claim">
                <a mat-icon-button [routerLink]="['/claims', claim.id]"
                   matTooltip="Szczegóły">
                  <mat-icon>arrow_forward</mat-icon>
                </a>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="table-row"></tr>
          </table>

          <div *ngIf="!loading && claims.length === 0" class="empty-state">
            <mat-icon>inbox</mat-icon>
            <h3>Brak zgłoszonych szkód</h3>
            <a mat-raised-button color="primary" routerLink="/claims/new"
               *ngIf="!auth.isAgent">
              <mat-icon>add</mat-icon> Zgłoś pierwszą szkodę
            </a>
          </div>

          <mat-paginator
            [length]="totalCount"
            [pageSize]="20"
            [pageSizeOptions]="[20, 50]"
            (page)="onPageChange($event)"
            *ngIf="totalCount > 0">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .filters-card { margin-bottom: 16px; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 240px; }
    .full-width { width: 100%; }
    .loading-container { display: flex; justify-content: center; padding: 40px; }
    .status-chip { font-size: 12px; height: 28px; display: flex; align-items: center; gap: 4px; }
    .chip-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .link { color: #1565C0; text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .table-row:hover { background-color: #f5f7fa; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; opacity: 0.3; }
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

  statusOptions = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  }));

  incidentTypes = [
    { value: 'accident', label: 'Wypadek' },
    { value: 'theft', label: 'Kradzież' },
    { value: 'fire', label: 'Pożar' },
    { value: 'flood', label: 'Powódź' },
    { value: 'vandalism', label: 'Wandalizm' },
    { value: 'illness', label: 'Choroba' },
    { value: 'injury', label: 'Uraz' },
    { value: 'natural_disaster', label: 'Klęska żywiołowa' },
    { value: 'other', label: 'Inne' },
  ];

  get displayedColumns(): string[] {
    const cols = ['claim_number', 'status', 'incident_type', 'policy',
                  'incident_date', 'estimated_damage'];
    if (this.auth.isAgent) cols.push('reported_by');
    cols.push('actions');
    return cols;
  }

  constructor(
    private claimService: ClaimService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadClaims();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged()
    ).subscribe(() => { this.currentPage = 1; this.loadClaims(); });

    this.statusCtrl.valueChanges.subscribe(() => { this.currentPage = 1; this.loadClaims(); });
    this.incidentTypeCtrl.valueChanges.subscribe(() => { this.currentPage = 1; this.loadClaims(); });
  }

  loadClaims(): void {
    this.loading = true;
    this.claimService.getClaims({
      status: this.statusCtrl.value || undefined,
      incident_type: this.incidentTypeCtrl.value || undefined,
      search: this.searchCtrl.value || undefined,
      page: this.currentPage,
    }).subscribe({
      next: (res) => {
        this.claims = res.results;
        this.totalCount = res.count;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.loadClaims();
  }

  getStatusColor(status: ClaimStatus): string {
    return STATUS_CONFIG[status]?.color || '#666';
  }

  getStatusIcon(status: ClaimStatus): string {
    return STATUS_CONFIG[status]?.icon || 'info';
  }
}
