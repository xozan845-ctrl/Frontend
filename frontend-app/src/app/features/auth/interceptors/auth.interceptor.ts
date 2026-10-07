import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthStore } from '../state/auth.store';
import { environment } from '../../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();
  const apiConfig = environment.apiConfig;

  let headers = req.headers;

  if (token && apiConfig?.authType !== 'cookie') {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const cloned = req.clone({
    headers,
    withCredentials: Boolean(apiConfig?.withCredentials || apiConfig?.authType === 'cookie'),
  });

  return next(cloned);
};
