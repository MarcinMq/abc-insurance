import { Component, inject, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { gsap } from 'gsap';
import { AuthService } from '../../core/services/auth.service';
import { PolicyService } from '../../core/services/policy.service';
import { ClaimService } from '../../core/services/claim.service';
import { Policy } from '../../core/models/policy.model';
import { Claim, CLAIM_STATUS_LABELS } from '../../core/models/claim.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
  ],
  template: `
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12 relative">
      <!-- Background Ambient Glow -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(10,132,255,0.08),transparent_60%)] pointer-events-none -z-10 blur-3xl"></div>

      <!-- Header -->
      <div class="gsap-element flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <h1 class="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Witaj, <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{{ auth.user()?.first_name || auth.user()?.username }}</span>! <span class="inline-block origin-bottom-right rotate-12 animate-pulse">👋</span>
          </h1>
          <p class="text-gray-400 text-lg md:text-xl font-light">{{ getWelcomeMessage() }}</p>
        </div>
        @if (auth.isCustomer()) {
          <a routerLink="/claims/new" class="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.6)] hover:-translate-y-1 overflow-hidden">
            <!-- inner flare -->
            <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 relative z-10 transition-transform group-hover:rotate-90">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span class="relative z-10">Zgłoś szkodę</span>
          </a>
        }
      </div>

      @if (loading) {
        <div class="flex justify-center items-center py-32">
          <div class="relative w-16 h-16">
            <div class="absolute inset-0 border-4 border-white/10 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      } @else {
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          <div class="gsap-element bg-gradient-to-b from-[#1c1c1e] to-[#121214] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors"></div>
            <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div class="text-sm tracking-wide text-gray-400 font-medium uppercase mb-1">Aktywne polisy</div>
            <div class="text-4xl md:text-5xl font-black text-white tracking-tight">{{ stats.activePolicies }}</div>
          </div>

          <div class="gsap-element bg-gradient-to-b from-[#1c1c1e] to-[#121214] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors"></div>
            <div class="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div class="text-sm tracking-wide text-gray-400 font-medium uppercase mb-1">Wszystkie szkody</div>
            <div class="text-4xl md:text-5xl font-black text-white tracking-tight">{{ stats.totalClaims }}</div>
          </div>

          <div class="gsap-element bg-gradient-to-b from-[#1c1c1e] to-[#121214] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-colors"></div>
            <div class="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(249,115,22,0.15)] group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="text-sm tracking-wide text-gray-400 font-medium uppercase mb-1">Rozpatrywane</div>
            <div class="text-4xl md:text-5xl font-black text-white tracking-tight">{{ stats.pendingClaims }}</div>
          </div>

          @if (auth.isAgent()) {
            <a routerLink="/agent/queue" class="gsap-element bg-gradient-to-b from-[#1c1c1e] to-[#121214] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div class="absolute -right-10 -top-10 w-40 h-40 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-500/30 transition-colors"></div>
              <div class="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(239,68,68,0.15)] group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 011.875 1.875v1.5a1.875 1.875 0 01-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875v-1.5c0-1.036.84-1.875 1.875-1.875z" />
                </svg>
              </div>
              <div class="text-sm tracking-wide text-gray-400 font-medium uppercase mb-1">Kolejka szkód</div>
              <div class="text-4xl md:text-5xl font-black text-white tracking-tight">{{ stats.queueCount }}</div>
            </a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin" class="gsap-element bg-gradient-to-b from-[#1c1c1e] to-[#121214] border border-[#bf5af2]/20 rounded-3xl p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div class="absolute -right-10 -top-10 w-40 h-40 bg-[#bf5af2]/15 rounded-full blur-3xl group-hover:bg-[#bf5af2]/25 transition-colors"></div>
              <div class="w-14 h-14 rounded-2xl bg-[#bf5af2]/10 border border-[#bf5af2]/20 text-[#bf5af2] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(191,90,242,0.15)] group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                </svg>
              </div>
              <div class="text-sm tracking-wide text-gray-400 font-medium uppercase mb-1">Panel admina</div>
              <div class="text-lg font-bold text-white tracking-tight">Zarządzaj systemem</div>
            </a>
          }
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <!-- Recent Policies -->
          <div>
            <div class="gsap-element flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-white tracking-tight">Ostatnie polisy</h2>
              <a routerLink="/policies" class="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 group">
                Zobacz wszystkie
                <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </a>
            </div>

            @if (recentPolicies.length === 0) {
              <div class="gsap-element bg-[#161617]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-12 text-center shadow-2xl">
                <div class="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-500">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                </div>
                <p class="text-gray-400 font-medium">Brak aktywnych polis</p>
              </div>
            } @else {
              <div class="bg-[#161617]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden divide-y divide-white/5">
                @for (policy of recentPolicies; track policy.id) {
                  <a [routerLink]="['/policies', policy.id]" class="gsap-element flex items-center gap-5 p-5 md:p-6 hover:bg-white/[0.03] transition-colors group">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 shadow-inner group-hover:from-blue-500/30 transition-colors">
                      <!-- Render SVG based on category -->
                      <ng-container *ngTemplateOutlet="categoryIcon; context: { $implicit: policy.product?.category || policy.product_category }"></ng-container>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-white font-semibold text-lg truncate group-hover:text-blue-200 transition-colors">{{ policy.product?.name || policy.product_name || 'Nieznany produkt' }}</h3>
                      <p class="text-gray-400 text-sm font-mono mt-0.5 tracking-wide">{{ policy.policy_number }}</p>
                    </div>
                    <div class="flex flex-col items-end gap-2 shrink-0">
                      <span [class]="'px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ' + getStatusClasses(policy.status)">
                        {{ getStatusLabel(policy.status) }}
                      </span>
                    </div>
                  </a>
                }
              </div>
            }
          </div>

          <!-- Recent Claims -->
          <div>
            <div class="gsap-element flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-white tracking-tight">Ostatnie szkody</h2>
              <a routerLink="/claims" class="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 group">
                Zobacz wszystkie
                <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </a>
            </div>

            @if (recentClaims.length === 0) {
              <div class="gsap-element bg-[#161617]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-12 text-center shadow-2xl">
                <div class="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-500">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                </div>
                <p class="text-gray-400 font-medium">Brak zgłoszonych szkód</p>
              </div>
            } @else {
              <div class="bg-[#161617]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden divide-y divide-white/5">
                @for (claim of recentClaims; track claim.id) {
                  <a [routerLink]="['/claims', claim.id]" class="gsap-element flex items-center gap-5 p-5 md:p-6 hover:bg-white/[0.03] transition-colors group">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 shadow-inner group-hover:from-purple-500/30 transition-colors">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2.25m0 0v2.25m0-2.25h2.25m-2.25 0H9.75m1.5-6a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-blue-400 font-mono font-bold text-base truncate group-hover:text-cyan-300 transition-colors">{{ claim.claim_number }}</h3>
                      <p class="text-gray-400 text-sm mt-1 truncate">{{ claim.incident_date | date:'dd.MM.yyyy' }} &bull; {{ claim.incident_location }}</p>
                    </div>
                    <div class="flex flex-col items-end gap-2 shrink-0">
                       <div class="text-white font-bold text-lg whitespace-nowrap">{{ claim.estimated_damage }} zł</div>
                      <span [class]="'px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border ' + getClaimStatusClasses(claim.status)">
                        {{ getClaimStatusLabel(claim.status) }}
                      </span>
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Reusable template for category icons -->
    <ng-template #categoryIcon let-category>
      @switch (category) {
        @case ('auto') {
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
        }
        @case ('property') {
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
        }
        @case ('health') {
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>
        }
        @case ('travel') {
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
        }
        @default {
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
        }
      }
    </ng-template>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit {
  auth = inject(AuthService);
  private policyService = inject(PolicyService);
  private claimService = inject(ClaimService);
  private el = inject(ElementRef);

  loading = true;
  recentPolicies: Policy[] = [];
  recentClaims: Claim[] = [];
  stats = { activePolicies: 0, totalClaims: 0, pendingClaims: 0, queueCount: 0 };

  ngOnInit(): void {
    forkJoin({
      policies: this.policyService.getPolicies(),
      claims: this.claimService.getClaims(),
    }).subscribe({
      next: ({ policies, claims }) => {
        this.recentPolicies = policies.results.slice(0, 3);
        this.recentClaims = claims.results.slice(0, 4); // show 4 for better grid balance
        this.stats.activePolicies = policies.results.filter(p => p.status === 'active').length;
        this.stats.totalClaims = claims.count;
        this.stats.pendingClaims = claims.results.filter(
          c => ['submitted', 'under_review', 'additional_info'].includes(c.status)
        ).length;
        this.loading = false;
        
        setTimeout(() => this.animateElements(), 50);
      },
      error: () => { this.loading = false; }
    });

    if (this.auth.isAgent()) {
      this.claimService.getAgentQueue().subscribe(q => {
        this.stats.queueCount = q.count;
      });
    }
  }

  ngAfterViewInit() {
    this.animateElements();
  }

  animateElements() {
    const elements = this.el.nativeElement.querySelectorAll('.gsap-element');
    console.log("Dodano animacje GSAP do:", elements.length, "elementów");
    if (elements.length > 0) {
      gsap.fromTo(elements, 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out', overwrite: true }
      );
    }
  }

  getWelcomeMessage(): string {
    if (this.auth.isAgent()) return 'Twój panel operacyjny centrum dowodzenia';
    return 'Zarządzaj polisami i szybko zgłaszaj zdarzenia';
  }

  getStatusClasses(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-[#30d158]/10 text-[#30d158] border-[#30d158]/20',
      expired: 'bg-white/5 text-gray-400 border-white/10',
      cancelled: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
      pending: 'bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/20'
    };
    return classes[status] || classes['expired'];
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Aktywna', expired: 'Wygasła', cancelled: 'Anulowana', pending: 'Oczekująca'
    };
    return labels[status] || status;
  }

  getClaimStatusClasses(status: string): string {
    const classes: Record<string, string> = {
      draft: 'bg-white/5 text-gray-400 border-white/10',
      submitted: 'bg-[#0a84ff]/10 text-[#0a84ff] border-[#0a84ff]/20',
      under_review: 'bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/20',
      additional_info: 'bg-[#ffd60a]/10 text-[#ffd60a] border-[#ffd60a]/20',
      approved: 'bg-[#30d158]/10 text-[#30d158] border-[#30d158]/20',
      partially_approved: 'bg-[#32ade6]/10 text-[#32ade6] border-[#32ade6]/20',
      rejected: 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20',
      paid: 'bg-[#30d158]/10 text-[#30d158] border-[#30d158]/20',
      closed: 'bg-white/5 text-gray-400 border-white/10'
    };
    return classes[status] || classes['draft'];
  }

  getClaimStatusLabel(status: string): string {
    return CLAIM_STATUS_LABELS[status as keyof typeof CLAIM_STATUS_LABELS] || status;
  }
}
