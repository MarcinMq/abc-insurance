import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ClaimService } from '../../core/services/claim.service';
import { PolicyService } from '../../core/services/policy.service';
import { Claim, CLAIM_STATUS_LABELS } from '../../core/models/claim.model';
import { Policy, POLICY_STATUS_LABELS } from '../../core/models/policy.model';
import { forkJoin } from 'rxjs';

const API = 'http://localhost:8000/api';

type Tab = 'overview' | 'users' | 'policies' | 'claims';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-[#0a0a0b] text-white">

      <!-- Header -->
      <header class="border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-40">
        <div class="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <a routerLink="/dashboard" class="text-[#86868b] hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
              </svg>
            </a>
            <div class="w-px h-4 bg-white/10"></div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-md bg-[#bf5af2]/15 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-[#bf5af2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                </svg>
              </div>
              <span class="text-[15px] font-semibold">Panel admina</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-[#bf5af2]"></div>
            <span class="text-[13px] text-[#86868b]">{{ auth.user()?.first_name }} {{ auth.user()?.last_name }}</span>
          </div>
        </div>
      </header>

      <div class="max-w-[1280px] mx-auto px-6 py-8">

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-[#111112] border border-white/[0.06] rounded-2xl p-5">
            <div class="w-8 h-8 rounded-xl bg-[#0a84ff]/10 flex items-center justify-center mb-3">
              <svg class="w-4 h-4 text-[#0a84ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
              </svg>
            </div>
            <div class="text-2xl font-bold text-white">{{ stats.users }}</div>
            <div class="text-[13px] text-[#86868b] mt-0.5">Użytkowników</div>
          </div>
          <div class="bg-[#111112] border border-white/[0.06] rounded-2xl p-5">
            <div class="w-8 h-8 rounded-xl bg-[#30d158]/10 flex items-center justify-center mb-3">
              <svg class="w-4 h-4 text-[#30d158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
              </svg>
            </div>
            <div class="text-2xl font-bold text-white">{{ stats.policies }}</div>
            <div class="text-[13px] text-[#86868b] mt-0.5">Polis</div>
          </div>
          <div class="bg-[#111112] border border-white/[0.06] rounded-2xl p-5">
            <div class="w-8 h-8 rounded-xl bg-[#ff9f0a]/10 flex items-center justify-center mb-3">
              <svg class="w-4 h-4 text-[#ff9f0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <div class="text-2xl font-bold text-white">{{ stats.claims }}</div>
            <div class="text-[13px] text-[#86868b] mt-0.5">Szkód</div>
          </div>
          <div class="bg-[#111112] border border-white/[0.06] rounded-2xl p-5">
            <div class="w-8 h-8 rounded-xl bg-[#ff453a]/10 flex items-center justify-center mb-3">
              <svg class="w-4 h-4 text-[#ff453a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="text-2xl font-bold text-white">{{ stats.pendingClaims }}</div>
            <div class="text-[13px] text-[#86868b] mt-0.5">Oczekujących szkód</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-1 bg-[#111112] border border-white/[0.06] rounded-xl p-1 mb-6 w-fit">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab = tab.id"
                    class="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all"
                    [class.bg-white]="activeTab === tab.id"
                    [class.text-black]="activeTab === tab.id"
                    [class.text-\[#86868b\]]="activeTab !== tab.id"
                    [class.hover\:text-white]="activeTab !== tab.id">
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Loading -->
        @if (loading) {
          <div class="flex items-center justify-center py-24">
            <div class="w-8 h-8 border-2 border-[#bf5af2] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }

        <!-- Users Tab -->
        @if (!loading && activeTab === 'users') {
          <div class="bg-[#111112] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div class="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 class="text-[15px] font-semibold">Użytkownicy ({{ users.length }})</h2>
              <button (click)="openAddModal()"
                      class="inline-flex items-center gap-2 h-8 px-4 rounded-lg bg-[#bf5af2]/15 text-[#bf5af2] text-[13px] font-medium hover:bg-[#bf5af2]/25 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                Dodaj użytkownika
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-white/[0.04]">
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Użytkownik</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Email</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Rola</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Dołączył</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of users; track u.id) {
                    <tr class="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold"
                               [class]="getAvatarClass(u.role)">
                            {{ (u.first_name?.[0] || u.username[0]).toUpperCase() }}
                          </div>
                          <div>
                            <div class="text-[14px] font-medium">{{ u.full_name || u.username }}</div>
                            <div class="text-[12px] text-[#86868b]">{{ u.username }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-[14px] text-[#86868b]">{{ u.email }}</td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              [class]="getRoleBadge(u.role)">
                          {{ getRoleLabel(u.role) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-[13px] text-[#86868b]">{{ u.date_joined | date:'dd.MM.yyyy' }}</td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <!-- Role selector -->
                          <select class="h-7 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] text-[#d1d1d6] focus:outline-none focus:border-[#bf5af2]/50 cursor-pointer"
                                  [value]="u.role"
                                  (change)="changeRole(u, $any($event.target).value)"
                                  [disabled]="savingRole === u.id">
                            <option value="customer" class="bg-[#1c1c1e]">Klient</option>
                            <option value="agent" class="bg-[#1c1c1e]">Agent</option>
                            <option value="admin" class="bg-[#1c1c1e]">Admin</option>
                          </select>
                          @if (savingRole === u.id) {
                            <div class="w-3.5 h-3.5 border border-[#bf5af2] border-t-transparent rounded-full animate-spin"></div>
                          }
                          @if (savedRole === u.id) {
                            <svg class="w-3.5 h-3.5 text-[#30d158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                            </svg>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                  @empty {
                    <tr><td colspan="5" class="px-6 py-12 text-center text-[#86868b] text-[14px]">Brak użytkowników</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Policies Tab -->
        @if (!loading && activeTab === 'policies') {
          <div class="bg-[#111112] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div class="px-6 py-4 border-b border-white/[0.06]">
              <h2 class="text-[15px] font-semibold">Wszystkie polisy ({{ policies.length }})</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-white/[0.04]">
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Numer</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Produkt</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Status</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Suma ubezpieczenia</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Ważna do</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of policies; track p.id) {
                    <tr class="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td class="px-6 py-4">
                        <a [routerLink]="['/policies', p.id]" class="text-[13px] font-mono text-[#0a84ff] hover:underline">{{ p.policy_number }}</a>
                      </td>
                      <td class="px-6 py-4 text-[14px] text-[#86868b]">{{ p.product_name }}</td>
                      <td class="px-6 py-4">
                        <span class="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              [class]="getPolicyStatusBadge(p.status)">
                          {{ getPolicyStatusLabel(p.status) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-[14px]">{{ p.coverage_amount | number:'1.0-0':'pl' }} zł</td>
                      <td class="px-6 py-4 text-[13px] text-[#86868b]">{{ p.end_date | date:'dd.MM.yyyy' }}</td>
                    </tr>
                  }
                  @empty {
                    <tr><td colspan="5" class="px-6 py-12 text-center text-[#86868b] text-[14px]">Brak polis</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Claims Tab -->
        @if (!loading && activeTab === 'claims') {
          <div class="bg-[#111112] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div class="px-6 py-4 border-b border-white/[0.06]">
              <h2 class="text-[15px] font-semibold">Wszystkie szkody ({{ claims.length }})</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-white/[0.04]">
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Nr</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Zgłaszający</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Opis</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Status</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Agent</th>
                    <th class="text-left px-6 py-3 text-[12px] text-[#86868b] font-medium uppercase tracking-wider">Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of claims; track c.id) {
                    <tr class="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td class="px-6 py-4 text-[13px] font-mono text-[#86868b]">#{{ c.id }}</td>
                      <td class="px-6 py-4 text-[14px]">{{ c.reported_by_name || '—' }}</td>
                      <td class="px-6 py-4">
                        <div class="text-[14px] max-w-[200px] truncate">{{ c.description | slice:0:40 }}</div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                              [class]="getClaimStatusBadge(c.status)">
                          {{ getClaimStatusLabel(c.status) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-[13px] text-[#86868b]">{{ c.assigned_agent_name || '—' }}</td>
                      <td class="px-6 py-4 text-[13px] text-[#86868b]">{{ c.created_at | date:'dd.MM.yyyy' }}</td>
                      <td class="px-6 py-4">
                        <a [routerLink]="['/claims', c.id]" class="text-[13px] text-[#0a84ff] hover:underline">Szczegóły</a>
                      </td>
                    </tr>
                  }
                  @empty {
                    <tr><td colspan="7" class="px-6 py-12 text-center text-[#86868b] text-[14px]">Brak szkód</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Overview Tab -->
        @if (!loading && activeTab === 'overview') {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-[#111112] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div class="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 class="text-[15px] font-semibold">Ostatnie szkody</h2>
                <button (click)="activeTab = 'claims'" class="text-[13px] text-[#0a84ff] hover:underline">Wszystkie</button>
              </div>
              <div class="divide-y divide-white/[0.04]">
                @for (c of claims.slice(0, 5); track c.id) {
                  <div class="px-6 py-3.5 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-2 h-2 rounded-full flex-shrink-0" [class]="getClaimDot(c.status)"></div>
                      <div>
                        <div class="text-[14px] font-medium truncate max-w-[200px]">{{ c.description | slice:0:40 }}</div>
                        <div class="text-[12px] text-[#86868b]">{{ c.reported_by_name }}</div>
                      </div>
                    </div>
                    <span class="text-[11px] px-2 py-0.5 rounded-full" [class]="getClaimStatusBadge(c.status)">
                      {{ getClaimStatusLabel(c.status) }}
                    </span>
                  </div>
                }
                @empty {
                  <div class="px-6 py-8 text-center text-[#86868b] text-[14px]">Brak szkód</div>
                }
              </div>
            </div>

            <div class="bg-[#111112] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div class="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 class="text-[15px] font-semibold">Ostatnie polisy</h2>
                <button (click)="activeTab = 'policies'" class="text-[13px] text-[#0a84ff] hover:underline">Wszystkie</button>
              </div>
              <div class="divide-y divide-white/[0.04]">
                @for (p of policies.slice(0, 5); track p.id) {
                  <div class="px-6 py-3.5 flex items-center justify-between">
                    <div>
                      <div class="text-[14px] font-medium">{{ p.product_name }}</div>
                      <div class="text-[12px] text-[#86868b] font-mono">{{ p.policy_number }}</div>
                    </div>
                    <span class="text-[11px] px-2 py-0.5 rounded-full" [class]="getPolicyStatusBadge(p.status)">
                      {{ getPolicyStatusLabel(p.status) }}
                    </span>
                  </div>
                }
                @empty {
                  <div class="px-6 py-8 text-center text-[#86868b] text-[14px]">Brak polis</div>
                }
              </div>
            </div>

            <div class="bg-[#111112] border border-white/[0.06] rounded-2xl p-6">
              <h2 class="text-[15px] font-semibold mb-4">Szkody według statusu</h2>
              <div class="space-y-3">
                @for (s of claimsByStatus; track s.status) {
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[13px] text-[#86868b]">{{ getClaimStatusLabel(s.status) }}</span>
                      <span class="text-[13px] font-medium">{{ s.count }}</span>
                    </div>
                    <div class="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-700"
                           [style.width.%]="stats.claims > 0 ? (s.count / stats.claims) * 100 : 0"
                           [class]="s.barColor"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="bg-[#111112] border border-white/[0.06] rounded-2xl p-6">
              <h2 class="text-[15px] font-semibold mb-4">Szybkie akcje</h2>
              <div class="grid grid-cols-2 gap-3">
                <a routerLink="/agent/queue" class="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                  <div class="w-8 h-8 rounded-lg bg-[#ff9f0a]/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-[#ff9f0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="text-[13px] font-medium">Kolejka szkód</div>
                    <div class="text-[11px] text-[#86868b]">{{ stats.pendingClaims }} oczekujących</div>
                  </div>
                </a>
                <button (click)="openAddModal()" class="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors text-left">
                  <div class="w-8 h-8 rounded-lg bg-[#bf5af2]/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-[#bf5af2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="text-[13px] font-medium">Dodaj agenta</div>
                    <div class="text-[11px] text-[#86868b]">Nowy użytkownik</div>
                  </div>
                </button>
                <button (click)="activeTab = 'users'" class="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors text-left">
                  <div class="w-8 h-8 rounded-lg bg-[#0a84ff]/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-[#0a84ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="text-[13px] font-medium">Użytkownicy</div>
                    <div class="text-[11px] text-[#86868b]">{{ stats.users }} łącznie</div>
                  </div>
                </button>
                <a href="http://localhost:8000/admin/" target="_blank" class="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                  <div class="w-8 h-8 rounded-lg bg-[#30d158]/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-[#30d158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                    </svg>
                  </div>
                  <div>
                    <div class="text-[13px] font-medium">Django Admin</div>
                    <div class="text-[11px] text-[#86868b]">Panel systemowy</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Modal: Dodaj użytkownika -->
    @if (showAddModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="closeAddModal()">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div class="relative bg-[#1c1c1e] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl"
             (click)="$event.stopPropagation()">
          <div class="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 class="text-[16px] font-semibold">Dodaj użytkownika</h3>
            <button (click)="closeAddModal()" class="text-[#86868b] hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form (ngSubmit)="submitAddUser()" class="px-6 py-5 space-y-4">
            @if (addError) {
              <div class="bg-[#ff453a]/10 border border-[#ff453a]/20 rounded-xl px-4 py-3 text-[13px] text-[#ff453a]">
                {{ addError }}
              </div>
            }

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] text-[#86868b] mb-1.5">Imię</label>
                <input [(ngModel)]="newUser.first_name" name="first_name"
                       class="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder-[#86868b] focus:outline-none focus:border-[#bf5af2]/50"
                       placeholder="Jan">
              </div>
              <div>
                <label class="block text-[12px] text-[#86868b] mb-1.5">Nazwisko</label>
                <input [(ngModel)]="newUser.last_name" name="last_name"
                       class="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder-[#86868b] focus:outline-none focus:border-[#bf5af2]/50"
                       placeholder="Kowalski">
              </div>
            </div>

            <div>
              <label class="block text-[12px] text-[#86868b] mb-1.5">Login *</label>
              <input [(ngModel)]="newUser.username" name="username" required
                     class="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder-[#86868b] focus:outline-none focus:border-[#bf5af2]/50"
                     placeholder="jan.kowalski">
            </div>

            <div>
              <label class="block text-[12px] text-[#86868b] mb-1.5">Email *</label>
              <input [(ngModel)]="newUser.email" name="email" type="email" required
                     class="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder-[#86868b] focus:outline-none focus:border-[#bf5af2]/50"
                     placeholder="jan@example.com">
            </div>

            <div>
              <label class="block text-[12px] text-[#86868b] mb-1.5">Hasło *</label>
              <input [(ngModel)]="newUser.password" name="password" type="password" required
                     class="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder-[#86868b] focus:outline-none focus:border-[#bf5af2]/50"
                     placeholder="Min. 8 znaków">
            </div>

            <div>
              <label class="block text-[12px] text-[#86868b] mb-1.5">Rola *</label>
              <select [(ngModel)]="newUser.role" name="role"
                      class="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white focus:outline-none focus:border-[#bf5af2]/50">
                <option value="customer" class="bg-[#1c1c1e]">Klient</option>
                <option value="agent" class="bg-[#1c1c1e]">Agent</option>
                <option value="admin" class="bg-[#1c1c1e]">Admin</option>
              </select>
            </div>

            @if (newUser.role === 'agent') {
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[12px] text-[#86868b] mb-1.5">Nr licencji</label>
                  <input [(ngModel)]="newUser.license_number" name="license_number"
                         class="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder-[#86868b] focus:outline-none focus:border-[#bf5af2]/50"
                         placeholder="AG001">
                </div>
                <div>
                  <label class="block text-[12px] text-[#86868b] mb-1.5">Dział</label>
                  <input [(ngModel)]="newUser.department" name="department"
                         class="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder-[#86868b] focus:outline-none focus:border-[#bf5af2]/50"
                         placeholder="Szkody">
                </div>
              </div>
            }

            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeAddModal()"
                      class="flex-1 h-10 rounded-xl border border-white/[0.08] text-[14px] text-[#86868b] hover:text-white hover:border-white/20 transition-all">
                Anuluj
              </button>
              <button type="submit" [disabled]="addLoading"
                      class="flex-1 h-10 rounded-xl bg-[#bf5af2] text-[14px] font-medium text-white hover:bg-[#d070ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                @if (addLoading) {
                  <span class="inline-flex items-center gap-2">
                    <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Tworzenie...
                  </span>
                } @else {
                  Utwórz
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminPanelComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);
  private claimService = inject(ClaimService);
  private policyService = inject(PolicyService);

  activeTab: Tab = 'overview';
  loading = true;

  users: AdminUser[] = [];
  claims: Claim[] = [];
  policies: Policy[] = [];

  stats = { users: 0, policies: 0, claims: 0, pendingClaims: 0 };

  // Role change state
  savingRole: number | null = null;
  savedRole: number | null = null;

  // Add user modal
  showAddModal = false;
  addLoading = false;
  addError = '';
  newUser = { username: '', email: '', password: '', first_name: '', last_name: '', role: 'agent', license_number: '', department: '' };

  tabs = [
    { id: 'overview' as Tab, label: 'Przegląd' },
    { id: 'users' as Tab, label: 'Użytkownicy' },
    { id: 'policies' as Tab, label: 'Polisy' },
    { id: 'claims' as Tab, label: 'Szkody' },
  ];

  get claimsByStatus() {
    const statusGroups: Record<string, { count: number; barColor: string }> = {
      submitted:    { count: 0, barColor: 'bg-[#0a84ff]' },
      under_review: { count: 0, barColor: 'bg-[#ff9f0a]' },
      approved:     { count: 0, barColor: 'bg-[#30d158]' },
      rejected:     { count: 0, barColor: 'bg-[#ff453a]' },
      paid:         { count: 0, barColor: 'bg-[#64d2ff]' },
    };
    this.claims.forEach(c => {
      if (statusGroups[c.status]) statusGroups[c.status].count++;
    });
    return Object.entries(statusGroups)
      .filter(([, v]) => v.count > 0)
      .map(([status, v]) => ({ status, ...v }));
  }

  ngOnInit() {
    forkJoin({
      users: this.http.get<any>(`${API}/auth/admin/users/`),
      policies: this.policyService.getPolicies(),
      claims: this.claimService.getClaims(),
    }).subscribe({
      next: ({ users, policies, claims }) => {
        this.users = users.results ?? users;
        this.policies = policies.results ?? policies;
        this.claims = claims.results ?? claims;
        this.stats.users = this.users.length;
        this.stats.policies = policies.count ?? this.policies.length;
        this.stats.claims = claims.count ?? this.claims.length;
        this.stats.pendingClaims = this.claims.filter(
          c => ['submitted', 'under_review', 'additional_info'].includes(c.status)
        ).length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  changeRole(user: AdminUser, newRole: string) {
    if (newRole === user.role) return;
    this.savingRole = user.id;
    this.savedRole = null;
    this.http.patch(`${API}/auth/admin/users/${user.id}/role/`, { role: newRole }).subscribe({
      next: (updated: any) => {
        user.role = updated.role;
        this.savingRole = null;
        this.savedRole = user.id;
        setTimeout(() => { this.savedRole = null; }, 2000);
      },
      error: () => { this.savingRole = null; }
    });
  }

  openAddModal() {
    this.showAddModal = true;
    this.addError = '';
    this.newUser = { username: '', email: '', password: '', first_name: '', last_name: '', role: 'agent', license_number: '', department: '' };
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  submitAddUser() {
    this.addLoading = true;
    this.addError = '';
    this.http.post<AdminUser>(`${API}/auth/admin/users/`, this.newUser).subscribe({
      next: (created) => {
        this.users = [created, ...this.users];
        this.stats.users++;
        this.addLoading = false;
        this.closeAddModal();
        this.activeTab = 'users';
      },
      error: (err) => {
        this.addLoading = false;
        const errors = err.error;
        if (typeof errors === 'object') {
          const msgs = Object.entries(errors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`);
          this.addError = msgs.join(' | ');
        } else {
          this.addError = 'Wystąpił błąd. Sprawdź dane i spróbuj ponownie.';
        }
      }
    });
  }

  getRoleLabel(role: string) {
    return { customer: 'Klient', agent: 'Agent', admin: 'Admin' }[role] ?? role;
  }

  getRoleBadge(role: string) {
    return {
      customer: 'bg-[#0a84ff]/10 text-[#0a84ff]',
      agent:    'bg-[#30d158]/10 text-[#30d158]',
      admin:    'bg-[#bf5af2]/10 text-[#bf5af2]',
    }[role] ?? 'bg-white/10 text-white';
  }

  getAvatarClass(role: string) {
    return {
      customer: 'bg-[#0a84ff]/15 text-[#0a84ff]',
      agent:    'bg-[#30d158]/15 text-[#30d158]',
      admin:    'bg-[#bf5af2]/15 text-[#bf5af2]',
    }[role] ?? 'bg-white/10 text-white';
  }

  getClaimStatusLabel(status: string) { return (CLAIM_STATUS_LABELS as any)[status] ?? status; }

  getClaimStatusBadge(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-white/10 text-[#86868b]', submitted: 'bg-[#0a84ff]/10 text-[#0a84ff]',
      under_review: 'bg-[#ff9f0a]/10 text-[#ff9f0a]', additional_info: 'bg-[#ff9f0a]/10 text-[#ff9f0a]',
      approved: 'bg-[#30d158]/10 text-[#30d158]', partially_approved: 'bg-[#30d158]/10 text-[#30d158]',
      rejected: 'bg-[#ff453a]/10 text-[#ff453a]', paid: 'bg-[#64d2ff]/10 text-[#64d2ff]',
      closed: 'bg-white/10 text-[#86868b]',
    };
    return map[status] ?? 'bg-white/10 text-white';
  }

  getClaimDot(status: string) {
    const map: Record<string, string> = {
      submitted: 'bg-[#0a84ff]', under_review: 'bg-[#ff9f0a]', approved: 'bg-[#30d158]',
      rejected: 'bg-[#ff453a]', paid: 'bg-[#64d2ff]', closed: 'bg-[#86868b]',
    };
    return map[status] ?? 'bg-white/20';
  }

  getPolicyStatusLabel(status: string) { return (POLICY_STATUS_LABELS as any)[status] ?? status; }

  getPolicyStatusBadge(status: string) {
    const map: Record<string, string> = {
      active: 'bg-[#30d158]/10 text-[#30d158]', expired: 'bg-white/10 text-[#86868b]',
      cancelled: 'bg-[#ff453a]/10 text-[#ff453a]', pending: 'bg-[#ff9f0a]/10 text-[#ff9f0a]',
    };
    return map[status] ?? 'bg-white/10 text-white';
  }
}
