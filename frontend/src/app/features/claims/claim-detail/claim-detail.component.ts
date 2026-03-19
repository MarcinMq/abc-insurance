import { Component, inject, OnInit, AfterViewInit, ElementRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthService } from '../../../core/services/auth.service';
import { Claim, CLAIM_STATUS_LABELS, INCIDENT_TYPE_LABELS } from '../../../core/models/claim.model';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
  ],
  template: `
    <div class="max-w-[1000px] mx-auto px-4 md:px-8 py-8 md:py-12">
      <div class="gsap-element mb-8">
        <a routerLink="/claims" class="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors group">
          <span class="material-icons text-[18px] mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Wróć do listy szkód
        </a>
      </div>

      @if (loading) {
        <div class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      } @else if (claim) {
        <!-- Nagłówek szkody -->
        <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-6 md:p-8 mb-6 shadow-2xl relative overflow-hidden">
          <div class="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <p class="text-blue-400 font-mono text-sm mb-2">{{ claim.claim_number }}</p>
              <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">{{ getIncidentLabel(claim.incident_type) }}</h1>
              <p class="text-gray-400 text-sm">Zgłoszone przez: <span class="text-gray-300">{{ claim.reported_by_name }}</span></p>
            </div>
            
            <div>
              <span [class]="'px-4 py-1.5 rounded-full text-sm font-medium border ' + getStatusClasses(claim.status)">
                {{ getStatusLabel(claim.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Szczegóły zdarzenia -->
          <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col">
            <h3 class="text-lg font-semibold text-white mb-4">Szczegóły zdarzenia</h3>
            
            <div class="space-y-4 mb-6">
              <div class="flex justify-between items-center py-3 border-b border-white/5">
                <span class="text-gray-400 text-sm">Data zdarzenia</span>
                <span class="text-white font-medium">{{ claim.incident_date | date:'dd.MM.yyyy' }}</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-white/5">
                <span class="text-gray-400 text-sm">Miejsce</span>
                <span class="text-white font-medium">{{ claim.incident_location }}</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-white/5">
                <span class="text-gray-400 text-sm">Szacowana kwota</span>
                <span class="text-white font-medium">{{ claim.estimated_damage }} zł</span>
              </div>
              @if (claim.approved_amount) {
                <div class="flex justify-between items-center py-3 border-b border-white/5">
                  <span class="text-gray-400 text-sm">Zatwierdzona kwota</span>
                  <span class="text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">{{ claim.approved_amount }} zł</span>
                </div>
              }
              @if (claim.assigned_agent_name) {
                <div class="flex justify-between items-center py-3">
                  <span class="text-gray-400 text-sm">Przypisany agent</span>
                  <span class="text-gray-300">{{ claim.assigned_agent_name }}</span>
                </div>
              }
            </div>

            @if (claim.description) {
              <div class="mt-auto">
                <h4 class="text-sm font-semibold text-gray-400 mb-2">Opis zdarzenia</h4>
                <div class="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-gray-300 text-sm leading-relaxed">
                  {{ claim.description }}
                </div>
              </div>
            }

            @if (claim.agent_notes && auth.isAgent()) {
              <div class="mt-4">
                <h4 class="text-sm font-semibold text-yellow-500/80 mb-2">Notatki agenta</h4>
                <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-100/90 text-sm leading-relaxed">
                  {{ claim.agent_notes }}
                </div>
              </div>
            }

            @if (claim.rejection_reason) {
              <div class="mt-4">
                <h4 class="text-sm font-semibold text-red-400 mb-2">Powód odrzucenia</h4>
                <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200 text-sm leading-relaxed">
                  {{ claim.rejection_reason }}
                </div>
              </div>
            }
          </div>

          <!-- Historia statusów -->
          <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h3 class="text-lg font-semibold text-white mb-6">Historia zmian</h3>
            
            <div class="relative border-l border-white/10 ml-3 md:ml-4 space-y-6 pb-4">
              @for (entry of claim.status_history; track entry.id) {
                <div class="relative pl-6 md:pl-8">
                  <div class="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#161617]"></div>
                  
                  <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-colors hover:bg-white/[0.04]">
                    <div class="flex items-center flex-wrap gap-2 mb-2">
                      @if (entry.old_status) {
                        <span [class]="'px-2 py-0.5 rounded text-[10px] font-medium border ' + getStatusClasses(entry.old_status)">
                          {{ getStatusLabel(entry.old_status) }}
                        </span>
                        <span class="material-icons text-[14px] text-gray-500">arrow_forward</span>
                      }
                      <span [class]="'px-2 py-0.5 rounded text-[10px] font-medium border ' + getStatusClasses(entry.new_status)">
                        {{ getStatusLabel(entry.new_status) }}
                      </span>
                    </div>
                    
                    <div class="text-xs text-gray-500 mb-2">
                      {{ entry.changed_by_name }} &bull; {{ entry.changed_at | date:'dd.MM.yyyy HH:mm' }}
                    </div>
                    
                    @if (entry.comment) {
                      <div class="text-sm text-gray-400 italic">
                        "{{ entry.comment }}"
                      </div>
                    }
                  </div>
                </div>
              }
              
              @if (!claim.status_history || claim.status_history.length === 0) {
                 <div class="pl-6 md:pl-8 text-gray-500 text-sm italic">
                    Brak historii zmian dla tej szkody.
                 </div>
              }
            </div>
          </div>
        </div>

        <!-- Akcje klienta -->
        @if (!auth.isAgent() && claim.status === 'draft') {
          <div class="gsap-element bg-[#161617] border border-blue-500/20 rounded-3xl p-6 shadow-2xl">
            <h3 class="text-lg font-semibold text-white mb-4">Wymagane działanie</h3>
            <p class="text-gray-400 text-sm mb-6">Szkoda ma status roboczy. Wyślij ją do rozpatrzenia przez naszych agentów.</p>
            
            <button 
              (click)="submitClaim()" 
              [disabled]="actionLoading"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              @if (actionLoading) {
                <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Wysyłanie...
              } @else {
                <span class="material-icons text-[20px]">send</span>
                Wyślij szkodę do rozpatrzenia
              }
            </button>
          </div>
        }

        <!-- Akcje agenta -->
        @if (auth.isAgent() && ['submitted', 'under_review', 'additional_info'].includes(claim.status)) {
          <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h3 class="text-lg font-semibold text-white mb-4">Zarządzanie szkodą (Agent)</h3>
            <div class="flex flex-wrap gap-3">
              @if (claim.status === 'submitted') {
                <button 
                  (click)="changeStatus('under_review')"
                  [disabled]="actionLoading"
                  class="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50">
                  Rozpocznij ocenę
                </button>
              }
              @if (claim.status === 'under_review' || claim.status === 'additional_info') {
                <button 
                  (click)="changeStatus('approved')"
                  [disabled]="actionLoading"
                  class="px-5 py-2.5 rounded-full bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50">
                  Zatwierdź
                </button>
                <button 
                  (click)="changeStatus('additional_info')"
                  [disabled]="actionLoading"
                  class="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors disabled:opacity-50">
                  Poproś o uzupełnienie
                </button>
                <button 
                  (click)="changeStatus('rejected')"
                  [disabled]="actionLoading"
                  class="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50">
                  Odrzuć
                </button>
              }
            </div>
          </div>
        }
      } @else {
        <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl p-16 text-center shadow-2xl max-w-lg mx-auto mt-10">
          <div class="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
            <span class="material-icons text-4xl">error_outline</span>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">Szkoda nie została znaleziona</h3>
          <p class="text-gray-400 mb-8">Zgłoszenie o podanym identyfikatorze nie istnieje lub nie masz do niego dostępu.</p>
          <a routerLink="/claims" class="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
            Wróć do listy
          </a>
        </div>
      }
    </div>
  `
})
export class ClaimDetailComponent implements OnInit, AfterViewInit {
  id = input.required<string>();

  private claimService = inject(ClaimService);
  auth = inject(AuthService);
  private el = inject(ElementRef);

  loading = true;
  actionLoading = false;
  claim: Claim | null = null;

  ngOnInit(): void { this.loadClaim(); }

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

  loadClaim(): void {
    this.claimService.getClaim(Number(this.id())).subscribe({
      next: data => { 
        this.claim = data; 
        this.loading = false;
        setTimeout(() => this.animateElements(), 50);
      },
      error: () => { this.loading = false; }
    });
  }

  submitClaim(): void {
    if (!this.claim) return;
    this.actionLoading = true;
    this.claimService.submitClaim(this.claim.id).subscribe({
      next: data => { this.claim = data; this.actionLoading = false; },
      error: () => { this.actionLoading = false; }
    });
  }

  changeStatus(newStatus: string): void {
    if (!this.claim) return;
    this.actionLoading = true;
    this.claimService.updateClaimStatus(this.claim.id, newStatus).subscribe({
      next: data => { this.claim = data; this.actionLoading = false; },
      error: () => { this.actionLoading = false; }
    });
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
