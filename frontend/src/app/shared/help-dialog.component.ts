import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HelpService } from '../core/ui.service';
import { SettingsService } from '../core/settings.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-help-dialog',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <dialog #dlg aria-labelledby="help-title" (close)="help.close()"
            class="max-h-[90vh] w-[calc(100%-2rem)] max-w-[560px] rounded-[14px] border-0 px-7 py-6 shadow-[0_12px_40px_rgba(0,0,0,.35)] backdrop:bg-[rgba(20,10,50,.55)]">
      <div class="flex items-center justify-between">
        <h2 id="help-title" class="text-xl font-semibold">Ajuda e atalhos de teclado</h2>
        <button type="button" class="inline-flex rounded-lg border-0 bg-transparent p-1.5" aria-label="Fechar ajuda" (click)="help.close()"><app-icon name="close" [size]="20" /></button>
      </div>

      <h3 class="mb-2 mt-5 text-[0.9375rem] font-semibold text-primary">Atalhos</h3>
      <table class="w-full border-collapse text-sm">
        <caption class="sr-only">Lista de atalhos de teclado</caption>
        <thead><tr><th scope="col" class="bg-primary-50 px-2 py-1.5 text-left">Tecla</th><th scope="col" class="bg-primary-50 px-2 py-1.5 text-left">O que faz</th></tr></thead>
        <tbody class="[&_td]:border-b [&_td]:border-[#e3e3e8] [&_td]:px-2 [&_td]:py-1.5 [&_kbd]:rounded-[5px] [&_kbd]:border [&_kbd]:border-b-2 [&_kbd]:border-[#bbb] [&_kbd]:bg-[#f1f1f4] [&_kbd]:px-[7px] [&_kbd]:text-[0.8125rem]">
          <tr><td><kbd>Alt</kbd> + <kbd>1</kbd></td><td>Ir para o conteúdo principal</td></tr>
          <tr><td><kbd>Alt</kbd> + <kbd>2</kbd></td><td>Ir para o menu</td></tr>
          <tr><td><kbd>Alt</kbd> + <kbd>3</kbd></td><td>Ir para a busca de chamados</td></tr>
          <tr><td><kbd>/</kbd></td><td>Buscar chamado</td></tr>
          <tr><td><kbd>N</kbd></td><td>Abrir um novo chamado</td></tr>
          <tr><td><kbd>?</kbd></td><td>Abrir esta ajuda</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Fechar janelas e menus</td></tr>
        </tbody>
      </table>
      <p class="hint my-1.5">Os atalhos de uma tecla só funcionam quando você não está digitando em um campo.</p>

      <h3 class="mb-2 mt-5 text-[0.9375rem] font-semibold text-primary">Precisa de ajuda?</h3>
      <ul class="list-disc space-y-1 pl-5 text-sm leading-relaxed">
        <li><a routerLink="/base-de-conhecimento" (click)="help.close()">Base de conhecimento</a>: artigos e passo a passo.</li>
        <li><a routerLink="/base-de-conhecimento/como-abrir-seu-primeiro-chamado" (click)="help.close()">Como abrir seu primeiro chamado</a></li>
        <li>E-mail do suporte: <a [href]="'mailto:' + s().supportEmail">{{ s().supportEmail }}</a></li>
        <li>Telefone do suporte: {{ s().supportPhone }}</li>
      </ul>

      <h3 class="mb-2 mt-5 text-[0.9375rem] font-semibold text-primary">Acessibilidade</h3>
      <p class="text-sm">Use o botão <strong>Acessibilidade</strong> no topo da página para aumentar o texto, ativar o alto contraste e reduzir animações.</p>
    </dialog>
  `,
})
export class HelpDialogComponent {
  help = inject(HelpService);
  s = inject(SettingsService).value;
  private dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const open = this.help.isOpen();
      const d = this.dlg().nativeElement;
      if (open && !d.open) d.showModal();
      if (!open && d.open) d.close();
    });
  }
}
