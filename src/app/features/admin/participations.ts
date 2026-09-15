import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AppDialog } from '../../shared/dialog';
import { Pagination } from '../../shared/pagination';
interface Participation {
  id: number;
  campaign_name: string;
  kind: string;
  name: string;
  email: string;
  message: string;
  amount_cents: number | null;
  item_name: string | null;
  unit: string | null;
  quantity: number | null;
  status: string;
  created_at: string;
}
@Component({
  selector: 'app-participations',
  imports: [CurrencyPipe, DatePipe, FormsModule, AppDialog, Pagination],
  template: `
    <div class="page-heading">
      <div>
        <span class="eyebrow">CONEXÕES QUE VIRAM CUIDADO</span>
        <h1>Doações e pedidos de ajuda</h1>
        <p class="muted">
          Combine os próximos passos pelo contato informado. Confirme uma doação somente após
          recebê-la.
        </p>
      </div>
      <button class="button secondary" (click)="load()">Atualizar</button>
    </div>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    @if (message()) {
      <p class="notice" role="status">{{ message() }}</p>
    }
    <section class="panel">
      <label for="request-status">Situação</label
      ><select
        id="request-status"
        [ngModel]="filter()"
        (ngModelChange)="filter.set($event); page.set(1)"
      >
        <option value="">Todas</option>
        <option value="pending">Pendentes</option>
        <option value="confirmed">Confirmadas / aprovadas</option>
        <option value="rejected">Recusadas</option>
      </select>
      @if (loading()) {
        <p role="status">Carregando solicitações…</p>
      } @else {
        @for (p of visible(); track p.id) {
          <article class="campaign-item">
            <div class="panel-heading">
              <h2>
                {{ p.kind === 'donate' ? 'Oferta de doação' : 'Pedido de ajuda' }} #{{ p.id }}
              </h2>
              <span class="badge">{{ statusLabel(p) }}</span>
            </div>
            <h3>{{ p.campaign_name }}</h3>
            <p>{{ p.name }} · {{ p.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
            <p>
              <a [href]="'mailto:' + p.email">{{ p.email }}</a>
            </p>
            <p>
              @if (p.amount_cents !== null) {
                <strong>{{ p.amount_cents / 100 | currency: 'BRL' }}</strong>
              } @else {
                <strong>{{ p.quantity }} {{ p.unit }} de {{ p.item_name }}</strong>
              }
            </p>
            <p class="campaign-description">{{ p.message }}</p>
            @if (p.status === 'pending') {
              <button class="button secondary" (click)="selected.set(p)">
                Analisar solicitação
              </button>
            }
          </article>
        } @empty {
          <p>Nenhuma solicitação nesta situação.</p>
        }
      }
      <app-pagination
        [total]="filtered().length"
        [page]="page()"
        [pageSize]="10"
        (changed)="page.set($event)"
      />
    </section>
    @if (selected(); as p) {
      <app-dialog title="Analisar solicitação" (closed)="selected.set(null)"
        ><h3>{{ p.name }} · {{ p.campaign_name }}</h3>
        <p>
          {{
            p.kind === 'donate'
              ? 'Confirme apenas se a contribuição já foi recebida. A confirmação atualizará a arrecadação ou a quantidade de itens.'
              : 'A aprovação sinaliza que a organização poderá atender o pedido. Combine a entrega ou o apoio diretamente com a pessoa; esta ação não transfere valores nem registra uma entrega.'
          }}
        </p>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <div class="dialog-actions">
          <button class="button primary" [disabled]="saving()" (click)="review('confirmed')">
            {{ p.kind === 'donate' ? 'Confirmar recebimento' : 'Aprovar pedido' }}</button
          ><button class="button secondary" [disabled]="saving()" (click)="review('rejected')">
            Recusar solicitação
          </button>
        </div></app-dialog
      >
    }
  `,
})
export class Participations {
  private readonly http = inject(HttpClient);
  readonly entries = signal<Participation[]>([]);
  readonly filter = signal('pending');
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly selected = signal<Participation | null>(null);
  readonly filtered = computed(() =>
    this.entries().filter((p) => !this.filter() || p.status === this.filter()),
  );
  readonly visible = computed(() =>
    this.filtered().slice((this.page() - 1) * 10, this.page() * 10),
  );
  constructor() {
    void this.load();
  }
  statusLabel(p: Participation): string {
    return p.status === 'pending'
      ? 'Pendente'
      : p.status === 'rejected'
        ? 'Recusada'
        : p.kind === 'donate'
          ? 'Recebida'
          : 'Pedido aprovado';
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.entries.set(
        await firstValueFrom(this.http.get<Participation[]>('/api/admin/participations')),
      );
      this.page.set(Math.min(this.page(), Math.max(1, Math.ceil(this.filtered().length / 10))));
    } catch {
      this.error.set('Não foi possível carregar as solicitações.');
    } finally {
      this.loading.set(false);
    }
  }
  async review(status: string): Promise<void> {
    const p = this.selected();
    if (!p || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.http.patch('/api/admin/participations/' + p.id, { status }));
      this.selected.set(null);
      this.message.set('Solicitação atualizada.');
      await this.load();
    } catch (e) {
      this.error.set(
        e instanceof HttpErrorResponse && typeof e.error?.detail === 'string'
          ? e.error.detail
          : 'Não foi possível atualizar.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
