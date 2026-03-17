import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: number;
  notification_type: string;
  notification_type_display: string;
  title: string;
  message: string;
  is_read: boolean;
  related_claim_id?: number;
  related_policy_id?: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private stopPolling$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  startPolling(): void {
    // Zatrzymaj poprzedni polling jeśli był aktywny
    this.stopPolling$.next();

    interval(60000)
      .pipe(
        takeUntil(this.stopPolling$),
        switchMap(() => this.getUnreadCount())
      )
      .subscribe({
        next: (res) => this.unreadCountSubject.next(res.unread_count),
        error: () => { /* cicha obsługa błędów pollingu */ },
      });
  }

  stopPolling(): void {
    this.stopPolling$.next();
    this.unreadCountSubject.next(0);
  }

  getNotifications(): Observable<any> {
    return this.http.get(`${this.base}/`);
  }

  getUnreadCount(): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.base}/unread-count/`);
  }

  markRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.base}/${id}/read/`, {});
  }

  markAllRead(): Observable<{ marked_read: number }> {
    return this.http.post<{ marked_read: number }>(`${this.base}/mark-all-read/`, {});
  }

  refreshCount(): void {
    this.getUnreadCount().subscribe({
      next: (res) => this.unreadCountSubject.next(res.unread_count),
      error: () => { /* token może jeszcze nie być gotowy */ },
    });
  }
}
