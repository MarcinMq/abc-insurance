import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClaimService } from '../../../core/services/claim.service';
import { Claim, STATUS_CONFIG, ClaimStatus } from '../../../shared/models/claim.model';

@Component({
  selector: 'app-agent-queue',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatTableModule, MatProgressSpinnerModule, MatBadgeModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>
            <mat-icon>inbox</mat-icon>
            Kolejka szkód do rozpatrzenia
          </h1>
          <p class="subtitle">{{ claims.length }} szkód oczekuje na Twoją decyzję</p>
        </div>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!loading">
        <div *ngIf="claims.length === 0" class="empty-state">
          <mat-icon>check_circle</mat-icon>
          <h3>Kolejka pusta!</h3>
          <p>Wszystkie szkody zostały rozpatrzone.</p>
        </div>

        <div class="claims-list" *ngIf="claims.length > 0">
          <mat-card *ngFor="let claim of claims" class="claim-card"
                    [class.urgent]="isUrgent(claim)">
            <mat-card-content>
              <div class="claim-row">
                <div class="claim-status">
                  <mat-chip [style.background-color]="getStatusColor(claim.status)"
                            [style.color]="'white'">
                    {{ claim.status_display }}
                  </mat-chip>
                </div>
                <div class="claim-info">
                  <div class="claim-header">
                    <strong>{{ claim.claim_number }}</strong>
                    <span class="claim-type">{{ claim.incident_type_display }}</span>
                  </div>
                  <div class="claim-details">
                    <span><mat-icon>person</mat-icon> {{ claim.reported_by_name }}</span>
                    <span><mat-icon>policy</mat-icon> {{ claim.policy_number }}</span>
                    <span><mat-icon>event</mat-icon> {{ claim.incident_date | date:'d MMM y' }}</span>
                    <span><mat-icon>location_on</mat-icon> {{ claim.incident_location }}</span>
                  </div>
                </div>
                <div class="claim-amount">
                  <div class="amount-value">
                    {{ claim.estimated_damage | currency:'PLN':'symbol':'1.0-0':'pl' }}
                  </div>
                  <div class="amount-label">Szacowana szkoda</div>
                </div>
                <div class="claim-time">
                  <div class="time-value">{{ getWaitingTime(claim) }}</div>
                  <div class="time-label">Oczekuje</div>
                </div>
                <div class="claim-actions">
                  <a mat-raised-button color="primary"
                     [routerLink]="['/claims', claim.id]">
                    <mat-icon>open_in_new</mat-icon> Rozpatrz
                  </a>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { display: flex; align-items: center; gap: 8px;
      margin: 0; font-size: 24px; font-weight: 700; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }
    .claims-list { display: flex; flex-direction: column; gap: 12px; }
    .claim-card { transition: box-shadow 0.2s; }
    .claim-card.urgent { border-left: 4px solid #D32F2F; }
    .claim-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .claim-status { min-width: 160px; }
    .claim-info { flex: 1; min-width: 280px; }
    .claim-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .claim-header strong { font-size: 16px; }
    .claim-type { background: #E3F2FD; color: #1565C0; padding: 2px 8px;
      border-radius: 12px; font-size: 12px; }
    .claim-details { display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: #555; }
    .claim-details span { display: flex; align-items: center; gap: 4px; }
    .claim-details mat-icon { font-size: 14px; width: 14px; height: 14px; color: #999; }
    .claim-amount { text-align: center; min-width: 120px; }
    .amount-value { font-size: 20px; font-weight: 700; color: #1565C0; }
    .amount-label { font-size: 11px; color: #666; }
    .claim-time { text-align: center; min-width: 80px; }
    .time-value { font-size: 18px; font-weight: 700; color: #E65100; }
    .time-label { font-size: 11px; color: #666; }
    .claim-actions { min-width: 120px; }
    .empty-state { text-align: center; padding: 80px; color: #999; }
    .empty-state mat-icon { font-size: 80px; width: 80px; height: 80px;
      opacity: 0.3; color: #2E7D32; }
    .empty-state h3 { color: #2E7D32; }
  `],
})
export class AgentQueueComponent implements OnInit {
  claims: Claim[] = [];
  loading = false;

  constructor(private claimService: ClaimService) {}

  ngOnInit(): void {
    this.loading = true;
    this.claimService.getQueue().subscribe({
      next: (res) => {
        this.claims = res.results;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getStatusColor(status: ClaimStatus): string {
    return STATUS_CONFIG[status]?.color || '#666';
  }

  isUrgent(claim: Claim): boolean {
    if (!claim.submitted_at) return false;
    const days = (Date.now() - new Date(claim.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > 7;
  }

  getWaitingTime(claim: Claim): string {
    if (!claim.submitted_at) return '—';
    const hours = (Date.now() - new Date(claim.submitted_at).getTime()) / (1000 * 60 * 60);
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
}
