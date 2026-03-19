import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl) {
  const password = control.get('password')?.value;
  const confirm = control.get('password_confirm')?.value;
  if (password && confirm && password !== confirm) return { passwordsMismatch: true };
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <!-- Background glow -->
      <div class="fixed inset-0 pointer-events-none">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px]"
             style="background: radial-gradient(ellipse, rgba(48,209,88,0.08), transparent 70%); filter: blur(40px);">
        </div>
      </div>

      <div class="relative w-full max-w-[460px]">
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
          <h1 class="text-3xl font-bold text-white tracking-tight">Utwórz konto</h1>
          <p class="text-[#86868b] text-sm mt-2">Dołącz do platformy ubezpieczeniowej nowej generacji</p>
        </div>

        <!-- Card -->
        <div class="rounded-2xl border border-[rgba(255,255,255,0.06)] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.5)]"
             style="background: #161617">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <!-- Name row -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-[#86868b] mb-2">Imię</label>
                <input formControlName="first_name" type="text" placeholder="Jan" required
                       class="w-full h-12 px-4 rounded-xl text-white placeholder:text-[#3a3a3c] outline-none transition-colors"
                       style="background: #1c1c1e; border: 1px solid rgba(255,255,255,0.08);"
                       (focus)="onFocus($event)" (blur)="onBlur($event)">
              </div>
              <div>
                <label class="block text-sm font-medium text-[#86868b] mb-2">Nazwisko</label>
                <input formControlName="last_name" type="text" placeholder="Kowalski" required
                       class="w-full h-12 px-4 rounded-xl text-white placeholder:text-[#3a3a3c] outline-none transition-colors"
                       style="background: #1c1c1e; border: 1px solid rgba(255,255,255,0.08);"
                       (focus)="onFocus($event)" (blur)="onBlur($event)">
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-[#86868b] mb-2">Email</label>
              <input formControlName="email" type="email" placeholder="jan@example.com" required autocomplete="email"
                     class="w-full h-12 px-4 rounded-xl text-white placeholder:text-[#3a3a3c] outline-none transition-colors"
                     style="background: #1c1c1e; border: 1px solid rgba(255,255,255,0.08);"
                     (focus)="onFocus($event)" (blur)="onBlur($event)">
            </div>

            <!-- Username -->
            <div>
              <label class="block text-sm font-medium text-[#86868b] mb-2">Login</label>
              <input formControlName="username" type="text" placeholder="jankowalski" required autocomplete="username"
                     class="w-full h-12 px-4 rounded-xl text-white placeholder:text-[#3a3a3c] outline-none transition-colors"
                     style="background: #1c1c1e; border: 1px solid rgba(255,255,255,0.08);"
                     (focus)="onFocus($event)" (blur)="onBlur($event)">
            </div>

            <!-- Passwords -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-[#86868b] mb-2">Hasło</label>
                <input formControlName="password" [type]="hidePass ? 'password' : 'text'" placeholder="••••••••" required autocomplete="new-password"
                       class="w-full h-12 px-4 rounded-xl text-white placeholder:text-[#3a3a3c] outline-none transition-colors"
                       style="background: #1c1c1e; border: 1px solid rgba(255,255,255,0.08);"
                       (focus)="onFocus($event)" (blur)="onBlur($event)">
              </div>
              <div>
                <label class="block text-sm font-medium text-[#86868b] mb-2">Powtórz</label>
                <input formControlName="password_confirm" [type]="hidePass ? 'password' : 'text'" placeholder="••••••••" required autocomplete="new-password"
                       class="w-full h-12 px-4 rounded-xl text-white placeholder:text-[#3a3a3c] outline-none transition-colors"
                       style="background: #1c1c1e; border: 1px solid rgba(255,255,255,0.08);"
                       (focus)="onFocus($event)" (blur)="onBlur($event)">
              </div>
            </div>

            <button type="button" (click)="hidePass = !hidePass"
                    class="text-xs text-[#6e6e73] hover:text-[#86868b] transition-colors">
              {{ hidePass ? '👁 Pokaż hasła' : '🙈 Ukryj hasła' }}
            </button>

            <!-- Password mismatch error -->
            @if (form.errors?.['passwordsMismatch'] && f['password_confirm'].touched) {
              <div class="flex items-center gap-2 rounded-xl px-4 py-3 text-[#ff3b30] text-sm"
                   style="background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.2)">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                Hasła nie są identyczne
              </div>
            }

            <!-- Server error -->
            @if (errorMessage) {
              <div class="flex items-start gap-2 rounded-xl px-4 py-3 text-[#ff3b30] text-sm"
                   style="background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.2)">
                <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                {{ errorMessage }}
              </div>
            }

            <!-- Submit -->
            <button type="submit" [disabled]="loading"
                    class="w-full h-12 rounded-xl text-white font-semibold text-[15px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(48,209,88,0.25)]"
                    style="background: #30d158">
              @if (loading) {
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              } @else {
                Zarejestruj się
              }
            </button>
          </form>
        </div>

        <p class="text-center text-sm text-[#6e6e73] mt-6">
          Masz już konto?
          <a routerLink="/login" class="text-[#0a84ff] hover:text-[#409cff] transition-colors font-medium">Zaloguj się</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  hidePass = true;
  loading = false;
  errorMessage = '';

  form: FormGroup = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirm: ['', Validators.required],
  }, { validators: passwordsMatch });

  get f() { return this.form.controls; }

  onFocus(e: FocusEvent) {
    (e.target as HTMLElement).style.borderColor = '#0a84ff';
    (e.target as HTMLElement).style.boxShadow = '0 0 0 1px #0a84ff';
  }

  onBlur(e: FocusEvent) {
    (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
    (e.target as HTMLElement).style.boxShadow = 'none';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    this.auth.register(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        const errors = err.error;
        if (typeof errors === 'object') {
          const firstError = Object.values(errors)[0];
          this.errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
        } else {
          this.errorMessage = 'Błąd rejestracji. Spróbuj ponownie.';
        }
      }
    });
  }
}
