import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './api';
import { Article } from './kb.data';
import { AppSettings } from './settings.service';
import { Category, ReportSummary, Role, Stats, Ticket, TicketPriority, TicketStatus, User } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  tickets(status?: TicketStatus | '', q?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<Ticket[]>(`${API_URL}/tickets`, { params });
  }
  stats() { return this.http.get<Stats>(`${API_URL}/tickets/stats`); }
  ticket(id: number) { return this.http.get<Ticket>(`${API_URL}/tickets/${id}`); }
  createTicket(body: { title: string; description: string; sector: string; categoryId: number; priority?: TicketPriority }) {
    return this.http.post<Ticket>(`${API_URL}/tickets`, body);
  }
  changeStatus(id: number, status: TicketStatus) {
    return this.http.patch<Ticket>(`${API_URL}/tickets/${id}/status`, { status });
  }
  assign(id: number, assigneeId: number | null) {
    return this.http.patch<Ticket>(`${API_URL}/tickets/${id}/assignee`, { assigneeId });
  }
  comment(id: number, content: string) {
    return this.http.post<Ticket>(`${API_URL}/tickets/${id}/comments`, { content });
  }
  uploadAttachments(id: number, files: File[]) {
    const form = new FormData();
    files.forEach((f) => form.append('files', f, f.name));
    return this.http.post<Ticket>(`${API_URL}/tickets/${id}/attachments`, form);
  }
  downloadAttachment(id: number) { return this.http.get(`${API_URL}/attachments/${id}`, { responseType: 'blob' }); }
  reopen(id: number) { return this.http.post<Ticket>(`${API_URL}/tickets/${id}/reopen`, null); }
  rate(id: number, rating: number, comment: string) {
    return this.http.post<Ticket>(`${API_URL}/tickets/${id}/rating`, { rating, comment });
  }

  settings() { return this.http.get<AppSettings>(`${API_URL}/settings`); }
  saveSettings(body: AppSettings) { return this.http.put<AppSettings>(`${API_URL}/settings`, body); }

  articles(q?: string, category?: string) {
    let params = new HttpParams();
    if (q?.trim()) params = params.set('q', q.trim());
    if (category) params = params.set('category', category);
    return this.http.get<Article[]>(`${API_URL}/kb/articles`, { params });
  }
  article(slug: string) { return this.http.get<Article>(`${API_URL}/kb/articles/${slug}`); }

  reportSummary() { return this.http.get<ReportSummary>(`${API_URL}/reports/summary`); }
  categories() { return this.http.get<Category[]>(`${API_URL}/categories`); }

  users() { return this.http.get<User[]>(`${API_URL}/users`); }
  staff() { return this.http.get<User[]>(`${API_URL}/users/staff`); }
  createUser(body: { name: string; email: string; password: string; role: Role; department: string }) {
    return this.http.post<User>(`${API_URL}/users`, body);
  }
  setActive(id: number, value: boolean) {
    return this.http.patch<User>(`${API_URL}/users/${id}/active`, null, { params: { value } });
  }
}
