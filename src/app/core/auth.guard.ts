import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
export const authGuard: CanActivateFn = async (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    if (await auth.restore()) return true;
  } catch {
    /* The login screen allows retrying after a network failure. */
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const superadminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    if ((await auth.restore()) && auth.user()?.role === 'superadmin') return true;
  } catch {
    /* The parent guard handles authentication. */
  }
  return router.createUrlTree(['/admin']);
};
