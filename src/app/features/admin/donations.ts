import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, Donation } from '../../core/api.service';
@Component({
  selector: 'app-donations',
  imports: [CurrencyPipe, DatePipe],
  template: ` <div class="page-heading">
      <div>
        <span class="eyebrow">CADA CONTRIBUIÇÃO IMPORTA</span>
        <h1>Doações</h1>
        <p class="muted">As 100 contribuições mais recentes para suas causas.</p>
      </div>
      <button class="button secondary" (click)="load()" [disabled]="loading()">Atualizar</button>
    </div>
    <section class="panel" aria-label="Doações recebidas">
      @if (loading()) {
        <p role="status">Carregando doações…</p>
      } @else if (error()) {
        <p class="error" role="alert">
          Não foi possível carregar as doações. Tente atualizar a lista.
        </p>
      } @else if (donations().length) {
        <div class="table-scroll" tabindex="0" role="region" aria-label="Tabela de doações">
          <table>
            <caption>
              Últimas doações recebidas
            </caption>
            <thead>
              <tr>
                <th scope="col">Doador</th>
                <th scope="col">Campanha</th>
                <th scope="col">Data</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              @for (donation of donations(); track donation.id) {
                <tr>
                  <td>{{ donation.donor }}</td>
                  <td>{{ donation.campaign_name }}</td>
                  <td>{{ donation.created_at | date: 'dd/MM/yyyy' }}</td>
                  <td>{{ donation.amount_cents / 100 | currency: 'BRL' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty-state">
          <span aria-hidden="true">♡</span>
          <h2>À espera do primeiro gesto</h2>
          <p>Quando uma doação for registrada, ela aparecerá aqui.</p>
        </div>
      }
    </section>`,
})
export class Donations {
  private readonly api = inject(ApiService);
  readonly donations = signal<Donation[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() {
    void this.load();
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.donations.set(await firstValueFrom(this.api.donations()));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
