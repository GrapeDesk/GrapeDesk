import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { HelpService } from '../core/ui.service';
import { SettingsService } from '../core/settings.service';
import { ROLE_LABEL, initials } from '../core/models';
import { A11yMenuComponent } from '../shared/a11y-menu.component';
import { IconComponent } from '../shared/icon.component';

export const SETTINGS_SECTIONS = [
  { slug: 'geral', label: 'Geral', icon: 'gear' },
  { slug: 'canais', label: 'Canais de Atendimento', icon: 'chat' },
  { slug: 'categorias', label: 'Categorias', icon: 'tag' },
  { slug: 'slas', label: 'SLAs', icon: 'hourglass' },
  { slug: 'status', label: 'Status de Chamados', icon: 'check' },
  { slug: 'usuarios', label: 'Usuários', icon: 'users' },
  { slug: 'funcoes', label: 'Funções e Permissões', icon: 'shield' },
  { slug: 'notificacoes', label: 'Notificações', icon: 'bell' },
  { slug: 'integracoes', label: 'Integrações', icon: 'plug' },
  { slug: 'seguranca', label: 'Segurança', icon: 'lock' },
  { slug: 'personalizacao', label: 'Personalização', icon: 'palette' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, IconComponent, A11yMenuComponent],
  host: { class: 'grid min-h-screen grid-cols-1 lg:grid-cols-[19.5rem_minmax(0,1fr)]' },
  template: `
    <a data-skip class="fixed -top-16 left-3 z-[2000] rounded-lg bg-[#111] px-4 py-2.5 font-semibold text-white no-underline focus:top-3" href="#conteudo" (click)="skipToMain($event)">Ir para o conteúdo principal</a>

    <aside aria-label="Barra lateral" class="z-[5] overflow-y-auto bg-white px-[22px] py-[26px] shadow-[3px_0_14px_rgba(30,20,70,.08)] lg:sticky lg:top-0 lg:h-screen">
      <a class="mb-11 flex items-center gap-2 text-black no-underline" routerLink="/dashboard" aria-label="Grape Desk - ir para o Dashboard">
        <img src="logo-color.png" alt="" class="h-[53px] w-[52px] object-contain" />
        <span aria-hidden="true" class="whitespace-nowrap text-[1.8125rem] font-semibold leading-none"><b class="font-semibold text-primary">Grape</b> Desk</span>
      </a>
      <nav #nav aria-label="Menu principal" class="flex flex-col gap-3.5">
        <a class="nav-item" routerLink="/dashboard" routerLinkActive ariaCurrentWhenActive="page"><app-icon name="home" [size]="26" /> Dashboard</a>
        <a class="nav-item" routerLink="/chamados" routerLinkActive ariaCurrentWhenActive="page"><app-icon name="headset" [size]="26" /> Chamados</a>
        @if (auth.isStaff()) {
          <a class="nav-item" routerLink="/relatorios" routerLinkActive ariaCurrentWhenActive="page"><app-icon name="chart" [size]="26" /> Relatórios</a>
        }
        <a class="nav-item" routerLink="/base-de-conhecimento" routerLinkActive ariaCurrentWhenActive="page"><app-icon name="book" [size]="26" /> Base de conhecimento</a>
        @if (auth.isAdmin()) {
          <button type="button" class="nav-item" [attr.data-active]="onSettings()" aria-controls="submenu-config" [attr.aria-expanded]="settingsOpen()" (click)="settingsOpen.set(!settingsOpen())">
            <app-icon name="gear" [size]="26" /> Configurações
            <span class="ml-auto inline-flex"><app-icon [name]="settingsOpen() ? 'chevron-down' : 'chevron-right'" [size]="20" /></span>
          </button>
          @if (settingsOpen()) {
            <div id="submenu-config" class="-mt-3.5 flex flex-col gap-1.5 rounded-b-xl bg-primary-50 py-3 pl-[22px] pr-2.5">
              @for (s of subItems; track s.slug) {
                <a [routerLink]="['/configuracoes', s.slug]" routerLinkActive ariaCurrentWhenActive="page"
                   class="group flex min-h-7 items-center gap-[9px] text-[0.8125rem] text-[#444] no-underline aria-[current=page]:font-semibold aria-[current=page]:text-primary">
                  <i aria-hidden="true" class="size-[5px] rounded-full bg-[#777] group-aria-[current=page]:bg-primary"></i>{{ s.label }}
                </a>
              }
            </div>
          }
        }
      </nav>
    </aside>

    <div class="flex min-w-0 flex-col">
      <header class="relative z-[4] flex min-h-28 flex-wrap items-center gap-6 bg-white px-5 py-[18px] shadow-bar lg:px-10">
        <div class="min-w-[220px] flex-1">
          <h1 class="m-0 text-[1.75rem] font-semibold">{{ title() }}</h1>
          @if (subtitle()) { <p class="mt-0.5 text-sm">{{ subtitle() }}</p> }
        </div>
        <div class="flex flex-wrap items-center gap-[18px]">
          <app-a11y-menu />
          <button type="button" class="inline-flex cursor-pointer rounded-full border-0 bg-transparent p-1.5 text-primary hover:bg-primary-50" aria-label="Ajuda e atalhos de teclado" title="Ajuda e atalhos (?)" (click)="help.open()"><app-icon name="help" [size]="26" /></button>
          <form role="search" aria-label="Buscar chamados no sistema" (submit)="$event.preventDefault(); doSearch()"
                class="m-0 flex h-[42px] w-[230px] items-center rounded-full border border-[#767676] pl-5 pr-3 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[#111]">
            <label for="busca" class="sr-only">Buscar chamado</label>
            <input #busca id="busca" type="search" placeholder="Buscar Chamado" [(ngModel)]="search" name="busca"
                   class="w-full border-0 bg-transparent p-0 text-[0.8125rem] font-semibold shadow-none outline-none focus-visible:shadow-none focus-visible:outline-none" />
            <button type="submit" aria-label="Buscar" class="inline-flex cursor-pointer rounded-full border-0 bg-transparent p-1 text-primary"><app-icon name="search" [size]="22" /></button>
          </form>
          <a class="relative inline-flex rounded-full p-1 text-primary" routerLink="/chamados" [attr.aria-label]="'Chamados abertos: ' + openCount()" title="Chamados abertos">
            <app-icon name="bell" [size]="30" />
            @if (openCount() > 0) { <span aria-hidden="true" class="absolute -right-2 -top-1 h-5 min-w-5 rounded-full border border-primary bg-white text-center text-xs leading-[18px] text-[#222]">{{ openCount() }}</span> }
          </a>
          <div class="relative">
            <button type="button" aria-haspopup="true" [attr.aria-expanded]="menu()" (click)="$event.stopPropagation(); menu.set(!menu())"
                    class="flex cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent p-1 text-left text-inherit">
              <span aria-hidden="true" class="relative inline-flex size-11 items-center justify-center rounded-full bg-[#3b3b4a] text-[0.9375rem] font-semibold text-white">{{ ini() }}<i class="absolute bottom-0 right-0 size-[11px] rounded-full border-2 border-white bg-[#22c55e]"></i></span>
              <span class="flex flex-col leading-tight"><b class="text-[0.8125rem]">{{ auth.user()?.name }}</b><small class="text-xs text-[#555]">{{ auth.user()?.department || roleLabel[auth.user()!.role] }}</small></span>
              <app-icon name="chevron-down" [size]="22" />
            </button>
            @if (menu()) {
              <div role="menu" (click)="$event.stopPropagation()" data-panel class="absolute right-0 top-14 z-20 w-60 rounded-xl border border-line bg-white p-2 shadow-pop">
                <div class="break-all px-2.5 pb-2.5 pt-1.5 text-xs text-muted">{{ auth.user()?.email }}</div>
                <button type="button" role="menuitem" (click)="auth.logout()" class="flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 py-[9px] hover:bg-primary-50"><app-icon name="logout" [size]="18" /> Sair</button>
              </div>
            }
          </div>
        </div>
      </header>
      <main #main id="conteudo" tabindex="-1" class="min-w-0 px-5 pb-10 pt-[26px] focus:outline-none lg:px-10"><router-outlet /></main>
    </div>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  help = inject(HelpService);
  private router = inject(Router);
  private api = inject(ApiService);
  private titleSvc = inject(Title);
  private settings = inject(SettingsService);

  private main = viewChild.required<ElementRef<HTMLElement>>('main');
  private nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  private busca = viewChild.required<ElementRef<HTMLInputElement>>('busca');

  title = signal('');
  subtitle = signal('');
  openCount = signal(0);
  menu = signal(false);
  settingsOpen = signal(false);
  search = '';
  subItems = SETTINGS_SECTIONS.slice(0, 7);
  roleLabel = ROLE_LABEL;
  private first = true;

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), startWith(null)).subscribe(() => this.onRoute());
    this.api.stats().subscribe((s) => this.openCount.set(s.open));
    this.settings.load();
  }

  ini() { return initials(this.auth.user()?.name ?? ''); }
  onSettings() { return this.router.url.startsWith('/configuracoes'); }

  private onRoute() {
    let r = this.router.routerState.snapshot.root;
    while (r.firstChild) r = r.firstChild;
    this.title.set(r.data['title'] ?? '');
    this.subtitle.set(r.data['subtitle'] ?? r.data['crumb'] ?? '');
    this.titleSvc.setTitle(`${this.title()} · Grape Desk`);
    if (this.onSettings()) this.settingsOpen.set(true);
    this.menu.set(false);
    // Acessibilidade: leva o foco para o conteúdo a cada troca de página (leitores de tela anunciam a nova página)
    if (!this.first) setTimeout(() => this.main().nativeElement.focus({ preventScroll: false }));
    this.first = false;
  }

  skipToMain(e: Event) { e.preventDefault(); this.main().nativeElement.focus(); }

  doSearch() { this.router.navigate(['/chamados'], { queryParams: { q: this.search.trim() || null } }); }

  /** Atalhos: Alt+1/2/3 (padrão eMAG), "/" busca, "N" novo chamado, "?" ajuda. */
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable;
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.code === 'Digit1') { e.preventDefault(); this.main().nativeElement.focus(); }
      else if (e.code === 'Digit2') { e.preventDefault(); this.nav().nativeElement.querySelector<HTMLElement>('a,button')?.focus(); }
      else if (e.code === 'Digit3') { e.preventDefault(); this.busca().nativeElement.focus(); }
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (e.key === '/') { e.preventDefault(); this.busca().nativeElement.focus(); }
    else if (e.key === '?') { e.preventDefault(); this.help.open(); }
    else if (e.key.toLowerCase() === 'n') { e.preventDefault(); this.router.navigate(['/chamados/novo']); }
  }

  @HostListener('document:click') closeMenu() { this.menu.set(false); }
  @HostListener('document:keydown.escape') escMenu() { this.menu.set(false); }
}
