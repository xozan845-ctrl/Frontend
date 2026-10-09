import { HttpErrorResponse } from '@angular/common/http';
import { toUserMessage } from './api-error';

describe('toUserMessage', () => {
  it('debe traducir el 409 a un mensaje de negocio', () => {
    const message = toUserMessage(new HttpErrorResponse({ status: 409 }), 'fallback');

    expect(message).toBe('Ya tienes una tienda creada.');
  });

  it('debe traducir el 403 a un mensaje de rol', () => {
    const message = toUserMessage(new HttpErrorResponse({ status: 403 }), 'fallback');

    expect(message).toBe('Necesitas una cuenta de vendedor para esta acción.');
  });

  it('debe traducir el 400 a un mensaje de datos', () => {
    const message = toUserMessage(new HttpErrorResponse({ status: 400 }), 'fallback');

    expect(message).toBe('Revisa los datos e inténtalo de nuevo.');
  });

  it('debe traducir el estado 0 a un mensaje de conexión', () => {
    const message = toUserMessage(new HttpErrorResponse({ status: 0 }), 'fallback');

    expect(message).toContain('No pudimos conectar con el servidor');
  });

  it('debe usar el fallback para otros códigos HTTP', () => {
    const message = toUserMessage(new HttpErrorResponse({ status: 500 }), 'fallback');

    expect(message).toBe('fallback');
  });

  it('debe usar el mensaje del Error cuando no es HTTP', () => {
    const message = toUserMessage(new Error('boom'), 'fallback');

    expect(message).toBe('boom');
  });

  it('debe usar el fallback cuando el error no trae mensaje', () => {
    const message = toUserMessage({}, 'fallback');

    expect(message).toBe('fallback');
  });
});
