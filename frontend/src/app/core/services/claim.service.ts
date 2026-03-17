import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Claim,
  ClaimCreateRequest,
  ClaimStatusUpdateRequest,
} from '../../shared/models/claim.model';
import { PaginatedResponse } from './policy.service';

export interface ClaimFilters {
  status?: string;
  incident_type?: string;
  search?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private readonly base = `${environment.apiUrl}/claims`;

  constructor(private http: HttpClient) {}

  getClaims(filters?: ClaimFilters): Observable<PaginatedResponse<Claim>> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.incident_type) params = params.set('incident_type', filters.incident_type);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page) params = params.set('page', filters.page.toString());
    return this.http.get<PaginatedResponse<Claim>>(`${this.base}/`, { params });
  }

  getClaim(id: number): Observable<Claim> {
    return this.http.get<Claim>(`${this.base}/${id}/`);
  }

  createClaim(data: ClaimCreateRequest): Observable<Claim> {
    return this.http.post<Claim>(`${this.base}/`, data);
  }

  submitClaim(id: number): Observable<Claim> {
    return this.http.post<Claim>(`${this.base}/${id}/submit/`, {});
  }

  updateClaimStatus(id: number, data: ClaimStatusUpdateRequest): Observable<Claim> {
    return this.http.patch<Claim>(`${this.base}/${id}/status/`, data);
  }

  assignAgent(claimId: number, agentId?: number): Observable<Claim> {
    return this.http.patch<Claim>(`${this.base}/${claimId}/assign/`, {
      agent_id: agentId,
    });
  }

  uploadDocument(claimId: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.base}/${claimId}/documents/`, formData);
  }

  getQueue(): Observable<PaginatedResponse<Claim>> {
    return this.http.get<PaginatedResponse<Claim>>(`${this.base}/queue/`);
  }
}
