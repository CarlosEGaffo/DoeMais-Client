import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  organization_id?: number | null;
}
interface LoginResponse {
  access_token: string;
  user: User;
}
@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<User | null>(null);
  readonly token = signal(sessionStorage.getItem('doamais.token'));
  async login(credentials: { email: string; password: string }): Promise<void> {
    const result = await firstValueFrom(
      this.http.post<LoginResponse>('/api/auth/login', credentials),
    );
    sessionStorage.setItem('doamais.token', result.access_token);
    this.token.set(result.access_token);
    this.user.set(result.user);
  }
  async restore(): Promise<boolean> {
    if (!this.token()) return false;
    if (this.user()) return ['admin', 'superadmin'].includes(this.user()?.role ?? '');
    const user = await firstValueFrom(this.http.get<User>('/api/auth/me'));
    this.user.set(user);
    return ['admin', 'superadmin'].includes(user.role);
  }
  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>('/api/auth/logout', {}));
    this.clear();
  }
  clear(): void {
    sessionStorage.removeItem('doamais.token');
    this.token.set(null);
    this.user.set(null);
  }
}
