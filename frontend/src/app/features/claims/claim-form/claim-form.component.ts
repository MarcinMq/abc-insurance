import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { PolicyService } from '../../../core/services/policy.service';
import { ClaimService } from '../../../core/services/claim.service';
import { Policy } from '../../../shared/models/policy.model';

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatCheckboxModule, MatSnackBarModule, MatStepperModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <a mat-button routerLink="/claims">
          <mat-icon>arrow_back</mat-icon> Powrót do listy szkód
        </a>
        <h1>Zgłoś szkodę</h1>
        <p class="subtitle">Wypełnij formularz, aby zgłosić zdarzenie do ubezpieczenia</p>
      </div>

      <mat-card>
        <mat-card-content>
          <mat-stepper linear #stepper orientation="vertical">
            <!-- Krok 1: Wybór polisy -->
            <mat-step [stepControl]="policyForm" label="Wybór polisy">
              <form [formGroup]="policyForm">
                <div class="step-content">
                  <p class="step-hint">Wybierz polisę, do której chcesz zgłosić szkodę.</p>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Polisa</mat-label>
                    <mat-select formControlName="policy">
                      <mat-option *ngFor="let p of activePolicies" [value]="p.id">
                        <span class="policy-option">
                          <strong>{{ p.policy_number }}</strong> —
                          {{ p.product?.name || p.product_name }}
                          (do {{ p.end_date | date:'d MMM y' }})
                        </span>
                      </mat-option>
                    </mat-select>
                    <mat-error>Wybierz polisę</mat-error>
                  </mat-form-field>
                  <div *ngIf="activePolicies.length === 0" class="no-policies">
                    <mat-icon>warning</mat-icon>
                    <p>Nie masz aktywnych polis. <a routerLink="/policies">Sprawdź swoje polisy.</a></p>
                  </div>
                </div>
                <div class="step-actions">
                  <button mat-raised-button color="primary" matStepperNext
                          [disabled]="policyForm.invalid">
                    Dalej <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Krok 2: Opis zdarzenia -->
            <mat-step [stepControl]="incidentForm" label="Opis zdarzenia">
              <form [formGroup]="incidentForm">
                <div class="step-content form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Typ zdarzenia</mat-label>
                    <mat-select formControlName="incident_type">
                      <mat-option value="accident">Wypadek</mat-option>
                      <mat-option value="theft">Kradzież</mat-option>
                      <mat-option value="fire">Pożar</mat-option>
                      <mat-option value="flood">Powódź</mat-option>
                      <mat-option value="vandalism">Wandalizm</mat-option>
                      <mat-option value="illness">Choroba</mat-option>
                      <mat-option value="injury">Uraz</mat-option>
                      <mat-option value="natural_disaster">Klęska żywiołowa</mat-option>
                      <mat-option value="other">Inne</mat-option>
                    </mat-select>
                    <mat-error>Wybierz typ zdarzenia</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Data zdarzenia</mat-label>
                    <input matInput [matDatepicker]="picker"
                           formControlName="incident_date" [max]="today" />
                    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                    <mat-error>Podaj datę zdarzenia</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Miejsce zdarzenia</mat-label>
                    <input matInput formControlName="incident_location"
                           placeholder="np. ul. Marszałkowska 1, Warszawa" />
                    <mat-icon matSuffix>location_on</mat-icon>
                    <mat-error>Podaj miejsce zdarzenia</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Szczegółowy opis zdarzenia</mat-label>
                    <textarea matInput formControlName="description" rows="5"
                              placeholder="Opisz dokładnie co się wydarzyło..."></textarea>
                    <mat-hint align="end">
                      {{ incidentForm.get('description')?.value?.length || 0 }}/50 min.
                    </mat-hint>
                    <mat-error>Opis musi mieć co najmniej 50 znaków</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Szacowana wartość szkody (PLN)</mat-label>
                    <input matInput type="number" formControlName="estimated_damage"
                           min="1" />
                    <mat-icon matSuffix>monetization_on</mat-icon>
                    <mat-error>Podaj szacowaną wartość szkody</mat-error>
                  </mat-form-field>
                </div>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>Wstecz</button>
                  <button mat-raised-button color="primary" matStepperNext
                          [disabled]="incidentForm.invalid">
                    Dalej <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Krok 3: Potwierdzenie -->
            <mat-step label="Potwierdzenie">
              <div class="step-content summary">
                <h3>Sprawdź dane przed wysłaniem</h3>
                <div class="summary-item">
                  <span>Polisa:</span>
                  <strong>{{ getSelectedPolicyNumber() }}</strong>
                </div>
                <div class="summary-item">
                  <span>Typ zdarzenia:</span>
                  <strong>{{ getIncidentTypeLabel() }}</strong>
                </div>
                <div class="summary-item">
                  <span>Data zdarzenia:</span>
                  <strong>{{ incidentForm.get('incident_date')?.value | date:'d MMMM y' }}</strong>
                </div>
                <div class="summary-item">
                  <span>Miejsce:</span>
                  <strong>{{ incidentForm.get('incident_location')?.value }}</strong>
                </div>
                <div class="summary-item">
                  <span>Szacowana szkoda:</span>
                  <strong>{{ incidentForm.get('estimated_damage')?.value | currency:'PLN':'symbol':'1.2-2':'pl' }}</strong>
                </div>

                <div class="submit-options">
                  <mat-checkbox [(ngModel)]="submitImmediately">
                    Wyślij od razu do rozpatrzenia
                  </mat-checkbox>
                  <p class="hint">
                    Jeśli nie zaznaczysz, szkoda zostanie zapisana jako szkic —
                    będziesz mógł ją edytować i wysłać później.
                  </p>
                </div>
              </div>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Wstecz</button>
                <button mat-raised-button color="primary"
                        (click)="onSubmit()" [disabled]="loading">
                  <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                  <mat-icon *ngIf="!loading">send</mat-icon>
                  <span>{{ submitImmediately ? 'Zgłoś szkodę' : 'Zapisz szkic' }}</span>
                </button>
              </div>
            </mat-step>
          </mat-stepper>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 720px; margin: 0 auto; }
    .page-header { margin-bottom: 20px; }
    .page-header h1 { margin: 8px 0 4px; font-size: 24px; font-weight: 700; }
    .subtitle { color: #666; margin: 0; }
    .step-content { padding: 16px 0; }
    .step-hint { color: #666; margin: 0 0 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .step-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
    .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    .summary h3 { margin: 0 0 16px; font-size: 16px; }
    .summary-item { display: flex; gap: 8px; padding: 8px 0;
      border-bottom: 1px solid #e0e0e0; }
    .summary-item span { color: #666; min-width: 160px; }
    .submit-options { margin-top: 20px; }
    .hint { font-size: 12px; color: #666; margin: 8px 0 0; }
    .no-policies { display: flex; align-items: center; gap: 12px;
      background: #FFF3E0; padding: 16px; border-radius: 8px; color: #E65100; }
    .policy-option { font-size: 14px; }
  `],
})
export class ClaimFormComponent implements OnInit {
  policyForm: FormGroup;
  incidentForm: FormGroup;
  activePolicies: Policy[] = [];
  loading = false;
  today = new Date();
  submitImmediately = true;

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
    this.policyService.getPolicies({ status: 'active' }).subscribe((res) => {
      this.activePolicies = res.results;
    });
  }

  getSelectedPolicyNumber(): string {
    const id = this.policyForm.get('policy')?.value;
    return this.activePolicies.find((p) => p.id === id)?.policy_number || '';
  }

  getIncidentTypeLabel(): string {
    const type = this.incidentForm.get('incident_type')?.value;
    return this.incidentTypeLabels[type] || type;
  }

  formatDate(date: Date): string {
    return date ? date.toISOString().split('T')[0] : '';
  }

  onSubmit(): void {
    this.loading = true;
    const dateVal = this.incidentForm.get('incident_date')?.value;
    const data = {
      ...this.policyForm.value,
      ...this.incidentForm.value,
      incident_date: this.formatDate(dateVal),
      submit: this.submitImmediately,
    };
    this.claimService.createClaim(data).subscribe({
      next: (claim) => {
        this.loading = false;
        const msg = this.submitImmediately
          ? 'Szkoda zgłoszona pomyślnie!'
          : 'Szkoda zapisana jako szkic.';
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
