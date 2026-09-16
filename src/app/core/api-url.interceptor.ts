import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const base = environment.apiUrl;
  if (base && request.url.startsWith('/api/')) {
    return next(request.clone({ url: base + request.url }));
  }
  return next(request);
};