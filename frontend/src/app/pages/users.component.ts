import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ConfirmService, ToastService } from '../core/ui.service';
import { ROLES, ROLE_LABEL, Role, User, errMsg } from '../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 class="mb-1 text-xl font-semibold">Usuários</h2>
    <p class="mb-[18px] text-sm">Cadastre servidores e membros da equipe de TI.</p>

    <form class="card" (ngSubmit)="create()" novalidate aria-labelledby="new-user-h">
      <h3 id="new-user-h" class="mb-3 text-base font-semibold">Novo usuário</h3>
      @if (error()) { <div class="error" role="alert">{{ error() }}</div> }
      <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div><label class="lbl" for="u-name">Nome</label><input id="u-name" name="name" class="input" autocomplete="off" [(ngModel)]="form.name" required /></div>
        <div><label class="lbl" for="u-email">E-mail institucional</label><input id="u-email" name="email" type="email" class="input" autocomplete="off" [(ngModel)]="form.email" required /></div>
        <div><label class="lbl" for="u-pass">Senha inicial</label><input id="u-pass" name="password" type="password" class="input" autocomplete="new-password" minlength="6" [(ngModel)]="form.password" required aria-describedby="u-pass-hint" /><p id="u-pass-hint" class="hint mt-1">Mínimo de 6 caracteres.</p></div>
        <div><label class="lbl" for="u-dep">Departamento</label><input id="u-dep" name="department" class="input" [(ngModel)]="form.department" /></div>
        <div>
          <label class="lbl" for="u-role">Perfil</label>
          <select id="u-role" name="role" class="input" [(ngModel)]="form.role">
            @for (r of roles; track r) { <option [value]="r">{{ roleLabel[r] }}</option> }
          </select>
        </div>
      </div>
      <button class="btn btn-primary btn-sm mt-4" type="submit" [disabled]="saving()">{{ saving() ? 'Cadastrando...' : 'Cadastrar' }}</button>
    </form>

    <div class="card overflow-x-auto">
      <table class="dtable">
        <caption class="sr-only">Lista de usuários cadastrados</caption>
        <thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Departamento</th><th scope="col">Perfil</th><th scope="col">Situação</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr>
              <td>{{ u.name }}</td><td>{{ u.email }}</td><td>{{ u.department }}</td>
              <td>{{ roleLabel[u.role] }}</td>
              <td><span class="badge" [class]="u.active ? 's-RESOLVED' : 'p-HIGH'">{{ u.active ? 'Ativo' : 'Inativo' }}</span></td>
              <td>
                @if (u.id !== auth.user()?.id) {
                  <button class="btn btn-outline btn-sm" type="button" (click)="toggle(u)">{{ u.active ? 'Desativar' : 'Ativar' }}<span class="sr-only"> {{ u.name }}</span></button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class UsersComponent {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  users = signal<User[]>([]);
  error = signal('');
  saving = signal(false);
  roles = ROLES;
  roleLabel = ROLE_LABEL;
  form = { name: '', email: '', password: '', department: '', role: 'USER' as Role };

  constructor() { this.load(); }

  load() { this.api.users().subscribe((u) => this.users.set(u)); }

  create() {
    this.error.set('');
    const f = this.form;
    if (!f.name.trim() || !f.email.trim() || f.password.length < 6) {
      this.error.set('Preencha nome, e-mail institucional e uma senha inicial com pelo menos 6 caracteres.');
      return;
    }
    this.saving.set(true);
    this.api.createUser(f).subscribe({
      next: (u) => {
        this.form = { name: '', email: '', password: '', department: '', role: 'USER' };
        this.saving.set(false);
        this.toast.success(`Usuário ${u.name} cadastrado.`);
        this.load();
      },
      error: (e) => { this.error.set(errMsg(e)); this.saving.set(false); },
    });
  }

  async toggle(u: User) {
    if (u.active) {
      const ok = await this.confirm.ask({
        title: `Desativar ${u.name}?`, message: 'O usuário não conseguirá mais entrar no sistema. Você pode reativá-lo quando quiser.',
        confirmLabel: 'Desativar usuário', danger: true,
      });
      if (!ok) return;
    }
    this.api.setActive(u.id, !u.active).subscribe({
      next: () => { this.toast.success(`${u.name} ${u.active ? 'desativado' : 'ativado'}.`); this.load(); },
      error: (e) => this.toast.error(errMsg(e)),
    });
  }
}
