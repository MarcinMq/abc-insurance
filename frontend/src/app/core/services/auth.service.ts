import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../models/user.model';

const API = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem('access_token'));

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAgent = computed(() => this._user()?.role === 'agent' || this._user()?.role === 'admin');
  readonly isCustomer = computed(() => this._user()?.role === 'customer');
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginCredentials): Observable<any> {
    return this.http.post<AuthResponse>(`${API}/auth/login/`, credentials).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        this._token.set(response.access);
      }),
      switchMap(response => {
        return this.http.get<User>(`${API}/auth/profile/?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${response.access}` }
        }).pipe(
          tap(user => {
            localStorage.setItem('user', JSON.stringify(user));
            this._user.set(user);
          })
        );
      })
    );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/auth/register/`, data).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        this._token.set(response.access);
        this._user.set(response.user);
      })
    );
  }

  logout(): void {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      this.http.post(`${API}/auth/logout/`, { refresh }).subscribe();
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  refreshToken(): Observable<{ access: string }> {
    const refresh = localStorage.getItem('refresh_token');
    return this.http.post<{ access: string }>(`${API}/auth/token/refresh/`, { refresh }).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
        this._token.set(response.access);
      })
    );
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}
