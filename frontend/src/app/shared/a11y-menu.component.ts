import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { A11yService, SCALES } from '../core/a11y.service';
import { HelpService } from '../core/ui.service';
import { IconComponent } from './icon.component';

/** Barra de acessibilidade (padrão eMAG: tamanho do texto, contraste e atalhos). */
@Component({
  selector: 'app-a11y-menu',
  standalone: true,
  imports: [IconComponent],
  host: { class: 'relative inline-block' },
  template: `
    <button #btn type="button" aria-controls="a11y-panel" [attr.aria-expanded]="open()" (click)="open.set(!open())"
            class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary bg-white px-3.5 py-2 text-[0.8125rem] font-medium text-primary hover:bg-primary-50 aria-expanded:bg-primary-50">
      <app-icon name="access" [size]="22" /> <span>Acessibilidade</span>
    </button>
    @if (open()) {
      <div id="a11y-panel" data-panel role="group" aria-label="Opções de acessibilidade"
           class="absolute right-0 top-[calc(100%+8px)] z-50 w-[290px] rounded-xl border border-[#ccc] bg-white px-4 py-3.5 shadow-pop">
        <div class="flex items-center justify-between gap-3 border-b border-[#eee] py-2 text-sm">
          <span id="a11y-size">Tamanho do texto</span>
          <div class="flex items-center gap-1.5" role="group" aria-labelledby="a11y-size">
            <button type="button" aria-label="Diminuir texto" [disabled]="a.state().scale === min" (click)="a.smaller()"
                    class="min-h-9 min-w-10 cursor-pointer rounded-lg border border-primary bg-white font-semibold text-primary disabled:opacity-40">A−</button>
            <output aria-live="polite" class="min-w-11 text-center text-[0.8125rem]">{{ pct() }}%</output>
            <button type="button" aria-label="Aumentar texto" [disabled]="a.state().scale === max" (click)="a.bigger()"
                    class="min-h-9 min-w-10 cursor-pointer rounded-lg border border-primary bg-white font-semibold text-primary disabled:opacity-40">A+</button>
          </div>
        </div>
        <div class="flex items-center justify-between gap-3 border-b border-[#eee] py-2 text-sm">
          <span id="a11y-hc">Alto contraste</span>
          <button type="button" class="sw" role="switch" aria-labelledby="a11y-hc" [attr.aria-checked]="a.state().contrast" (click)="a.toggleContrast()"></button>
        </div>
        <div class="flex items-center justify-between gap-3 border-b border-[#eee] py-2 text-sm">
          <span id="a11y-mo">Reduzir animações</span>
          <button type="button" class="sw" role="switch" aria-labelledby="a11y-mo" [attr.aria-checked]="a.state().reduceMotion" (click)="a.toggleMotion()"></button>
        </div>
        <div class="flex justify-between pt-2.5">
          <button type="button" class="linkbtn" (click)="a.reset()">Restaurar padrões</button>
          <button type="button" class="linkbtn" (click)="open.set(false); help.open()">Atalhos de teclado</button>
        </div>
      </div>
    }
  `,
})
export class A11yMenuComponent {
  a = inject(A11yService);
  help = inject(HelpService);
  open = signal(false);
  min = SCALES[0];
  max = SCALES[SCALES.length - 1];
  private btn = viewChild.required<ElementRef<HTMLButtonElement>>('btn');
  private host = inject(ElementRef<HTMLElement>);

  pct() { return Math.round(this.a.state().scale * 100); }

  @HostListener('document:keydown.escape') onEsc() {
    if (this.open()) { this.open.set(false); this.btn().nativeElement.focus(); }
  }
  @HostListener('document:click', ['$event']) onDoc(e: Event) {
    if (this.open() && !this.host.nativeElement.contains(e.target)) this.open.set(false);
  }
}
