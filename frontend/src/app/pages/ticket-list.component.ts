import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { PRIORITY_LABEL, STATUSES, STATUS_LABEL, Ticket, TicketStatus, errMsg, friendlyDate } from '../core/models';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="card">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <form class="contents" (submit)="$event.preventDefault(); load()" role="search" aria-label="Filtrar lista de chamados">
          <label for="f-q" class="sr-only">Buscar por título ou número</label>
          <input id="f-q" name="q" type="search" class="input max-w-[320px] !text-xs" placeholder="Buscar por título ou número..." [(ngModel)]="q" />
          <label for="f-status" class="sr-only">Filtrar por status</label>
          <select id="f-status" name="status" class="input max-w-[200px] !text-xs" [(ngModel)]="status" (ngModelChange)="load()">
            <option value="">Todos os status</option>
            @for (s of statuses; track s) { <option [value]="s">{{ statusLabel[s] }}</option> }
          </select>
          <button type="submit" class="btn btn-outline btn-sm">Buscar</button>
        </form>
        <span class="flex-1"></span>
        <a class="btn btn-primary btn-sm inline-flex items-center gap-1.5 !text-white" routerLink="/chamados/novo"><app-icon name="plus" [size]="14" /> Novo chamado</a>
      </div>

      @if (error()) { <div class="error" role="alert">{{ error() }}</div> }

      @if (q || status) {
        <p class="mb-3 flex flex-wrap items-center gap-2 text-[0.8125rem]">Filtros ativos:
          @if (q) { <span class="rounded-full bg-primary-50 px-3 py-[3px] text-[#3a0095]">Busca: "{{ q }}"</span> }
          @if (status) { <span class="rounded-full bg-primary-50 px-3 py-[3px] text-[#3a0095]">Status: {{ statusLabel[status] }}</span> }
          <button type="button" class="linkbtn" (click)="clear()">Limpar filtros</button></p>
      }

      <div class="overflow-x-auto">
        <table class="dtable">
          <caption class="sr-only">Lista de chamados</caption>
          <thead>
            <tr><th scope="col">ID</th><th scope="col">Título</th><th scope="col">Setor</th><th scope="col">Categoria</th><th scope="col">Prioridade</th><th scope="col">Status</th>
              @if (auth.isStaff()) { <th scope="col">Cliente</th><th scope="col">Responsável</th> }<th scope="col">Atualizado em</th><th scope="col"><span class="sr-only">Detalhes</span></th></tr>
          </thead>
          <tbody>
            @for (t of tickets(); track t.id) {
              <tr class="click" (click)="open(t.id)">
                <td class="id"><a [routerLink]="['/chamados', t.id]" [attr.aria-label]="'Abrir chamado ' + t.id + ': ' + t.title" (click)="$event.stopPropagation()">#{{ t.id }}</a></td>
                <td>{{ t.title }}</td>
                <td>{{ t.sector }}</td>
                <td>{{ t.category.name }}</td>
                <td><span class="badge p-{{ t.priority }}">{{ priorityLabel[t.priority] }}</span></td>
                <td><span class="badge s-{{ t.status }}">{{ statusLabel[t.status] }}</span></td>
                @if (auth.isStaff()) { <td>{{ t.requester.name }}</td><td>{{ t.assignee?.name ?? '—' }}</td> }
                <td>{{ fmt(t.updatedAt) }}</td>
                <td><app-icon name="chevron-right" [size]="18" /></td>
              </tr>
            } @empty {
              <tr><td colspan="10" class="muted">{{ loading() ? 'Carregando...' : 'Nenhum chamado encontrado.' }}</td></tr>
            }
          </tbody>
        </table>
      </div>
      <p class="mb-0 mt-3 text-[0.8125rem] text-muted" role="status" aria-live="polite">{{ loading() ? 'Carregando...' : tickets().length + ' chamado(s) encontrado(s)' }}</p>
    </div>
  `,
})
export class TicketListComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  tickets = signal<Ticket[]>([]);
  loading = signal(true);
  error = signal('');
  q = '';
  status: TicketStatus | '' = '';
  statuses = STATUSES;
  statusLabel = STATUS_LABEL;
  priorityLabel = PRIORITY_LABEL;
  fmt = friendlyDate;

  constructor() {
    this.route.queryParamMap.subscribe((p) => { this.q = p.get('q') ?? ''; this.load(); });
  }

  load() {
    this.loading.set(true);
    this.api.tickets(this.status, this.q).subscribe({
      next: (t) => { this.tickets.set(t); this.loading.set(false); this.error.set(''); },
      error: (e) => { this.error.set(errMsg(e)); this.loading.set(false); },
    });
  }

  open(id: number) { this.router.navigate(['/chamados', id]); }

  clear() { this.q = ''; this.status = ''; this.router.navigate(['/chamados']); this.load(); }
}
