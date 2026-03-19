import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-auth-sync',
  standalone: true,
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: -apple-system, sans-serif; background: #000000;">
      <div style="text-align: center;">
        <h2 style="color: #0a84ff; margin-bottom: 16px;">Synchronizacja sesji...</h2>
        <p style="color: #86868b;">Trwa logowanie do panelu ubezpieczeń.</p>
      </div>
    </div>
  `
})
export class AuthSyncComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const access = params['access'];
      const refresh = params['refresh'];

      if (access && refresh) {
        // Zapisz tokeny z Landing Page'a
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        
        // Pobierz profil użytkownika by Angular app wiedziała kto jest zalogowany
        // Zapobiegamy cache'owaniu odp przez przeglądarki używając ?_t=timestamp
        this.http.get(`http://localhost:8000/api/auth/profile/?_t=${Date.now()}`, {
           headers: { Authorization: `Bearer ${access}` }
        }).subscribe({
          next: (user) => {
             // AuthService w Angular zazwyczaj czyta z 'user' w localStorage przy starcie
             // lub inicjuje stan. Tutaj możemy po prostu zapisać do localStorage i zrobić
             // twardy reload, żeby wszystkie serwisy (w tym AuthService z signal<User>) 
             // zainicjalizowały się poprawnie z zapisanymi danymi.
             localStorage.setItem('user', JSON.stringify(user));
             
             // Twardy reload by wymusić zresetowanie stanu aplikacji Angular z LocalStorage
             window.location.href = '/dashboard'; 
          },
          error: () => {
             // W razie błędu przy pobieraniu profilu wróć do logowania Angularowego
             this.router.navigate(['/login']);
          }
        });
      } else {
        // Brak tokenów = ktoś wszedł tu z palca
        this.router.navigate(['/login']);
      }
    });
  }
}
