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
