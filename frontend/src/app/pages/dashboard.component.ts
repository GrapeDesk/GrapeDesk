import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Article } from '../core/kb.data';
import { PRIORITY_LABEL, STATUS_LABEL, Stats, Ticket, friendlyDate } from '../core/models';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="mb-6 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-6" aria-label="Indicadores de chamados">
      @if (!stats()) { <div class="loading" role="status"><span class="spin" aria-hidden="true"></span> Carregando indicadores...</div> }
      @for (k of kpis(); track k.label) {
        <div class="card relative !mb-0 min-h-[150px] !px-5 !py-[18px]">
          <div class="flex items-center gap-3">
            <span class="circle-icon"><app-icon [name]="k.icon" [size]="20" /></span>
            <b class="text-sm font-semibold">{{ k.label }}</b>
          </div>
          <div class="ml-[50px] mt-1.5 flex items-baseline gap-3"><strong class="text-3xl font-semibold">{{ k.value }}</strong>@if (k.delta !== null) {
              <span aria-hidden="true" class="text-xs" [class]="k.delta < 0 ? 'text-[#c92a2a]' : 'text-[#0b7a3b]'">{{ k.delta > 0 ? '+' : '' }}{{ k.delta }}%</span><span class="sr-only">{{ k.delta > 0 ? 'aumento' : 'queda' }} de {{ k.delta < 0 ? -k.delta : k.delta }} por cento em relação ao último mês</span>
            }</div>
          @if (k.delta !== null) { <small aria-hidden="true" class="ml-[50px] mt-1.5 block text-xs">vs. último mês</small> }
          <span class="absolute bottom-3.5 right-[18px] text-primary"><app-icon name="trend" [size]="44" /></span>
        </div>
      }
    </section>

    <section class="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <div class="card">
          <div class="mb-3.5 flex items-center justify-between"><h2 class="m-0 text-[0.9375rem] font-semibold">Chamados Recentes</h2><a class="btn btn-outline btn-sm" routerLink="/chamados">Ver todos os chamados</a></div>
          <div class="overflow-x-auto"><table class="dtable">
            <caption class="sr-only">Seis chamados mais recentes</caption>
            <thead><tr><th scope="col">ID</th><th scope="col">Título</th><th scope="col">Cliente</th><th scope="col">Prioridade</th><th scope="col">Status</th><th scope="col">Atualizado em</th><th scope="col"><span class="sr-only">Detalhes</span></th></tr></thead>
            <tbody>
              @for (t of recent(); track t.id) {
                <tr class="click" (click)="open(t.id)">
                  <td class="id"><a [routerLink]="['/chamados', t.id]" [attr.aria-label]="'Abrir chamado ' + t.id + ': ' + t.title" (click)="$event.stopPropagation()">#{{ t.id }}</a></td>
                  <td>{{ t.title }}</td>
                  <td>{{ t.requester.name }}</td>
                  <td><span class="badge p-{{ t.priority }}">{{ priority[t.priority] }}</span></td>
                  <td><span class="badge s-{{ t.status }}">{{ status[t.status] }}</span></td>
                  <td>{{ fmt(t.updatedAt) }}</td>
                  <td><app-icon name="chevron-right" [size]="18" /></td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="muted">{{ loading() ? 'Carregando chamados...' : 'Nenhum chamado por aqui ainda.' }}</td></tr>
              }
            </tbody>
          </table></div>
        </div>

        <div class="card">
          <div class="mb-3.5 flex items-center justify-between"><h2 class="m-0 text-[0.9375rem] font-semibold">Base de Conhecimento</h2><a class="btn btn-outline btn-sm" routerLink="/base-de-conhecimento">Ver todos artigos</a></div>
          <div class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            @for (a of articles(); track a.slug) {
              <a class="block rounded-[10px] border border-[#ececf1] p-3 text-inherit no-underline shadow-[0_1px_6px_rgba(30,20,70,.08)] hover:border-primary" [routerLink]="['/base-de-conhecimento', a.slug]">
                <span class="float-left mr-2 inline-flex size-[30px] items-center justify-center rounded-full bg-primary-100 text-primary"><app-icon [name]="a.icon" [size]="18" /></span>
                <b class="block min-h-[30px] text-xs">{{ a.title }}</b>
                <p class="clear-both mb-2.5 mt-1.5 min-h-[42px] text-xs text-ink">{{ a.summary }}</p>
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">Ler artigo <app-icon name="arrow-right" [size]="14" /></span>
              </a>
            }
          </div>
        </div>
      </div>

      <section class="card !mb-0 flex flex-col gap-3.5" aria-labelledby="quick-h">
        <h2 id="quick-h" class="mb-1.5 text-center text-[0.9375rem] font-medium">Acesso rápido</h2>
        <a class="btn btn-primary flex items-center justify-center gap-2 !p-[11px] text-sm !text-white" routerLink="/chamados/novo"><app-icon name="plus" [size]="18" /> Novo chamado</a>
        <a class="btn btn-outline flex items-center justify-center gap-2 !p-[11px] text-sm" routerLink="/chamados"><app-icon name="search" [size]="18" /> Buscar Chamado</a>
        @if (auth.isStaff()) {
          <a class="btn btn-outline flex items-center justify-center gap-2 !p-[11px] text-sm" routerLink="/relatorios"><app-icon name="file-text" [size]="18" /> Relatórios</a>
        }
      </section>
    </section>
  `,
})
export class DashboardComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);

  stats = signal<Stats | null>(null);
  recent = signal<Ticket[]>([]);
  loading = signal(true);
  status = STATUS_LABEL;
  priority = PRIORITY_LABEL;
  fmt = friendlyDate;
  articles = signal<Article[]>([]);

  /** As variações (%) vêm do backend (mês atual x anterior); ficam ocultas quando não há base de comparação. */
  kpis = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Total de chamados', value: s.total, delta: s.totalDelta ?? null, icon: 'file-text' },
      { label: 'Em andamento', value: s.inProgress, delta: s.inProgressDelta ?? null, icon: 'clock' },
      { label: 'Resolvidos', value: s.resolved, delta: s.resolvedDelta ?? null, icon: 'check' },
      { label: 'Aguardando Cliente', value: s.waiting, delta: s.waitingDelta ?? null, icon: 'hourglass' },
    ];
  });

  constructor() {
    this.api.stats().subscribe((s) => this.stats.set(s));
    this.api.articles().subscribe({ next: (a) => this.articles.set(a.slice(0, 4)), error: () => this.articles.set([]) });
    this.api.tickets().subscribe((t) => { this.recent.set(t.slice(0, 6)); this.loading.set(false); });
  }

  open(id: number) { this.router.navigate(['/chamados', id]); }
}
