import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Campaign, Page } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AppDialog } from '../../shared/dialog';
import { Pagination } from '../../shared/pagination';
import { Login } from '../auth/login';
@Component({
  selector: 'app-public-home',
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule, AppDialog, Pagination, Login],
  templateUrl: './home.html',
})
export class PublicHome {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  readonly campaignId = this.route.snapshot.paramMap.get('id');
  readonly faqOnly = this.route.snapshot.data['faqOnly'] === true;
  readonly campaigns = signal<Campaign[]>([]);
  readonly faq = signal<{ question: string; answer: string }[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly loginOpen = signal(false);
  readonly participation = signal<'donate' | 'receive' | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly message = signal('');
  readonly page = signal(1);
  readonly total = signal(0);
  search = '';
  funding = '';
  status = '';
  draft = { name: '', email: '', message: '', resource: 'money', amount: 50, quantity: 1 };
  private loadVersion = 0;
  constructor() {
    void this.load();
  }
  label(c: Campaign): string {
    return c.funding_type === 'items'
      ? 'Doação de itens'
      : c.funding_type === 'mixed'
        ? 'Itens e valores'
        : 'Contribuição em dinheiro';
  }
  symbol(c: Campaign): string {
    return c.funding_type === 'items' ? '✳' : c.funding_type === 'mixed' ? '♡' : '↗';
  }
  async load(page = this.page()): Promise<void> {
    const version = ++this.loadVersion;
    this.loading.set(true);
    this.error.set('');
    try {
      const [result, faq] = await Promise.all([
        this.faqOnly
          ? Promise.resolve({ items: [], total: 0 })
          : this.campaignId
            ? firstValueFrom(
                this.http.get<Campaign>(
                  '/api/public/campaigns/' + encodeURIComponent(this.campaignId),
                ),
              ).then((c) => ({ items: [c], total: 1 }))
            : firstValueFrom(
                this.http.get<Page<Campaign>>('/api/public/campaigns', {
                  params: {
                    page,
                    page_size: 12,
                    q: this.search,
                    funding_type: this.funding,
                    campaign_status: this.status,
                  },
                }),
              ),
        firstValueFrom(this.http.get<{ question: string; answer: string }[]>('/api/public/faq')),
      ]);
      if (version !== this.loadVersion) return;
      this.campaigns.set(result.items);
      this.total.set(result.total);
      this.page.set(page);
      this.faq.set(faq);
    } catch {
      if (version === this.loadVersion)
        this.error.set('Não foi possível carregar o conteúdo. Tente novamente.');
    } finally {
      if (version === this.loadVersion) this.loading.set(false);
    }
  }
  openParticipation(kind: 'donate' | 'receive'): void {
    const campaign = this.campaigns()[0];
    this.draft = {
      name: '',
      email: '',
      message: '',
      resource: campaign.funding_type === 'items' ? String(campaign.items[0]?.id ?? '') : 'money',
      amount: 50,
      quantity: 1,
    };
    this.saveError.set('');
    this.message.set('');
    this.participation.set(kind);
  }
  async send(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');
    try {
      const data = {
        kind: this.participation(),
        name: this.draft.name,
        email: this.draft.email,
        message: this.draft.message,
        ...(this.draft.resource === 'money'
          ? { amount_cents: Math.round(this.draft.amount * 100) }
          : { item_id: Number(this.draft.resource), quantity: this.draft.quantity }),
      };
      const result = await firstValueFrom(
        this.http.post<{ id: number }>(
          '/api/public/campaigns/' + this.campaignId + '/participations',
          data,
        ),
      );
      this.participation.set(null);
      this.message.set(
        `Solicitação #${result.id} enviada. A organização poderá entrar em contato pelo e-mail informado. Nenhum pagamento foi realizado.`,
      );
    } catch (e) {
      this.saveError.set(
        e instanceof HttpErrorResponse && typeof e.error?.detail === 'string'
          ? e.error.detail
          : 'Confira os campos e tente novamente.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
