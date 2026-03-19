import { Component, inject, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  template: `
    @if (auth.isLoggedIn() && !isLanding && !isAdminPage) {
      <nav class="fixed top-0 left-0 w-full z-50 bg-[#000000]/70 backdrop-blur-xl border-b border-white/10">
        <div class="max-w-[1200px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          <!-- Logo & Links -->
          <div class="flex items-center gap-8">
            <a routerLink="/dashboard" class="flex items-center gap-2 text-white font-semibold text-lg hover:opacity-80 transition-opacity">
              <span class="text-xl">🛡️</span>
              <span class="tracking-tight">ABC Ubezpieczenia</span>
            </a>

            <div class="hidden md:flex items-center gap-1">
              <a routerLink="/" class="px-4 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"><span class="material-icons text-[16px]">home</span> Strona główna</a>
              <a routerLink="/dashboard" routerLinkActive="bg-white/10 text-white" class="px-4 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-white transition-colors">Dashboard</a>
              <a routerLink="/policies" routerLinkActive="bg-white/10 text-white" class="px-4 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-white transition-colors">Polisy</a>
              <a routerLink="/claims" routerLinkActive="bg-white/10 text-white" class="px-4 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-white transition-colors">Szkody</a>
              @if (auth.isAgent()) {
                <a routerLink="/agent/queue" routerLinkActive="bg-white/10 text-white" class="px-4 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-white transition-colors">Kolejka agenta</a>
              }
            </div>
          </div>

          <!-- User Menu -->
          <div class="relative">
            <button 
              (click)="toggleMenu($event)"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-sm font-medium text-gray-300">
              <span class="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                {{ (auth.user()?.first_name?.[0] || auth.user()?.username?.[0] || 'U') | uppercase }}
              </span>
              {{ auth.user()?.first_name || auth.user()?.username }}
            </button>

            <!-- Dropdown -->
            @if (menuOpen) {
              <div class="absolute right-0 mt-2 w-48 rounded-xl bg-[#1c1c1e] border border-white/10 shadow-2xl overflow-hidden py-1 z-50">
                <div class="px-4 py-3 border-b border-white/10">
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">{{ getRoleLabel() }}</p>
                  <p class="text-sm text-white font-medium truncate mt-0.5">{{ auth.user()?.email }}</p>
                </div>
                
                <!-- Mobile Navigation Links -->
                <div class="md:hidden border-b border-white/5 py-1">
                  <a routerLink="/dashboard" routerLinkActive="text-white bg-white/5" class="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Dashboard</a>
                  <a routerLink="/policies" routerLinkActive="text-white bg-white/5" class="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Polisy</a>
                  <a routerLink="/claims" routerLinkActive="text-white bg-white/5" class="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Szkody</a>
                  @if (auth.isAgent()) {
                    <a routerLink="/agent/queue" routerLinkActive="text-white bg-white/5" class="block px-4 py-2.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-colors font-medium">Kolejka agenta</a>
                  }
                </div>
                
                <a routerLink="/" class="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5 md:hidden">
                  <span class="material-icons text-[18px]">home</span>
                  Strona główna
                </a>
                <button (click)="logout()" class="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Wyloguj się
                </button>
              </div>
            }
          </div>

        </div>
      </nav>
    }

    <main [class.pt-16]="auth.isLoggedIn() && !isLanding && !isAdminPage" class="min-h-screen">
      <router-outlet />
    </main>
  `
})
export class AppComponent {
  auth = inject(AuthService);
  router = inject(Router);
  menuOpen = false;
  isLanding = false;
  isAdminPage = false;

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.isLanding = e.urlAfterRedirects === '/';
      this.isAdminPage = e.urlAfterRedirects === '/admin';
    });
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void { 
    this.auth.logout(); 
  }

  getRoleLabel(): string {
    const labels: Record<string, string> = { customer: 'Klient', agent: 'Agent', admin: 'Administrator' };
    return labels[this.auth.user()?.role ?? ''] ?? 'Użytkownik';
  }
}
