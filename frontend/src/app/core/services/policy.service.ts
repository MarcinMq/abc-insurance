import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Policy, InsuranceProduct } from '../../shared/models/policy.model';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PolicyFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly base = `${environment.apiUrl}/policies`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<PaginatedResponse<InsuranceProduct>> {
    return this.http.get<PaginatedResponse<InsuranceProduct>>(`${this.base}/products/`);
  }

  getPolicies(filters?: PolicyFilters): Observable<PaginatedResponse<Policy>> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.category) params = params.set('product__category', filters.category);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page) params = params.set('page', filters.page.toString());
    return this.http.get<PaginatedResponse<Policy>>(`${this.base}/`, { params });
  }

  getPolicy(id: number): Observable<Policy> {
    return this.http.get<Policy>(`${this.base}/${id}/`);
  }

  createPolicy(data: Partial<Policy>): Observable<Policy> {
    return this.http.post<Policy>(`${this.base}/`, data);
  }

  updatePolicyStatus(id: number, status: string, notes?: string): Observable<Policy> {
    return this.http.patch<Policy>(`${this.base}/${id}/status/`, { status, notes });
  }

  uploadDocument(policyId: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.base}/${policyId}/documents/`, formData);
  }
}
