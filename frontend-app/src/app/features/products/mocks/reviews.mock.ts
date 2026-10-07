import { Review } from '../models/review.model';

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'mock-r1',
    productId: 1,
    authorName: 'María García',
    rating: 5,
    comment:
      'Excelente calidad de audio. La cancelación de ruido es impresionante, perfecta para el trabajo desde casa.',
    date: '2026-06-15T10:30:00Z',
  },
  {
    id: 'mock-r2',
    productId: 1,
    authorName: 'Carlos López',
    rating: 4,
    comment:
      'Muy buenas, confortables y con un sonido increíble. La batería dura todo el día sin problemas.',
    date: '2026-06-20T14:00:00Z',
  },
  {
    id: 'mock-r3',
    productId: 2,
    authorName: 'Ana Martínez',
    rating: 5,
    comment:
      'Reloj elegantísimo. Llegó en perfectas condiciones y el cuero es de muy alta calidad.',
    date: '2026-06-10T09:15:00Z',
  },
  {
    id: 'mock-r4',
    productId: 3,
    authorName: 'Roberto Silva',
    rating: 5,
    comment: 'El mejor teclado que he usado. Los switches son suaves y el RGB es espectacular.',
    date: '2026-06-25T11:45:00Z',
  },
  {
    id: 'mock-r5',
    productId: 3,
    authorName: 'Luisa Fernanda',
    rating: 4,
    comment: 'Excelente construcción, muy cómodo para largas jornadas de trabajo. Muy recomendado.',
    date: '2026-06-28T16:30:00Z',
  },
  {
    id: 'mock-r6',
    productId: 4,
    authorName: 'Diego Herrera',
    rating: 5,
    comment: 'Increíble tapete de yoga. El agarre es perfecto incluso con las manos sudadas.',
    date: '2026-07-01T08:00:00Z',
  },
  {
    id: 'mock-r7',
    productId: 5,
    authorName: 'Patricia Vega',
    rating: 4,
    comment: 'Muy buena botella, mantiene el agua fría por horas. El acabado es impecable.',
    date: '2026-07-02T13:20:00Z',
  },
  {
    id: 'mock-r8',
    productId: 6,
    authorName: 'Andrés Torres',
    rating: 4,
    comment:
      'El hub funciona perfectamente con todos mis dispositivos. El sonido del speaker también sorprende.',
    date: '2026-07-05T10:10:00Z',
  },
];
