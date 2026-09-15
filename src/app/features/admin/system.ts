import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Pagination } from '../../shared/pagination';
import { AppDialog } from '../../shared/dialog';
import { User } from '../../core/auth.service';

export interface Organization {
  id: number;
  name: string;
}
@Component({
  selector: 'app-system',
  imports: [FormsModule, Pagination, AppDialog],
  template: `
    <div class="page-heading">
      <div>
        <span class="eyebrow">ADMINISTRAÇÃO DO SISTEMA</span>
        <h1>Usuários e organizações</h1>
        <p class="muted">Cadastre organizações e defina quem pode administrar cada uma.</p>
      </div>
    </div>
    @if (loading()) {
      <p role="status">Carregando…</p>
    }
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
      <button class="text-button" (click)="load()">Recarregar dados</button>
    }
    @if (message()) {
      <p class="notice" role="status">{{ message() }}</p>
    }
    <div class="campaign-layout">
      <section class="panel">
        <h2>Organizações</h2>
        <button class="button secondary" (click)="organizationOpen.set(true)">
          + Nova organização
        </button>
        @if (organizationOpen()) {
          <app-dialog title="Criar organização" (closed)="organizationOpen.set(false)">
            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }
            <form #organizationForm="ngForm" (ngSubmit)="createOrganization()">
              <label for="organization-name">Nome da organização</label
              ><input
                id="organization-name"
                name="organizationName"
                [(ngModel)]="organizationName"
                required
                minlength="3"
                maxlength="100"
              />
              <button
                class="button primary"
                [disabled]="saving() || loading() || organizationForm.invalid"
              >
                Cadastrar organização
              </button>
            </form></app-dialog
          >
        }
        @for (
          organization of organizations().slice((orgPage() - 1) * 10, orgPage() * 10);
          track organization.id
        ) {
          <article class="campaign-item">
            <h3>{{ organization.name }}</h3>
          </article>
        } @empty {
          @if (!loading()) {
            <p>Nenhuma organização cadastrada.</p>
          }
        }
        <app-pagination
          [total]="organizations().length"
          [page]="orgPage()"
          [pageSize]="10"
          (changed)="orgPage.set($event)"
        />
      </section>
      <section class="panel">
        <h2>Novo usuário</h2>
        <p>Crie acessos para a equipe de cada organização.</p>
        <button class="button primary" (click)="userOpen.set(true)">+ Novo usuário</button>
        @if (userOpen()) {
          <app-dialog title="Criar usuário" (closed)="userOpen.set(false)">
            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }
            <form #userForm="ngForm" (ngSubmit)="createUser()">
              <label for="user-name">Nome</label
              ><input
                id="user-name"
                name="name"
                [(ngModel)]="draft.name"
                required
                minlength="3"
                maxlength="100"
                autocomplete="name"
              />
              <label for="user-email">E-mail</label
              ><input
                id="user-email"
                name="email"
                type="email"
                [(ngModel)]="draft.email"
                required
                email
                maxlength="254"
                autocomplete="off"
              />
              <label for="user-password">Senha inicial</label
              ><input
                id="user-password"
                name="password"
                type="password"
                [(ngModel)]="draft.password"
                required
                minlength="12"
                maxlength="256"
                autocomplete="new-password"
                aria-describedby="password-help"
              />
              <p id="password-help" class="muted">
                Use pelo menos 12 caracteres. Compartilhe a senha com o usuário por um canal
                privado.
              </p>
              <label for="user-role">Perfil</label
              ><select id="user-role" name="role" [(ngModel)]="draft.role">
                <option value="admin">Administrador de organização</option>
                <option value="superadmin">Administrador máximo</option>
              </select>
              <label for="user-organization"
                >Organização {{ draft.role === 'superadmin' ? '(opcional)' : '' }}</label
              ><select
                id="user-organization"
                name="organization"
                [(ngModel)]="draft.organization_id"
                [required]="draft.role === 'admin'"
              >
                <option [ngValue]="null">Selecione uma organização</option>
                @for (organization of organizations(); track organization.id) {
                  <option [ngValue]="organization.id">{{ organization.name }}</option>
                }
              </select>
              <button class="button primary" [disabled]="saving() || loading() || userForm.invalid">
                {{ saving() ? 'Salvando…' : 'Cadastrar usuário' }}
              </button>
            </form></app-dialog
          >
        }
      </section>
    </div>
    <section class="panel system-users">
      <h2>Usuários cadastrados</h2>
      @for (user of users().slice((userPage() - 1) * 10, userPage() * 10); track user.id) {
        <article class="campaign-item">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <span class="badge">{{
            user.role === 'superadmin' ? 'Administrador máximo' : 'Administrador de organização'
          }}</span>
          <p class="muted">{{ organizationNameFor(user.organization_id) }}</p>
        </article>
      } @empty {
        @if (!loading()) {
          <p>Nenhum usuário encontrado.</p>
        }
      }
      <app-pagination
        [total]="users().length"
        [page]="userPage()"
        [pageSize]="10"
        (changed)="userPage.set($event)"
      />
    </section>
  `,
})
export class SystemAdmin {
  readonly orgPage = signal(1);
  readonly userPage = signal(1);
  readonly organizationOpen = signal(false);
  readonly userOpen = signal(false);
  private readonly http = inject(HttpClient);
  readonly organizations = signal<Organization[]>([]);
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  organizationName = '';
  draft: {
    name: string;
    email: string;
    password: string;
    role: string;
    organization_id: number | null;
  } = { name: '', email: '', password: '', role: 'admin', organization_id: null };
  constructor() {
    void this.load();
  }
  organizationNameFor(id: number | null | undefined): string {
    return this.organizations().find((o) => o.id === id)?.name ?? 'Acesso global';
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [organizations, users] = await Promise.all([
        firstValueFrom(this.http.get<Organization[]>('/api/admin/organizations')),
        firstValueFrom(this.http.get<User[]>('/api/admin/users')),
      ]);
      this.organizations.set(organizations);
      this.users.set(users);
    } catch {
      this.error.set('Não foi possível carregar os usuários e organizações.');
    } finally {
      this.loading.set(false);
    }
  }
  private showError(error: unknown): void {
    this.error.set(
      error instanceof HttpErrorResponse && typeof error.error?.detail === 'string'
        ? error.error.detail
        : 'Confira os campos e tente novamente.',
    );
  }
  async createOrganization(): Promise<void> {
    if (this.saving() || this.organizationName.trim().length < 3) return;
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const organization = await firstValueFrom(
        this.http.post<Organization>('/api/admin/organizations', {
          name: this.organizationName.trim(),
        }),
      );
      this.organizations.update((items) => [...items, organization]);
      this.organizationName = '';
      this.message.set('Organização cadastrada.');
      this.organizationOpen.set(false);
      this.orgPage.set(Math.ceil(this.organizations().length / 10));
    } catch (error) {
      this.showError(error);
    } finally {
      this.saving.set(false);
    }
  }
  async createUser(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const user = await firstValueFrom(this.http.post<User>('/api/admin/users', this.draft));
      this.users.update((items) => [user, ...items]);
      this.draft = { name: '', email: '', password: '', role: 'admin', organization_id: null };
      this.message.set('Usuário cadastrado.');
      this.userOpen.set(false);
      this.userPage.set(1);
    } catch (error) {
      this.showError(error);
    } finally {
      this.saving.set(false);
    }
  }
}
