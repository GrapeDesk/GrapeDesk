import { Component, ElementRef, inject, input, signal, OnInit, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ConfirmService, ToastService } from '../core/ui.service';
import { SettingsService } from '../core/settings.service';
import { IconComponent } from '../shared/icon.component';
import { Attachment, PRIORITY_LABEL, ROLE_LABEL, STATUSES, STATUS_LABEL, Ticket, TicketStatus, User, errMsg } from '../core/models';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, IconComponent],
  template: `
    <a routerLink="/chamados" class="inline-block py-1 text-muted">← Voltar para chamados</a>

    @if (error()) { <div class="error mt-4" role="alert">{{ error() }}</div> }
    @if (loading()) { <div class="loading" role="status"><span class="spin" aria-hidden="true"></span> Carregando chamado...</div> }

    @if (ticket(); as t) {
      <div class="mb-5 mt-3 flex flex-wrap items-center gap-3">
        <h2 class="m-0 text-[1.375rem] font-semibold">#{{ t.id }} · {{ t.title }}</h2>
        <span class="badge p-{{ t.priority }}"><span class="sr-only">Prioridade: </span>{{ priorityLabel[t.priority] }}</span>
        <span class="badge s-{{ t.status }}"><span class="sr-only">Status: </span>{{ statusLabel[t.status] }}</span>
      </div>

      <section class="card" aria-labelledby="info-h">
        <h2 id="info-h" class="sr-only">Informações do chamado</h2>
        <dl class="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 [&_dd]:mt-0.5 [&_dd]:ml-0">
          <div><dt class="muted">Solicitante</dt><dd>{{ t.requester.name }}<br /><small class="muted">{{ t.requester.department }}</small></dd></div>
          <div><dt class="muted">Setor</dt><dd>{{ t.sector }}</dd></div>
          <div><dt class="muted">Categoria</dt><dd>{{ t.category.name }}</dd></div>
          <div><dt class="muted">Responsável</dt><dd>{{ t.assignee?.name ?? 'Não atribuído' }}</dd></div>
          <div><dt class="muted">Aberto em</dt><dd><time [attr.datetime]="t.createdAt">{{ t.createdAt | date: 'dd/MM/yyyy HH:mm' }}</time></dd></div>
          <div><dt class="muted">Atualizado em</dt><dd><time [attr.datetime]="t.updatedAt">{{ t.updatedAt | date: 'dd/MM/yyyy HH:mm' }}</time></dd></div>
        </dl>
        <hr class="my-5 border-0 border-t border-line" />
        <h2 class="card-title">Descrição</h2>
        <p class="m-0 whitespace-pre-wrap">{{ t.description }}</p>
        @if (t.attachments?.length) {
          <h2 class="card-title mt-5">Anexos</h2>
          <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
            @for (a of t.attachments; track a.id) {
              <li><button type="button" class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#c9b6f0] bg-primary-50 px-3 py-[5px] text-[0.8125rem] text-[#2f0a7a]" (click)="download(a)">
                <app-icon name="paperclip" [size]="14" /> <span class="sr-only">Baixar anexo </span>{{ a.name }} <small class="text-[#555]">{{ size(a.size) }}</small></button></li>
            }
          </ul>
        }
      </section>

      @if (canReopen(t)) {
        <section class="card" aria-labelledby="reopen-h">
          <h2 id="reopen-h" class="card-title">Reabrir chamado</h2>
          <p class="mb-3 mt-0">O problema voltou ou não foi resolvido? Você pode reabrir este chamado.</p>
          <button type="button" class="btn btn-outline btn-sm" (click)="reopen(t)">Reabrir chamado</button>
        </section>
      }

      @if (canRate(t)) {
        <section class="card" aria-labelledby="rate-h">
          <h2 id="rate-h" class="card-title">Avalie o atendimento</h2>
          @if (t.rating) {
            <p class="m-0">Sua avaliação: <span class="tracking-[1px] text-[#b7791f]" role="img" [attr.aria-label]="'Nota ' + t.rating + ' de 5'">{{ stars(t.rating) }}</span></p>
            @if (t.ratingComment) { <p class="muted mb-0 mt-1.5">“{{ t.ratingComment }}”</p> }
            <p class="hint mb-0 mt-2">Obrigado pelo seu feedback!</p>
          } @else {
            <form (ngSubmit)="submitRating(t)" novalidate>
              <fieldset class="m-0 border-0 p-0" aria-describedby="rate-err">
                <legend class="mb-2 p-0 font-semibold">Qual nota você dá para este atendimento?</legend>
                @for (o of ratingOptions; track o.value) {
                  <label class="mb-1.5 mr-4 inline-flex cursor-pointer items-center gap-1.5 text-sm"><input type="radio" name="nota" class="w-auto" [value]="o.value" [(ngModel)]="ratingValue" /> {{ o.value }} · {{ o.label }}</label>
                }
              </fieldset>
              <p id="rate-err" class="field-error" [hidden]="!ratingErr()">{{ ratingErr() }}</p>
              <label class="lbl mt-3" for="rating-comment">Comentário (opcional)</label>
              <textarea id="rating-comment" name="ratingComment" class="input" [(ngModel)]="ratingComment" rows="2" maxlength="500" placeholder="Conte como foi o atendimento"></textarea>
              <button class="btn btn-primary btn-sm mt-2.5" type="submit" [disabled]="rating()">{{ rating() ? 'Enviando...' : 'Enviar avaliação' }}</button>
            </form>
          }
        </section>
      }

      @if (auth.isStaff()) {
        <section class="card" aria-labelledby="att-h">
          <h2 id="att-h" class="card-title">Atendimento</h2>
          <div class="flex flex-wrap items-center gap-3">
            <div class="min-w-[200px]">
              <label class="lbl" for="status">Status</label>
              <select id="status" class="input" (change)="onStatus($event, t)">
                @for (s of statuses; track s) { <option [value]="s" [selected]="s === t.status">{{ statusLabel[s] }}</option> }
              </select>
            </div>
            <div class="min-w-[240px]">
              <label class="lbl" for="assignee">Responsável</label>
              <select id="assignee" class="input" (change)="onAssign($event, t)">
                <option value="" [selected]="!t.assignee">Não atribuído</option>
                @for (u of staff(); track u.id) { <option [value]="u.id" [selected]="u.id === t.assignee?.id">{{ u.name }}</option> }
              </select>
            </div>
          </div>
        </section>
      }

      <section class="card" aria-labelledby="com-h">
        <h2 id="com-h" class="card-title">Comentários ({{ t.comments.length }})</h2>
        @if (t.comments.length) {
          <ol class="m-0 list-none p-0">
            @for (c of t.comments; track c.id) {
              <li class="mb-2.5 rounded-[10px] bg-surface px-3.5 py-3">
                <div class="flex flex-wrap items-center gap-3">
                  <strong>{{ c.author.name }}</strong>
                  <small class="muted">{{ roleLabel[c.author.role] }} · <time [attr.datetime]="c.createdAt">{{ c.createdAt | date: 'dd/MM/yyyy HH:mm' }}</time></small>
                </div>
                <p class="mb-0 mt-1.5 whitespace-pre-wrap">{{ c.content }}</p>
              </li>
            }
          </ol>
        } @else {
          <p class="muted">Ainda não há comentários.</p>
        }

        @if (t.status !== 'CLOSED') {
          <form (ngSubmit)="sendComment()" class="mt-4" novalidate>
            <label class="lbl" for="novo-comentario">Novo comentário</label>
            <textarea #box id="novo-comentario" name="comment" class="input" [(ngModel)]="comment" rows="3" placeholder="Escreva um comentário..."
                      [attr.aria-invalid]="commentErr() ? 'true' : null" aria-describedby="comment-err"></textarea>
            <p id="comment-err" class="field-error" [hidden]="!commentErr()">{{ commentErr() }}</p>
            <button class="btn btn-primary btn-sm mt-2.5" type="submit" [disabled]="sending()">
              {{ sending() ? 'Enviando...' : 'Comentar' }}
            </button>
          </form>
        } @else {
          <p class="hint">Este chamado está encerrado e não aceita novos comentários.</p>
        }
      </section>
    }
  `,
})
export class TicketDetailComponent implements OnInit {
  /** Recebe o parâmetro :id da rota (withComponentInputBinding). */
  id = input.required<string>();

  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);
  auth = inject(AuthService);
  private box = viewChild<ElementRef<HTMLTextAreaElement>>('box');
  private settings = inject(SettingsService);

  ticket = signal<Ticket | null>(null);
  staff = signal<User[]>([]);
  error = signal('');
  loading = signal(true);
  sending = signal(false);
  commentErr = signal('');
  comment = '';
  ratingValue = 0;
  ratingComment = '';
  ratingErr = signal('');
  rating = signal(false);
  ratingOptions = [{ value: 1, label: 'Muito ruim' }, { value: 2, label: 'Ruim' }, { value: 3, label: 'Regular' }, { value: 4, label: 'Bom' }, { value: 5, label: 'Excelente' }];
  statuses = STATUSES;
  statusLabel = STATUS_LABEL;
  priorityLabel = PRIORITY_LABEL;
  roleLabel = ROLE_LABEL;

  ngOnInit() {
    this.api.ticket(+this.id()).subscribe({
      next: (t) => { this.ticket.set(t); this.loading.set(false); },
      error: (e) => { this.error.set(errMsg(e)); this.loading.set(false); },
    });
    if (this.auth.isStaff()) this.api.staff().subscribe((s) => this.staff.set(s));
  }

  /** Pede confirmação ao concluir/encerrar, ações que mudam o fluxo do chamado (Nielsen 5). */
  async onStatus(ev: Event, t: Ticket) {
    const sel = ev.target as HTMLSelectElement;
    const status = sel.value as TicketStatus;
    if (status === t.status) return;
    if (status === 'CLOSED' || status === 'RESOLVED') {
      const closing = status === 'CLOSED';
      const ok = await this.confirm.ask({
        title: closing ? 'Encerrar este chamado?' : 'Marcar como concluído?',
        message: closing ? 'Chamados encerrados não aceitam novos comentários.' : 'O chamado será marcado como concluído. Você poderá alterar o status depois, se necessário.',
        confirmLabel: closing ? 'Encerrar chamado' : 'Marcar como concluído', danger: closing,
      });
      if (!ok) { sel.value = t.status; return; }
    }
    this.api.changeStatus(t.id, status).subscribe({
      next: (n) => { this.ticket.set(n); this.toast.success(`Status alterado para "${STATUS_LABEL[n.status]}".`); },
      error: (e) => { sel.value = t.status; this.toast.error(errMsg(e)); },
    });
  }

  onAssign(ev: Event, t: Ticket) {
    const sel = ev.target as HTMLSelectElement;
    const id = sel.value ? +sel.value : null;
    this.api.assign(t.id, id).subscribe({
      next: (n) => { this.ticket.set(n); this.toast.success(n.assignee ? `Chamado atribuído a ${n.assignee.name}.` : 'Responsável removido.'); },
      error: (e) => { sel.value = t.assignee ? String(t.assignee.id) : ''; this.toast.error(errMsg(e)); },
    });
  }

  private finished(t: Ticket) { return t.status === 'RESOLVED' || t.status === 'CLOSED'; }
  canReopen(t: Ticket) { return this.finished(t) && !this.auth.isStaff() && this.settings.value().allowReopen; }
  canRate(t: Ticket) { return this.finished(t) && t.requester.id === this.auth.user()?.id; }
  stars(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
  size(bytes: number) { return bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? Math.round(bytes / 1024) + ' KB' : (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB'; }

  download(a: Attachment) {
    this.api.downloadAttachment(a.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = a.name; link.click();
        URL.revokeObjectURL(url);
      },
      error: (e) => this.toast.error(errMsg(e)),
    });
  }

  async reopen(t: Ticket) {
    const ok = await this.confirm.ask({ title: 'Reabrir este chamado?', message: 'O chamado voltará para a fila de atendimento da equipe de TI.', confirmLabel: 'Reabrir chamado' });
    if (!ok) return;
    this.api.reopen(t.id).subscribe({
      next: (n) => { this.ticket.set(n); this.toast.success('Chamado reaberto.'); },
      error: (e) => this.toast.error(errMsg(e)),
    });
  }

  submitRating(t: Ticket) {
    this.ratingErr.set('');
    if (!this.ratingValue) { this.ratingErr.set('Escolha uma nota de 1 a 5 antes de enviar.'); return; }
    this.rating.set(true);
    this.api.rate(t.id, this.ratingValue, this.ratingComment).subscribe({
      next: (n) => { this.ticket.set(n); this.rating.set(false); this.toast.success('Avaliação enviada. Obrigado!'); },
      error: (e) => { this.rating.set(false); this.toast.error(errMsg(e)); },
    });
  }

  sendComment() {
    this.commentErr.set('');
    if (!this.comment.trim()) { this.commentErr.set('Escreva o comentário antes de enviar.'); this.box()?.nativeElement.focus(); return; }
    this.sending.set(true);
    this.api.comment(+this.id(), this.comment).subscribe({
      next: (t) => {
        this.ticket.set(t); this.comment = ''; this.sending.set(false);
        this.toast.success('Comentário adicionado.');
        setTimeout(() => this.box()?.nativeElement.focus());
      },
      error: (e) => { this.toast.error(errMsg(e)); this.sending.set(false); },
    });
  }
}
