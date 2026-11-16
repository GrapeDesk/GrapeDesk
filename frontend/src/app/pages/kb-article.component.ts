import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../shared/icon.component';

const KEY = 'grapedesk.kb.saved';
export function savedSlugs(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

@Component({
  selector: 'app-kb-article',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <a routerLink="/base-de-conhecimento" class="inline-block py-1 text-muted">← Voltar para a base de conhecimento</a>
    @if (article(); as a) {
      <div class="card mt-4 max-w-[820px]">
        <div class="flex flex-wrap items-center gap-3">
          <span class="circle-icon"><app-icon [name]="a.icon" [size]="20" /></span>
          <div><h2 class="m-0 text-[1.375rem] font-semibold">{{ a.title }}</h2><span class="badge s-IN_PROGRESS">{{ a.category }}</span></div>
          <span class="flex-1"></span>
          <button type="button" class="btn btn-outline btn-sm inline-flex items-center gap-1.5" (click)="toggleSave(a.slug)"><app-icon name="bookmark" [size]="14" /> {{ saved() ? 'Artigo salvo' : 'Salvar artigo' }}</button>
        </div>
        <p class="my-[18px]">{{ a.summary }}</p>
        <ol class="m-0 list-decimal space-y-1.5 pl-[22px] leading-[1.8]">
          @for (s of a.steps; track $index) { <li>{{ s }}</li> }
        </ol>
        <hr class="my-[22px] border-0 border-t border-line" />
        @if (voted()) { <p class="muted m-0">Obrigado pelo feedback!</p> }
        @else {
          <div class="flex flex-wrap items-center gap-3"><span>Este artigo ajudou?</span>
            <button type="button" class="btn btn-outline btn-sm" (click)="voted.set(true)">Sim</button>
            <button type="button" class="btn btn-outline btn-sm" (click)="voted.set(true)">Não</button>
            <span class="flex-1"></span>
            <a routerLink="/chamados/novo" class="link-arrow">Ainda precisa de ajuda? Abrir chamado <app-icon name="arrow-right" [size]="14" /></a>
          </div>
        }
      </div>
    } @else if (article() === null) {
      <p class="muted mt-4">Artigo não encontrado.</p>
    } @else {
      <div class="loading" role="status"><span class="spin" aria-hidden="true"></span> Carregando artigo...</div>
    }
  `,
})
export class KbArticleComponent {
  slug = input.required<string>();
  private api = inject(ApiService);
  /** undefined = carregando; null = não encontrado. */
  article = toSignal(toObservable(this.slug).pipe(switchMap((s) => this.api.article(s).pipe(catchError(() => of(null))))));
  voted = signal(false);
  private list = signal(savedSlugs());
  saved = computed(() => this.list().includes(this.slug()));

  toggleSave(slug: string) {
    const next = this.list().includes(slug) ? this.list().filter((s) => s !== slug) : [...this.list(), slug];
    this.list.set(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignora */ }
  }
}
