import { afterNextRender, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: ` <a class="skip-link" href="#main-content">Pular para o conteúdo</a>
    <div class="admin-layout">
      <aside class="sidebar" aria-label="Navegação administrativa">
        <a class="brand" routerLink="/admin" aria-label="DoaMais, visão geral"
          ><span class="brand-mark" aria-hidden="true">✳</span> doa<span>mais</span></a
        >
        <span class="nav-caption">ESPAÇO DE GESTÃO</span>
        <nav aria-label="Principal">
          <a
            routerLink="/admin"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            ariaCurrentWhenActive="page"
            ><span aria-hidden="true">▦</span> Visão geral</a
          >
          <a routerLink="/admin/campanhas" routerLinkActive="active" ariaCurrentWhenActive="page"
            ><span aria-hidden="true">♡</span> Campanhas</a
          >
          <a routerLink="/admin/doacoes" routerLinkActive="active" ariaCurrentWhenActive="page"
            ><span aria-hidden="true">↗</span> Doações</a
          >
          <a routerLink="/admin/solicitacoes" routerLinkActive="active" ariaCurrentWhenActive="page"
            >Doações e pedidos</a
          >
          @if (auth.user()?.role === 'superadmin') {
            <a routerLink="/admin/sistema" routerLinkActive="active" ariaCurrentWhenActive="page"
              >Usuários e organizações</a
            >
          }
          <a routerLink="/campanhas">Ver site público ↗</a>
        </nav>
        <div class="sidebar-note">
          <span aria-hidden="true">✳</span><strong>Cada gesto conta.</strong>
          <p>Seu trabalho transforma solidariedade em impacto.</p>
        </div>
        <button class="logout" (click)="logout()" [disabled]="busy()">
          {{ busy() ? 'Saindo…' : 'Sair da conta' }} <span aria-hidden="true">↗</span>
        </button>
        @if (error()) {
          <p role="alert" class="error">{{ error() }}</p>
        }
      </aside>
      <div class="workspace">
        <header class="topbar">
          <span>Painel administrativo</span>
          <div class="profile">
            <span class="avatar" aria-hidden="true">A</span>
            <div>
              <strong>{{ auth.user()?.name }}</strong
              ><small>{{
                auth.user()?.role === 'superadmin' ? 'Administrador máximo' : 'Administrador'
              }}</small>
            </div>
          </div>
        </header>
        <main #content id="main-content" tabindex="-1" class="main-content">
          <router-outlet (activate)="focusContent()" />
        </main>
        <footer class="workspace-footer">DoaMais <span>Juntos, o bem vai mais longe.</span></footer>
      </div>
    </div>`,
})
export class AdminShell {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  readonly busy = signal(false);
  readonly error = signal('');
  constructor() {
    afterNextRender(() => this.focusContent());
  }
  focusContent(): void {
    this.content()?.nativeElement.focus();
  }
  async logout(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    } catch {
      this.error.set('Não foi possível sair. Tente novamente.');
    } finally {
      this.busy.set(false);
    }
  }
}
