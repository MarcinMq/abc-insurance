import { Component, inject, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { gsap } from 'gsap';
import { ClaimService } from '../../../core/services/claim.service';
import { Claim, CLAIM_STATUS_LABELS, INCIDENT_TYPE_LABELS } from '../../../core/models/claim.model';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">
      <div class="gsap-element flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 class="text-3xl md:text-4xl font-semibold text-white tracking-tight">Moje szkody</h1>
          <p class="text-gray-400 mt-2 text-lg">Historia zgłoszonych roszczeń i incydentów</p>
        </div>
        <a routerLink="/claims/new" class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:-translate-y-0.5 mt-4 md:mt-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Zgłoś nową szkodę
        </a>
      </div>

      <!-- Filters -->
      <div class="gsap-element bg-[#161617] border border-white/5 rounded-2xl p-4 md:p-6 mb-8 shadow-xl flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Szukaj szkody</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
              <span class="material-icons text-[20px]">search</span>
            </span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onFilterChange()" 
              placeholder="Wpisz numer szkody..."
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
              @for (entry of statusOptions; track entry.value) {
                <option [value]="entry.value">{{ entry.label }}</option>
              }
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
      } @else if (claims.length === 0) {
        <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-16 text-center shadow-2xl">
          <div class="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6 text-gray-500">
            <span class="material-icons text-4xl">assignment</span>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">Brak szkód</h3>
          <p class="text-gray-400 mb-8">Nie masz jeszcze żadnych zgłoszonych roszczeń w systemie.</p>
          <a routerLink="/claims/new" class="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
            Zgłoś pierwszą szkodę
          </a>
        </div>
      } @else {
        <div class="bg-[#161617] border border-white/5 rounded-3xl shadow-2xl overflow-hidden mb-8">
          @for (claim of claims; track claim.id) {
            <a [routerLink]="['/claims', claim.id]" class="gsap-element block flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-5 md:p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group relative">
              
              <div class="w-full sm:w-auto min-w-[160px]">
                <h3 class="text-blue-400 font-mono font-medium text-lg shrink-0">{{ claim.claim_number }}</h3>
                <span [class]="'inline-block mt-2 sm:hidden px-3 py-1 rounded-full text-xs font-medium border ' + getStatusClasses(claim.status)">
                  {{ getStatusLabel(claim.status) }}
                </span>
              </div>

              <div class="flex-1 min-w-0 w-full">
                <div class="text-white font-medium text-base mb-1">{{ getIncidentLabel(claim.incident_type) }}</div>
                <div class="flex items-center gap-2 text-gray-400 text-sm truncate">
                  <span class="material-icons text-[16px]">event</span>
                  {{ claim.incident_date | date:'dd.MM.yyyy' }}
                  <span class="px-1">&bull;</span>
                  <span class="material-icons text-[16px]">place</span>
                  <span class="truncate">{{ claim.incident_location }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 sm:shrink-0 mt-4 sm:mt-0">
                <div class="text-left sm:text-right">
                  <div class="text-xs text-gray-500 mb-1">Szacowana kwota</div>
                  <div class="text-white font-medium text-lg whitespace-nowrap">{{ claim.estimated_damage }} zł</div>
                </div>

                <div class="hidden sm:block">
                  <span [class]="'px-3 py-1 rounded-full text-xs font-medium border ' + getStatusClasses(claim.status)">
                    {{ getStatusLabel(claim.status) }}
                  </span>
                </div>
                
                <span class="material-icons text-gray-600 group-hover:text-white transition-colors">chevron_right</span>
              </div>
            </a>
          }
        </div>

        <div class="gsap-element">
          <!-- TODO: Paginator z elementami Tailwind -->
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
export class ClaimListComponent implements OnInit, AfterViewInit {
  private claimService = inject(ClaimService);
  private el = inject(ElementRef);

  loading = true;
  claims: Claim[] = [];
  totalCount = 0;
  currentPage = 1;
  searchQuery = '';
  statusFilter = '';

  statusOptions = Object.entries(CLAIM_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.loadClaims(); }

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

  loadClaims(): void {
    this.loading = true;
    this.claimService.getClaims(this.currentPage, this.statusFilter, this.searchQuery).subscribe({
      next: data => {
        this.claims = data.results;
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
      this.loadClaims();
    }, 300);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.loadClaims();
  }

  getStatusClasses(status: string): string {
    const classes: Record<string, string> = {
      draft: 'bg-white/5 text-gray-400 border-white/10',
      submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      under_review: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      additional_info: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      approved: 'bg-green-500/10 text-green-400 border-green-500/20',
      partially_approved: 'bg-green-500/5 text-green-300 border-green-500/10',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
      paid: 'bg-green-500/10 text-green-400 border-green-500/20',
      closed: 'bg-white/5 text-gray-400 border-white/10'
    };
    return classes[status] || classes['draft'];
  }

  getStatusLabel(status: string): string {
    return CLAIM_STATUS_LABELS[status as keyof typeof CLAIM_STATUS_LABELS] || status;
  }

  getIncidentLabel(type: string): string {
    return INCIDENT_TYPE_LABELS[type as keyof typeof INCIDENT_TYPE_LABELS] || type;
  }
}
