import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authentication interceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    auth.token.set('test-session');
  });
  afterEach(() => {
    controller.verify();
    sessionStorage.clear();
  });
  it('attaches bearer credentials only to protected local API requests', () => {
    for (const url of [
      '/api/admin/summary',
      '/api/auth/login',
      '/api/public/campaigns',
      '/api/public/faq',
      'https://external.example/data',
    ]) {
      http.get(url).subscribe();
      const request = controller.expectOne(url);
      expect(request.request.headers.get('Authorization')).toBe(
        url === '/api/admin/summary' ? 'Bearer test-session' : null,
      );
      request.flush({});
    }
  });
  it('clears rejected sessions and redirects to login', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http.get('/api/auth/me').subscribe({ error: () => {} });
    controller.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expired: '1' } });
  });
  it('keeps the session and current page when a public request fails', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http.get('/api/public/campaigns').subscribe({ error: () => {} });
    controller
      .expectOne('/api/public/campaigns')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBe('test-session');
    expect(navigate).not.toHaveBeenCalled();
  });
  it('does not log out for a server error', () => {
    http.get('/api/admin/summary').subscribe({ error: () => {} });
    controller
      .expectOne('/api/admin/summary')
      .flush({}, { status: 500, statusText: 'Server error' });
    expect(auth.token()).toBe('test-session');
  });
});
