/** `ServicioResponseDto` de ejemplo para pruebas de operaciones. */
export const SERVICE_FIXTURE = {
  id: 'srv-1',
  empresa_id: 'e-1',
  codigo: 'SRV-001',
  nombre: 'Mantenimiento',
  descripcion: 'Demo',
  categoria: 'Soporte',
  marca: 'Marca Demo',
  codigo_barras: '750123',
  precio: '500.00',
  costo: '200.00',
  unidad: 'Hora (h)',
  duracion_minutos: 60,
  estado: 'activo',
  creado_en: '2026-10-27T00:00:00.000Z',
  actualizado_en: '2026-10-27T00:00:00.000Z',
} as const;
