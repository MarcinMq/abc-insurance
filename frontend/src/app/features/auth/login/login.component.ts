import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <!-- Background glow -->
      <div class="fixed inset-0 pointer-events-none">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px]"
             style="background: radial-gradient(ellipse, rgba(10,132,255,0.12), transparent 70%); filter: blur(40px);">
        </div>
      </div>

      <div class="relative w-full max-w-[420px]">
        <!-- Logo & header -->
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-flex items-center gap-2 mb-6 group">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.3)] group-hover:shadow-[0_0_30px_rgba(10,132,255,0.5)] transition-shadow"
                 style="background: linear-gradient(135deg, #0a84ff, #0066cc)">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <span class="text-white font-semibold text-lg">ABC Insurance</span>
          </a>
          <h1 class="text-3xl font-bold text-white tracking-tight">Zaloguj się</h1>
          <p class="text-[#86868b] text-sm mt-2">Wejdź do Twojego panelu ubezpieczeń</p>
        </div>

        <!-- Card -->
        <div class="rounded-2xl border border-[rgba(255,255,255,0.06)] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.5)]"
             style="background: #161617">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">

            <!-- Username -->
            <div>
              <label class="block text-sm font-medium text-[#86868b] mb-2">Login</label>
              <div class="relative">
                <input formControlName="username" type="text" placeholder="np. klient" autocomplete="username"
                       class="w-full h-12 px-4 pr-10 rounded-xl text-white placeholder:text-[#3a3a3c] outline-none transition-colors"
                       style="background: #1c1c1e; border: 1px solid rgba(255,255,255,0.08);"
                       (focus)="onFieldFocus($event)" (blur)="onFieldBlur($event)">
                <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3a3a3c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/>
                </svg>
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-[#86868b] mb-2">Hasło</label>
              <div class="relative">
                <input formControlName="password" [type]="hidePassword ? 'password' : 'text'" placeholder="••••••••" autocomplete="current-password"
                       class="w-full h-12 px-4 pr-10 rounded-xl text-white placeholder:text-[#3a3a3c] outline-none transition-colors"
                       style="background: #1c1c1e; border: 1px solid rgba(255,255,255,0.08);"
                       (focus)="onFieldFocus($event)" (blur)="onFieldBlur($event)">
                <button type="button" (click)="hidePassword = !hidePassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a3a3c] hover:text-[#86868b] transition-colors">
                  @if (hidePassword) {
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  } @else {
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <!-- Error -->
            @if (errorMessage) {
              <div class="flex items-center gap-2 rounded-xl px-4 py-3 text-[#ff3b30] text-sm"
                   style="background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.2)">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                {{ errorMessage }}
              </div>
            }

            <!-- Demo accounts -->
            <div class="rounded-xl p-4" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.04)">
              <p class="text-[11px] text-[#6e6e73] uppercase tracking-wider mb-3">Konta demo</p>
              <div class="flex gap-2">
                <button type="button" (click)="fillDemo('klient')"
                        class="flex-1 h-9 rounded-lg text-[#86868b] text-xs font-medium hover:text-white transition-all"
                        style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06)">
                  klient / Haslo123!
                </button>
                <button type="button" (click)="fillDemo('agent')"
                        class="flex-1 h-9 rounded-lg text-[#86868b] text-xs font-medium hover:text-white transition-all"
                        style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06)">
                  agent / Haslo123!
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" [disabled]="loading || form.invalid"
                    class="w-full h-12 rounded-xl bg-[#0a84ff] text-white font-semibold text-[15px] hover:bg-[#409cff] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(10,132,255,0.25)]">
              @if (loading) {
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              } @else {
                Zaloguj się
              }
            </button>
          </form>
        </div>

        <p class="text-center text-sm text-[#6e6e73] mt-6">
          Nie masz konta?
          <a routerLink="/register" class="text-[#0a84ff] hover:text-[#409cff] transition-colors font-medium">Zarejestruj się</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  hidePassword = true;
  loading = false;
  errorMessage = '';

  form: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  fillDemo(user: 'klient' | 'agent'): void {
    this.form.patchValue({ username: user, password: 'Haslo123!' });
  }

  onFieldFocus(e: FocusEvent) {
    (e.target as HTMLElement).style.borderColor = '#0a84ff';
    (e.target as HTMLElement).style.boxShadow = '0 0 0 1px #0a84ff';
  }

  onFieldBlur(e: FocusEvent) {
    (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
    (e.target as HTMLElement).style.boxShadow = 'none';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.auth.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Nieprawidłowy login lub hasło.';
      }
    });
  }
}
