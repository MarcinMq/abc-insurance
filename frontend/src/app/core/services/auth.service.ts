import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, LoginResponse, RegisterRequest, JwtPayload } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_KEY = 'abc_access';
  private readonly REFRESH_KEY = 'abc_refresh';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromToken());
  currentUser$ = this.currentUserSubject.asObservable();

  /** Observable używany w szablonach — eliminuje wywołanie isLoggedIn() w każdym cyklu CD */
  isLoggedIn$ = this.currentUser$.pipe(map((u) => !!u));

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login/`, { username, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.ACCESS_KEY, res.access);
          localStorage.setItem(this.REFRESH_KEY, res.refresh);
          this.currentUserSubject.next(this.getUserFromToken());
          this.loadUserProfile();
        })
      );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register/`, data).pipe(
      tap((res: any) => {
        localStorage.setItem(this.ACCESS_KEY, res.access);
        localStorage.setItem(this.REFRESH_KEY, res.refresh);
        this.currentUserSubject.next(res.user);
      })
    );
  }

  logout(): void {
    const refresh = localStorage.getItem(this.REFRESH_KEY);
    if (refresh) {
      this.http.post(`${environment.apiUrl}/auth/logout/`, { refresh }).subscribe();
    }
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<{ access: string }> {
    const refresh = localStorage.getItem(this.REFRESH_KEY);
    return this.http
      .post<{ access: string }>(`${environment.apiUrl}/auth/token/refresh/`, { refresh })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.ACCESS_KEY, res.access);
        })
      );
  }

  loadUserProfile(): void {
    this.http.get<User>(`${environment.apiUrl}/auth/profile/`).subscribe((user) => {
      const current = this.currentUserSubject.value;
      // Aktualizuj tylko jeśli dane faktycznie się zmieniły — zapobiega zbędnemu re-renderowi
      if (
        !current ||
        current.id !== user.id ||
        current.full_name !== user.full_name ||
        current.role !== user.role ||
        current.email !== user.email
      ) {
        this.currentUserSubject.next(user);
      }
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  /** Używaj tylko poza szablonami (guardy, interceptory). W szablonach używaj isLoggedIn$ */
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAgent(): boolean {
    return this.currentUser?.role === 'agent' || this.currentUser?.role === 'admin';
  }

  get isCustomer(): boolean {
    return this.currentUser?.role === 'customer';
  }

  private getUserFromToken(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    if (!payload || payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.user_id,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
    } as User;
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const base64 = token.split('.')[1];
      const json = atob(base64);
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }
}
