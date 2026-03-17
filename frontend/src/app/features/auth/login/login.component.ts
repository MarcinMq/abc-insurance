import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
    MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-page">
      <!-- Animated background -->
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>

      <!-- Left panel -->
      <div class="login-left">
        <div class="left-content">
          <div class="brand">
            <div class="brand-icon"><mat-icon>shield</mat-icon></div>
            <span class="brand-name">ABC Insurance</span>
          </div>
          <h1 class="hero-title">
            Twoje bezpieczeństwo<br>
            <span class="hero-accent">w jednym miejscu</span>
          </h1>
          <p class="hero-sub">
            Zarządzaj polisami, zgłaszaj szkody i śledź status roszczeń — szybko i wygodnie.
          </p>
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon" style="background:rgba(129,140,248,.2)">
                <mat-icon style="color:#818cf8">bolt</mat-icon>
              </div>
              <div>
                <div class="feature-title">Błyskawiczne zgłoszenia</div>
                <div class="feature-desc">Zgłoś szkodę w mniej niż 2 minuty</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon" style="background:rgba(6,182,212,.2)">
                <mat-icon style="color:#06b6d4">track_changes</mat-icon>
              </div>
              <div>
                <div class="feature-title">Śledzenie w czasie rzeczywistym</div>
                <div class="feature-desc">Powiadomienia o każdej zmianie statusu</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon" style="background:rgba(16,185,129,.2)">
                <mat-icon style="color:#10b981">security</mat-icon>
              </div>
              <div>
                <div class="feature-title">Pełne bezpieczeństwo</div>
                <div class="feature-desc">Twoje dane są zawsze chronione</div>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="stats-row">
            <div class="stat">
              <div class="stat-n">12k+</div>
              <div class="stat-l">Klientów</div>
            </div>
            <div class="stat-sep"></div>
            <div class="stat">
              <div class="stat-n">98%</div>
              <div class="stat-l">Satysfakcji</div>
            </div>
            <div class="stat-sep"></div>
            <div class="stat">
              <div class="stat-n">24h</div>
              <div class="stat-l">Obsługa</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel: form -->
      <div class="login-right">
        <div class="form-card">
          <div class="form-header">
            <h2>Zaloguj się</h2>
            <p>Witaj ponownie! Wprowadź swoje dane.</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form-body">
            <div class="field-group">
              <label>Nazwa użytkownika</label>
              <div class="input-wrap" [class.input-error]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
                <mat-icon class="input-icon">person</mat-icon>
                <input formControlName="username" placeholder="Wpisz nazwę użytkownika"
                       autocomplete="username" />
              </div>
            </div>

            <div class="field-group">
              <label>Hasło</label>
              <div class="input-wrap" [class.input-error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                <mat-icon class="input-icon">lock</mat-icon>
                <input [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password"
                       placeholder="Wpisz hasło"
                       autocomplete="current-password" />
                <button type="button" class="toggle-pass" (click)="hidePassword = !hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <div class="error-box" *ngIf="errorMessage">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>

            <button type="submit" class="btn-login" [disabled]="loading || loginForm.invalid">
              <mat-spinner *ngIf="loading" diameter="20" color="accent"></mat-spinner>
              <span *ngIf="!loading">Zaloguj się</span>
              <span *ngIf="!loading">→</span>
            </button>
          </form>

          <div class="form-footer">
            Nie masz konta?
            <a routerLink="/auth/register">Zarejestruj się za darmo</a>
          </div>

          <!-- Demo credentials -->
          <div class="demo-creds">
            <div class="demo-title">Konta demo</div>
            <div class="demo-row" (click)="fillDemo('klient','Haslo123!')">
              <span class="demo-chip customer">Klient</span>
              <span class="demo-login">klient / Haslo123!</span>
            </div>
            <div class="demo-row" (click)="fillDemo('agent','Haslo123!')">
              <span class="demo-chip agent">Agent</span>
              <span class="demo-login">agent / Haslo123!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; position: relative; overflow: hidden;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    }

    /* Animated background shapes */
    .bg-shapes { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .shape {
      position: absolute; border-radius: 50%;
      background: linear-gradient(135deg, rgba(129,140,248,.15), rgba(6,182,212,.1));
      animation: float 6s ease-in-out infinite;
    }
    .shape-1 { width: 400px; height: 400px; top: -100px; left: -100px; animation-delay: 0s; }
    .shape-2 { width: 300px; height: 300px; top: 50%; right: 10%; animation-delay: 1s; }
    .shape-3 { width: 200px; height: 200px; bottom: -50px; left: 30%; animation-delay: 2s; }
    .shape-4 { width: 150px; height: 150px; top: 20%; left: 50%; animation-delay: 3s; }
    .shape-5 { width: 250px; height: 250px; bottom: 20%; right: -50px; animation-delay: 1.5s; }
    @keyframes float {
      0%,100% { transform: translateY(0) rotate(0deg); }
      33%      { transform: translateY(-20px) rotate(5deg); }
      66%      { transform: translateY(10px) rotate(-3deg); }
    }

    /* Left panel */
    .login-left {
      flex: 1.1; display: flex; align-items: center; justify-content: center;
      padding: 60px 48px; position: relative; z-index: 1;
    }
    .left-content { max-width: 480px; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
    .brand-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #818cf8, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(129,140,248,.4);
    }
    .brand-icon mat-icon { color: white; font-size: 24px; }
    .brand-name { font-size: 20px; font-weight: 800; color: white; }
    .hero-title {
      font-size: 42px; font-weight: 800; color: white; line-height: 1.15;
      letter-spacing: -0.02em; margin-bottom: 20px;
    }
    .hero-accent {
      background: linear-gradient(135deg, #818cf8, #06b6d4);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero-sub { font-size: 16px; color: rgba(255,255,255,.55); margin-bottom: 40px; line-height: 1.6; }
    .features { display: flex; flex-direction: column; gap: 20px; margin-bottom: 48px; }
    .feature-item { display: flex; gap: 16px; align-items: flex-start; }
    .feature-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .feature-title { font-size: 14px; font-weight: 600; color: white; }
    .feature-desc { font-size: 13px; color: rgba(255,255,255,.45); margin-top: 2px; }
    .stats-row {
      display: flex; align-items: center; gap: 24px;
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
      border-radius: 16px; padding: 20px 28px;
    }
    .stat { text-align: center; }
    .stat-n { font-size: 24px; font-weight: 800; color: white; }
    .stat-l { font-size: 12px; color: rgba(255,255,255,.4); }
    .stat-sep { width: 1px; height: 40px; background: rgba(255,255,255,.1); }

    /* Right panel */
    .login-right {
      width: 480px; display: flex; align-items: center; justify-content: center;
      padding: 40px 32px; position: relative; z-index: 1;
    }
    .form-card {
      width: 100%; max-width: 400px;
      background: rgba(255,255,255,.97);
      border-radius: 24px; padding: 36px;
      box-shadow: 0 32px 80px rgba(0,0,0,.4);
    }
    .form-header { margin-bottom: 28px; }
    .form-header h2 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .form-header p { font-size: 14px; color: #64748b; }

    /* Custom inputs */
    .field-group { margin-bottom: 16px; }
    .field-group label { font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
    .input-wrap {
      display: flex; align-items: center;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      background: #f8fafc; overflow: hidden;
      transition: border-color .2s, box-shadow .2s;
    }
    .input-wrap:focus-within {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,.12);
      background: white;
    }
    .input-wrap.input-error { border-color: #ef4444; }
    .input-icon { color: #94a3b8; margin: 0 10px; font-size: 18px; flex-shrink: 0; }
    .input-wrap input {
      flex: 1; border: none; background: none; padding: 12px 4px; font-size: 14px;
      color: #0f172a; outline: none; font-family: inherit;
    }
    .toggle-pass {
      background: none; border: none; cursor: pointer; padding: 0 12px;
      color: #94a3b8; display: flex; align-items: center;
    }
    .toggle-pass:hover { color: #4f46e5; }

    .error-box {
      display: flex; align-items: center; gap: 8px;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
      padding: 10px 12px; color: #dc2626; font-size: 13px; margin-bottom: 16px;
    }
    .error-box mat-icon { font-size: 18px; }

    .btn-login {
      width: 100%; height: 48px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      color: white; border-radius: 12px; font-size: 15px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all .2s; box-shadow: 0 4px 16px rgba(79,70,229,.35);
      letter-spacing: .01em;
    }
    .btn-login:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,.45); }
    .btn-login:active:not(:disabled) { transform: translateY(0); }
    .btn-login:disabled { opacity: .6; cursor: not-allowed; }
    .btn-login mat-icon { font-size: 20px; }

    .form-footer {
      text-align: center; margin-top: 20px; font-size: 13px; color: #64748b;
    }
    .form-footer a { color: #4f46e5; font-weight: 600; text-decoration: none; margin-left: 4px; }
    .form-footer a:hover { text-decoration: underline; }

    /* Demo credentials */
    .demo-creds {
      margin-top: 20px; padding: 16px;
      background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;
    }
    .demo-title { font-size: 11px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
    .demo-row {
      display: flex; align-items: center; gap: 10px; padding: 7px 8px;
      border-radius: 8px; cursor: pointer; transition: background .15s;
    }
    .demo-row:hover { background: white; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .demo-chip {
      font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
      white-space: nowrap;
    }
    .demo-chip.customer { background: #ede9fe; color: #7c3aed; }
    .demo-chip.agent    { background: #e0f2fe; color: #0369a1; }
    .demo-login { font-size: 12px; color: #64748b; font-family: monospace; }

    @media (max-width: 900px) {
      .login-left { display: none; }
      .login-right { width: 100%; }
    }
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
    private route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  fillDemo(username: string, password: string): void {
    this.loginForm.patchValue({ username, password });
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
        this.errorMessage = err.error?.detail || 'Nieprawidłowa nazwa użytkownika lub hasło.';
      },
    });
  }
}
