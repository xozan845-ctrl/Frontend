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
    expect(pipe.transform('pendiente', 'class')).toContain('bg-amber-100');
    expect(pipe.transform('aceptada', 'class')).toContain('bg-emerald-100');
    expect(pipe.transform('expirada', 'class')).toContain('bg-slate-200');
    expect(pipe.transform('revocada', 'class')).toContain('bg-red-100');
  });

  it('mantiene un estado desconocido y usa el chip neutro', () => {
    expect(pipe.transform('otro')).toBe('otro');
    expect(pipe.transform('', 'label')).toBe('Sin estado');
    expect(pipe.transform('otro', 'class')).toContain('bg-slate-100');
  });
});
