import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <div class="auth-left">
        <div class="auth-left-content">
          <div class="brand-logo">
            <mat-icon class="brand-icon">shield</mat-icon>
            <span>ABC Insurance</span>
          </div>
          <h1>Twoje bezpieczeństwo<br>jest naszym priorytetem</h1>
          <p>Zarządzaj swoimi polisami i zgłaszaj szkody w jednym miejscu.</p>
          <div class="features">
            <div class="feature"><mat-icon>check_circle</mat-icon> Szybkie zgłaszanie szkód online</div>
            <div class="feature"><mat-icon>check_circle</mat-icon> Śledzenie statusu w czasie rzeczywistym</div>
            <div class="feature"><mat-icon>check_circle</mat-icon> Dostęp do wszystkich polis 24/7</div>
          </div>
        </div>
      </div>
      <div class="auth-right">
        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>Zaloguj się</mat-card-title>
            <mat-card-subtitle>Wprowadź dane logowania</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nazwa użytkownika</mat-label>
                <input matInput formControlName="username" autocomplete="username" />
                <mat-icon matSuffix>person</mat-icon>
                <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                  Nazwa użytkownika jest wymagana
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Hasło</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password" autocomplete="current-password" />
                <button mat-icon-button matSuffix type="button"
                        (click)="hidePassword = !hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  Hasło jest wymagane
                </mat-error>
              </mat-form-field>

              <div *ngIf="errorMessage" class="error-message">
                <mat-icon>error</mat-icon> {{ errorMessage }}
              </div>

              <button mat-raised-button color="primary" type="submit"
                      class="submit-btn" [disabled]="loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Zaloguj się</span>
              </button>
            </form>
          </mat-card-content>
          <mat-card-actions>
            <span>Nie masz konta?</span>
            <a mat-button color="primary" routerLink="/auth/register">Zarejestruj się</a>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; min-height: 100vh; }
    .auth-left { flex: 1; background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
      color: white; display: flex; align-items: center; justify-content: center;
      padding: 48px; }
    .auth-left-content { max-width: 440px; }
    .brand-logo { display: flex; align-items: center; gap: 12px; font-size: 22px;
      font-weight: 700; margin-bottom: 40px; }
    .brand-icon { font-size: 36px; width: 36px; height: 36px; }
    .auth-left h1 { font-size: 36px; font-weight: 700; line-height: 1.2; margin-bottom: 16px; }
    .auth-left p { font-size: 16px; opacity: 0.85; margin-bottom: 32px; }
    .features { display: flex; flex-direction: column; gap: 12px; }
    .feature { display: flex; align-items: center; gap: 10px; font-size: 15px; opacity: 0.9; }
    .auth-right { flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 48px; background: #f5f7fa; }
    .login-card { width: 100%; max-width: 420px; padding: 24px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .submit-btn { width: 100%; height: 48px; font-size: 16px; margin-top: 8px; }
    .error-message { color: #D32F2F; display: flex; align-items: center; gap: 8px;
      background: #FFEBEE; padding: 12px; border-radius: 4px; margin-bottom: 16px; }
    mat-card-actions { display: flex; align-items: center; justify-content: center;
      gap: 4px; padding: 16px 24px; }
  `],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const { username, password } = this.loginForm.value;
    this.auth.login(username, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.detail || 'Nieprawidłowa nazwa użytkownika lub hasło.';
      },
    });
  }
}
