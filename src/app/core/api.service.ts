import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
export interface Summary {
  total_cents: number;
  donations: number;
  donors: number;
  active_campaigns: number;
}
export interface CampaignItem {
  id: number;
  name: string;
  unit: string;
  target_quantity: number;
  received_quantity: number;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
export interface Campaign {
  id: number;
  name: string;
  description: string;
  goal_cents: number;
  raised_cents: number;
  status: string;
  organization_name: string;
  creator_name: string | null;
  created_at: string | null;
  category: string;
  location: string;
  instructions: string;
  funding_type: 'money' | 'items' | 'mixed';
  items: CampaignItem[];
}
export interface Donation {
  id: number;
  campaign_name: string;
  donor: string;
  amount_cents: number;
  created_at: string;
}
@Service()
export class ApiService {
  private readonly http = inject(HttpClient);
  summary() {
    return this.http.get<Summary>('/api/admin/summary');
  }
  campaigns() {
    return this.http.get<Campaign[]>('/api/admin/campaigns');
  }
  donations() {
    return this.http.get<Donation[]>('/api/admin/donations');
  }
  createCampaign(data: {
    name: string;
    description: string;
    goal_cents: number;
    organization_id?: number;
  }) {
    return this.http.post<Campaign>('/api/admin/campaigns', data);
  }
}
