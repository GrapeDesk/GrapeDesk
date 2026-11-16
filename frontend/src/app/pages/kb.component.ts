import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { Article, KB_CATEGORIES } from '../core/kb.data';
import { ApiService } from '../core/api.service';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../core/ui.service';
import { savedSlugs } from './kb-article.component';

type Filtro = 'populares' | 'recentes' | 'salvos' | 'importantes' | 'pequenos';

@Component({
  selector: 'app-kb',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
      <div>
        <div class="card !px-7 !py-6">
          <div class="mb-3.5 flex items-center gap-3 text-[0.9375rem]"><span class="inline-flex text-primary"><app-icon name="sparkles" [size]="30" /></span> <b>Como podemos te ajudar hoje?</b></div>
          <div class="flex h-[42px] items-center rounded-[10px] border border-[#ddd] px-3.5 text-primary shadow-[0_1px_4px_rgba(0,0,0,.08)] focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[#111]">
            <label for="kb-q" class="sr-only">Pesquisar na base de conhecimento</label>
            <input id="kb-q" type="search" placeholder="Pesquise um problema, erro ou procedimento..." [ngModel]="query()" (ngModelChange)="query.set($event)"
                   class="w-full border-0 bg-transparent p-0 text-xs text-ink shadow-none outline-none focus-visible:shadow-none focus-visible:outline-none" />
            <app-icon name="search" [size]="20" />
          </div>
          <div class="mt-3.5 flex flex-wrap items-center gap-2.5">
            <small class="text-xs">Buscas populares</small>
            @for (c of chips; track c) {
              <button type="button" class="cursor-pointer rounded-full border border-[#ccc] bg-white px-4 py-[3px] text-xs hover:border-primary hover:text-primary" [attr.aria-label]="'Buscar por ' + c" (click)="query.set(c)">{{ c }}</button>
            }
          </div>
        </div>

        <div class="card">
          <h2 class="mb-3.5 text-[0.8125rem] font-semibold">Categorias</h2>
          <div class="grid grid-cols-3 gap-3 min-[1300px]:grid-cols-6">
            @for (c of cats(); track c.name) {
              <button type="button" class="flex cursor-pointer flex-col items-center gap-1 rounded-[10px] border border-[#ececf1] bg-white px-2 py-3 shadow-[0_1px_6px_rgba(30,20,70,.08)] hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary-50"
                      [attr.aria-pressed]="categoria() === c.name" (click)="toggleCat(c.name)">
                <span class="inline-flex size-[38px] items-center justify-center rounded-lg" [style.background]="c.bg" [style.color]="c.fg"><app-icon [name]="c.icon" [size]="20" /></span>
                <b class="text-xs font-medium">{{ c.name }}</b><small class="text-xs text-muted">{{ c.count }} {{ c.count === 1 ? 'artigo' : 'artigos' }}</small>
              </button>
            }
          </div>
        </div>

        <div class="card">
          <div class="mb-3.5 flex items-center justify-between">
            <h2 class="m-0 text-[0.8125rem] font-semibold">{{ heading() }}</h2>
            @if (filtro() !== 'populares' || categoria() || query()) { <button type="button" class="btn btn-outline btn-sm" (click)="reset()">Limpar filtros</button> }
          </div>
          @if (loading()) { <div class="loading" role="status"><span class="spin" aria-hidden="true"></span> Carregando artigos...</div> }
          <p class="sr-only" role="status" aria-live="polite">{{ list().length }} {{ list().length === 1 ? 'artigo encontrado' : 'artigos encontrados' }}</p>
          <div class="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
            @for (a of list(); track a.slug) {
              <a class="block rounded-[10px] border border-[#ececf1] p-3 text-inherit no-underline shadow-[0_1px_6px_rgba(30,20,70,.08)] hover:border-primary" [routerLink]="['/base-de-conhecimento', a.slug]">
                <span class="float-left mr-2 inline-flex size-7 items-center justify-center rounded-full bg-primary-100 text-primary"><app-icon [name]="a.icon" [size]="16" /></span><b class="block min-h-[30px] text-xs">{{ a.title }}</b>
                <p class="clear-both mb-3 mt-1.5 min-h-10 text-xs text-ink">{{ a.summary }}</p>
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">Ler artigo <app-icon name="arrow-right" [size]="13" /></span>
              </a>
            } @empty {
              @if (!loading()) { <p class="muted col-span-full">Nenhum artigo encontrado. Tente outra busca ou <a routerLink="/chamados/novo">abra um chamado</a>.</p> }
            }
          </div>
        </div>
      </div>

      <div>
        <div class="card !p-[18px]">
          <h2 class="mb-3 flex items-center gap-2 text-[0.8125rem] font-semibold"><i aria-hidden="true" class="size-2 rounded-full bg-primary"></i> Sugestões da IA</h2>
          <a class="mb-2.5 flex items-start gap-2.5 rounded-[10px] p-2.5 text-xs text-inherit no-underline shadow-[0_1px_6px_rgba(30,20,70,.1)]" [routerLink]="['/base-de-conhecimento', 'acesso-ao-wifi']">
            <span class="text-primary"><app-icon name="chart" [size]="24" /></span><span>87% dos usuários com “internet lenta” resolveram com reinício do proxy.<br /><em class="font-semibold not-italic text-primary">Ver artigo</em></span>
          </a>
          <a class="flex items-start gap-2.5 rounded-[10px] p-2.5 text-xs text-inherit no-underline shadow-[0_1px_6px_rgba(30,20,70,.1)]" [routerLink]="['/base-de-conhecimento', 'acesso-ao-wifi']">
            <span class="text-primary"><app-icon name="trend" [size]="24" /></span><span>Esse problema ocorreu 15 vezes essa semana.<br /><em class="font-semibold not-italic text-primary">Ver artigo</em></span>
          </a>
        </div>

        <div class="card !p-[18px]">
          <h2 class="mb-3 text-[0.8125rem] font-semibold">Acesso rápido</h2>
          @for (q of quick; track q.label) {
            <button type="button" class="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent py-2 text-left text-xs hover:text-primary" (click)="go(q)"><i aria-hidden="true" class="size-[7px] rounded-full bg-primary"></i><span class="flex-1">{{ q.label }}</span><app-icon name="chevron-right" [size]="18" /></button>
          }
        </div>
      </div>
    </div>
  `,
})
export class KbComponent {
  private router = inject(Router);
  private api = inject(ApiService);
  articles = signal<Article[]>([]);
  loading = signal(true);

  query = signal('');
  categoria = signal<string | null>(null);
  filtro = signal<Filtro>('populares');
  private toasts = inject(ToastService);
  chips = ['senha', 'internet lenta', 'impressora', 'vpn'];
  quick = [
    { label: 'Artigos Recentes', f: 'recentes' as Filtro },
    { label: 'Meus Artigos Salvos', f: 'salvos' as Filtro },
    { label: 'Artigos que já ajudaram' },
    { label: 'Reportar conteúdo incorreto' },
    { label: 'Realizar chamado', link: '/chamados/novo' },
    { label: 'Realizar solicitação', link: '/chamados/novo' },
    { label: 'Sugestões e melhorias' },
    { label: 'Pequenos artigos', f: 'pequenos' as Filtro },
    { label: 'Artigos importantes', f: 'importantes' as Filtro },
  ];

  cats = computed(() => KB_CATEGORIES.map((c) => ({ ...c, count: this.articles().filter((a) => a.category === c.name).length })));

  list = computed<Article[]>(() => {
    let l: Article[] = [...this.articles()];
    switch (this.filtro()) {
      case 'recentes': l = [...l].reverse(); break;
      case 'salvos': { const s = savedSlugs(); l = l.filter((a) => s.includes(a.slug)); break; }
      case 'importantes': l = l.filter((a) => a.important); break;
      case 'pequenos': l = l.filter((a) => a.steps.length <= 3); break;
    }
    const cat = this.categoria();
    if (cat) l = l.filter((a) => a.category === cat);
    const q = this.query().trim().toLowerCase();
    if (q) l = l.filter((a) => (a.title + ' ' + a.summary + ' ' + a.keywords).toLowerCase().includes(q));
    return l;
  });

  heading = computed(() => {
    if (this.query().trim()) return 'Resultados da busca';
    return { populares: 'Artigos mais acessados', recentes: 'Artigos recentes', salvos: 'Meus artigos salvos', importantes: 'Artigos importantes', pequenos: 'Pequenos artigos' }[this.filtro()];
  });

  constructor() {
    this.api.articles().subscribe({ next: (a) => { this.articles.set(a); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  toggleCat(name: string) { this.categoria.set(this.categoria() === name ? null : name); }
  reset() { this.query.set(''); this.categoria.set(null); this.filtro.set('populares'); }

  go(q: { label: string; f?: Filtro; link?: string }) {
    if (q.link) this.router.navigateByUrl(q.link);
    else if (q.f) { this.filtro.set(q.f); this.query.set(''); }
    else this.toasts.info('Esta função estará disponível em breve.');
  }
}
