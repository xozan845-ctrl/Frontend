import { InvitationStatusPipe } from './invitation-status.pipe';

describe('InvitationStatusPipe', () => {
  const pipe = new InvitationStatusPipe();

  it('traduce los estados conocidos', () => {
    expect(pipe.transform('pendiente')).toBe('Pendiente');
    expect(pipe.transform('aceptada')).toBe('Aceptada');
    expect(pipe.transform('expirada')).toBe('Expirada');
    expect(pipe.transform('revocada')).toBe('Revocada');
  });

  it('devuelve las clases del chip para cada estado', () => {
    expect(pipe.transform('pendiente', 'class')).toContain('badge-warning');
    expect(pipe.transform('aceptada', 'class')).toContain('badge-success');
    expect(pipe.transform('expirada', 'class')).toContain('badge-neutral');
    expect(pipe.transform('revocada', 'class')).toContain('badge-danger');
  });

  it('mantiene un estado desconocido y usa el chip neutro', () => {
    expect(pipe.transform('otro')).toBe('otro');
    expect(pipe.transform('', 'label')).toBe('Sin estado');
    expect(pipe.transform('otro', 'class')).toContain('badge-neutral');
  });
});
