import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="register-page">
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="register-card">
        <!-- Header -->
        <div class="card-header">
          <div class="brand">
            <div class="brand-icon"><mat-icon>shield</mat-icon></div>
            <span>ABC Insurance</span>
          </div>
          <h2>Utwórz konto</h2>
          <p>Dołącz do tysięcy zadowolonych klientów</p>
        </div>

        <!-- Step indicators -->
        <div class="steps-indicator">
          <div *ngFor="let s of steps; let i = index" class="step-dot-wrap">
            <div class="step-dot" [class.active]="currentStep === i" [class.done]="currentStep > i">
              <mat-icon *ngIf="currentStep > i">check</mat-icon>
              <span *ngIf="currentStep <= i">{{ i + 1 }}</span>
            </div>
            <span class="step-label">{{ s }}</span>
          </div>
          <div class="step-line"></div>
        </div>

        <!-- Step 1: Account -->
        <form [formGroup]="accountForm" *ngIf="currentStep === 0" class="step-form">
          <div class="field-row">
            <div class="field-group full">
              <label><mat-icon>person</mat-icon> Nazwa użytkownika</label>
              <input formControlName="username" placeholder="np. jan.kowalski" class="field-input"
                     [class.field-error]="isInvalid(accountForm, 'username')" />
              <span class="err-msg" *ngIf="isInvalid(accountForm, 'username')">
                Minimum 3 znaki
              </span>
            </div>
          </div>
          <div class="field-row">
            <div class="field-group full">
              <label><mat-icon>email</mat-icon> Adres e-mail</label>
              <input formControlName="email" type="email" placeholder="jan@example.com" class="field-input"
                     [class.field-error]="isInvalid(accountForm, 'email')" />
              <span class="err-msg" *ngIf="isInvalid(accountForm, 'email')">
                Podaj prawidłowy adres email
              </span>
            </div>
          </div>
          <div class="field-row two-cols">
            <div class="field-group">
              <label><mat-icon>lock</mat-icon> Hasło</label>
              <div class="pass-wrap">
                <input [type]="hidePass ? 'password' : 'text'" formControlName="password"
                       placeholder="Min. 8 znaków" class="field-input"
                       [class.field-error]="isInvalid(accountForm, 'password')" />
                <button type="button" class="pass-toggle" (click)="hidePass = !hidePass">
                  <mat-icon>{{ hidePass ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>
            <div class="field-group">
              <label><mat-icon>lock_reset</mat-icon> Potwierdź hasło</label>
              <div class="pass-wrap">
                <input [type]="hidePass ? 'password' : 'text'" formControlName="password_confirm"
                       placeholder="Powtórz hasło" class="field-input"
                       [class.field-error]="accountForm.get('password_confirm')?.hasError('mismatch')" />
              </div>
              <span class="err-msg" *ngIf="accountForm.get('password_confirm')?.hasError('mismatch')">
                Hasła nie są identyczne
              </span>
            </div>
          </div>
          <div class="password-strength" *ngIf="accountForm.get('password')?.value">
            <div class="strength-bar">
              <div class="strength-fill" [style.width]="passStrength + '%'"
                   [class]="'str-' + passLevel"></div>
            </div>
            <span class="strength-label">Siła hasła: {{ passLevelLabel }}</span>
          </div>
          <div class="step-actions">
            <button class="btn-next" (click)="nextStep()" [disabled]="accountForm.invalid">
              Dalej →
            </button>
          </div>
        </form>

        <!-- Step 2: Personal data -->
        <form [formGroup]="personalForm" *ngIf="currentStep === 1" class="step-form">
          <div class="field-row two-cols">
            <div class="field-group">
              <label>Imię</label>
              <input formControlName="first_name" placeholder="Jan" class="field-input"
                     [class.field-error]="isInvalid(personalForm, 'first_name')" />
            </div>
            <div class="field-group">
              <label>Nazwisko</label>
              <input formControlName="last_name" placeholder="Kowalski" class="field-input"
                     [class.field-error]="isInvalid(personalForm, 'last_name')" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group full">
              <label>Numer telefonu <span class="optional">(opcjonalnie)</span></label>
              <input formControlName="phone_number" placeholder="+48 123 456 789" class="field-input" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group full">
              <label>Adres zamieszkania <span class="optional">(opcjonalnie)</span></label>
              <textarea formControlName="address" placeholder="ul. Przykładowa 1, 00-000 Warszawa"
                        class="field-input field-textarea" rows="2"></textarea>
            </div>
          </div>
          <div class="step-actions">
            <button class="btn-back" (click)="currentStep = 0">
              <mat-icon>arrow_back</mat-icon> Wstecz
            </button>
            <button class="btn-next" (click)="nextStep()" [disabled]="personalForm.invalid">
              Dalej →
            </button>
          </div>
        </form>

        <!-- Step 3: Summary -->
        <div *ngIf="currentStep === 2" class="step-form">
          <div class="summary-card">
            <div class="summary-row">
              <mat-icon>person</mat-icon>
              <span class="s-label">Użytkownik</span>
              <span class="s-value">{{ accountForm.get('username')?.value }}</span>
            </div>
            <div class="summary-row">
              <mat-icon>email</mat-icon>
              <span class="s-label">Email</span>
              <span class="s-value">{{ accountForm.get('email')?.value }}</span>
            </div>
            <div class="summary-row">
              <mat-icon>badge</mat-icon>
              <span class="s-label">Imię i nazwisko</span>
              <span class="s-value">
                {{ personalForm.get('first_name')?.value }} {{ personalForm.get('last_name')?.value }}
              </span>
            </div>
            <div class="summary-row" *ngIf="personalForm.get('phone_number')?.value">
              <mat-icon>phone</mat-icon>
              <span class="s-label">Telefon</span>
              <span class="s-value">{{ personalForm.get('phone_number')?.value }}</span>
            </div>
          </div>

          <div class="error-box" *ngIf="errorMessage">
            <mat-icon>error_outline</mat-icon> {{ errorMessage }}
          </div>

          <div class="step-actions">
            <button class="btn-back" (click)="currentStep = 1">
              <mat-icon>arrow_back</mat-icon> Wstecz
            </button>
            <button class="btn-submit" (click)="onSubmit()" [disabled]="loading">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <mat-icon *ngIf="!loading">check_circle</mat-icon>
              <span>{{ loading ? 'Rejestracja...' : 'Zarejestruj się' }}</span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="card-footer">
          Masz już konto? <a routerLink="/auth/login">Zaloguj się</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      padding: 24px; position: relative; overflow: hidden;
    }
    .bg-shapes { position: absolute; inset: 0; pointer-events: none; }
    .shape { position: absolute; border-radius: 50%;
      background: linear-gradient(135deg,rgba(129,140,248,.1),rgba(6,182,212,.08)); }
    .shape-1 { width: 500px; height: 500px; top: -200px; left: -200px; animation: float 7s ease-in-out infinite; }
    .shape-2 { width: 300px; height: 300px; bottom: -100px; right: -100px; animation: float 5s ease-in-out infinite 1s; }
    .shape-3 { width: 200px; height: 200px; top: 50%; left: 60%; animation: float 6s ease-in-out infinite 2s; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }

    .register-card {
      width: 100%; max-width: 520px; position: relative; z-index: 1;
      background: white; border-radius: 24px; padding: 36px;
      box-shadow: 0 32px 80px rgba(0,0,0,.4);
    }

    /* Header */
    .card-header { text-align: center; margin-bottom: 28px; }
    .brand { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px;
      font-size: 16px; font-weight: 700; color: #4f46e5; }
    .brand-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg,#4f46e5,#06b6d4);
      display: flex; align-items: center; justify-content: center;
    }
    .brand-icon mat-icon { color: white; font-size: 20px; }
    .card-header h2 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .card-header p { color: #64748b; font-size: 14px; }

    /* Step indicator */
    .steps-indicator {
      display: flex; justify-content: center; align-items: center;
      gap: 8px; margin-bottom: 28px; position: relative;
    }
    .step-dot-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 1; }
    .step-dot {
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid #e2e8f0;
      background: white; display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #94a3b8; transition: all .3s;
    }
    .step-dot.active { border-color: #4f46e5; color: #4f46e5; background: #eef2ff; }
    .step-dot.done { background: #4f46e5; border-color: #4f46e5; color: white; }
    .step-dot mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .step-label { font-size: 10px; color: #94a3b8; font-weight: 600; white-space: nowrap; }
    .step-line {
      position: absolute; top: 16px; left: 15%; right: 15%; height: 2px;
      background: #e2e8f0; z-index: 0;
    }

    /* Form fields */
    .step-form { animation: fadeIn .25s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    .field-row { margin-bottom: 14px; }
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field-group { display: flex; flex-direction: column; gap: 5px; }
    .field-group.full { grid-column: 1 / -1; }
    .field-group label {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 600; color: #374151;
    }
    .field-group label mat-icon { font-size: 14px; width: 14px; height: 14px; color: #6366f1; }
    .optional { color: #94a3b8; font-weight: 400; }

    .field-input {
      width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0;
      border-radius: 10px; font-size: 14px; font-family: inherit;
      color: #0f172a; background: #f8fafc; outline: none;
      transition: border-color .2s, box-shadow .2s;
    }
    .field-input:focus {
      border-color: #4f46e5; background: white;
      box-shadow: 0 0 0 3px rgba(79,70,229,.1);
    }
    .field-input.field-error { border-color: #ef4444; }
    .field-textarea { resize: none; }

    .pass-wrap { position: relative; }
    .pass-wrap .field-input { padding-right: 40px; }
    .pass-toggle {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #94a3b8;
      display: flex; align-items: center;
    }
    .pass-toggle:hover { color: #4f46e5; }
    .err-msg { font-size: 11px; color: #ef4444; font-weight: 500; }

    /* Password strength */
    .password-strength { margin: 4px 0 12px; }
    .strength-bar { height: 4px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin-bottom: 4px; }
    .strength-fill { height: 100%; border-radius: 99px; transition: width .3s, background .3s; }
    .str-weak   { background: #ef4444; }
    .str-medium { background: #f59e0b; }
    .str-strong { background: #10b981; }
    .strength-label { font-size: 11px; color: #64748b; }

    /* Summary */
    .summary-card {
      background: #f8fafc; border-radius: 14px; padding: 16px;
      border: 1px solid #e2e8f0; margin-bottom: 16px;
    }
    .summary-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 0; border-bottom: 1px solid #f1f5f9;
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-row mat-icon { font-size: 16px; color: #6366f1; flex-shrink: 0; }
    .s-label { font-size: 12px; color: #64748b; width: 120px; flex-shrink: 0; }
    .s-value { font-size: 13px; font-weight: 600; color: #0f172a; }

    .error-box {
      display: flex; align-items: center; gap: 8px;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
      padding: 10px 14px; color: #dc2626; font-size: 13px; margin-bottom: 16px;
    }
    .error-box mat-icon { font-size: 18px; flex-shrink: 0; }

    /* Actions */
    .step-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .btn-back {
      display: flex; align-items: center; gap: 4px;
      background: none; border: 1.5px solid #e2e8f0; cursor: pointer;
      padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
      color: #64748b; font-family: inherit; transition: all .15s;
    }
    .btn-back:hover { border-color: #4f46e5; color: #4f46e5; }
    .btn-back mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-next {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg,#4f46e5,#06b6d4); color: white;
      border: none; cursor: pointer; padding: 10px 20px; border-radius: 10px;
      font-size: 14px; font-weight: 700; font-family: inherit;
      box-shadow: 0 4px 12px rgba(79,70,229,.3); transition: all .2s;
    }
    .btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(79,70,229,.4); }
    .btn-next:disabled { opacity: .5; cursor: not-allowed; }
    .btn-next mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-submit {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg,#059669,#10b981); color: white;
      border: none; cursor: pointer; padding: 10px 24px; border-radius: 10px;
      font-size: 14px; font-weight: 700; font-family: inherit;
      box-shadow: 0 4px 12px rgba(16,185,129,.3); transition: all .2s;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    .btn-submit mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .card-footer {
      text-align: center; margin-top: 20px; font-size: 13px; color: #64748b;
    }
    .card-footer a { color: #4f46e5; font-weight: 600; text-decoration: none; margin-left: 4px; }
    .card-footer a:hover { text-decoration: underline; }

    @media (max-width: 540px) { .two-cols { grid-template-columns: 1fr; } }
  `],
})
export class RegisterComponent {
  steps = ['Konto', 'Dane osobowe', 'Potwierdzenie'];
  currentStep = 0;
  accountForm: FormGroup;
  personalForm: FormGroup;
  loading = false;
  hidePass = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.accountForm = this.fb.group(
      {
        username:         ['', [Validators.required, Validators.minLength(3)]],
        email:            ['', [Validators.required, Validators.email]],
        password:         ['', [Validators.required, Validators.minLength(8)]],
        password_confirm: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
    this.personalForm = this.fb.group({
      first_name:   ['', Validators.required],
      last_name:    ['', Validators.required],
      phone_number: [''],
      address:      [''],
    });
  }

  get passStrength(): number {
    const p = this.accountForm.get('password')?.value || '';
    let score = 0;
    if (p.length >= 8)  score += 33;
    if (/[A-Z]/.test(p)) score += 33;
    if (/[0-9!@#$%]/.test(p)) score += 34;
    return score;
  }
  get passLevel(): string {
    const s = this.passStrength;
    if (s < 40) return 'weak';
    if (s < 80) return 'medium';
    return 'strong';
  }
  get passLevelLabel(): string {
    return { weak: 'Słabe', medium: 'Średnie', strong: 'Silne' }[this.passLevel] || '';
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c.touched);
  }

  passwordMatchValidator(group: FormGroup) {
    const pass    = group.get('password')?.value;
    const confirm = group.get('password_confirm')?.value;
    if (pass !== confirm) {
      group.get('password_confirm')?.setErrors({ mismatch: true });
    }
    return null;
  }

  nextStep(): void {
    if (this.currentStep === 0 && this.accountForm.valid) { this.currentStep = 1; return; }
    if (this.currentStep === 1 && this.personalForm.valid) { this.currentStep = 2; return; }
    if (this.currentStep === 0) this.accountForm.markAllAsTouched();
    if (this.currentStep === 1) this.personalForm.markAllAsTouched();
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';
    const data = { ...this.accountForm.value, ...this.personalForm.value };
    this.auth.register(data).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        const errors = err.error;
        this.errorMessage = Object.values(errors).flat().join(' ') || 'Błąd rejestracji.';
      },
    });
  }
}
