import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { PolicyService } from '../../../core/services/policy.service';
import { AuthService } from '../../../core/services/auth.service';
import { Policy, CATEGORY_ICONS, CATEGORY_COLORS } from '../../../shared/models/policy.model';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-wrapper animate-fade-up" *ngIf="policy; else loadingTpl">

      <!-- Back -->
      <a class="back-link" routerLink="/policies">
        <mat-icon>arrow_back</mat-icon>
        <span>Powrót do polis</span>
      </a>

      <!-- Hero banner -->
      <div class="hero-banner" [style.background]="getCategoryGradient()">
        <div class="hero-left">
          <div class="hero-icon-wrap">
            <mat-icon class="hero-icon">{{ getCategoryIcon() }}</mat-icon>
          </div>
          <div>
            <div class="hero-num">{{ policy.policy_number }}</div>
            <h1 class="hero-title">{{ policy.product?.name }}</h1>
            <div class="hero-dates">
              <mat-icon>calendar_today</mat-icon>
              {{ policy.start_date | date:'d MMM y' }} — {{ policy.end_date | date:'d MMM y' }}
            </div>
          </div>
        </div>
        <div class="hero-status" [style.background]="getStatusBg()">
          {{ policy.status_display }}
        </div>
      </div>

      <!-- Layout -->
      <div class="detail-grid">

        <!-- Main column -->
        <div class="main-col">

          <!-- KPI cards -->
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-label">Suma ubezpieczenia</div>
              <div class="kpi-value indigo">
                {{ policy.coverage_amount | currency:'PLN':'symbol':'1.0-0':'pl' }}
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Składka miesięczna</div>
              <div class="kpi-value teal">
                {{ policy.premium_monthly | currency:'PLN':'symbol':'1.2-2':'pl' }}
              </div>
            </div>
            <div class="kpi-card" *ngIf="policy.days_to_expiry !== null">
              <div class="kpi-label">Dni do wygaśnięcia</div>
              <div class="kpi-value" [class.amber]="(policy.days_to_expiry ?? 999) <= 30"
                   [class.indigo]="(policy.days_to_expiry ?? 999) > 30">
                {{ policy.days_to_expiry }}
              </div>
            </div>
          </div>

          <!-- Expiry bar -->
          <div class="section-card" *ngIf="policy.status === 'active' && policy.days_to_expiry !== null">
            <div class="expiry-header">
              <span class="section-label">
                <mat-icon>schedule</mat-icon> Czas obowiązywania
              </span>
              <span class="expiry-badge" [class.warn]="(policy.days_to_expiry ?? 999) <= 30">
                {{ policy.days_to_expiry }} dni
              </span>
            </div>
            <div class="expiry-track">
              <div class="expiry-fill"
                   [style.width]="getExpiryProgress() + '%'"
                   [class.warn]="(policy.days_to_expiry ?? 999) <= 30"></div>
            </div>
            <div class="expiry-foot">
              <span>Wygasa: {{ policy.end_date | date:'d MMMM y' }}</span>
            </div>
          </div>

          <!-- Coverage -->
          <div class="section-card" *ngIf="getCoverageItems().length > 0">
            <div class="section-title-row">
              <mat-icon>verified_user</mat-icon>
              <span>Zakres ochrony</span>
            </div>
            <div class="coverage-grid">
              <div *ngFor="let item of getCoverageItems()" class="coverage-item"
                   [class.covered]="item.value" [class.uncovered]="!item.value">
                <mat-icon>{{ item.value ? 'check_circle' : 'cancel' }}</mat-icon>
                <span>{{ item.key }}</span>
              </div>
            </div>
          </div>

          <!-- Insured object -->
          <div class="section-card" *ngIf="hasInsuredObject()">
            <div class="section-title-row">
              <mat-icon>info</mat-icon>
              <span>Ubezpieczony obiekt</span>
            </div>
            <div class="info-grid">
              <div *ngFor="let item of getInsuredObjectItems()" class="info-row">
                <span class="info-key">{{ item.key }}</span>
                <span class="info-val">{{ item.value }}</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="section-card" *ngIf="policy.notes">
            <div class="section-title-row">
              <mat-icon>note</mat-icon>
              <span>Uwagi</span>
            </div>
            <p class="notes-text">{{ policy.notes }}</p>
          </div>

          <!-- Documents -->
          <div class="section-card">
            <div class="section-title-row">
              <mat-icon>folder</mat-icon>
              <span>Dokumenty polisy</span>
            </div>
            <div *ngIf="!policy.documents?.length" class="empty-docs">
              <mat-icon>folder_open</mat-icon>
              <p>Brak dokumentów</p>
            </div>
            <div *ngFor="let doc of policy.documents" class="doc-row">
              <div class="doc-icon"><mat-icon>picture_as_pdf</mat-icon></div>
              <div class="doc-info">
                <div class="doc-title">{{ doc.title }}</div>
                <div class="doc-meta">{{ doc.document_type_display }} · {{ doc.uploaded_at | date:'d MMM y' }}</div>
              </div>
              <a class="doc-dl" [href]="doc.file" target="_blank">
                <mat-icon>download</mat-icon>
              </a>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar-col">

          <!-- Policy info -->
          <div class="section-card">
            <div class="section-title-row">
              <mat-icon>badge</mat-icon>
              <span>Informacje</span>
            </div>
            <div class="info-list">
              <div class="info-row">
                <span class="info-key">Kategoria</span>
                <span class="info-val">{{ policy.product?.category_display }}</span>
              </div>
              <div class="info-row" *ngIf="policy.assigned_agent">
                <span class="info-key">Opiekun</span>
                <span class="info-val">{{ policy.assigned_agent?.full_name }}</span>
              </div>
            </div>
          </div>

          <!-- Agent: change status -->
          <div class="section-card" *ngIf="auth.isAgent">
            <div class="section-title-row">
              <mat-icon>manage_accounts</mat-icon>
              <span>Zarządzanie polisą</span>
            </div>
            <div class="field-group">
              <label class="field-label">Zmień status</label>
              <div class="select-wrap">
                <mat-icon class="select-icon">swap_horiz</mat-icon>
                <select [formControl]="newStatusCtrl" class="custom-select">
                  <option value="">— Wybierz status —</option>
                  <option value="pending">Oczekująca</option>
                  <option value="active">Aktywna</option>
                  <option value="suspended">Zawieszona</option>
                  <option value="cancelled">Anulowana</option>
                  <option value="expired">Wygasła</option>
                </select>
                <mat-icon class="select-arrow">expand_more</mat-icon>
              </div>
            </div>
            <button class="btn-change" (click)="changeStatus()"
                    [disabled]="!newStatusCtrl.value || statusLoading">
              <mat-spinner *ngIf="statusLoading" diameter="16"></mat-spinner>
              <mat-icon *ngIf="!statusLoading">save</mat-icon>
              <span>Zmień status</span>
            </button>
          </div>

          <!-- Agent: customer info -->
          <div class="section-card" *ngIf="auth.isAgent && policy.customer">
            <div class="section-title-row">
              <mat-icon>person</mat-icon>
              <span>Klient</span>
            </div>
            <div class="info-list">
              <div class="info-row">
                <span class="info-key">Imię i nazwisko</span>
                <span class="info-val">{{ policy.customer?.full_name }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Email</span>
                <span class="info-val">{{ policy.customer?.email }}</span>
              </div>
            </div>
          </div>

          <!-- Customer: report claim -->
          <div class="section-card cta-card" *ngIf="policy.status === 'active' && !auth.isAgent">
            <div class="cta-icon">
              <mat-icon>report_problem</mat-icon>
            </div>
            <strong>Masz szkodę?</strong>
            <p>Zgłoś zdarzenie do tej polisy szybko i wygodnie.</p>
            <a class="btn-claim" [routerLink]="['/claims/new']"
               [queryParams]="{ policyId: policy.id }">
              <mat-icon>add</mat-icon> Zgłoś szkodę
            </a>
          </div>

        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-page">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-wrapper { max-width: 1200px; margin: 0 auto; }

    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text-muted); text-decoration: none;
      margin-bottom: 16px; transition: color .15s;
    }
    .back-link:hover { color: #4f46e5; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Hero */
    .hero-banner {
      border-radius: 18px; padding: 28px 32px;
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; gap: 16px;
    }
    .hero-left { display: flex; align-items: center; gap: 20px; }
    .hero-icon-wrap {
      width: 64px; height: 64px; border-radius: 16px;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .hero-icon { font-size: 36px; width: 36px; height: 36px; color: white; }
    .hero-num { font-size: 12px; color: rgba(255,255,255,.65); font-weight: 600; margin-bottom: 4px; }
    .hero-title { font-size: 22px; font-weight: 800; color: white; margin: 0 0 8px; }
    .hero-dates {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: rgba(255,255,255,.75);
    }
    .hero-dates mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .hero-status {
      font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 20px;
      color: white; white-space: nowrap; flex-shrink: 0;
    }

    /* Layout */
    .detail-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }

    /* Section card */
    .section-card {
      background: white; border-radius: 14px; padding: 20px;
      border: 1px solid var(--border); box-shadow: var(--shadow-sm);
      margin-bottom: 16px;
    }
    .section-card:last-child { margin-bottom: 0; }
    .section-title-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 700; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: .05em;
      margin-bottom: 16px;
    }
    .section-title-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #4f46e5; }

    /* KPI */
    .kpi-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 16px; }
    .kpi-card {
      background: white; border-radius: 12px; padding: 16px;
      border: 1px solid var(--border); box-shadow: var(--shadow-sm);
    }
    .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; }
    .kpi-value { font-size: 20px; font-weight: 800; }
    .kpi-value.indigo { color: #4f46e5; }
    .kpi-value.teal { color: #0e7490; }
    .kpi-value.amber { color: #d97706; }

    /* Expiry bar */
    .expiry-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .section-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 700; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: .05em;
    }
    .section-label mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .expiry-badge {
      font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 20px;
      background: rgba(79,70,229,.1); color: #4f46e5;
    }
    .expiry-badge.warn { background: rgba(245,158,11,.1); color: #d97706; }
    .expiry-track { height: 6px; background: var(--surface-3); border-radius: 99px; overflow: hidden; }
    .expiry-fill { height: 100%; background: linear-gradient(90deg,#4f46e5,#06b6d4); border-radius: 99px; transition: width .3s; }
    .expiry-fill.warn { background: linear-gradient(90deg,#f59e0b,#ef4444); }
    .expiry-foot { margin-top: 6px; font-size: 11px; color: var(--text-muted); }

    /* Coverage */
    .coverage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .coverage-item { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 4px 0; }
    .coverage-item mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .covered mat-icon { color: #10b981; }
    .uncovered { color: var(--text-muted); }
    .uncovered mat-icon { color: #cbd5e1; }

    /* Info grid */
    .info-grid { display: flex; flex-direction: column; gap: 0; }
    .info-list { display: flex; flex-direction: column; gap: 0; }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    .info-row:last-child { border-bottom: none; }
    .info-key { color: var(--text-muted); font-size: 12px; }
    .info-val { font-weight: 600; }

    /* Notes */
    .notes-text { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

    /* Documents */
    .empty-docs { text-align: center; padding: 24px; color: var(--text-muted); }
    .empty-docs mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .25; display: block; margin: 0 auto 8px; }
    .doc-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .doc-row:last-child { border-bottom: none; }
    .doc-icon {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: rgba(239,68,68,.1); display: flex; align-items: center; justify-content: center;
    }
    .doc-icon mat-icon { color: #ef4444; font-size: 20px; }
    .doc-info { flex: 1; }
    .doc-title { font-size: 13px; font-weight: 600; }
    .doc-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
    .doc-dl {
      width: 32px; height: 32px; border-radius: 8px;
      background: var(--surface-3); display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); text-decoration: none; transition: all .15s;
    }
    .doc-dl:hover { background: #4f46e5; color: white; }
    .doc-dl mat-icon { font-size: 18px; }

    /* Sidebar: select */
    .field-group { margin-bottom: 12px; }
    .field-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px; }
    .select-wrap {
      display: flex; align-items: center;
      border: 1.5px solid var(--border); border-radius: 10px;
      background: var(--surface-2); overflow: hidden;
      transition: border-color .2s;
    }
    .select-wrap:focus-within { border-color: #4f46e5; background: white; }
    .select-icon { color: var(--text-muted); margin: 0 8px; font-size: 16px; flex-shrink: 0; }
    .select-arrow { color: var(--text-muted); margin: 0 8px; font-size: 16px; flex-shrink: 0; pointer-events: none; }
    .custom-select {
      flex: 1; border: none; background: none; padding: 10px 4px;
      font-size: 13px; color: var(--text-primary); outline: none;
      font-family: inherit; cursor: pointer; appearance: none;
    }
    .btn-change {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: linear-gradient(135deg,#4f46e5,#06b6d4); color: white;
      border: none; border-radius: 10px; padding: 10px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 12px rgba(79,70,229,.25); transition: all .2s;
    }
    .btn-change:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,.35); }
    .btn-change:disabled { opacity: .5; cursor: not-allowed; }
    .btn-change mat-icon { font-size: 16px; }

    /* CTA card */
    .cta-card { text-align: center; }
    .cta-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(239,68,68,.1); display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
    }
    .cta-icon mat-icon { color: #ef4444; font-size: 28px; }
    .cta-card strong { font-size: 15px; display: block; margin-bottom: 6px; }
    .cta-card p { font-size: 12px; color: var(--text-muted); margin: 0 0 14px; }
    .btn-claim {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg,#b91c1c,#ef4444); color: white;
      text-decoration: none; border-radius: 10px; padding: 10px 18px;
      font-size: 13px; font-weight: 700;
      box-shadow: 0 4px 12px rgba(239,68,68,.3); transition: all .2s;
    }
    .btn-claim:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(239,68,68,.4); }
    .btn-claim mat-icon { font-size: 16px; }

    .loading-page { display: flex; justify-content: center; padding: 100px; }

    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
    @media (max-width: 600px) { .kpi-row { grid-template-columns: 1fr 1fr; } }
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

  getCategoryGradient(): string {
    const gradients: Record<string, string> = {
      auto: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
      property: 'linear-gradient(135deg,#047857,#10b981)',
      health: 'linear-gradient(135deg,#b91c1c,#ef4444)',
      life: 'linear-gradient(135deg,#6d28d9,#a855f7)',
      travel: 'linear-gradient(135deg,#0e7490,#06b6d4)',
      liability: 'linear-gradient(135deg,#c2410c,#f97316)',
    };
    const cat = (this.policy?.product as any)?.category || '';
    return gradients[cat] || 'linear-gradient(135deg,#4f46e5,#06b6d4)';
  }

  getStatusBg(): string {
    const colors: Record<string, string> = {
      active: 'rgba(16,185,129,.3)', pending: 'rgba(99,102,241,.3)',
      expired: 'rgba(100,116,139,.3)', cancelled: 'rgba(239,68,68,.3)',
      suspended: 'rgba(245,158,11,.3)',
    };
    return colors[this.policy?.status || ''] || 'rgba(0,0,0,.2)';
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
      hospitalization: 'Hospitalizacja', death: 'Śmierć',
      permanent_disability: 'Trwała inwalidztwo', critical_illness: 'Ciężka choroba',
      savings_component: 'Składnik oszczędnościowy', medical_costs: 'Koszty leczenia',
      evacuation: 'Ewakuacja', baggage: 'Bagaż',
      trip_cancellation: 'Rezygnacja z podróży', flight_delay: 'Opóźnienie lotu',
      personal_accident: 'NNW', third_party_liability: 'OC',
      temporary_accommodation: 'Zakwaterowanie zastępcze',
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
