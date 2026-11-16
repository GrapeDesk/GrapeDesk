import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '../core/api.service';
import { AppSettings, SettingsService } from '../core/settings.service';
import { SETTINGS_SECTIONS } from '../layout/shell.component';
import { IconComponent } from '../shared/icon.component';
import { UsersComponent } from './users.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, UsersComponent],
  template: `
    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
      <nav class="card !mb-0 flex flex-col gap-0.5 !px-3.5 !py-4" aria-label="Seções de configurações">
        <h2 class="mb-2.5 ml-1.5 text-[0.9375rem] font-semibold">Navegação</h2>
        @for (s of sections; track s.slug) {
          <a [routerLink]="['/configuracoes', s.slug]" [attr.aria-current]="s.slug === secao() ? 'page' : null"
             class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[#333] no-underline hover:bg-primary-50 aria-[current=page]:bg-primary-100 aria-[current=page]:font-medium aria-[current=page]:text-primary"><app-icon [name]="s.icon" [size]="18" /> {{ s.label }}</a>
        }
      </nav>

      <div>
        @switch (secao()) {
          @case ('geral') {
            <div class="card">
              <h2 class="card-title !mb-4">Informações da Empresa</h2>
              <div class="grid grid-cols-1 gap-[30px] md:grid-cols-[minmax(0,1fr)_200px]">
                <div class="grid grid-cols-1 content-start gap-x-6 gap-y-3.5 sm:grid-cols-2">
                  <div><label for="s-name" class="mb-1 block text-xs">Nome da empresa</label><input id="s-name" class="input !px-2.5 !py-2 !text-xs !rounded-md" [ngModel]="v().companyName" (ngModelChange)="set('companyName', $event)" /></div>
                  <div><label for="s-tz" class="mb-1 block text-xs">Fuso horário</label>
                    <select id="s-tz" class="input !px-2.5 !py-2 !text-xs !rounded-md" [ngModel]="v().timezone" (ngModelChange)="set('timezone', $event)">
                      @for (o of timezones; track o) { <option>{{ o }}</option> }
                    </select></div>
                  <div><label for="s-mail" class="mb-1 block text-xs">E-mail de suporte</label><input id="s-mail" type="email" class="input !px-2.5 !py-2 !text-xs !rounded-md" [ngModel]="v().supportEmail" (ngModelChange)="set('supportEmail', $event)" /></div>
                  <div><label for="s-lang" class="mb-1 block text-xs">Idioma padrão</label>
                    <select id="s-lang" class="input !px-2.5 !py-2 !text-xs !rounded-md" [ngModel]="v().language" (ngModelChange)="set('language', $event)">
                      @for (o of languages; track o) { <option>{{ o }}</option> }
                    </select></div>
                  <div><label for="s-phone" class="mb-1 block text-xs">Telefone de suporte</label><input id="s-phone" type="tel" class="input !px-2.5 !py-2 !text-xs !rounded-md" [ngModel]="v().supportPhone" (ngModelChange)="set('supportPhone', $event)" /></div>
                </div>
                <div class="flex flex-col gap-2.5">
                  <span class="mb-1 block text-xs">Logotipo</span>
                  <div class="flex h-[110px] items-center justify-center border border-[#aaa] bg-white"><img [src]="v().logo || 'logo-color.png'" alt="Logotipo atual da empresa" class="max-h-[90px] max-w-[90%]" /></div>
                  <button type="button" class="btn btn-outline btn-sm inline-flex items-center justify-center gap-1.5" (click)="logoInput.click()"><app-icon name="upload" [size]="14" /> Alterar Logo</button>
                  <input #logoInput type="file" accept="image/*" hidden (change)="onLogo($event)" />
                </div>
              </div>
            </div>

            <div class="card">
              <h2 class="card-title !mb-4">Configurações de Chamados</h2>
              <div class="grid grid-cols-1 gap-[26px] md:grid-cols-[1fr_1px_1fr]">
                <div>
                  <div class="mb-4 flex items-center justify-between gap-3.5"><div><b id="t-auto" class="block text-xs">Atribuição automática de chamados</b><small class="text-xs text-muted">Atribuir novos chamados automaticamente para Técnicos</small></div>
                    <button type="button" class="sw" role="switch" aria-labelledby="t-auto" [attr.aria-checked]="v().autoAssign" (click)="set('autoAssign', !v().autoAssign)"></button></div>
                  <div class="mb-4 flex items-center justify-between gap-3.5"><div><b id="t-reopen" class="block text-xs">Permitir reabertura de chamados</b><small class="text-xs text-muted">Permitir que clientes reabram chamados finalizados</small></div>
                    <button type="button" class="sw" role="switch" aria-labelledby="t-reopen" [attr.aria-checked]="v().allowReopen" (click)="set('allowReopen', !v().allowReopen)"></button></div>
                  <div class="mb-4 flex items-center justify-between gap-3.5"><div><b id="t-att" class="block text-xs">Anexos obrigatórios</b><small class="text-xs text-muted">Tornar anexos obrigatórios ao abrir um chamado</small></div>
                    <button type="button" class="sw" role="switch" aria-labelledby="t-att" [attr.aria-checked]="v().requireAttachments" (click)="set('requireAttachments', !v().requireAttachments)"></button></div>
                </div>
                <div class="hidden bg-[#ddd] md:block"></div>
                <div>
                  <div class="mb-4 flex items-center justify-between gap-3.5"><div><b id="t-fr" class="block text-xs">Prazo para resposta inicial (padrão)</b><small class="text-xs text-muted">Tempo máximo para a primeira resposta</small></div>
                    <select aria-labelledby="t-fr" class="input !w-[112px] !px-2.5 !py-2 !text-xs !rounded-md" [ngModel]="v().firstResponse" (ngModelChange)="set('firstResponse', $event)">@for (o of o1; track o) { <option>{{ o }}</option> }</select></div>
                  <div class="mb-4 flex items-center justify-between gap-3.5"><div><b id="t-res" class="block text-xs">Prazo para resolução (padrão)</b><small class="text-xs text-muted">Tempo máximo para a resolução do chamado</small></div>
                    <select aria-labelledby="t-res" class="input !w-[112px] !px-2.5 !py-2 !text-xs !rounded-md" [ngModel]="v().resolution" (ngModelChange)="set('resolution', $event)">@for (o of o2; track o) { <option>{{ o }}</option> }</select></div>
                  <div class="mb-4 flex items-center justify-between gap-3.5"><div><b id="t-ac" class="block text-xs">Encerramento automático</b><small class="text-xs text-muted">Encerrar chamados inativos após</small></div>
                    <select aria-labelledby="t-ac" class="input !w-[112px] !px-2.5 !py-2 !text-xs !rounded-md" [ngModel]="v().autoClose" (ngModelChange)="set('autoClose', $event)">@for (o of o3; track o) { <option>{{ o }}</option> }</select></div>
                </div>
              </div>
            </div>

            <p class="ml-2.5 flex items-center gap-2 text-xs" role="status" aria-live="polite"><app-icon name="info" [size]="16" />
              @if (settings.savedAt()) { Alterações salvas automaticamente. } @else { Todas as alterações serão salvas automaticamente. }</p>
          }
          @case ('usuarios') { <app-users /> }
          @case ('categorias') {
            <div class="card">
              <h2 class="card-title">Categorias de chamados</h2>
              <table class="dtable"><caption class="sr-only">Categorias de chamados</caption><thead><tr><th scope="col">#</th><th scope="col">Nome</th></tr></thead>
                <tbody>@for (c of categories() ?? []; track c.id) { <tr><td>{{ c.id }}</td><td>{{ c.name }}</td></tr> }</tbody></table>
            </div>
          }
          @default {
            <div class="card px-5 py-[50px] text-center text-primary">
              <app-icon name="info" [size]="32" />
              <h2 class="card-title mt-3">{{ current()?.label }}</h2>
              <p class="muted m-0">Esta seção ainda está em construção.</p>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class SettingsComponent {
  settings = inject(SettingsService);
  private api = inject(ApiService);

  secao = input.required<string>();
  sections = SETTINGS_SECTIONS;
  v = this.settings.value;
  current = computed(() => this.sections.find((s) => s.slug === this.secao()));
  categories = toSignal(this.api.categories());

  timezones = ['(GMT-03:00) Brasília', '(GMT-04:00) Manaus', '(GMT-02:00) Fernando de Noronha'];
  languages = ['Português (Brasil)', 'English', 'Español'];
  o1 = ['30 minutos', '1 hora', '2 horas', '4 horas', '8 horas'];
  o2 = ['8 horas', '24 horas', '48 horas', '72 horas'];
  o3 = ['3 dias', '5 dias', '7 dias', '15 dias', '30 dias'];

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) { this.settings.update({ [key]: value } as Partial<AppSettings>); }

  onLogo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.set('logo', String(reader.result));
    reader.readAsDataURL(file);
  }
}
