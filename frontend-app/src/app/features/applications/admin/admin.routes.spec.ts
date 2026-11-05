import { adminGuard } from '../auth/public-api';
import { ADMIN_ROUTES } from './admin.routes';

describe('ADMIN_ROUTES · personalización', () => {
  it('protege la personalización global con adminGuard', () => {
    const route = ADMIN_ROUTES.find((item) => item.path === 'personalizacion');

    expect(route).toBeDefined();
    expect(route?.canActivate).toContain(adminGuard);
  });
});
