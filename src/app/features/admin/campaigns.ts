import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Campaign, Page } from '../../core/api.service';
import { AppDialog } from '../../shared/dialog';
import { Pagination } from '../../shared/pagination';
interface ItemDraft {
  name: string;
  unit: string;
  target_quantity: number;
}
const emptyDraft = () => ({
  name: '',
  description: '',
  goal: 1000,
  category: 'Solidariedade',
  location: '',
  instructions: '',
  funding_type: 'money',
});
@Component({
  selector: 'app-campaigns',
  imports: [CurrencyPipe, FormsModule, RouterLink, AppDialog, Pagination],
  templateUrl: './campaigns.html',
})
export class Campaigns {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  readonly organizations = signal<{ id: number; name: string }[]>([]);
  organizationId: number | null = null;
  readonly campaigns = signal<Campaign[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly saveError = signal('');
  readonly message = signal('');
  readonly createOpen = signal(false);
  readonly itemOpen = signal(false);
  readonly items = signal<ItemDraft[]>([]);
  readonly page = signal(1);
  readonly total = signal(0);
  search = '';
  draft = emptyDraft();
  itemDraft: ItemDraft = { name: '', unit: 'unidades', target_quantity: 1 };
  private loadVersion = 0;
  constructor() {
    void this.load();
  }
  async load(page = this.page()): Promise<void> {
    const version = ++this.loadVersion;
    this.loading.set(true);
    this.error.set('');
    try {
      const [result, organizations] = await Promise.all([
        firstValueFrom(
          this.http.get<Page<Campaign>>('/api/admin/campaigns', {
            params: { page, page_size: 12, q: this.search },
          }),
        ),
        this.auth.user()?.role === 'superadmin'
          ? firstValueFrom(
              this.http.get<{ id: number; name: string }[]>('/api/admin/organizations'),
            )
          : Promise.resolve([]),
      ]);
      if (version !== this.loadVersion) return;
      this.campaigns.set(result.items);
      this.total.set(result.total);
      this.page.set(page);
      this.organizations.set(organizations);
    } catch {
      if (version === this.loadVersion) this.error.set('Não foi possível carregar as campanhas.');
    } finally {
      if (version === this.loadVersion) this.loading.set(false);
    }
  }
  addItem(): void {
    const item = {
      ...this.itemDraft,
      name: this.itemDraft.name.trim(),
      unit: this.itemDraft.unit.trim(),
    };
    if (
      item.name.length < 2 ||
      !item.unit ||
      !Number.isInteger(item.target_quantity) ||
      item.target_quantity < 1 ||
      item.target_quantity > 1000000
    )
      return;
    if (this.items().some((i) => i.name.toLocaleLowerCase() === item.name.toLocaleLowerCase())) {
      this.saveError.set('Esse item já foi adicionado.');
      return;
    }
    this.items.update((items) => [...items, item]);
    this.itemOpen.set(false);
    this.itemDraft = { name: '', unit: 'unidades', target_quantity: 1 };
    this.saveError.set('');
  }
  removeItem(index: number): void {
    this.items.update((items) => items.filter((_, i) => i !== index));
  }
  async create(): Promise<void> {
    if (this.saving()) return;
    this.saveError.set('');
    this.message.set('');
    if (this.auth.user()?.role === 'superadmin' && !this.organizationId) {
      this.saveError.set('Selecione a organização responsável.');
      return;
    }
    if (this.draft.funding_type !== 'money' && !this.items().length) {
      this.saveError.set('Adicione pelo menos um item.');
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.http.post<Campaign>('/api/admin/campaigns', {
          ...this.draft,
          goal_cents: this.draft.funding_type === 'items' ? 0 : Math.round(this.draft.goal * 100),
          organization_id: this.organizationId ?? undefined,
          items: this.draft.funding_type === 'money' ? [] : this.items(),
        }),
      );
      this.createOpen.set(false);
      this.draft = emptyDraft();
      this.items.set([]);
      this.search = '';
      this.message.set('Campanha criada com sucesso.');
      await this.load(1);
    } catch {
      this.saveError.set('Não foi possível criar. Confira os campos e tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }
}
