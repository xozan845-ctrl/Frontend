import { adaptUserFromBackend, adaptAuthResponseFromBackend } from './auth.adapter';

describe('auth.adapter', () => {
  describe('adaptUserFromBackend', () => {
    it('debe construir un usuario por defecto a partir del email cuando no hay datos', () => {
      const user = adaptUserFromBackend(null, 'ana@tienda.com');

      expect(user.email).toBe('ana@tienda.com');
      expect(user.name).toBe('Ana');
    });

    it('debe usar valores por defecto cuando no hay datos ni email', () => {
      const user = adaptUserFromBackend(undefined);

      expect(user.email).toBe('usuario@ejemplo.com');
      expect(user.name).toBe('Usuario');
    });

    it('debe mapear id, email y nombre con nombres alternativos', () => {
      const user = adaptUserFromBackend({ user_id: 12, mail: 'x', full_name: 'Juan Pérez' });

      expect(user.id).toBe(12);
    });

    it('debe preferir el nombre explícito sobre el derivado del email', () => {
      const user = adaptUserFromBackend({ name: 'Carlos' }, 'carlos@tienda.com');

      expect(user.name).toBe('Carlos');
    });

    it('debe extraer el rol del campo role o del primer elemento de roles', () => {
      expect(adaptUserFromBackend({ role: 'admin' }).role).toBe('admin');
      expect(adaptUserFromBackend({ roles: ['vendedor'] }).role).toBe('vendedor');
      expect(adaptUserFromBackend({}).role).toBe('customer');
    });

    it('debe extraer el avatar de avatar, avatar_url o photo', () => {
      expect(adaptUserFromBackend({ avatar: 'a.png' }).avatar).toBe('a.png');
      expect(adaptUserFromBackend({ avatar_url: 'b.png' }).avatar).toBe('b.png');
      expect(adaptUserFromBackend({ photo: 'c.png' }).avatar).toBe('c.png');
    });
  });

  describe('adaptAuthResponseFromBackend', () => {
    it('debe devolver token vacío cuando la respuesta no es válida', () => {
      expect(adaptAuthResponseFromBackend(null).token).toBe('');
    });

    it('debe extraer el token de los distintos campos soportados', () => {
      expect(adaptAuthResponseFromBackend({ token: 'a' }).token).toBe('a');
      expect(adaptAuthResponseFromBackend({ access_token: 'b' }).token).toBe('b');
      expect(adaptAuthResponseFromBackend({ jwt: 'c' }).token).toBe('c');
      expect(adaptAuthResponseFromBackend({ accessToken: 'd' }).token).toBe('d');
    });

    it('debe desenvolver la respuesta anidada en data', () => {
      const response = adaptAuthResponseFromBackend({
        data: { token: 'xyz', user: { id: 1, name: 'Ana', email: 'ana@tienda.com' } },
      });

      expect(response.token).toBe('xyz');
      expect(response.user.name).toBe('Ana');
    });

    it('debe usar el email de respaldo cuando el usuario no lo trae', () => {
      const response = adaptAuthResponseFromBackend({ token: 'x' }, 'respaldo@tienda.com');

      expect(response.user.email).toBe('respaldo@tienda.com');
    });

    it('debe extraer el refresh token si viene en la respuesta', () => {
      expect(adaptAuthResponseFromBackend({ token: 'a', refresh_token: 'r1' }).refreshToken).toBe(
        'r1',
      );
      expect(adaptAuthResponseFromBackend({ token: 'a', refreshToken: 'r2' }).refreshToken).toBe(
        'r2',
      );
      expect(adaptAuthResponseFromBackend({ token: 'a' }).refreshToken).toBeUndefined();
    });
  });
});
