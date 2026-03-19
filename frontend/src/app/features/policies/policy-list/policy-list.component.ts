import { Component, inject, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { gsap } from 'gsap';
import { PolicyService } from '../../../core/services/policy.service';
import { Policy } from '../../../core/models/policy.model';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">
      <div class="gsap-element mb-10">
        <h1 class="text-3xl md:text-4xl font-semibold text-white tracking-tight">Moje polisy</h1>
        <p class="text-gray-400 mt-2 text-lg">Zarządzaj swoimi aktywnymi ubezpieczeniami</p>
      </div>

      <!-- Filters -->
      <div class="gsap-element bg-[#161617] border border-white/5 rounded-2xl p-4 md:p-6 mb-8 shadow-xl flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Szukaj polisy</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
              <span class="material-icons text-[20px]">search</span>
            </span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onFilterChange()" 
              placeholder="Wpisz numer polisy lub nazwę..."
              class="w-full bg-[#1c1c1e] text-white placeholder-gray-500 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
          </div>
        </div>

        <div class="w-full md:w-64">
          <label class="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Status</label>
          <div class="relative">
            <select 
              [(ngModel)]="statusFilter" 
              (ngModelChange)="onFilterChange()"
              class="w-full bg-[#1c1c1e] text-white border border-white/10 rounded-xl py-3 px-4 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
              <option value="">Wszystkie</option>
              <option value="active">Aktywne</option>
              <option value="expired">Wygasłe</option>
              <option value="cancelled">Anulowane</option>
              <option value="pending">Oczekujące</option>
            </select>
            <span class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
              <span class="material-icons text-[20px]">expand_more</span>
            </span>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      } @else if (policies.length === 0) {
        <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-16 text-center shadow-2xl">
          <div class="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6 text-gray-500">
            <span class="material-icons text-4xl">shield</span>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">Brak polis</h3>
          <p class="text-gray-400">Nie znaleźliśmy polis pasujących do podanych kryteriów.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          @for (policy of policies; track policy.id) {
            <a [routerLink]="['/policies', policy.id]" class="gsap-element block bg-[#161617] border border-white/5 rounded-3xl p-6 shadow-xl hover:border-white/10 hover:bg-[#1c1c1e] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
              <div class="flex justify-between items-start mb-6">
                <div class="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span class="material-icons">{{ getProductIcon(policy.product?.category || policy.product_category || '') }}</span>
                </div>
                <span [class]="'px-3 py-1 rounded-full text-xs font-medium border ' + getStatusClasses(policy.status)">
                  {{ getStatusLabel(policy.status) }}
                </span>
              </div>
              
              <div class="mb-6">
                <p class="text-gray-500 text-xs font-mono mb-1">{{ policy.policy_number }}</p>
                <h3 class="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">{{ policy.product?.name || policy.product_name || 'Nieznany produkt' }}</h3>
              </div>

              <div class="space-y-3 pt-6 border-t border-white/5">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-400">Okres</span>
                  <div class="flex items-center text-gray-300">
                    {{ policy.start_date | date:'dd.MM.yyyy' }}
                    <span class="material-icons text-[14px] mx-1 text-gray-500">arrow_forward</span>
                    {{ policy.end_date | date:'dd.MM.yyyy' }}
                  </div>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-400">Składka</span>
                  <span class="text-white font-medium">{{ policy.premium_amount }} zł/rok</span>
                </div>
              </div>
            </a>
          }
        </div>

        <div class="gsap-element">
          <!-- TODO: Paginator z elementami Tailwind zamiast Material -->
          <mat-paginator
            class="bg-[#161617] text-white rounded-2xl border border-white/5"
            [length]="totalCount"
            [pageSize]="20"
            [pageIndex]="currentPage - 1"
            (page)="onPageChange($event)"
            hidePageSize>
          </mat-paginator>
        </div>
      }
    </div>
  `
})
export class PolicyListComponent implements OnInit, AfterViewInit {
  private policyService = inject(PolicyService);
  private el = inject(ElementRef);

  loading = true;
  policies: Policy[] = [];
  totalCount = 0;
  currentPage = 1;
  searchQuery = '';
  statusFilter = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.loadPolicies(); }

  ngAfterViewInit() {
    this.animateElements();
  }

  animateElements() {
    const elements = this.el.nativeElement.querySelectorAll('.gsap-element');
    if (elements.length > 0) {
      gsap.fromTo(elements, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', overwrite: true }
      );
    }
  }

  loadPolicies(): void {
    this.loading = true;
    this.policyService.getPolicies(this.currentPage, this.statusFilter, this.searchQuery).subscribe({
      next: data => {
        this.policies = data.results;
        this.totalCount = data.count;
        this.loading = false;
        setTimeout(() => this.animateElements(), 50);
      },
      error: () => { this.loading = false; }
    });
  }

  onFilterChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadPolicies();
    }, 300);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.loadPolicies();
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
}
