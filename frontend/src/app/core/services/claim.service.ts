import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Claim, CreateClaimData } from '../models/claim.model';
import { PaginatedResponse } from '../models/policy.model';

const API = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class ClaimService {
  constructor(private http: HttpClient) {}

  getClaims(page = 1, status?: string, search?: string): Observable<PaginatedResponse<Claim>> {
    let params = new HttpParams().set('page', page.toString());
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedResponse<Claim>>(`${API}/claims/`, { params });
  }

  getClaim(id: number): Observable<Claim> {
    return this.http.get<Claim>(`${API}/claims/${id}/`);
  }

  createClaim(data: CreateClaimData): Observable<Claim> {
    return this.http.post<Claim>(`${API}/claims/`, data);
  }

  submitClaim(id: number): Observable<Claim> {
    return this.http.post<Claim>(`${API}/claims/${id}/submit/`, {});
  }

  updateClaimStatus(id: number, status: string, data: Record<string, unknown> = {}): Observable<Claim> {
    return this.http.patch<Claim>(`${API}/claims/${id}/status/`, { status, ...data });
  }

  assignClaim(id: number, agentId: number): Observable<Claim> {
    return this.http.patch<Claim>(`${API}/claims/${id}/assign/`, { agent_id: agentId });
  }

  getAgentQueue(page = 1): Observable<PaginatedResponse<Claim>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<Claim>>(`${API}/claims/queue/`, { params });
  }
}
