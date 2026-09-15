import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const protectedApi =
    request.url.startsWith('/api/') &&
    request.url !== '/api/auth/login' &&
    !request.url.startsWith('/api/public/');
  const token = auth.token();
  const authenticated =
    protectedApi && token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  return next(authenticated).pipe(
    catchError((error: unknown) => {
      if (
        protectedApi &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        auth.token() === token
      ) {
        auth.clear();
        void router.navigate(['/login'], { queryParams: { expired: '1' } });
      }
      return throwError(() => error);
    }),
  );
};
