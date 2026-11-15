import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../core/ui.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed bottom-5 right-5 z-[1000] flex max-w-[min(420px,calc(100vw-40px))] flex-col gap-2.5">
      <div role="status" aria-live="polite">
        @for (t of polite(); track t.id) {
          <div data-toast class="mt-2.5 flex items-center gap-2.5 rounded-[10px] border-l-[5px] bg-[#1f1f2b] px-3.5 py-3 text-sm text-white shadow-[0_6px_20px_rgba(0,0,0,.25)]"
               [class]="t.type === 'success' ? 'border-l-[#22c55e]' : 'border-l-[#60a5fa]'">
            <app-icon [name]="t.type === 'success' ? 'check' : 'info'" [size]="18" />
            <span class="flex-1">{{ t.text }}</span>
            <button type="button" class="inline-flex rounded-md border-0 bg-transparent p-1 text-white" aria-label="Fechar notificação" (click)="svc.dismiss(t.id)"><app-icon name="close" [size]="16" /></button>
          </div>
        }
      </div>
      <div role="alert">
        @for (t of errors(); track t.id) {
          <div data-toast class="mt-2.5 flex items-center gap-2.5 rounded-[10px] border-l-[5px] border-l-[#f87171] bg-[#1f1f2b] px-3.5 py-3 text-sm text-white shadow-[0_6px_20px_rgba(0,0,0,.25)]">
            <app-icon name="info" [size]="18" />
            <span class="flex-1">{{ t.text }}</span>
            <button type="button" class="inline-flex rounded-md border-0 bg-transparent p-1 text-white" aria-label="Fechar notificação" (click)="svc.dismiss(t.id)"><app-icon name="close" [size]="16" /></button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ToastsComponent {
  svc = inject(ToastService);
  polite = computed(() => this.svc.items().filter((t) => t.type !== 'error'));
  errors = computed(() => this.svc.items().filter((t) => t.type === 'error'));
}
