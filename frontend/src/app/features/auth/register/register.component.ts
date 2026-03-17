import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatStepperModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <div class="header-content">
            <mat-icon class="header-icon">shield</mat-icon>
            <div>
              <mat-card-title>Zarejestruj się w ABC Insurance</mat-card-title>
              <mat-card-subtitle>Załóż konto klienta</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>
        <mat-card-content>
          <mat-stepper linear #stepper>
            <!-- Krok 1: Dane logowania -->
            <mat-step [stepControl]="accountForm" label="Konto">
              <form [formGroup]="accountForm">
                <div class="form-grid">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nazwa użytkownika</mat-label>
                    <input matInput formControlName="username" />
                    <mat-error *ngIf="accountForm.get('username')?.hasError('required')">
                      Wymagane
                    </mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Adres e-mail</mat-label>
                    <input matInput formControlName="email" type="email" />
                    <mat-error *ngIf="accountForm.get('email')?.hasError('email')">
                      Nieprawidłowy email
                    </mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Hasło</mat-label>
                    <input matInput [type]="hidePass ? 'password' : 'text'"
                           formControlName="password" />
                    <button mat-icon-button matSuffix type="button"
                            (click)="hidePass = !hidePass">
                      <mat-icon>{{ hidePass ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    <mat-hint>Minimum 8 znaków</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Potwierdź hasło</mat-label>
                    <input matInput [type]="hidePass ? 'password' : 'text'"
                           formControlName="password_confirm" />
                    <mat-error *ngIf="accountForm.get('password_confirm')?.hasError('mismatch')">
                      Hasła nie są identyczne
                    </mat-error>
                  </mat-form-field>
                </div>
                <div class="step-actions">
                  <button mat-raised-button color="primary" matStepperNext
                          [disabled]="accountForm.invalid">
                    Dalej <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Krok 2: Dane osobowe -->
            <mat-step [stepControl]="personalForm" label="Dane osobowe">
              <form [formGroup]="personalForm">
                <div class="form-grid-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Imię</mat-label>
                    <input matInput formControlName="first_name" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Nazwisko</mat-label>
                    <input matInput formControlName="last_name" />
                  </mat-form-field>
                </div>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Numer telefonu</mat-label>
                  <input matInput formControlName="phone_number" placeholder="+48 123 456 789" />
                  <mat-icon matPrefix>phone</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Adres zamieszkania</mat-label>
                  <textarea matInput formControlName="address" rows="2"></textarea>
                  <mat-icon matPrefix>home</mat-icon>
                </mat-form-field>
                <div class="step-actions">
                  <button mat-button matStepperPrevious>Wstecz</button>
                  <button mat-raised-button color="primary" matStepperNext
                          [disabled]="personalForm.invalid">
                    Dalej <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Krok 3: Potwierdzenie -->
            <mat-step label="Gotowe">
              <div class="summary">
                <p>Sprawdź dane przed rejestracją:</p>
                <div class="summary-item">
                  <span>Login:</span> <strong>{{ accountForm.get('username')?.value }}</strong>
                </div>
                <div class="summary-item">
                  <span>Email:</span> <strong>{{ accountForm.get('email')?.value }}</strong>
                </div>
                <div class="summary-item">
                  <span>Imię i nazwisko:</span>
                  <strong>{{ personalForm.get('first_name')?.value }} {{ personalForm.get('last_name')?.value }}</strong>
                </div>
              </div>
              <div *ngIf="errorMessage" class="error-message">
                <mat-icon>error</mat-icon> {{ errorMessage }}
              </div>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Wstecz</button>
                <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="loading">
                  <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                  <span *ngIf="!loading">Zarejestruj się</span>
                </button>
              </div>
            </mat-step>
          </mat-stepper>
        </mat-card-content>
        <mat-card-actions>
          <span>Masz już konto?</span>
          <a mat-button color="primary" routerLink="/auth/login">Zaloguj się</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container { min-height: 100vh; background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
      display: flex; align-items: center; justify-content: center; padding: 24px; }
    .register-card { width: 100%; max-width: 560px; padding: 16px; }
    .header-content { display: flex; align-items: center; gap: 12px; padding: 8px 0 16px; }
    .header-icon { font-size: 40px; width: 40px; height: 40px; color: #1565C0; }
    .full-width { width: 100%; }
    .form-grid { display: flex; flex-direction: column; gap: 4px; padding-top: 16px; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding-top: 16px; }
    .step-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .summary { padding: 16px 0; }
    .summary-item { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
    .summary-item span { color: #666; min-width: 160px; }
    .error-message { color: #D32F2F; display: flex; align-items: center; gap: 8px;
      background: #FFEBEE; padding: 12px; border-radius: 4px; margin: 12px 0; }
    mat-card-actions { display: flex; align-items: center; justify-content: center; gap: 4px; }
  `],
})
export class RegisterComponent {
  accountForm: FormGroup;
  personalForm: FormGroup;
  loading = false;
  hidePass = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.accountForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        password_confirm: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );

    this.personalForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone_number: [''],
      address: [''],
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('password_confirm')?.value;
    if (pass !== confirm) {
      group.get('password_confirm')?.setErrors({ mismatch: true });
    }
    return null;
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';
    const data = {
      ...this.accountForm.value,
      ...this.personalForm.value,
    };
    this.auth.register(data).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        const errors = err.error;
        this.errorMessage =
          Object.values(errors).flat().join(' ') || 'Błąd rejestracji.';
      },
    });
  }
}
