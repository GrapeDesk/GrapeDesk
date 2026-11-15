import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../core/ui.service';

/** Usa o <dialog> nativo: o navegador já cuida do foco preso, da tecla Esc e de devolver o foco. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <dialog #dlg aria-labelledby="cf-title" aria-describedby="cf-msg" (cancel)="$event.preventDefault(); svc.answer(false)"
            class="w-[calc(100%-2rem)] max-w-[440px] rounded-[14px] border-0 p-6 shadow-[0_12px_40px_rgba(0,0,0,.35)] backdrop:bg-[rgba(20,10,50,.55)]">
      @if (svc.request(); as r) {
        <h2 id="cf-title" class="mb-2 text-lg font-semibold">{{ r.title }}</h2>
        <p id="cf-msg" class="mb-[22px] text-[0.9375rem] leading-normal">{{ r.message }}</p>
        <div class="flex justify-end gap-3">
          <button type="button" class="btn btn-outline btn-sm" autofocus (click)="svc.answer(false)">{{ r.cancelLabel || 'Cancelar' }}</button>
          <button type="button" class="btn btn-sm" [class]="r.danger ? 'btn-danger' : 'btn-primary'" (click)="svc.answer(true)">{{ r.confirmLabel || 'Confirmar' }}</button>
        </div>
      }
    </dialog>
  `,
})
export class ConfirmDialogComponent {
  svc = inject(ConfirmService);
  private dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const open = !!this.svc.request();
      const d = this.dlg().nativeElement;
      if (open && !d.open) d.showModal();
      if (!open && d.open) d.close();
    });
  }
}
