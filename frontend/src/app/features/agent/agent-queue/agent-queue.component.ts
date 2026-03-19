import { Component, inject, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ClaimService } from '../../../core/services/claim.service';
import { Claim, CLAIM_STATUS_LABELS, INCIDENT_TYPE_LABELS } from '../../../core/models/claim.model';

@Component({
  selector: 'app-agent-queue',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
  ],
  template: `
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">
      <div class="gsap-element page-header mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Kolejka szkód</h1>
          <p class="text-gray-400 text-lg">Szkody oczekujące na rozpatrzenie</p>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex justify-center items-center text-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            {{ totalCount }}
          </div>
          <span class="text-gray-400 text-sm md:text-base font-medium">szkód do obsłużenia</span>
        </div>
      </div>

      @if (loading) {
        <div class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      } @else if (claims.length === 0) {
        <div class="gsap-element empty-state bg-[#161617] border border-white/5 rounded-3xl p-16 text-center shadow-2xl relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent opacity-50"></div>
          
          <div class="relative z-10 max-w-lg mx-auto">
            <div class="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-6 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <span class="material-icons text-4xl">check_circle</span>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Kolejka pusta!</h3>
            <p class="text-gray-400">Wszystkie szkody zostały rozpatrzone. Dobra robota.</p>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          @for (claim of claims; track claim.id) {
            <div class="gsap-element relative group bg-[#161617] border border-white/5 rounded-3xl p-6 shadow-xl transition-all hover:bg-white/[0.02] hover:border-white/10 flex flex-col h-full overflow-hidden">
              
              <!-- Subtle accent line on top -->
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/80 to-purple-500/80 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div class="flex justify-between items-start mb-6">
                <div>
                  <div class="text-blue-400 font-mono font-bold">{{ claim.claim_number }}</div>
                  <div class="text-xs text-gray-500 mt-1">Polisa: {{ claim.policy_number }}</div>
                </div>
                <span [class]="'px-3 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ' + getStatusClasses(claim.status)">
                  {{ getStatusLabel(claim.status) }}
                </span>
              </div>

              <div class="flex items-center gap-2 mb-4">
                <span class="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                  {{ getIncidentLabel(claim.incident_type) }}
                </span>
              </div>

              <div class="space-y-3 mb-6 flex-grow">
                <div class="flex items-start gap-3">
                  <span class="material-icons text-gray-500 text-[18px]">person</span>
                  <span class="text-gray-300 text-sm">{{ claim.reported_by_name }}</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="material-icons text-gray-500 text-[18px]">event</span>
                  <span class="text-gray-300 text-sm">{{ claim.incident_date | date:'dd.MM.yyyy' }}</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="material-icons text-gray-500 text-[18px]">location_on</span>
                  <span class="text-gray-300 text-sm">{{ claim.incident_location }}</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="material-icons text-gray-500 text-[18px]">payments</span>
                  <span class="text-white font-semibold text-sm">{{ claim.estimated_damage }} zł</span>
                </div>
              </div>

              <div class="mt-auto pt-5 border-t border-white/5 flex flex-wrap gap-3 items-center justify-between">
                @if (!claim.assigned_agent) {
                  <button 
                    (click)="assignToMe(claim)" 
                    [disabled]="assigning === claim.id"
                    class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-blue-500/30 text-blue-400 font-medium text-sm hover:bg-blue-500/10 transition-colors disabled:opacity-50">
                    <span class="material-icons text-[16px]">person_add</span>
                    Przypisz mi
                  </button>
                } @else {
                  <span class="inline-flex items-center gap-1.5 text-green-400 font-medium text-sm">
                    <span class="material-icons text-[16px]">check_circle</span>
                    Przypisane: {{ claim.assigned_agent_name }}
                  </span>
                }
                
                <a [routerLink]="['/claims', claim.id]" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors">
                   Rozpatrz
                   <span class="material-icons text-[16px]">arrow_forward</span>
                </a>
              </div>
            </div>
          }
        </div>

        @if (totalPages > 1) {
          <div class="flex justify-center items-center gap-2 mt-8">
            <button 
              (click)="onPageChange(currentPage - 1)" 
              [disabled]="currentPage === 1"
              class="w-10 h-10 rounded-full flex items-center justify-center bg-[#161617] border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-icons">chevron_left</span>
            </button>
            <span class="text-sm font-medium text-gray-400 px-4">Strona <span class="text-white">{{ currentPage }}</span> z {{ totalPages }}</span>
            <button 
              (click)="onPageChange(currentPage + 1)" 
              [disabled]="currentPage === totalPages"
              class="w-10 h-10 rounded-full flex items-center justify-center bg-[#161617] border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        }
      }
    </div>
  `
})
export class AgentQueueComponent implements OnInit, AfterViewInit {
  private claimService = inject(ClaimService);
  private el = inject(ElementRef);

  loading = true;
  claims: Claim[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 20; // Stały rozmiar strony tak jak na backendzie
  assigning: number | null = null;

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  ngOnInit(): void { this.loadQueue(); }

  ngAfterViewInit() {
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

  loadQueue(): void {
    this.loading = true;
    this.claimService.getAgentQueue(this.currentPage).subscribe({
      next: data => {
        this.claims = data.results;
        this.totalCount = data.count;
        this.loading = false;
        setTimeout(() => this.animateElements(), 50);
      },
      error: () => { this.loading = false; }
    });
  }

  assignToMe(claim: Claim): void {
    this.assigning = claim.id;
    this.claimService.assignClaim(claim.id, 0).subscribe({
      next: updated => {
        const idx = this.claims.findIndex(c => c.id === claim.id);
        if (idx !== -1) this.claims[idx] = updated;
        this.assigning = null;
      },
      error: () => { this.assigning = null; }
    });
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
        this.currentPage = newPage;
        this.loadQueue();
    }
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
