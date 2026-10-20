/** Datos de contacto de la empresa (tipo puro). */
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
