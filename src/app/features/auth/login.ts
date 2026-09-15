import { Component, inject, signal, input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { form, FormField, required, email } from '@angular/forms/signals';
import { AuthService } from '../../core/auth.service';
@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  readonly compact = input(false);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly credentials = signal({ email: '', password: '' });
  readonly fields = form(this.credentials, (p) => {
    required(p.email);
    email(p.email);
    required(p.password);
  });
  readonly busy = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly expired = this.route.snapshot.queryParamMap.has('expired');
  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    if (this.fields().invalid()) {
      this.fields.email().markAsTouched();
      this.fields.password().markAsTouched();
      (this.fields.email().invalid()
        ? this.fields.email()
        : this.fields.password()
      ).focusBoundControl();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.credentials());
      this.credentials.update((value) => ({ ...value, password: '' }));
      const target = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(
        target && /^\/admin(?:\/|$|\?)/.test(target) ? target : '/admin',
      );
    } catch (error: unknown) {
      this.error.set(
        error instanceof HttpErrorResponse && error.status === 401
          ? 'E-mail ou senha incorretos. Confira seus dados.'
          : error instanceof HttpErrorResponse && error.status === 429
            ? 'Muitas tentativas. Tente novamente em 15 minutos.'
            : 'Não foi possível conectar. Verifique sua conexão e tente novamente.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
