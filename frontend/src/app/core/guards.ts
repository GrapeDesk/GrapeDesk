import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  () => {
    const user = inject(AuthService).user();
    return user && roles.includes(user.role) ? true : inject(Router).createUrlTree(['/dashboard']);
  };
