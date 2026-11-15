import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errMsg } from '../core/models';
import { USE_MOCK } from '../core/api';
import { A11yMenuComponent } from '../shared/a11y-menu.component';
import { IconComponent } from '../shared/icon.component';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, A11yMenuComponent, IconComponent],
  template: `
    <div class="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <main id="conteudo" class="relative flex items-center justify-center bg-white px-6 pb-10 pt-[72px]">
        <div class="absolute right-4 top-4"><app-a11y-menu /></div>
        <div class="w-full max-w-[420px]">
          <div class="mb-12 flex items-center gap-3">
            <img src="logo-color.png" alt="" class="h-[102px] w-[100px] object-contain" />
            <span class="text-4xl font-semibold leading-none md:text-5xl"><span class="text-primary">Grape</span> Desk</span>
          </div>

          <h1 class="mb-2 text-2xl font-semibold">Bem-vindo(a)!</h1>
          <p class="mb-6 text-sm leading-normal">Faça login com seu e-mail e senha institucionais<br />para acessar o Grape Desk.</p>

          @if (summary()) {
            <div #summaryBox class="error" role="alert" tabindex="-1">{{ summary() }}</div>
          }

          @if (mock) {
            <div class="mb-[18px] rounded-[10px] bg-[#f1eafc] px-3.5 py-2.5 text-[0.8125rem] text-[#3a0095]">
              <strong>Modo demonstração</strong> (sem backend). Preencher como:
              <button type="button" class="cursor-pointer border-0 bg-transparent px-1 py-0.5 font-semibold text-[#3a0095] underline" (click)="fill('admin', 'admin123')">Admin</button> ·
              <button type="button" class="cursor-pointer border-0 bg-transparent px-1 py-0.5 font-semibold text-[#3a0095] underline" (click)="fill('tecnico', 'tecnico123')">Técnico</button> ·
              <button type="button" class="cursor-pointer border-0 bg-transparent px-1 py-0.5 font-semibold text-[#3a0095] underline" (click)="fill('jose.antonio', 'senha123')">Usuário</button>
            </div>
          }

          <form (ngSubmit)="submit()" novalidate>
            <label class="lbl" for="email">E-mail institucional</label>
            <div class="flex min-h-[46px] items-center gap-3.5 rounded-[14px] border border-[#767676] px-3.5 text-primary focus-within:border-primary focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[#111] data-[invalid=true]:border-danger"
                 [attr.data-invalid]="!!emailErr()">
              <app-icon name="mail" [size]="24" />
              <input id="email" name="email" type="email" autocomplete="username" [(ngModel)]="email"
                     placeholder="seunome.departamento@ferrazdevasconcelos.sp.gov.br"
                     class="min-h-11 w-full border-0 bg-transparent p-0 text-sm text-ink shadow-none outline-none focus-visible:shadow-none focus-visible:outline-none"
                     [attr.aria-invalid]="emailErr() ? 'true' : null" aria-describedby="email-err" required />
            </div>
            <p id="email-err" class="field-error" [hidden]="!emailErr()">{{ emailErr() }}</p>

            <label class="lbl mt-[22px]" for="password">Senha institucional</label>
            <div class="flex min-h-[46px] items-center gap-3.5 rounded-[14px] border border-[#767676] px-3.5 text-primary focus-within:border-primary focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[#111] data-[invalid=true]:border-danger"
                 [attr.data-invalid]="!!passErr()">
              <app-icon name="lock" [size]="24" />
              <input id="password" name="password" [type]="show() ? 'text' : 'password'" autocomplete="current-password"
                     [(ngModel)]="password" placeholder="Digite sua senha" (keyup)="onKey($event)"
                     class="min-h-11 w-full border-0 bg-transparent p-0 text-sm text-ink shadow-none outline-none focus-visible:shadow-none focus-visible:outline-none"
                     [attr.aria-invalid]="passErr() ? 'true' : null" aria-describedby="pass-err caps-msg" required />
              <button type="button" class="inline-flex cursor-pointer rounded-lg border-0 bg-transparent p-1.5 text-primary" [attr.aria-label]="show() ? 'Ocultar senha' : 'Mostrar senha'" [attr.aria-pressed]="show()" (click)="show.set(!show())">
                <app-icon [name]="show() ? 'eye-off' : 'eye'" [size]="20" />
              </button>
            </div>
            <p id="pass-err" class="field-error" [hidden]="!passErr()">{{ passErr() }}</p>
            <p id="caps-msg" class="hint my-1.5" [hidden]="!caps()">Atenção: Caps Lock está ativado.</p>

            <div class="mb-0.5 mt-2.5 text-right">
              <button type="button" class="linkbtn" aria-controls="forgot-info" [attr.aria-expanded]="info()" (click)="info.set(!info())">Esqueci minha senha</button>
            </div>
            <p id="forgot-info" class="hint my-1.5" [hidden]="!info()">Para redefinir sua senha, procure o Departamento de TI.</p>

            <button type="submit" [disabled]="loading()" data-cta
                    class="mt-1.5 min-h-[46px] w-full cursor-pointer rounded-xl border-0 bg-primary font-medium text-white hover:bg-primary-dark disabled:cursor-progress disabled:opacity-70">
              {{ loading() ? 'Entrando...' : 'Entrar' }}
            </button>
            <p class="sr-only" role="status">{{ loading() ? 'Verificando seus dados, aguarde.' : '' }}</p>
          </form>

          <div aria-hidden="true" class="my-[30px] flex items-center gap-6 text-[0.8125rem] before:flex-1 before:border-t before:border-[#888] before:content-[''] after:flex-1 after:border-t after:border-[#888] after:content-['']"><span>ou</span></div>

          <section aria-labelledby="no-access" class="flex gap-[18px] rounded-xl border border-[#767676] p-5 text-primary">
            <app-icon name="info" [size]="28" />
            <div class="text-ink">
              <strong id="no-access" class="text-sm">Ainda não possui acesso?</strong>
              <p class="mb-2.5 mt-1 text-[0.8125rem]">Solicite seu usuário e senha ao Departamento de TI.</p>
              <button type="button" class="linkbtn" aria-controls="how-info" [attr.aria-expanded]="help()" (click)="help.set(!help())">Como solicitar acesso ao Grape Desk →</button>
              <p id="how-info" class="hint mt-2" [hidden]="!help()">Envie um e-mail ao Departamento de TI informando seu nome completo, secretaria e e-mail institucional.</p>
            </div>
          </section>
        </div>
      </main>

      <section aria-label="Apresentação do Grape Desk" class="relative hidden flex-col items-center justify-center bg-primary p-6 text-center text-white md:flex">
        <img src="logo-white.png" alt="" class="mb-7 w-[170px]" />
        <h2 class="mb-3 text-lg font-medium">Centralize. Organize. Resolva.</h2>
        <p class="text-sm leading-normal">Atendimento com eficiência,<br />do início ao fim.</p>
        <footer class="absolute bottom-9 text-[0.8125rem]">© 2026 Grape Desk. Todos os direitos reservados</footer>
      </section>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private titleSvc = inject(Title);
  private summaryBox = viewChild<ElementRef<HTMLElement>>('summaryBox');

  mock = USE_MOCK;
  email = '';
  password = '';
  loading = signal(false);
  submitted = signal(false);
  summary = signal('');
  show = signal(false);
  caps = signal(false);
  info = signal(false);
  help = signal(false);

  constructor() {
    this.titleSvc.setTitle('Entrar · Grape Desk');
    if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard']);
  }

  /** Mensagens de erro específicas, em linguagem simples (Nielsen 9). */
  emailErr() {
    if (!this.submitted()) return '';
    const v = this.email.trim();
    if (!v) return 'Informe seu e-mail institucional.';
    if (!EMAIL_RE.test(v)) return 'Digite um e-mail válido, por exemplo: seunome.departamento@ferrazdevasconcelos.sp.gov.br';
    return '';
  }
  passErr() { return this.submitted() && !this.password ? 'Informe sua senha.' : ''; }

  onKey(e: KeyboardEvent) { this.caps.set(e.getModifierState('CapsLock')); }

  fill(user: string, pass: string) {
    this.email = user + '@ferrazdevasconcelos.sp.gov.br';
    this.password = pass;
    this.summary.set('');
  }

  submit() {
    if (this.loading()) return;
    this.submitted.set(true);
    this.summary.set('');
    if (this.emailErr() || this.passErr()) {
      this.summary.set('Não foi possível entrar. Corrija os campos destacados e tente novamente.');
      this.focusSummary();
      return;
    }
    this.loading.set(true);
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.summary.set(e?.status === 401 ? 'E-mail ou senha inválidos. Confira os dados digitados ou procure o Departamento de TI.' : errMsg(e));
        this.loading.set(false);
        this.focusSummary();
      },
    });
  }

  private focusSummary() { setTimeout(() => this.summaryBox()?.nativeElement.focus()); }
}
