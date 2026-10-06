export interface CompanyInfo {
  name: string;
  phone: string;
  displayPhone: string;
  email: string;
  location: string;
  whatsappMessage: string;
  socials: {
    twitter?: string;
    instagram?: string;
    github?: string;
  };
}

export const COMPANY_INFO: CompanyInfo = {
  name: 'Quantum Store',
  phone: '15551234567',
  displayPhone: '+1 (555) 123-4567',
  email: 'soporte@quantum.com',
  location: 'Silicon Valley, CA',
  whatsappMessage: 'Hola Quantum Store, me gustaría recibir asesoría sobre un producto.',
  socials: {
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    github: 'https://github.com',
  },
};
