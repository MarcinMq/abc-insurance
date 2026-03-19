import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Policy, InsuranceProduct, PaginatedResponse } from '../models/policy.model';

const API = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  constructor(private http: HttpClient) {}

  getProducts(): Observable<InsuranceProduct[]> {
    return this.http.get<InsuranceProduct[]>(`${API}/policies/products/`);
  }

  getPolicies(page = 1, status?: string, search?: string): Observable<PaginatedResponse<Policy>> {
    let params = new HttpParams().set('page', page.toString());
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedResponse<Policy>>(`${API}/policies/`, { params });
  }

  getPolicy(id: number): Observable<Policy> {
    return this.http.get<Policy>(`${API}/policies/${id}/`);
  }

  updatePolicyStatus(id: number, status: string, notes?: string): Observable<Policy> {
    return this.http.patch<Policy>(`${API}/policies/${id}/status/`, { status, notes });
  }
}
