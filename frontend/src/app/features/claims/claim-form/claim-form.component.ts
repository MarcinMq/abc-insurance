import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PolicyService } from '../../../core/services/policy.service';
import { ClaimService } from '../../../core/services/claim.service';
import { Policy } from '../../../shared/models/policy.model';

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, FormsModule,
    MatIconModule, MatProgressSpinnerModule, MatCheckboxModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-wrapper animate-fade-up">

      <!-- Header -->
      <div class="page-top">
        <a class="back-link" routerLink="/claims">
          <mat-icon>arrow_back</mat-icon>
          <span>Powrót do listy szkód</span>
        </a>
        <div>
          <h1 class="page-title">Zgłoś szkodę</h1>
          <p class="page-sub">Wypełnij formularz, aby zgłosić zdarzenie do ubezpieczenia</p>
        </div>
      </div>

      <!-- Step indicator -->
      <div class="step-bar">
        <div *ngFor="let s of steps; let i = index" class="step-item"
             [class.active]="i === currentStep" [class.done]="i < currentStep">
          <div class="step-circle">
            <mat-icon *ngIf="i < currentStep">check</mat-icon>
            <span *ngIf="i >= currentStep">{{ i + 1 }}</span>
          </div>
          <span class="step-label">{{ s }}</span>
          <div *ngIf="i < steps.length - 1" class="step-line" [class.done]="i < currentStep"></div>
        </div>
      </div>

      <!-- Form card -->
      <div class="form-card">

        <!-- Step 1: Policy -->
        <div *ngIf="currentStep === 0" class="step-body">
          <div class="step-heading">
            <div class="step-icon-wrap" style="background:linear-gradient(135deg,#4f46e5,#818cf8)">
              <mat-icon>policy</mat-icon>
            </div>
            <div>
              <h2>Wybierz polisę</h2>
              <p>Wskaż polisę, której dotyczy zdarzenie</p>
            </div>
          </div>

          <form [formGroup]="policyForm">
            <div class="field-group">
              <label class="field-label">Polisa ubezpieczeniowa</label>
              <div class="select-wrap" [class.field-error]="policyForm.get('policy')?.invalid && policyForm.get('policy')?.touched">
                <mat-icon class="select-icon">shield</mat-icon>
                <select formControlName="policy" class="custom-select">
                  <option value="">— Wybierz polisę —</option>
                  <option *ngFor="let p of activePolicies" [value]="p.id">
                    {{ p.policy_number }} — {{ p.product?.name || p.product_name }}
                    (do {{ p.end_date | date:'d MMM y' }})
                  </option>
                </select>
                <mat-icon class="select-arrow">expand_more</mat-icon>
              </div>
              <span class="field-hint" *ngIf="policyForm.get('policy')?.invalid && policyForm.get('policy')?.touched">
                Wybierz polisę
              </span>
            </div>

            <div *ngIf="activePolicies.length === 0 && !loadingPolicies" class="alert-box">
              <mat-icon>warning_amber</mat-icon>
              <div>
                <strong>Brak aktywnych polis</strong>
                <p>Nie masz aktywnych polis. <a routerLink="/policies">Sprawdź swoje polisy.</a></p>
              </div>
            </div>

            <div class="step-actions">
              <button class="btn-next" (click)="nextStep()" [disabled]="policyForm.invalid">
                Dalej →
              </button>
            </div>
          </form>
        </div>

        <!-- Step 2: Incident details -->
        <div *ngIf="currentStep === 1" class="step-body">
          <div class="step-heading">
            <div class="step-icon-wrap" style="background:linear-gradient(135deg,#0e7490,#06b6d4)">
              <mat-icon>event_note</mat-icon>
            </div>
            <div>
              <h2>Opis zdarzenia</h2>
              <p>Podaj szczegóły dotyczące zdarzenia</p>
            </div>
          </div>

          <form [formGroup]="incidentForm">
            <div class="form-grid">

              <div class="field-group">
                <label class="field-label">Typ zdarzenia</label>
                <div class="select-wrap" [class.field-error]="incidentForm.get('incident_type')?.invalid && incidentForm.get('incident_type')?.touched">
                  <mat-icon class="select-icon">category</mat-icon>
                  <select formControlName="incident_type" class="custom-select">
                    <option value="">— Wybierz typ —</option>
                    <option value="accident">Wypadek</option>
                    <option value="theft">Kradzież</option>
                    <option value="fire">Pożar</option>
                    <option value="flood">Powódź</option>
                    <option value="vandalism">Wandalizm</option>
                    <option value="illness">Choroba</option>
                    <option value="injury">Uraz</option>
                    <option value="natural_disaster">Klęska żywiołowa</option>
                    <option value="other">Inne</option>
                  </select>
                  <mat-icon class="select-arrow">expand_more</mat-icon>
                </div>
                <span class="field-hint error" *ngIf="incidentForm.get('incident_type')?.invalid && incidentForm.get('incident_type')?.touched">
                  Wybierz typ zdarzenia
                </span>
              </div>

              <div class="field-group">
                <label class="field-label">Data zdarzenia</label>
                <div class="input-wrap" [class.field-error]="incidentForm.get('incident_date')?.invalid && incidentForm.get('incident_date')?.touched">
                  <mat-icon class="input-icon">calendar_today</mat-icon>
                  <input type="date" formControlName="incident_date"
                         [max]="todayStr" class="field-input" />
                </div>
                <span class="field-hint error" *ngIf="incidentForm.get('incident_date')?.invalid && incidentForm.get('incident_date')?.touched">
                  Podaj datę zdarzenia
                </span>
              </div>

              <div class="field-group full-width">
                <label class="field-label">Miejsce zdarzenia</label>
                <div class="input-wrap" [class.field-error]="incidentForm.get('incident_location')?.invalid && incidentForm.get('incident_location')?.touched">
                  <mat-icon class="input-icon">location_on</mat-icon>
                  <input type="text" formControlName="incident_location" class="field-input"
                         placeholder="np. ul. Marszałkowska 1, Warszawa" />
                </div>
                <span class="field-hint error" *ngIf="incidentForm.get('incident_location')?.invalid && incidentForm.get('incident_location')?.touched">
                  Podaj miejsce zdarzenia
                </span>
              </div>

              <div class="field-group full-width">
                <label class="field-label">Szczegółowy opis zdarzenia</label>
                <div class="input-wrap textarea-wrap" [class.field-error]="incidentForm.get('description')?.invalid && incidentForm.get('description')?.touched">
                  <textarea formControlName="description" class="field-textarea"
                            rows="5" placeholder="Opisz dokładnie co się wydarzyło..."></textarea>
                </div>
                <div class="field-hint-row">
                  <span class="field-hint error" *ngIf="incidentForm.get('description')?.invalid && incidentForm.get('description')?.touched">
                    Opis musi mieć co najmniej 50 znaków
                  </span>
                  <span class="char-count" [class.count-warn]="(incidentForm.get('description')?.value?.length || 0) < 50">
                    {{ incidentForm.get('description')?.value?.length || 0 }} / 50 min.
                  </span>
                </div>
              </div>

              <div class="field-group full-width">
                <label class="field-label">Szacowana wartość szkody (PLN)</label>
                <div class="input-wrap" [class.field-error]="incidentForm.get('estimated_damage')?.invalid && incidentForm.get('estimated_damage')?.touched">
                  <mat-icon class="input-icon">monetization_on</mat-icon>
                  <input type="number" formControlName="estimated_damage" class="field-input"
                         placeholder="0.00" min="1" />
                  <span class="input-suffix">PLN</span>
                </div>
                <span class="field-hint error" *ngIf="incidentForm.get('estimated_damage')?.invalid && incidentForm.get('estimated_damage')?.touched">
                  Podaj szacowaną wartość szkody
                </span>
              </div>

            </div>

            <div class="step-actions">
              <button class="btn-back" (click)="prevStep()">
                <mat-icon>arrow_back</mat-icon> Wstecz
              </button>
              <button class="btn-next" (click)="nextStep()" [disabled]="incidentForm.invalid">
                Dalej →
              </button>
            </div>
          </form>
        </div>

        <!-- Step 3: Summary -->
        <div *ngIf="currentStep === 2" class="step-body">
          <div class="step-heading">
            <div class="step-icon-wrap" style="background:linear-gradient(135deg,#047857,#10b981)">
              <mat-icon>fact_check</mat-icon>
            </div>
            <div>
              <h2>Potwierdzenie</h2>
              <p>Sprawdź dane przed wysłaniem</p>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-row">
              <span class="summary-label"><mat-icon>shield</mat-icon> Polisa</span>
              <strong>{{ getSelectedPolicyNumber() }}</strong>
            </div>
            <div class="summary-row">
              <span class="summary-label"><mat-icon>category</mat-icon> Typ zdarzenia</span>
              <strong>{{ getIncidentTypeLabel() }}</strong>
            </div>
            <div class="summary-row">
              <span class="summary-label"><mat-icon>calendar_today</mat-icon> Data zdarzenia</span>
              <strong>{{ incidentForm.get('incident_date')?.value | date:'d MMMM y' }}</strong>
            </div>
            <div class="summary-row">
              <span class="summary-label"><mat-icon>location_on</mat-icon> Miejsce</span>
              <strong>{{ incidentForm.get('incident_location')?.value }}</strong>
            </div>
            <div class="summary-row">
              <span class="summary-label"><mat-icon>monetization_on</mat-icon> Szacowana szkoda</span>
              <strong class="amount-big">
                {{ incidentForm.get('estimated_damage')?.value | currency:'PLN':'symbol':'1.2-2':'pl' }}
              </strong>
            </div>
          </div>

          <div class="submit-option">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="submitImmediately" class="checkbox-input" />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Wyślij od razu do rozpatrzenia</span>
            </label>
            <p class="option-hint">
              Jeśli nie zaznaczysz, szkoda zostanie zapisana jako szkic — będziesz mógł ją edytować i wysłać później.
            </p>
          </div>

          <div class="step-actions">
            <button class="btn-back" (click)="prevStep()">
              <mat-icon>arrow_back</mat-icon> Wstecz
            </button>
            <button class="btn-submit" (click)="onSubmit()" [disabled]="loading">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <mat-icon *ngIf="!loading">send</mat-icon>
              <span>{{ submitImmediately ? 'Zgłoś szkodę' : 'Zapisz szkic' }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { max-width: 760px; margin: 0 auto; }
    .page-top { margin-bottom: 24px; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text-muted); text-decoration: none;
      margin-bottom: 12px; transition: color .15s;
    }
    .back-link:hover { color: #4f46e5; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .page-title { font-size: 26px; font-weight: 800; letter-spacing: -.02em; margin: 0; }
    .page-sub { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

    /* Step bar */
    .step-bar {
      display: flex; align-items: center; margin-bottom: 24px;
      background: white; border-radius: 14px; padding: 20px 24px;
      border: 1px solid var(--border); box-shadow: var(--shadow-sm);
    }
    .step-item { display: flex; align-items: center; flex: 1; }
    .step-item:last-child { flex: 0; }
    .step-circle {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
      background: var(--surface-3); color: var(--text-muted);
      border: 2px solid var(--border); transition: all .2s;
    }
    .step-circle mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .step-item.active .step-circle { background: #4f46e5; color: white; border-color: #4f46e5; }
    .step-item.done .step-circle { background: #10b981; color: white; border-color: #10b981; }
    .step-label { font-size: 12px; font-weight: 600; margin-left: 8px; color: var(--text-muted); white-space: nowrap; }
    .step-item.active .step-label { color: #4f46e5; }
    .step-item.done .step-label { color: #10b981; }
    .step-line { flex: 1; height: 2px; background: var(--border); margin: 0 12px; transition: background .2s; }
    .step-line.done { background: #10b981; }

    /* Form card */
    .form-card {
      background: white; border-radius: 18px;
      border: 1px solid var(--border); box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .step-body { padding: 32px; }

    /* Step heading */
    .step-heading { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .step-icon-wrap {
      width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .step-icon-wrap mat-icon { color: white; font-size: 24px; }
    .step-heading h2 { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
    .step-heading p { font-size: 13px; color: var(--text-muted); margin: 0; }

    /* Form grid */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }

    /* Field */
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 600; color: #374151; }

    /* Input wrap */
    .input-wrap {
      display: flex; align-items: center;
      border: 1.5px solid var(--border); border-radius: 10px;
      background: var(--surface-2); overflow: hidden;
      transition: border-color .2s, box-shadow .2s;
    }
    .input-wrap:focus-within {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,.1);
      background: white;
    }
    .input-wrap.field-error { border-color: #ef4444; }
    .input-icon { color: var(--text-muted); margin: 0 10px; font-size: 18px; flex-shrink: 0; }
    .field-input {
      flex: 1; border: none; background: none; padding: 12px 4px;
      font-size: 14px; color: var(--text-primary); outline: none;
      font-family: inherit;
    }
    .field-input[type="date"] { padding: 11px 4px; cursor: pointer; }
    .input-suffix { padding: 0 12px; font-size: 13px; font-weight: 600; color: var(--text-muted); }
    .textarea-wrap { align-items: flex-start; }
    .field-textarea {
      flex: 1; border: none; background: none; padding: 12px;
      font-size: 14px; color: var(--text-primary); outline: none;
      font-family: inherit; resize: vertical; min-height: 100px;
    }

    /* Select wrap */
    .select-wrap {
      display: flex; align-items: center; position: relative;
      border: 1.5px solid var(--border); border-radius: 10px;
      background: var(--surface-2); overflow: hidden;
      transition: border-color .2s, box-shadow .2s;
    }
    .select-wrap:focus-within {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,.1);
      background: white;
    }
    .select-wrap.field-error { border-color: #ef4444; }
    .select-icon { color: var(--text-muted); margin: 0 10px; font-size: 18px; flex-shrink: 0; }
    .select-arrow { color: var(--text-muted); margin: 0 10px; font-size: 18px; flex-shrink: 0; pointer-events: none; }
    .custom-select {
      flex: 1; border: none; background: none; padding: 12px 4px;
      font-size: 14px; color: var(--text-primary); outline: none;
      font-family: inherit; cursor: pointer; appearance: none;
    }

    /* Hints */
    .field-hint { font-size: 11px; color: var(--text-muted); }
    .field-hint.error { color: #ef4444; }
    .field-hint-row { display: flex; justify-content: space-between; align-items: center; }
    .char-count { font-size: 11px; color: var(--text-muted); }
    .count-warn { color: #f59e0b; font-weight: 600; }

    /* Alert */
    .alert-box {
      display: flex; align-items: flex-start; gap: 12px;
      background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px;
      padding: 14px 16px; color: #c2410c; margin-bottom: 16px;
    }
    .alert-box mat-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
    .alert-box strong { display: block; font-size: 14px; margin-bottom: 2px; }
    .alert-box p { margin: 0; font-size: 13px; }
    .alert-box a { color: #9a3412; font-weight: 600; }

    /* Summary */
    .summary-card {
      background: var(--surface-2); border-radius: 12px;
      border: 1px solid var(--border); margin-bottom: 20px; overflow: hidden;
    }
    .summary-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--border);
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--text-muted);
    }
    .summary-label mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .summary-row strong { font-size: 14px; font-weight: 600; }
    .amount-big { font-size: 16px; color: #4f46e5; }

    /* Submit option */
    .submit-option {
      background: var(--surface-2); border-radius: 12px;
      border: 1px solid var(--border); padding: 16px; margin-bottom: 24px;
    }
    .checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .checkbox-input { display: none; }
    .checkbox-custom {
      width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
      border: 2px solid var(--border); background: white;
      transition: all .15s; position: relative;
    }
    .checkbox-input:checked + .checkbox-custom {
      background: #4f46e5; border-color: #4f46e5;
    }
    .checkbox-input:checked + .checkbox-custom::after {
      content: ''; position: absolute; left: 4px; top: 1px;
      width: 6px; height: 10px; border: 2px solid white;
      border-top: none; border-left: none; transform: rotate(45deg);
    }
    .checkbox-text { font-size: 14px; font-weight: 600; }
    .option-hint { margin: 8px 0 0 28px; font-size: 12px; color: var(--text-muted); }

    /* Actions */
    .step-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 24px; }
    .btn-next {
      display: flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white;
      border: none; border-radius: 10px; padding: 10px 22px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 12px rgba(79,70,229,.3); transition: all .2s;
    }
    .btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,.4); }
    .btn-next:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .btn-next mat-icon { font-size: 18px; }
    .btn-back {
      display: flex; align-items: center; gap: 6px;
      background: none; border: 1.5px solid var(--border); border-radius: 10px;
      padding: 10px 18px; font-size: 14px; font-weight: 600;
      color: var(--text-secondary); cursor: pointer; transition: all .15s;
    }
    .btn-back:hover { border-color: #4f46e5; color: #4f46e5; }
    .btn-back mat-icon { font-size: 18px; }
    .btn-submit {
      display: flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, #047857, #10b981); color: white;
      border: none; border-radius: 10px; padding: 10px 24px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 12px rgba(16,185,129,.3); transition: all .2s;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16,185,129,.4); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .btn-submit mat-icon { font-size: 18px; }

    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .step-body { padding: 20px; }
      .step-label { display: none; }
    }
  `],
})
export class ClaimFormComponent implements OnInit {
  policyForm: FormGroup;
  incidentForm: FormGroup;
  activePolicies: Policy[] = [];
  loadingPolicies = false;
  loading = false;
  submitImmediately = true;
  currentStep = 0;
  todayStr = new Date().toISOString().split('T')[0];

  steps = ['Wybór polisy', 'Opis zdarzenia', 'Potwierdzenie'];

  incidentTypeLabels: Record<string, string> = {
    accident: 'Wypadek', theft: 'Kradzież', fire: 'Pożar', flood: 'Powódź',
    vandalism: 'Wandalizm', illness: 'Choroba', injury: 'Uraz',
    natural_disaster: 'Klęska żywiołowa', other: 'Inne',
  };

  constructor(
    private fb: FormBuilder,
    private policyService: PolicyService,
    private claimService: ClaimService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.policyForm = this.fb.group({ policy: ['', Validators.required] });
    this.incidentForm = this.fb.group({
      incident_type: ['', Validators.required],
      incident_date: ['', Validators.required],
      incident_location: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(50)]],
      estimated_damage: ['', [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.loadingPolicies = true;
    this.policyService.getPolicies({ status: 'active' }).subscribe({
      next: (res) => { this.activePolicies = res.results; this.loadingPolicies = false; },
      error: () => { this.loadingPolicies = false; },
    });
  }

  nextStep(): void {
    if (this.currentStep === 0 && this.policyForm.invalid) {
      this.policyForm.markAllAsTouched();
      return;
    }
    if (this.currentStep === 1 && this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      return;
    }
    this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  getSelectedPolicyNumber(): string {
    const id = Number(this.policyForm.get('policy')?.value);
    return this.activePolicies.find((p) => p.id === id)?.policy_number || '';
  }

  getIncidentTypeLabel(): string {
    const type = this.incidentForm.get('incident_type')?.value;
    return this.incidentTypeLabels[type] || type;
  }

  onSubmit(): void {
    this.loading = true;
    const data = {
      ...this.policyForm.value,
      ...this.incidentForm.value,
      submit: this.submitImmediately,
    };
    this.claimService.createClaim(data).subscribe({
      next: (claim) => {
        this.loading = false;
        const msg = this.submitImmediately ? 'Szkoda zgłoszona pomyślnie!' : 'Szkoda zapisana jako szkic.';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
        this.router.navigate(['/claims', claim.id]);
      },
      error: (err) => {
        this.loading = false;
        const errors = Object.values(err.error || {}).flat().join(' ');
        this.snackBar.open(errors || 'Błąd zgłoszenia szkody.', 'OK', { duration: 4000 });
      },
    });
  }
}
