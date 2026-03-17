import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PolicyService } from '../../../core/services/policy.service';
import { AuthService } from '../../../core/services/auth.service';
import { Policy, CATEGORY_ICONS, CATEGORY_COLORS } from '../../../shared/models/policy.model';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatListModule, MatProgressSpinnerModule,
    MatProgressBarModule, MatSelectModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-container" *ngIf="policy; else loading">
      <div class="breadcrumb">
        <a routerLink="/policies" mat-button>
          <mat-icon>arrow_back</mat-icon> Polisy
        </a>
      </div>

      <div class="policy-header" [style.background]="getCategoryColor()">
        <mat-icon class="header-icon">{{ getCategoryIcon() }}</mat-icon>
        <div class="header-info">
          <div class="policy-number">{{ policy.policy_number }}</div>
          <h1>{{ policy.product?.name }}</h1>
          <div class="header-meta">
            {{ policy.start_date | date:'d MMM y' }} — {{ policy.end_date | date:'d MMM y' }}
          </div>
        </div>
        <mat-chip class="status-chip-lg" [style.background]="getStatusBg()"
                  [style.color]="'white'">
          {{ policy.status_display }}
        </mat-chip>
      </div>

      <div class="detail-grid">
        <div class="main-col">
          <!-- Kluczowe informacje -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Szczegóły polisy</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Suma ubezpieczenia</span>
                  <strong class="big-value">
                    {{ policy.coverage_amount | currency:'PLN':'symbol':'1.0-0':'pl' }}
                  </strong>
                </div>
                <div class="info-item">
                  <span class="info-label">Składka miesięczna</span>
                  <strong class="big-value">
                    {{ policy.premium_monthly | currency:'PLN':'symbol':'1.2-2':'pl' }}
                  </strong>
                </div>
                <div class="info-item">
                  <span class="info-label">Kategoria</span>
                  <span>{{ policy.product?.category_display }}</span>
                </div>
                <div class="info-item" *ngIf="policy.assigned_agent">
                  <span class="info-label">Opiekun</span>
                  <span>{{ policy.assigned_agent?.full_name }}</span>
                </div>
              </div>

              <!-- Zakres ochrony -->
              <mat-divider></mat-divider>
              <h4 class="section-title">Zakres ochrony</h4>
              <div class="coverage-list">
                <div *ngFor="let item of getCoverageItems()" class="coverage-item">
                  <mat-icon [class.covered]="item.value" [class.not-covered]="!item.value">
                    {{ item.value ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                  <span>{{ item.key }}</span>
                </div>
              </div>

              <!-- Ubezpieczony obiekt -->
              <div *ngIf="hasInsuredObject()">
                <mat-divider></mat-divider>
                <h4 class="section-title">Ubezpieczony obiekt</h4>
                <div class="info-grid">
                  <div *ngFor="let item of getInsuredObjectItems()" class="info-item">
                    <span class="info-label">{{ item.key }}</span>
                    <span>{{ item.value }}</span>
                  </div>
                </div>
              </div>

              <div *ngIf="policy.notes">
                <mat-divider></mat-divider>
                <h4 class="section-title">Uwagi</h4>
                <p>{{ policy.notes }}</p>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Dokumenty -->
          <mat-card class="mt-16">
            <mat-card-header>
              <mat-card-title>Dokumenty polisy</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="!policy.documents?.length" class="empty-docs">
                <mat-icon>folder_open</mat-icon>
                <p>Brak dokumentów</p>
              </div>
              <mat-list>
                <mat-list-item *ngFor="let doc of policy.documents">
                  <mat-icon matListItemIcon>picture_as_pdf</mat-icon>
                  <span matListItemTitle>{{ doc.title }}</span>
                  <span matListItemLine>{{ doc.document_type_display }} · {{ doc.uploaded_at | date:'d MMM y' }}</span>
                  <a mat-icon-button matListItemMeta [href]="doc.file" target="_blank">
                    <mat-icon>download</mat-icon>
                  </a>
                </mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="sidebar-col">
          <!-- Zmiana statusu (tylko agent) -->
          <mat-card *ngIf="auth.isAgent">
            <mat-card-header>
              <mat-card-title>Zarządzanie polisą</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Zmień status</mat-label>
                <mat-select [formControl]="newStatusCtrl">
                  <mat-option value="pending">Oczekująca</mat-option>
                  <mat-option value="active">Aktywna</mat-option>
                  <mat-option value="suspended">Zawieszona</mat-option>
                  <mat-option value="cancelled">Anulowana</mat-option>
                  <mat-option value="expired">Wygasła</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" class="full-width"
                      (click)="changeStatus()" [disabled]="!newStatusCtrl.value || statusLoading">
                Zmień status
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Klient (tylko agent) -->
          <mat-card class="mt-16" *ngIf="auth.isAgent && policy.customer">
            <mat-card-header>
              <mat-card-title>Klient</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-item">
                <span class="info-label">Imię i nazwisko</span>
                <span>{{ policy.customer?.full_name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span>{{ policy.customer?.email }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Szybka akcja: zgłoś szkodę -->
          <mat-card class="mt-16" *ngIf="policy.status === 'active' && !auth.isAgent">
            <mat-card-content>
              <div class="action-box">
                <mat-icon color="warn">report_problem</mat-icon>
                <div>
                  <strong>Masz szkodę?</strong>
                  <p>Zgłoś zdarzenie do tej polisy.</p>
                  <a mat-raised-button color="warn"
                     [routerLink]="['/claims/new']"
                     [queryParams]="{ policyId: policy.id }">
                    <mat-icon>add</mat-icon> Zgłoś szkodę
                  </a>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Czas do wygaśnięcia -->
          <mat-card class="mt-16" *ngIf="policy.days_to_expiry !== null">
            <mat-card-content>
              <div class="expiry-info">
                <mat-icon [color]="policy.days_to_expiry! <= 30 ? 'warn' : 'primary'">
                  schedule
                </mat-icon>
                <div>
                  <strong>{{ policy.days_to_expiry }} dni</strong> do wygaśnięcia
                  <mat-progress-bar
                    mode="determinate"
                    [value]="getExpiryProgress()"
                    [color]="policy.days_to_expiry! <= 30 ? 'warn' : 'primary'"
                    class="expiry-bar">
                  </mat-progress-bar>
                  <span class="expiry-date">
                    Wygasa: {{ policy.end_date | date:'d MMMM y' }}
                  </span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-container">
        <mat-spinner></mat-spinner>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .policy-header { color: white; padding: 32px; border-radius: 12px; display: flex;
      align-items: center; gap: 24px; margin-bottom: 24px; }
    .header-icon { font-size: 56px; width: 56px; height: 56px; opacity: 0.9; }
    .header-info { flex: 1; }
    .policy-number { font-size: 13px; opacity: 0.8; margin-bottom: 4px; }
    .policy-header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 700; }
    .header-meta { opacity: 0.85; font-size: 14px; }
    .status-chip-lg { font-size: 14px; height: 36px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 8px 0 16px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .big-value { font-size: 20px; color: #1565C0; }
    .section-title { font-size: 13px; color: #666; text-transform: uppercase;
      letter-spacing: 0.5px; margin: 16px 0 8px; }
    .coverage-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .coverage-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .covered { color: #2E7D32; }
    .not-covered { color: #bbb; }
    .action-box { display: flex; gap: 12px; align-items: flex-start; }
    .action-box p { margin: 4px 0 12px; color: #666; font-size: 13px; }
    .expiry-info { display: flex; gap: 12px; align-items: flex-start; }
    .expiry-bar { margin: 8px 0; }
    .expiry-date { font-size: 12px; color: #666; }
    .full-width { width: 100%; }
    .mt-16 { margin-top: 16px; }
    .empty-docs { text-align: center; padding: 24px; color: #999; }
    .empty-docs mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.3;
      display: block; margin: 0 auto 8px; }
    .loading-container { display: flex; justify-content: center; padding: 80px; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
  `],
})
export class PolicyDetailComponent implements OnInit {
  policy: Policy | null = null;
  newStatusCtrl = new FormControl('');
  statusLoading = false;

  constructor(
    private route: ActivatedRoute,
    private policyService: PolicyService,
    public auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.policyService.getPolicy(id).subscribe((policy) => {
      this.policy = policy;
    });
  }

  getCategoryIcon(): string {
    const cat = (this.policy?.product as any)?.category || '';
    return (CATEGORY_ICONS as any)[cat] || 'policy';
  }

  getCategoryColor(): string {
    const cat = (this.policy?.product as any)?.category || '';
    return (CATEGORY_COLORS as any)[cat] || '#1565C0';
  }

  getStatusBg(): string {
    const colors: Record<string, string> = {
      active: '#2E7D32', pending: '#1565C0', expired: '#616161',
      cancelled: '#C62828', suspended: '#E65100',
    };
    return colors[this.policy?.status || ''] || '#666';
  }

  getCoverageItems(): { key: string; value: boolean }[] {
    const details = (this.policy?.product as any)?.coverage_details || {};
    return Object.entries(details).map(([key, value]) => ({
      key: this.formatCoverageKey(key),
      value: Boolean(value),
    }));
  }

  formatCoverageKey(key: string): string {
    const labels: Record<string, string> = {
      theft: 'Kradzież', accident: 'Wypadek', fire: 'Pożar', flood: 'Powódź',
      vandalism: 'Wandalizm', natural_disasters: 'Klęski żywiołowe',
      glass_breakage: 'Stłuczenie szyb', replacement_vehicle: 'Pojazd zastępczy',
      bodily_injury: 'Ochrona ciała', property_damage: 'Szkody majątkowe',
      eu_coverage: 'Ochrona EU', assistance_24h: 'Assistance 24/7',
      gp_visits: 'Wizyty u lekarza', specialists: 'Specjaliści',
      diagnostics: 'Diagnostyka', rehabilitation: 'Rehabilitacja',
      dental: 'Stomatologia', mental_health: 'Zdrowie psychiczne',
      hospitalization: 'Hospitalizacja', death: 'Śmierć', permanent_disability: 'Trwała inwalidztwo',
      critical_illness: 'Ciężka choroba', savings_component: 'Składnik oszczędnościowy',
      medical_costs: 'Koszty leczenia', evacuation: 'Ewakuacja',
      baggage: 'Bagaż', trip_cancellation: 'Rezygnacja z podróży',
      flight_delay: 'Opóźnienie lotu', personal_accident: 'NNW',
      third_party_liability: 'OC', temporary_accommodation: 'Zakwaterowanie zastępcze',
    };
    return labels[key] || key;
  }

  hasInsuredObject(): boolean {
    return Object.keys(this.policy?.insured_object || {}).length > 0;
  }

  getInsuredObjectItems(): { key: string; value: string }[] {
    return Object.entries(this.policy?.insured_object || {}).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  }

  getExpiryProgress(): number {
    if (!this.policy?.days_to_expiry) return 0;
    return Math.max(0, Math.min(100, (this.policy.days_to_expiry / 365) * 100));
  }

  changeStatus(): void {
    if (!this.policy || !this.newStatusCtrl.value) return;
    this.statusLoading = true;
    this.policyService.updatePolicyStatus(this.policy.id, this.newStatusCtrl.value).subscribe({
      next: (updated) => {
        this.policy = updated;
        this.newStatusCtrl.reset();
        this.statusLoading = false;
        this.snackBar.open('Status polisy zmieniony.', 'OK', { duration: 3000 });
      },
      error: () => { this.statusLoading = false; },
    });
  }
}
