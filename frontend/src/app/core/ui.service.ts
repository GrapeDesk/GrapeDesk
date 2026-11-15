import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; text: string; type: 'success' | 'error' | 'info'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly items = signal<Toast[]>([]);
  private seq = 0;

  show(text: string, type: Toast['type'] = 'success', ms = 6000) {
    const id = ++this.seq;
    this.items.update((l) => [...l, { id, text, type }]);
    setTimeout(() => this.dismiss(id), ms);
  }
  success(text: string) { this.show(text, 'success'); }
  info(text: string) { this.show(text, 'info'); }
  error(text: string) { this.show(text, 'error', 10000); }
  dismiss(id: number) { this.items.update((l) => l.filter((t) => t.id !== id)); }
}

export interface ConfirmOptions { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; }

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request = signal<ConfirmOptions | null>(null);
  private resolver?: (v: boolean) => void;

  ask(options: ConfirmOptions): Promise<boolean> {
    this.request.set(options);
    return new Promise((resolve) => (this.resolver = resolve));
  }
  answer(value: boolean) {
    this.request.set(null);
    this.resolver?.(value);
    this.resolver = undefined;
  }
}

@Injectable({ providedIn: 'root' })
export class HelpService {
  readonly isOpen = signal(false);
  open() { this.isOpen.set(true); }
  close() { this.isOpen.set(false); }
}
