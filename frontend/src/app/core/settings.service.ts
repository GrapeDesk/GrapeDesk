import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, USE_MOCK } from './api';
import { AuthService } from './auth.service';
import { ToastService } from './ui.service';

export interface AppSettings {
  companyName: string; supportEmail: string; supportPhone: string; timezone: string; language: string; logo: string | null;
  autoAssign: boolean; allowReopen: boolean; requireAttachments: boolean;
  firstResponse: string; resolution: string; autoClose: string;
}

const KEY = 'grapedesk.settings';
const DEFAULTS: AppSettings = {
  companyName: 'Grape Desk', supportEmail: 'tecnologia@ferrazdevasconcelos.sp.gov.br', supportPhone: '(11) 4674-7418',
  timezone: '(GMT-03:00) Brasília', language: 'Português (Brasil)', logo: null,
  autoAssign: true, allowReopen: false, requireAttachments: true,
  firstResponse: '2 horas', resolution: '24 horas', autoClose: '5 dias',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly value = signal<AppSettings>(this.loadLocal());
  readonly savedAt = signal<number | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  private loadLocal(): AppSettings {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return { ...DEFAULTS }; }
  }

  load() {
    if (USE_MOCK) return;
    this.http.get<AppSettings>(`${API_URL}/settings`).subscribe({
      next: (s) => this.value.set({ ...DEFAULTS, ...s }),
      error: () => { /* mantém os valores atuais */ },
    });
  }

  update(patch: Partial<AppSettings>) {
    const next = { ...this.value(), ...patch };
    this.value.set(next);
    if (USE_MOCK) {
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* armazenamento cheio: ignora */ }
      this.savedAt.set(Date.now());
      return;
    }
    if (!this.auth.isAdmin()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.http.put<AppSettings>(`${API_URL}/settings`, this.value()).subscribe({
        next: () => this.savedAt.set(Date.now()),
        error: (e) => this.toast.error(e?.error?.message || 'Não foi possível salvar as configurações.'),
      });
    }, 600);
  }
}
