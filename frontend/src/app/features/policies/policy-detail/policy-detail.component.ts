import { Component, inject, OnInit, AfterViewInit, ElementRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { PolicyService } from '../../../core/services/policy.service';
import { Policy } from '../../../core/models/policy.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
  ],
  template: `
    <div class="max-w-[1000px] mx-auto px-4 md:px-8 py-8 md:py-12">
      <div class="gsap-element mb-8">
        <a routerLink="/policies" class="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors group">
          <span class="material-icons text-[18px] mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Wróć do listy polis
        </a>
      </div>

      @if (loading) {
        <div class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      } @else if (policy) {
        <!-- Nagłówek polisy -->
        <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-6 md:p-8 mb-6 shadow-2xl relative overflow-hidden">
          <div class="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div class="flex items-center gap-6">
              <div class="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <span class="material-icons text-3xl">{{ getProductIcon(policy.product?.category || '') }}</span>
              </div>
              <div>
                <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">{{ policy.product?.name || 'Nieznany produkt' }}</h1>
                <p class="text-gray-400 font-mono mt-1">{{ policy.policy_number }}</p>
              </div>
            </div>
            
            <div>
              <span id="status-badge" [class]="'px-4 py-1.5 inline-block rounded-full text-sm font-medium border ' + getStatusClasses(policy.status)">
                {{ getStatusLabel(policy.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Szczegóły -->
          <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h3 class="text-lg font-semibold text-white mb-4">Szczegóły polisy</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center py-3 border-b border-white/5">
                <span class="text-gray-400 text-sm">Data rozpoczęcia</span>
                <span class="text-white font-medium">{{ policy.start_date | date:'dd.MM.yyyy' }}</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-white/5">
                <span class="text-gray-400 text-sm">Data zakończenia</span>
                <span class="text-white font-medium">{{ policy.end_date | date:'dd.MM.yyyy' }}</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-white/5">
                <span class="text-gray-400 text-sm">Składka roczna</span>
                <span class="text-white font-medium">{{ policy.premium_amount }} zł</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-white/5">
                <span class="text-gray-400 text-sm">Suma ubezpieczenia</span>
                <span class="text-white font-medium">{{ policy.coverage_amount }} zł</span>
              </div>
              <div class="flex justify-between items-center py-3">
                <span class="text-gray-400 text-sm">Kategoria</span>
                <span class="text-gray-300">{{ getCategoryLabel(policy.product?.category || '') }}</span>
              </div>
            </div>
          </div>

          <!-- Informacje o produkcie -->
          <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h3 class="text-lg font-semibold text-white mb-4">Informacje o produkcie</h3>
            <p class="text-gray-400 leading-relaxed text-sm md:text-base">
              {{ policy.product?.description || 'Brak opisu.' }}
            </p>
          </div>
        </div>

        @if (auth.isAgent()) {
          <!-- Panel Agenta -->
          <div class="gsap-element bg-gradient-to-br from-blue-900/10 to-purple-900/5 border border-blue-500/20 rounded-3xl p-6 shadow-2xl mb-8 relative overflow-hidden">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
            <h3 class="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2 relative z-10">
              <span class="material-icons">admin_panel_settings</span>
              Panel Agenta: Zarządzanie statusem
            </h3>
            <div class="flex flex-wrap gap-3 relative z-10">
              <button 
                [disabled]="isUpdating || policy.status === 'active'"
                (click)="updateStatus('active')"
                class="px-5 py-2.5 rounded-full text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0">
                Aktywuj
              </button>
              <button 
                [disabled]="isUpdating || policy.status === 'pending'"
                (click)="updateStatus('pending')"
                class="px-5 py-2.5 rounded-full text-sm font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0">
                Oczekująca
              </button>
              <button 
                [disabled]="isUpdating || policy.status === 'expired'"
                (click)="updateStatus('expired')"
                class="px-5 py-2.5 rounded-full text-sm font-medium bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0">
                Oznacz jako Wygaśniętą
              </button>
              <button 
                [disabled]="isUpdating || policy.status === 'cancelled'"
                (click)="updateStatus('cancelled')"
                class="px-5 py-2.5 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0">
                Anuluj
              </button>
            </div>
          </div>
        }

        <!-- Akcje -->
        <div class="gsap-element flex flex-col sm:flex-row gap-4">
          <a routerLink="/claims/new" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex-1 sm:flex-none">
            <span class="material-icons text-[20px]">add</span>
            Zgłoś szkodę z tej polisy
          </a>
          <a routerLink="/claims" [queryParams]="{policy: policy.id}" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-transparent border border-white/20 hover:bg-white/5 text-white font-medium transition-colors flex-1 sm:flex-none">
            <span class="material-icons text-[20px]">list</span>
            Historia szkód
          </a>
        </div>
      } @else {
        <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-16 text-center shadow-2xl max-w-lg mx-auto mt-10">
          <div class="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
            <span class="material-icons text-4xl">error_outline</span>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">Polisa nie została znaleziona</h3>
          <p class="text-gray-400 mb-8">Polisa o podanym identyfikatorze nie istnieje lub nie masz do niej dostępu.</p>
          <a routerLink="/policies" class="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
            Wróć do listy
          </a>
        </div>
      }
    </div>
  `
})
export class PolicyDetailComponent implements OnInit, AfterViewInit {
  id = input.required<string>();

  private policyService = inject(PolicyService);
  auth = inject(AuthService);
  private el = inject(ElementRef);

  loading = true;
  isUpdating = false;
  policy: Policy | null = null;

  ngOnInit(): void {
    this.policyService.getPolicy(Number(this.id())).subscribe({
      next: data => { 
        this.policy = data; 
        this.loading = false; 
        setTimeout(() => this.animateElements(), 50);
      },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewInit() {
    // initial fall-back if loading is fast
    this.animateElements();
  }

  animateElements() {
    const elements = this.el.nativeElement.querySelectorAll('.gsap-element');
    if (elements.length > 0) {
      gsap.fromTo(elements, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', overwrite: true }
      );
    }
  }

  updateStatus(newStatus: string): void {
    if (!this.policy || this.isUpdating) return;
    this.isUpdating = true;
    
    // Smooth transition UI
    const targetEl = document.getElementById('status-badge');
    if (targetEl) {
      gsap.to(targetEl, { scale: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
    }

    this.policyService.updatePolicyStatus(this.policy.id, newStatus).subscribe({
      next: (updatedPolicy) => {
        this.policy = updatedPolicy;
        this.isUpdating = false;
        
        // Success animation
        if (targetEl) {
          gsap.fromTo(targetEl, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, ease: 'back.out(1.5)' });
        }
      },
      error: () => {
        this.isUpdating = false;
        alert('Wystąpił błąd podczas zmiany statusu polis.');
      }
    });
  }

  getProductIcon(category: string): string {
    const icons: Record<string, string> = {
      auto: 'directions_car', property: 'home', health: 'favorite',
      life: 'person', travel: 'flight', liability: 'gavel',
    };
    return icons[category] || 'shield';
  }

  getStatusClasses(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-500/10 text-green-400 border-green-500/20',
      expired: 'bg-white/5 text-gray-400 border-white/10',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
      pending: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };
    return classes[status] || classes['expired'];
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Aktywna', expired: 'Wygasła', cancelled: 'Anulowana', pending: 'Oczekująca'
    };
    return labels[status] || status;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      auto: 'Komunikacyjne', property: 'Nieruchomości', health: 'Zdrowotne',
      life: 'Na życie', travel: 'Podróżne', liability: 'OC'
    };
    return labels[category] || category;
  }
}
