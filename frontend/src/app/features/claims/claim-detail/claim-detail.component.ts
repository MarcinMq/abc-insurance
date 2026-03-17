import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthService } from '../../../core/services/auth.service';
import { Claim, STATUS_CONFIG, ClaimStatus, AllowedNextStatus } from '../../../shared/models/claim.model';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatListModule, MatDialogModule,
    MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatExpansionModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container" *ngIf="claim; else loading">
      <!-- Nagłówek -->
      <div class="page-header">
        <div class="breadcrumb">
          <a routerLink="/claims" mat-button>
            <mat-icon>arrow_back</mat-icon> Szkody
          </a>
        </div>
        <div class="header-info">
          <div>
            <h1>{{ claim.claim_number }}</h1>
            <p class="subtitle">{{ claim.incident_type_display }} · {{ claim.incident_date | date:'d MMMM y' }}</p>
          </div>
          <div class="status-section">
            <mat-chip [style.background-color]="getStatusColor(claim.status)"
                      [style.color]="'white'" class="status-chip-lg">
              <mat-icon>{{ getStatusIcon(claim.status) }}</mat-icon>
              {{ claim.status_display }}
            </mat-chip>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Główne informacje -->
        <div class="main-col">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Szczegóły zdarzenia</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Polisa</span>
                  <a [routerLink]="['/policies', claim.policy?.id]" class="link">
                    {{ claim.policy?.policy_number || claim.policy_number }}
                  </a>
                </div>
                <div class="info-item">
                  <span class="info-label">Typ ubezpieczenia</span>
                  <span>{{ claim.policy?.product_name || claim.policy?.product?.name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Data zdarzenia</span>
                  <span>{{ claim.incident_date | date:'d MMMM y' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Miejsce zdarzenia</span>
                  <span>{{ claim.incident_location }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Szacowana szkoda</span>
                  <strong>{{ claim.estimated_damage | currency:'PLN':'symbol':'1.2-2':'pl' }}</strong>
                </div>
                <div class="info-item" *ngIf="claim.approved_amount">
                  <span class="info-label">Zatwierdzona kwota</span>
                  <strong class="approved-amount">
                    {{ claim.approved_amount | currency:'PLN':'symbol':'1.2-2':'pl' }}
                  </strong>
                </div>
              </div>
              <mat-divider></mat-divider>
              <div class="description-section">
                <h4>Opis zdarzenia</h4>
                <p>{{ claim.description }}</p>
              </div>
              <div *ngIf="claim.rejection_reason" class="rejection-box">
                <mat-icon>cancel</mat-icon>
                <div>
                  <strong>Powód odrzucenia:</strong>
                  <p>{{ claim.rejection_reason }}</p>
                </div>
              </div>
              <div *ngIf="claim.agent_notes && auth.isAgent" class="agent-notes-box">
                <mat-icon>note</mat-icon>
                <div>
                  <strong>Notatki agenta:</strong>
                  <p>{{ claim.agent_notes }}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Dokumenty -->
          <mat-card class="mt-16">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>attach_file</mat-icon> Dokumenty
              </mat-card-title>
              <button mat-button color="primary" (click)="openUploadDialog()"
                      *ngIf="canUploadDocuments()">
                <mat-icon>upload</mat-icon> Dodaj
              </button>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="!claim.documents?.length" class="empty-docs">
                <mat-icon>folder_open</mat-icon>
                <p>Brak dokumentów</p>
              </div>
              <mat-list *ngIf="claim.documents?.length">
                <mat-list-item *ngFor="let doc of claim.documents">
                  <mat-icon matListItemIcon>description</mat-icon>
                  <span matListItemTitle>{{ doc.title }}</span>
                  <span matListItemLine>{{ doc.document_type_display }} · {{ doc.uploaded_at | date:'d MMM y' }}</span>
                  <a mat-icon-button matListItemMeta [href]="doc.file" target="_blank">
                    <mat-icon>download</mat-icon>
                  </a>
                </mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Sidebar -->
        <div class="sidebar-col">
          <!-- Akcje dla klienta -->
          <mat-card *ngIf="!auth.isAgent && claim.status === 'draft'">
            <mat-card-content>
              <div class="action-info">
                <mat-icon color="primary">info</mat-icon>
                <p>Szkoda jest w stanie roboczym. Prześlij ją do rozpatrzenia.</p>
              </div>
              <button mat-raised-button color="primary" class="full-width"
                      (click)="submitClaim()" [disabled]="actionLoading">
                <mat-icon>send</mat-icon> Wyślij do rozpatrzenia
              </button>
            </mat-card-content>
          </mat-card>

          <!-- Panel agenta: zmiana statusu -->
          <mat-card *ngIf="auth.isAgent && claim.allowed_next_statuses?.length">
            <mat-card-header>
              <mat-card-title>Zarządzanie szkodą</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="statusForm" (ngSubmit)="updateStatus()" class="agent-form">

                <div class="af-group">
                  <label class="af-label">Nowy status</label>
                  <div class="af-select-wrap">
                    <mat-icon class="af-icon">swap_horiz</mat-icon>
                    <select formControlName="status" class="af-select">
                      <option value="">— Wybierz status —</option>
                      <option *ngFor="let s of claim.allowed_next_statuses" [value]="s.value">
                        {{ s.label }}
                      </option>
                    </select>
                    <mat-icon class="af-arrow">expand_more</mat-icon>
                  </div>
                </div>

                <div class="af-group" *ngIf="requiresAmount">
                  <label class="af-label">Kwota do wypłaty (PLN)</label>
                  <div class="af-input-wrap">
                    <mat-icon class="af-icon">monetization_on</mat-icon>
                    <input type="number" formControlName="approved_amount" class="af-input"
                           placeholder="0.00" min="0.01" />
                    <span class="af-suffix">PLN</span>
                  </div>
                  <span class="af-hint">Max: {{ claim.estimated_damage | currency:'PLN':'symbol':'1.0-0':'pl' }}</span>
                </div>

                <div class="af-group" *ngIf="requiresRejectionReason">
                  <label class="af-label">Powód odrzucenia</label>
                  <div class="af-input-wrap af-textarea-wrap">
                    <textarea formControlName="rejection_reason" class="af-textarea"
                              rows="3" placeholder="Opisz powód odrzucenia..."></textarea>
                  </div>
                </div>

                <div class="af-group">
                  <label class="af-label">Komentarz (opcjonalny)</label>
                  <div class="af-input-wrap af-textarea-wrap">
                    <textarea formControlName="comment" class="af-textarea"
                              rows="2" placeholder="Dodaj komentarz..."></textarea>
                  </div>
                </div>

                <button mat-raised-button color="primary" type="submit"
                        class="full-width" [disabled]="statusForm.invalid || actionLoading">
                  <mat-spinner *ngIf="actionLoading" diameter="20"></mat-spinner>
                  <span *ngIf="!actionLoading">Zmień status</span>
                </button>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Informacje o zgłaszającym -->
          <mat-card class="mt-16">
            <mat-card-header>
              <mat-card-title>Klient</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-item">
                <span class="info-label">Imię i nazwisko</span>
                <span>{{ claim.reported_by?.full_name }}</span>
              </div>
              <div class="info-item" *ngIf="auth.isAgent">
                <span class="info-label">Email</span>
                <span>{{ claim.reported_by?.email }}</span>
              </div>
              <div class="info-item" *ngIf="claim.assigned_agent">
                <span class="info-label">Przypisany agent</span>
                <span>{{ claim.assigned_agent?.full_name }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Historia statusów -->
          <mat-card class="mt-16">
            <mat-card-header>
              <mat-card-title>Historia zmian</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="timeline">
                <div *ngFor="let entry of claim.status_history" class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-title">
                      {{ entry.new_status_display }}
                    </div>
                    <div class="timeline-meta">
                      {{ entry.changed_by_name }} · {{ entry.changed_at | date:'d MMM y, HH:mm' }}
                    </div>
                    <div class="timeline-comment" *ngIf="entry.comment">
                      {{ entry.comment }}
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-container">
        <mat-spinner></mat-spinner>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .breadcrumb { margin-bottom: 8px; }
    .header-info { display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .status-chip-lg { font-size: 14px; height: 36px; padding: 0 12px;
      display: flex; align-items: center; gap: 6px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 8px 0 16px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .description-section { padding: 16px 0 0; }
    .description-section h4 { margin: 0 0 8px; font-size: 13px; color: #666;
      text-transform: uppercase; }
    .rejection-box { display: flex; gap: 12px; background: #FFEBEE; padding: 16px;
      border-radius: 8px; margin-top: 16px; color: #C62828; }
    .agent-notes-box { display: flex; gap: 12px; background: #E8F5E9; padding: 16px;
      border-radius: 8px; margin-top: 16px; }
    .action-info { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 16px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .mt-16 { margin-top: 16px; }
    .approved-amount { color: #2E7D32; font-size: 16px; }
    .link { color: #1565C0; text-decoration: none; }
    .empty-docs { text-align: center; padding: 24px; color: #999; }
    .empty-docs mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.3; display: block;
      margin: 0 auto 8px; }
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-item { display: flex; gap: 12px; padding-bottom: 16px;
      border-left: 2px solid #e0e0e0; margin-left: 8px; padding-left: 16px; position: relative; }
    .timeline-dot { width: 12px; height: 12px; background: #1565C0; border-radius: 50%;
      position: absolute; left: -7px; top: 4px; }
    .timeline-title { font-weight: 600; font-size: 14px; }
    .timeline-meta { font-size: 12px; color: #666; }
    .timeline-comment { font-size: 13px; color: #444; margin-top: 4px;
      background: #f5f7fa; padding: 6px 8px; border-radius: 4px; }
    .loading-container { display: flex; justify-content: center; padding: 80px; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }

    /* Agent form custom inputs */
    .agent-form { display: flex; flex-direction: column; gap: 12px; }
    .af-group { display: flex; flex-direction: column; gap: 5px; }
    .af-label { font-size: 12px; font-weight: 600; color: #475569; }
    .af-select-wrap, .af-input-wrap {
      display: flex; align-items: center;
      border: 1.5px solid #e2e8f0; border-radius: 8px;
      background: #f8fafc; overflow: hidden; transition: border-color .2s;
    }
    .af-select-wrap:focus-within, .af-input-wrap:focus-within {
      border-color: #4f46e5; background: white;
    }
    .af-textarea-wrap { align-items: flex-start; }
    .af-icon { color: #94a3b8; margin: 0 8px; font-size: 16px; flex-shrink: 0; }
    .af-arrow { color: #94a3b8; margin: 0 8px; font-size: 16px; pointer-events: none; flex-shrink: 0; }
    .af-select {
      flex: 1; border: none; background: none; padding: 9px 4px;
      font-size: 13px; color: #0f172a; outline: none; font-family: inherit;
      cursor: pointer; appearance: none;
    }
    .af-input {
      flex: 1; border: none; background: none; padding: 9px 4px;
      font-size: 13px; color: #0f172a; outline: none; font-family: inherit;
    }
    .af-suffix { padding: 0 10px; font-size: 12px; font-weight: 600; color: #94a3b8; }
    .af-textarea {
      flex: 1; border: none; background: none; padding: 9px;
      font-size: 13px; color: #0f172a; outline: none; font-family: inherit;
      resize: vertical; width: 100%;
    }
    .af-hint { font-size: 11px; color: #94a3b8; }
  `],
})
export class ClaimDetailComponent implements OnInit {
  claim: Claim | null = null;
  statusForm: FormGroup;
  actionLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private claimService: ClaimService,
    public auth: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      comment: [''],
      approved_amount: [null],
      rejection_reason: [''],
    });

    this.statusForm.get('status')?.valueChanges.subscribe((val) => {
      const approvedCtrl = this.statusForm.get('approved_amount');
      const rejCtrl = this.statusForm.get('rejection_reason');
      if (['approved', 'partially_approved'].includes(val)) {
        approvedCtrl?.setValidators([Validators.required, Validators.min(0.01)]);
      } else {
        approvedCtrl?.clearValidators();
      }
      if (val === 'rejected') {
        rejCtrl?.setValidators(Validators.required);
      } else {
        rejCtrl?.clearValidators();
      }
      approvedCtrl?.updateValueAndValidity();
      rejCtrl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.claimService.getClaim(id).subscribe((claim) => {
      this.claim = claim;
    });
  }

  get requiresAmount(): boolean {
    const s = this.statusForm.get('status')?.value;
    return ['approved', 'partially_approved'].includes(s);
  }

  get requiresRejectionReason(): boolean {
    return this.statusForm.get('status')?.value === 'rejected';
  }

  getStatusColor(status: ClaimStatus): string {
    return STATUS_CONFIG[status]?.color || '#666';
  }

  getStatusIcon(status: ClaimStatus): string {
    return STATUS_CONFIG[status]?.icon || 'info';
  }

  canUploadDocuments(): boolean {
    if (!this.claim) return false;
    if (['closed', 'paid'].includes(this.claim.status)) return false;
    if (this.auth.isAgent) return true;
    return this.claim.reported_by?.id === this.auth.currentUser?.id;
  }

  submitClaim(): void {
    if (!this.claim) return;
    this.actionLoading = true;
    this.claimService.submitClaim(this.claim.id).subscribe({
      next: (updated) => {
        this.claim = updated;
        this.actionLoading = false;
        this.snackBar.open('Szkoda wysłana do rozpatrzenia.', 'OK', { duration: 3000 });
      },
      error: () => { this.actionLoading = false; },
    });
  }

  updateStatus(): void {
    if (!this.claim || this.statusForm.invalid) return;
    this.actionLoading = true;
    const data = this.statusForm.value;
    this.claimService.updateClaimStatus(this.claim.id, data).subscribe({
      next: (updated) => {
        this.claim = updated;
        this.statusForm.reset();
        this.actionLoading = false;
        this.snackBar.open('Status szkody zmieniony.', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.actionLoading = false;
        const msg = err.error?.non_field_errors?.[0] || 'Błąd zmiany statusu.';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  openUploadDialog(): void {
    // Uproszczona wersja — w pełnym projekcie tu byłby MatDialog
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file && this.claim) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('document_type', 'other');
        this.claimService.uploadDocument(this.claim.id, formData).subscribe(() => {
          this.snackBar.open('Dokument dodany.', 'OK', { duration: 3000 });
          this.claimService.getClaim(this.claim!.id).subscribe((c) => (this.claim = c));
        });
      }
    };
    input.click();
  }
}
