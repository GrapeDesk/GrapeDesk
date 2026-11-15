import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanDeactivateFn, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { SettingsService } from '../core/settings.service';
import { ConfirmService, ToastService } from '../core/ui.service';
import { Category, SECTORS, errMsg } from '../core/models';
import { IconComponent } from '../shared/icon.component';

type Field = 'sector' | 'category' | 'title' | 'description' | 'files';

export const unsavedGuard: CanDeactivateFn<TicketNewComponent> = (c) => c.canLeave();

@Component({
  selector: 'app-ticket-new',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
      <form class="card !mb-0 !px-[30px] !py-[26px]" (ngSubmit)="submit()" novalidate>
        <h2 class="mb-[18px] flex items-center gap-3 text-[0.8125rem] font-semibold text-primary"><span class="circle-icon !size-7"><app-icon name="file-text" [size]="16" /></span> Informações de Chamado</h2>
        <p class="hint -mt-1.5 mb-3">Campos com <span class="req text-[#e53935]" aria-hidden="true">*</span><span class="sr-only">asterisco</span> são obrigatórios.</p>

        @if (summary().length) {
          <div #summaryBox class="error" role="alert" tabindex="-1">
            <strong>Corrija {{ summary().length }} {{ summary().length === 1 ? 'campo' : 'campos' }} para abrir o chamado:</strong>
            <ul>@for (s of summary(); track s.field) { <li><a href="#" (click)="goTo($event, s.field)">{{ s.msg }}</a></li> }</ul>
          </div>
        }
        @if (apiError()) { <div class="error" role="alert">{{ apiError() }}</div> }

        <div class="grid grid-cols-1 gap-x-10 md:grid-cols-2">
          <div class="mb-4">
            <label class="lbl !text-[0.9375rem] !font-semibold" for="sector">Setor<span class="ml-0.5 text-[#e53935]" aria-hidden="true">*</span></label>
            <select id="sector" name="sector" class="input !rounded-md !text-[0.8125rem]" [(ngModel)]="sector" (change)="touch('sector')" required
                    [attr.aria-invalid]="err('sector') ? 'true' : null" aria-describedby="sector-err">
              <option value="" disabled>Selecione o seu setor</option>
              @for (s of sectors; track s) { <option [value]="s">{{ s }}</option> }
            </select>
            <p id="sector-err" class="field-error" [hidden]="!err('sector')">{{ err('sector') }}</p>
          </div>
          <div class="mb-4">
            <label class="lbl !text-[0.9375rem] !font-semibold" for="category">Categoria<span class="ml-0.5 text-[#e53935]" aria-hidden="true">*</span></label>
            <select id="category" name="category" class="input !rounded-md !text-[0.8125rem]" [(ngModel)]="categoryId" (change)="touch('category')" required
                    [attr.aria-invalid]="err('category') ? 'true' : null" aria-describedby="category-err">
              <option [ngValue]="null" disabled>Selecione a categoria</option>
              @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
            <p id="category-err" class="field-error" [hidden]="!err('category')">{{ err('category') }}</p>
          </div>
        </div>

        <div class="mb-4">
          <label class="lbl !text-[0.9375rem] !font-semibold" for="title">Título<span class="ml-0.5 text-[#e53935]" aria-hidden="true">*</span></label>
          <input id="title" name="title" class="input !rounded-md !text-[0.8125rem]" [(ngModel)]="title" maxlength="150" (blur)="touch('title')" autocomplete="off"
                 placeholder="Escreva um título para o seu chamado" required
                 [attr.aria-invalid]="err('title') ? 'true' : null" aria-describedby="title-hint title-err" />
          <div class="flex justify-between gap-3"><p id="title-hint" class="hint mt-1">Seja objetivo. Ex.: "Impressora do setor não imprime".</p><span class="hint" aria-hidden="true">{{ title.length }}/150</span></div>
          <p id="title-err" class="field-error" [hidden]="!err('title')">{{ err('title') }}</p>
        </div>

        <div class="mb-4">
          <label class="lbl !text-[0.9375rem] !font-semibold" for="description">Descrição<span class="ml-0.5 text-[#e53935]" aria-hidden="true">*</span></label>
          <textarea id="description" name="description" class="input !rounded-md !text-[0.8125rem]" [(ngModel)]="description" rows="4" (blur)="touch('description')"
                    placeholder="Descreva o seu problema e solicitação com o máximo de detalhes possível" required
                    [attr.aria-invalid]="err('description') ? 'true' : null" aria-describedby="description-err"></textarea>
          <p id="description-err" class="field-error" [hidden]="!err('description')">{{ err('description') }}</p>
        </div>

        <div id="files" role="button" tabindex="0" aria-describedby="drop-hint files-err"
             class="mt-[18px] flex min-h-[94px] cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed p-2.5 text-center text-[#3f2380]"
             [class]="(over() ? 'bg-[#d2c0f2] ' : 'bg-[#e0d4f5] ') + (err('files') ? 'border-danger' : 'border-[#6d3fd0]')"
             (click)="file.click()" (keydown.enter)="file.click()" (keydown.space)="$event.preventDefault(); file.click()"
             (dragover)="$event.preventDefault(); over.set(true)" (dragleave)="over.set(false)" (drop)="onDrop($event)">
          <app-icon name="paperclip" [size]="28" />
          <b class="text-[0.8125rem]">Adicione arquivos aqui.</b>
          <small id="drop-hint" class="text-xs">Arraste e solte ou clique para escolher.@if (settings.value().requireAttachments) { Anexo obrigatório (definido em Configurações). }</small>
          <input #file type="file" multiple hidden tabindex="-1" (change)="onPick($event)" />
        </div>
        <p id="files-err" class="field-error" [hidden]="!err('files')">{{ err('files') }}</p>
        @if (files().length) {
          <ul class="mt-2.5 flex flex-wrap gap-2" aria-label="Arquivos anexados">
            @for (f of files(); track $index) {
              <li class="inline-flex items-center gap-1 rounded-full bg-primary-50 py-1 pl-3 pr-1.5 text-[0.8125rem]">{{ f.name }} <button type="button" class="inline-flex cursor-pointer rounded-full border-0 bg-transparent p-1 text-primary" [attr.aria-label]="'Remover arquivo ' + f.name" (click)="remove($index)"><app-icon name="close" [size]="14" /></button></li>
            }
          </ul>
        }

        <div class="mt-[22px] flex justify-end gap-3.5">
          <a class="btn btn-outline btn-sm" routerLink="/chamados">Cancelar</a>
          <button class="btn btn-primary btn-sm" type="submit" [disabled]="loading()">{{ loading() ? 'Enviando...' : 'Abrir Chamado' }}</button>
        </div>
      </form>

      <div>
        <section class="card" aria-labelledby="tips-h">
          <h2 id="tips-h" class="mb-[18px] flex items-center gap-3 font-semibold text-primary"><span class="circle-icon !size-7 !bg-primary-200 !text-primary"><app-icon name="bulb" [size]="16" /></span> <span class="text-[0.9375rem]">Dicas para um bom chamado</span></h2>
          <ul class="m-0 flex list-none flex-col gap-3 p-0">
            <li class="flex gap-3 text-[0.8125rem] font-medium"><app-icon name="target" [size]="18" /> Escolha a categoria certa para a sua solicitação.</li>
            <li class="flex gap-3 text-[0.8125rem] font-medium"><app-icon name="target" [size]="18" /> Selecione o setor correto para que a equipe possa te localizar.</li>
            <li class="flex gap-3 text-[0.8125rem] font-medium"><app-icon name="target" [size]="18" /> Seja objetivo com os detalhes do chamado, as informações precisam ser claras.</li>
            <li class="flex gap-3 text-[0.8125rem] font-medium"><app-icon name="target" [size]="18" /> Mantenha a calma, nossa equipe está trabalhando para resolver o problema o quanto antes.</li>
          </ul>
        </section>
        <section class="card relative" aria-labelledby="hours-h">
          <h2 id="hours-h" class="mb-[18px] flex items-center gap-3 font-semibold text-primary"><span class="circle-icon !size-7 !bg-primary-200 !text-primary"><app-icon name="clock" [size]="16" /></span> <span class="text-[0.9375rem]">Horário de atendimento</span></h2>
          <b class="block text-[0.8125rem]">Segunda a Sexta</b><p class="mb-4 mt-1.5 text-[0.8125rem] font-medium">08:00 às 18:00</p>
          <b class="block text-[0.8125rem]">Sábado</b><p class="mb-4 mt-1.5 text-[0.8125rem] font-medium">08:00 às 12:00</p>
          <span class="absolute bottom-4 right-[18px] text-[#d8d8dc]"><app-icon name="calendar" [size]="64" /></span>
        </section>
      </div>
    </div>
  `,
})
export class TicketNewComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);
  settings = inject(SettingsService);
  private summaryBox = viewChild<ElementRef<HTMLElement>>('summaryBox');

  categories = signal<Category[]>([]);
  sectors = SECTORS;
  sector = '';
  categoryId: number | null = null;
  title = '';
  description = '';
  files = signal<File[]>([]);
  over = signal(false);
  loading = signal(false);
  apiError = signal('');
  submitted = signal(false);
  summary = signal<{ field: Field; msg: string }[]>([]);
  private touched = signal<Partial<Record<Field, boolean>>>({});
  private done = false;

  constructor() { this.api.categories().subscribe((c) => this.categories.set(c)); }

  private rule(f: Field): string {
    switch (f) {
      case 'sector': return this.sector ? '' : 'Selecione o setor onde você trabalha.';
      case 'category': return this.categoryId ? '' : 'Selecione a categoria que melhor descreve o problema.';
      case 'title': {
        const t = this.title.trim();
        return !t ? 'Informe um título para o chamado.' : t.length < 5 ? 'O título precisa ter pelo menos 5 caracteres.' : '';
      }
      case 'description': {
        const d = this.description.trim();
        return !d ? 'Descreva o problema para que a equipe possa ajudar.' : d.length < 15 ? 'Descreva com mais detalhes (mínimo de 15 caracteres).' : '';
      }
      case 'files': return this.settings.value().requireAttachments && this.files().length === 0 ? 'Adicione pelo menos um arquivo: os anexos são obrigatórios.' : '';
    }
  }
  err(f: Field) { return this.submitted() || this.touched()[f] ? this.rule(f) : ''; }
  touch(f: Field) { this.touched.update((t) => ({ ...t, [f]: true })); }

  onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    this.files.update((f) => [...f, ...Array.from(input.files ?? [])]);
    input.value = '';
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.over.set(false);
    this.files.update((f) => [...f, ...Array.from(e.dataTransfer?.files ?? [])]);
  }
  remove(i: number) { this.files.update((f) => f.filter((_, idx) => idx !== i)); }

  goTo(e: Event, field: Field) {
    e.preventDefault();
    const id = field === 'files' ? 'files' : field;
    document.getElementById(id)?.focus();
  }

  submit() {
    if (this.loading()) return;
    this.submitted.set(true);
    this.apiError.set('');
    const order: Field[] = ['sector', 'category', 'title', 'description', 'files'];
    const problems = order.map((f) => ({ field: f, msg: this.rule(f) })).filter((p) => p.msg);
    this.summary.set(problems);
    if (problems.length) { setTimeout(() => this.summaryBox()?.nativeElement.focus()); return; }

    this.loading.set(true);
    this.api.createTicket({
      title: this.title, description: this.description, sector: this.sector, categoryId: this.categoryId!,
    }).subscribe({
      next: (t) => {
        this.done = true;
        const files = this.files();
        if (!files.length) return this.finish(t.id);
        this.api.uploadAttachments(t.id, files).subscribe({
          next: () => this.finish(t.id),
          error: (e) => this.finish(t.id, `O chamado foi criado, mas os anexos não foram enviados: ${errMsg(e)}`),
        });
      },
      error: (e) => { this.apiError.set(errMsg(e)); this.loading.set(false); },
    });
  }

  private finish(id: number, problem?: string) {
    if (problem) this.toast.error(problem); else this.toast.success(`Chamado #${id} aberto com sucesso.`);
    this.router.navigate(['/chamados', id]);
  }

  private dirty() { return !this.done && !!(this.title || this.description || this.sector || this.categoryId || this.files().length); }
  async canLeave(): Promise<boolean> {
    if (!this.dirty()) return true;
    return this.confirm.ask({
      title: 'Descartar este chamado?', message: 'Você preencheu informações que ainda não foram enviadas. Se sair agora, elas serão perdidas.',
      confirmLabel: 'Descartar e sair', cancelLabel: 'Continuar editando', danger: true,
    });
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(e: BeforeUnloadEvent) { if (this.dirty()) e.preventDefault(); }
}
