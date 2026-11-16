import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { PRIORITY_LABEL, ReportSummary, STATUS_LABEL, Ticket, TicketPriority, friendlyDate, initials } from '../core/models';
import { IconComponent } from '../shared/icon.component';

const PRIO_COLOR: Record<TicketPriority, string> = { HIGH: '#e53935', CRITICAL: '#b71c1c', MEDIUM: '#f5a623', LOW: '#12b83a' };
const AV_COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fee2e2', '#e0e7ff'];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    @if (r(); as d) {
      <section class="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)_minmax(0,1.1fr)]">
        <div class="card !mb-0 !pb-9">
          <div class="mb-3 flex items-center justify-between"><h2 class="m-0 text-[0.9375rem] font-semibold">Chamados por mês</h2><small class="text-xs">Últimos 6 meses ▾</small></div>
          <div class="flex h-[190px] items-end gap-[18px] border-b border-[#ddd] pt-[18px]" role="img" [attr.aria-label]="barsLabel()">
            @for (m of d.monthly; track m.label; let last = $last) {
              <div class="relative flex h-full flex-1 flex-col items-center justify-end" aria-hidden="true">
                <span class="mb-[3px] text-xs">{{ m.value }}</span>
                <div class="bar-fill w-full rounded-t-[3px]" [class]="last ? 'last bg-[#4b3fb4]' : 'bg-[#918af3]'" [style.height.%]="(m.value / maxMonthly()) * 100"></div>
                <span class="absolute -bottom-5 whitespace-nowrap text-xs text-muted">{{ m.label }}</span>
              </div>
            }
          </div>
        </div>

        <div class="card !mb-0">
          <h2 class="card-title">Chamados por prioridade</h2>
          <div class="flex flex-wrap items-center gap-[18px]">
            <div class="relative size-[140px]" role="img" [attr.aria-label]="donutLabel()">
              <svg viewBox="0 0 120 120" class="size-full">
                @for (s of segments(); track s.priority) {
                  <circle cx="60" cy="60" r="46" fill="none" stroke-width="16" [attr.stroke]="s.color"
                          [attr.stroke-dasharray]="s.dash + ' ' + (circ - s.dash)" [attr.stroke-dashoffset]="-s.offset" transform="rotate(-90 60 60)" />
                }
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center"><b class="text-2xl leading-none">{{ d.total }}</b><small class="text-xs font-semibold">Total</small></div>
            </div>
            <ul class="m-0 flex list-none flex-col gap-3 p-0">
              @for (s of segments(); track s.priority) {
                <li class="flex items-start gap-2"><i class="mt-1 size-2.5 rounded-full" [style.background]="s.color"></i><div><b class="block text-xs font-medium">{{ s.label }} prioridade</b><small class="text-xs text-muted">{{ s.count }} ({{ s.pct }}%)</small></div></li>
              }
            </ul>
          </div>
        </div>

        <div class="card !mb-0">
          <h2 class="mb-2 text-[0.9375rem] font-semibold">Resumo rápido</h2>
          @for (i of d.insights; track i.text) {
            <div class="flex items-start gap-2 border-b border-[#eee] py-[7px]"><span class="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-[#ece4ff] text-primary"><app-icon [name]="i.icon" [size]="14" /></span><p class="m-0 text-xs">{{ i.text }}</p></div>
          } @empty { <p class="muted m-0 text-xs">Ainda não há dados suficientes para o resumo.</p> }
        </div>
      </section>

      <section class="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
        <div class="card !mb-0 flex items-center gap-3.5">
          <span class="circle-icon"><app-icon name="clock" [size]="18" /></span>
          <div><small class="block text-xs">Tempo médio de resposta</small><b class="block text-[1.375rem] font-semibold">{{ d.avgResponse.value }}</b><em class="text-xs not-italic" [class]="d.avgResponse.delta > 0 ? 'text-[#c92a2a]' : 'text-[#0b7a3b]'">{{ d.avgResponse.delta }}% vs. último mês</em></div>
        </div>
        <div class="card !mb-0 flex items-center gap-3.5">
          <span class="circle-icon"><app-icon name="hourglass" [size]="18" /></span>
          <div><small class="block text-xs">Tempo médio de solução</small><b class="block text-[1.375rem] font-semibold">{{ d.avgResolution.value }}</b><em class="text-xs not-italic" [class]="d.avgResolution.delta > 0 ? 'text-[#c92a2a]' : 'text-[#0b7a3b]'">{{ d.avgResolution.delta }}% vs. último mês</em></div>
        </div>
        <div class="card !mb-0">
          <h2 class="mb-2 text-xs font-semibold">Chamados por setor</h2>
          <div class="grid grid-cols-1 gap-x-[22px] gap-y-2 sm:grid-cols-3">
            @for (s of d.sectors; track s.sector) {
              <div>
                <small class="block text-xs text-muted">{{ s.sector }}</small>
                <div class="my-0.5 h-[7px] rounded bg-[#ececf1]" aria-hidden="true"><div class="track-fill h-full rounded bg-primary" [style.width.%]="(s.count / maxSector()) * 100"></div></div>
                <span class="text-xs">{{ s.count }} ({{ pct(s.count, d.total) }}%)</span>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div class="card !mb-0">
          <div class="mb-3 flex items-center justify-between"><h2 class="m-0 text-[0.9375rem] font-semibold">Chamados recentes</h2><a class="link-arrow" routerLink="/chamados">Ver todos <app-icon name="arrow-right" [size]="14" /></a></div>
          <div class="overflow-x-auto"><table class="dtable">
            <caption class="sr-only">Cinco chamados mais recentes</caption>
            <thead><tr><th scope="col">ID</th><th scope="col">Título</th><th scope="col">Setor</th><th scope="col">Prioridade</th><th scope="col">Status</th><th scope="col">Aberto em</th></tr></thead>
            <tbody>
              @for (t of recent(); track t.id) {
                <tr class="click" [routerLink]="['/chamados', t.id]">
                  <td class="id"><a [routerLink]="['/chamados', t.id]" [attr.aria-label]="'Abrir chamado ' + t.id + ': ' + t.title" (click)="$event.stopPropagation()">#{{ t.id }}</a></td><td>{{ t.title }}</td><td>{{ t.sector }}</td>
                  <td><span class="badge p-{{ t.priority }}">{{ prio[t.priority] }}</span></td>
                  <td><span class="badge s-{{ t.status }}">{{ status[t.status] }}</span></td>
                  <td>{{ fmt(t.createdAt) }}</td>
                </tr>
              }
            </tbody>
          </table></div>
        </div>

        <div class="grid min-w-0 grid-cols-1 gap-5">
          <div class="card !mb-0">
            <div class="mb-3 flex items-center justify-between"><h2 class="m-0 text-[0.9375rem] font-semibold">Desempenho dos técnicos</h2></div>
            <div class="overflow-x-auto" tabindex="0" role="region" aria-label="Desempenho dos técnicos (tabela rolável)"><table class="dtable">
              <caption class="sr-only">Desempenho dos técnicos</caption>
              <thead><tr><th scope="col">Técnico</th><th scope="col">Resolvidos</th><th scope="col">Em andamento</th><th scope="col">TMR</th><th scope="col">Avaliação</th></tr></thead>
              <tbody>
                @for (t of d.technicians; track t.id; let i = $index) {
                  <tr>
                    <td><span class="mr-2 inline-flex size-[22px] items-center justify-center rounded-full align-middle text-xs text-[#333]" [style.background]="colors[i % colors.length]">{{ ini(t.name) }}</span>{{ t.name }}</td>
                    <td>{{ t.resolved }}</td><td>{{ t.inProgress }}</td><td>{{ t.tmr }}</td>
                    <td>@if (t.rating > 0) { <span class="whitespace-nowrap tracking-[1px] text-[#b7791f]" role="img" [attr.aria-label]="'Avaliação ' + t.rating + ' de 5'">{{ stars(t.rating) }}</span> } @else { <span class="muted">Sem avaliações</span> }</td>
                  </tr>
                }
              </tbody>
            </table></div>
          </div>
          <div class="card !mb-0 text-center">
            <small class="text-[0.8125rem]">Satisfação média dos usuários :</small>
            @if (d.satisfaction.average > 0) {
            <div class="mb-1 mt-2.5 flex items-center justify-center gap-3">
              <span class="inline-flex size-[38px] items-center justify-center rounded-full bg-[#3b3b4a] text-white"><app-icon name="user" [size]="24" /></span>
              <b class="text-[1.625rem]">{{ d.satisfaction.average.toString().replace('.', ',') }}<sub class="text-xs font-normal">/5</sub></b>
              <span class="whitespace-nowrap text-base tracking-[1px] text-[#b7791f]" role="img" [attr.aria-label]="'Nota média ' + d.satisfaction.average + ' de 5'">{{ stars(d.satisfaction.average) }}</span>
            </div>
            <em class="text-xs not-italic text-[#0b7a3b]">{{ d.satisfaction.positivePct }}% de avaliações positivas</em>
            } @else { <p class="muted mb-0 mt-2.5">Ainda não há avaliações dos usuários.</p> }
          </div>
        </div>
      </section>
    } @else {
      <div class="loading" role="status"><span class="spin" aria-hidden="true"></span> {{ error() || 'Carregando relatório...' }}</div>
    }
  `,
})
export class ReportsComponent {
  private api = inject(ApiService);

  r = signal<ReportSummary | null>(null);
  recent = signal<Ticket[]>([]);
  error = signal('');
  status = STATUS_LABEL;
  prio = PRIORITY_LABEL;
  fmt = friendlyDate;
  ini = initials;
  colors = AV_COLORS;
  circ = 2 * Math.PI * 46;

  maxMonthly = computed(() => Math.max(1, ...(this.r()?.monthly.map((m) => m.value) ?? [1])));
  maxSector = computed(() => Math.max(1, ...(this.r()?.sectors.map((s) => s.count) ?? [1])));
  segments = computed(() => {
    const d = this.r();
    if (!d) return [];
    let offset = 0;
    return d.priority.map((p) => {
      const dash = d.total ? (p.count / d.total) * this.circ : 0;
      const seg = { priority: p.priority, count: p.count, pct: this.pct(p.count, d.total), dash, offset,
                    color: PRIO_COLOR[p.priority], label: { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa', CRITICAL: 'Crítica' }[p.priority] };
      offset += dash;
      return seg;
    });
  });

  constructor() {
    this.api.reportSummary().subscribe({ next: (d) => this.r.set(d), error: () => this.error.set('Não foi possível carregar o relatório.') });
    this.api.tickets().subscribe((t) => this.recent.set(t.slice(0, 5)));
  }

  barsLabel() { const d = this.r(); return 'Gráfico de barras de chamados por mês. ' + (d?.monthly.map((m) => `${m.label}: ${m.value} chamados`).join('; ') ?? ''); }
  donutLabel() { return 'Gráfico de rosca de chamados por prioridade. ' + this.segments().map((s) => `${s.label}: ${s.count} (${s.pct}%)`).join('; '); }

  pct(n: number, total: number) { return total ? Math.round((n / total) * 100) : 0; }
  stars(n: number) { const f = Math.round(n); return '★'.repeat(f) + '☆'.repeat(5 - f); }
}
