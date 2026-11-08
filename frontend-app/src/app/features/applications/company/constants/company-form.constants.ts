export const SLUG_PATTERN = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;

export const MAX_LENGTH = {
  taxId: 30,
  legalName: 160,
  commercialName: 160,
  description: 1000,
  phone: 40,
  website: 200,
  address: 300,
  city: 80,
  department: 80,
  country: 80,
  currency: 3,
  timezone: 64,
  sector: 80,
  legalRepresentative: 160,
  businessHours: 120,
} as const;
