export interface PlanTier {
  id: string;
  name: string;
  popular?: boolean;
  priceMonthly: number;
  priceYearly: number;
  buttonLabel: string;
  isCurrent?: boolean;
}

export interface PlanFeature {
  name: string;
  basic: string | boolean;
  pro: string | boolean;
  premium: string | boolean;
}

export const PLANS: PlanTier[] = [
  {
    id: 'basic',
    name: 'Básico',
    priceMonthly: 0,
    priceYearly: 0,
    buttonLabel: 'Plan Actual',
    isCurrent: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    popular: true,
    priceMonthly: 20,
    priceYearly: 180,
    buttonLabel: 'Mejorar a Pro',
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 100,
    priceYearly: 900,
    buttonLabel: 'Contactar',
  },
];

export const PLAN_FEATURES: PlanFeature[] = [
  {
    name: 'Catálogo estándar',
    basic: true,
    pro: true,
    premium: true,
  },
  {
    name: 'Logística de Envío',
    basic: 'Estándar (5-7)',
    pro: 'Express Gratis',
    premium: 'Mismo Día',
  },
  {
    name: 'Descuento Global',
    basic: false,
    pro: '5%',
    premium: '15%',
  },
  {
    name: 'Soporte Dedicado',
    basic: 'Email (48h)',
    pro: 'Prioritario 24/7',
    premium: 'Concierge',
  },
];
