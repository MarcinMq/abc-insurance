import { Component, inject, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ClaimService } from '../../../core/services/claim.service';
import { PolicyService } from '../../../core/services/policy.service';
import { Policy } from '../../../core/models/policy.model';
import { INCIDENT_TYPE_LABELS } from '../../../core/models/claim.model';

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
  ],
  template: `
    <div class="max-w-[800px] mx-auto px-4 md:px-8 py-8 md:py-12">
      <div class="gsap-element mb-8">
        <a routerLink="/claims" class="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors group">
          <span class="material-icons text-[18px] mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Wróć do listy szkód
        </a>
      </div>

      <div class="gsap-element bg-[#161617] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
        <!-- Glow effect -->
        <div class="absolute right-0 top-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div class="p-8 md:p-10 border-b border-white/5">
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">Zgłoszenie szkody</h1>
          <p class="text-gray-400">Wypełnij poniższy formularz, aby zgłosić szkodę z Twojej polisy ubezpieczeniowej.</p>
        </div>

        <div class="p-8 md:p-10">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-6 relative z-10">

            <!-- Wybór polisy -->
            <div class="form-group gsap-form-item">
              <label class="block text-sm font-medium text-gray-300 mb-2 ml-1">Wybierz polisę <span class="text-red-500">*</span></label>
              <div class="relative">
                <select 
                  formControlName="policy"
                  [class.border-red-500]="form.get('policy')?.invalid && form.get('policy')?.touched"
                  class="w-full bg-[#1c1c1e] text-white border border-white/10 rounded-xl py-3 px-4 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <option [ngValue]="null" disabled selected>Wybierz polisę z listy...</option>
                  @if (loadingPolicies) {
                    <option disabled>Ładowanie polis...</option>
                  } @else {
                    @for (policy of policies; track policy.id) {
                      <option [value]="policy.id">
                        {{ policy.policy_number }} — {{ policy.product?.name || policy.product_name || 'Nieznany produkt' }}
                      </option>
                    }
                  }
                </select>
                <span class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  <span class="material-icons text-[20px]">expand_more</span>
                </span>
              </div>
              @if (form.get('policy')?.invalid && form.get('policy')?.touched) {
                <p class="text-red-400 text-xs mt-1.5 ml-1">Wybór polisy jest wymagany</p>
              }
            </div>

            <!-- Typ zdarzenia -->
            <div class="form-group gsap-form-item">
              <label class="block text-sm font-medium text-gray-300 mb-2 ml-1">Rodzaj zdarzenia <span class="text-red-500">*</span></label>
              <div class="relative">
                <select 
                  formControlName="incident_type"
                  [class.border-red-500]="form.get('incident_type')?.invalid && form.get('incident_type')?.touched"
                  class="w-full bg-[#1c1c1e] text-white border border-white/10 rounded-xl py-3 px-4 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <option value="" disabled selected>Wybierz rodzaj zdarzenia...</option>
                  @for (entry of incidentTypes; track entry.value) {
                    <option [value]="entry.value">{{ entry.label }}</option>
                  }
                </select>
                <span class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  <span class="material-icons text-[20px]">expand_more</span>
                </span>
              </div>
              @if (form.get('incident_type')?.invalid && form.get('incident_type')?.touched) {
                <p class="text-red-400 text-xs mt-1.5 ml-1">Rodzaj zdarzenia jest wymagany</p>
              }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 gsap-form-item">
              <!-- Data zdarzenia -->
              <div class="form-group">
                <label class="block text-sm font-medium text-gray-300 mb-2 ml-1">Data zdarzenia <span class="text-red-500">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 pointer-events-none">
                    <span class="material-icons text-[20px]">calendar_today</span>
                  </span>
                  <!-- Typ date z HTML5 zamiast mat-datepicker w celu uproszczenia (dziala ok w nowoczesnych przeglądarkach) -->
                  <input 
                    type="date" 
                    formControlName="incident_date"
                    [max]="todayString"
                    [class.border-red-500]="form.get('incident_date')?.invalid && form.get('incident_date')?.touched"
                    class="w-full bg-[#1c1c1e] text-white placeholder-gray-500 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]">
                </div>
                @if (form.get('incident_date')?.invalid && form.get('incident_date')?.touched) {
                  <p class="text-red-400 text-xs mt-1.5 ml-1">Podaj prawidłową datę zdarzenia (nie z przyszłości)</p>
                }
              </div>

              <!-- Szacowana kwota -->
              <div class="form-group">
                <label class="block text-sm font-medium text-gray-300 mb-2 ml-1">Szacowana kwota szkody <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input 
                    type="number" 
                    formControlName="estimated_damage" 
                    min="1" 
                    step="0.01"
                    placeholder="0.00"
                    [class.border-red-500]="form.get('estimated_damage')?.invalid && form.get('estimated_damage')?.touched"
                    class="w-full bg-[#1c1c1e] text-white placeholder-gray-600 border border-white/10 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 pointer-events-none font-medium">
                    zł
                  </span>
                </div>
                @if (form.get('estimated_damage')?.invalid && form.get('estimated_damage')?.touched) {
                  <p class="text-red-400 text-xs mt-1.5 ml-1">Podaj kwotę (min. 1 zł)</p>
                }
              </div>
            </div>

            <!-- Miejsce zdarzenia -->
            <div class="form-group gsap-form-item">
              <label class="block text-sm font-medium text-gray-300 mb-2 ml-1">Miejsce zdarzenia <span class="text-red-500">*</span></label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 pointer-events-none">
                  <span class="material-icons text-[20px]">place</span>
                </span>
                <input 
                  type="text" 
                  formControlName="incident_location" 
                  placeholder="np. Warszawa, ul. Marszałkowska 1"
                  [class.border-red-500]="form.get('incident_location')?.invalid && form.get('incident_location')?.touched"
                  class="w-full bg-[#1c1c1e] text-white placeholder-gray-600 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
              </div>
              @if (form.get('incident_location')?.invalid && form.get('incident_location')?.touched) {
                <p class="text-red-400 text-xs mt-1.5 ml-1">Podaj miejsce zdarzenia</p>
              }
            </div>

            <!-- Opis -->
            <div class="form-group gsap-form-item">
              <label class="block text-sm font-medium text-gray-300 mb-2 ml-1">Szczegółowy opis zdarzenia <span class="text-red-500">*</span></label>
              <textarea 
                formControlName="description" 
                rows="5"
                placeholder="Opisz jak najdokładniej przebieg zdarzenia, okoliczności oraz powstałe uszkodzenia..."
                [class.border-red-500]="form.get('description')?.invalid && form.get('description')?.touched"
                class="w-full bg-[#1c1c1e] text-white placeholder-gray-600 border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y min-h-[120px]"></textarea>
              @if (form.get('description')?.invalid && form.get('description')?.touched) {
                <p class="text-red-400 text-xs mt-1.5 ml-1">Opis jest wymagany i musi zawierać minimum 20 znaków</p>
              }
            </div>

            @if (errorMessage) {
              <div class="gsap-form-item flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mt-2">
                <span class="material-icons text-xl shrink-0">error_outline</span>
                <span class="text-sm">{{ errorMessage }}</span>
              </div>
            }

            <div class="gsap-form-item flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-white/5">
              <a routerLink="/claims" class="inline-flex justify-center items-center px-6 py-3 rounded-full bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-medium transition-colors">
                Anuluj
              </a>
              <button 
                type="submit" 
                [disabled]="loading || form.invalid"
                class="inline-flex justify-center items-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                @if (loading) {
                  <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Zapisywanie...
                } @else {
                  <span class="material-icons text-[20px]">save</span>
                  Zapisz jako robocze
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ClaimFormComponent implements OnInit, AfterViewInit {
  private claimService = inject(ClaimService);
  private policyService = inject(PolicyService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private el = inject(ElementRef);

  loading = false;
  loadingPolicies = true;
  errorMessage = '';
  policies: Policy[] = [];
  todayString: string;

  incidentTypes = Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  form: FormGroup = this.fb.group({
    policy: [null, Validators.required],
    incident_type: ['', Validators.required],
    incident_date: [null, Validators.required],
    incident_location: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    estimated_damage: [null, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    const d = new Date();
    this.todayString = d.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.policyService.getPolicies(1, 'active').subscribe({
      next: data => {
        this.policies = data.results;
        this.loadingPolicies = false;
      },
      error: () => { this.loadingPolicies = false; }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const parentElements = this.el.nativeElement.querySelectorAll('.gsap-element');
      const formItems = this.el.nativeElement.querySelectorAll('.gsap-form-item');

      gsap.fromTo(parentElements, 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );

      gsap.fromTo(formItems, 
        { y: 15, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', delay: 0.2 }
      );
    }, 50);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    this.errorMessage = '';

    const value = this.form.value;
    const payload = {
      ...value,
      incident_date: value.incident_date, // Jest juz stigniem YYYY-MM-DD z input type="date"
      estimated_damage: Number(value.estimated_damage),
    };

    this.claimService.createClaim(payload).subscribe({
      next: claim => this.router.navigate(['/claims', claim.id]),
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.detail || 'Błąd podczas zapisywania. Spróbuj ponownie.';
      }
    });
  }
}
