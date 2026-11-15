import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { HelpDialogComponent } from './shared/help-dialog.component';
import { ToastsComponent } from './shared/toasts.component';
import { A11yService } from './core/a11y.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastsComponent, ConfirmDialogComponent, HelpDialogComponent],
  template: `<router-outlet /><app-toasts /><app-confirm-dialog /><app-help-dialog />`,
})
export class AppComponent {
  /** Instancia o serviço cedo para aplicar tamanho de texto e contraste salvos. */
  private a11y = inject(A11yService);
}
