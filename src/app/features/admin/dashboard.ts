import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService, Summary } from '../../core/api.service';
@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <div class="page-heading">
      <div>
        <span class="eyebrow">SOLIDARIEDADE EM MOVIMENTO</span>
        <h1>Visão geral</h1>
        <p class="muted">Acompanhe o impacto que estamos construindo juntos.</p>
      </div>
      <a class="button primary" routerLink="/admin/campanhas"
        >Gerenciar campanhas <span aria-hidden="true">↗</span></a
      >
    </div>
    @if (error()) {
      <div class="error" role="alert">
        Não foi possível carregar o resumo.
        <button class="text-button" (click)="load()">Tentar novamente</button>
      </div>
    }
    @if (loading()) {
      <p role="status">Carregando indicadores…</p>
    }
    @if (summary(); as data) {
      <section class="stats" aria-label="Indicadores gerais">
        <article class="stat featured">
          <span>Total arrecadado</span
          ><strong>{{ data.total_cents / 100 | currency: 'BRL' }}</strong
          ><small>Solidariedade que faz a diferença</small>
        </article>
        <article class="stat">
          <span>Doações recebidas</span><strong>{{ data.donations }}</strong
          ><small>Gestos de generosidade</small>
        </article>
        <article class="stat">
          <span>Campanhas ativas</span><strong>{{ data.active_campaigns }}</strong
          ><small>Oportunidades de transformar</small>
        </article>
        <article class="stat">
          <span>Doadores</span><strong>{{ data.donors }}</strong
          ><small>Pessoas que fazem parte</small>
        </article>
      </section>
    }
    <section class="impact-banner">
      <div>
        <span class="eyebrow">O PRÓXIMO PASSO COMEÇA AQUI</span>
        <h2>Uma boa causa merece<br />chegar mais longe.</h2>
        <p>Organize suas campanhas e acompanhe cada contribuição em um só lugar.</p>
        <a class="button dark" routerLink="/admin/campanhas"
          >Ver campanhas <span aria-hidden="true">→</span></a
        >
      </div>
      <div class="banner-art" aria-hidden="true">♡<span>✳</span></div>
    </section>
    <section class="panel">
      <div class="panel-heading">
        <div>
          <h2>Acompanhe as contribuições</h2>
          <p class="muted">Transparência em cada gesto de cuidado.</p>
        </div>
        <a class="text-link" routerLink="/admin/doacoes">Ver doações →</a>
      </div>
      <p>Consulte as doações recebidas e as campanhas que elas ajudam a transformar.</p>
    </section>
  `,
})
export class Dashboard {
  private readonly api = inject(ApiService);
  readonly summary = signal<Summary | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() {
    void this.load();
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.summary.set(await firstValueFrom(this.api.summary()));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
