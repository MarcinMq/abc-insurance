import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, switchMap } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  startPolling(): void {
    interval(30000)
      .pipe(switchMap(() => this.getUnreadCount()))
      .subscribe((res) => this.unreadCountSubject.next(res.unread_count));
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
    return this.http.post<{ marked_read: number }>(`${this.base}/mark-all-read/`, {}).pipe(
      // Aktualizacja licznika
    );
  }

  refreshCount(): void {
    this.getUnreadCount().subscribe((res) => {
      this.unreadCountSubject.next(res.unread_count);
    });
  }
}
