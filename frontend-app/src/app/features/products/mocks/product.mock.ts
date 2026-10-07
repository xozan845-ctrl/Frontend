import { Product } from '../models/product.model';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Ultra-Comfort Wireless Headphones',
    description:
      'Experience studio-quality sound with hybrid active noise cancellation, 40-hour battery life, and plush memory foam earcups.',
    price: 199.99,
    originalPrice: 249.99,
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80',
    ],
    category: 'Electronics',
    stock: 15,
    variants: {
      colors: [
        { name: 'Negro Mate', hex: '#1e293b' },
        { name: 'Plata Lunar', hex: '#94a3b8' },
        { name: 'Azul Quantum', hex: '#2563eb' },
      ],
      specs: ['Estándar ANC', 'Edición Studio Hi-Res'],
    },
  },
  {
    id: 2,
    name: 'Minimalist Leather Chronograph',
    description:
      'A sleek, timeless timepiece featuring a genuine Italian leather strap, scratch-resistant sapphire crystal glass, and Japanese quartz movement.',
    price: 149.5,
    originalPrice: 189.0,
    imageUrl:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80',
    ],
    category: 'Accessories',
    stock: 8,
    variants: {
      colors: [
        { name: 'Cuero Marrón', hex: '#78350f' },
        { name: 'Cuero Negro', hex: '#0f172a' },
      ],
      specs: ['40mm Dial', '42mm Dial'],
    },
  },
  {
    id: 3,
    name: 'Ergonomic Mechanical Keyboard',
    description:
      'Hot-swappable tactile switches, per-key RGB backlighting, and a premium aluminum top plate. Designed for comfort and speed.',
    price: 129.99,
    originalPrice: 159.99,
    imageUrl:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=80',
    ],
    category: 'Electronics',
    stock: 20,
    variants: {
      colors: [
        { name: 'Gris Carbón', hex: '#334155' },
        { name: 'Blanco Ártico', hex: '#f8fafc' },
      ],
      specs: ['Switches Rojos Lineales', 'Switches Marrones Táctiles'],
    },
  },
  {
    id: 4,
    name: 'Eco-Friendly Premium Yoga Mat',
    description:
      'Made from biodegradable natural tree rubber, providing non-slip grip and cushiony support for your daily practice.',
    price: 79.0,
    imageUrl:
      'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500&auto=format&fit=crop&q=80',
    ],
    category: 'Fitness',
    stock: 25,
    variants: {
      colors: [
        { name: 'Verde Sabio', hex: '#4d7c0f' },
        { name: 'Lavanda', hex: '#8b5cf6' },
      ],
      specs: ['Grosor 4mm', 'Grosor 6mm'],
    },
  },
  {
    id: 5,
    name: 'Stainless Steel Insulated Bottle',
    description:
      'Double-walled vacuum insulation keeps your drinks ice-cold for 24 hours or piping hot for 12 hours. Leak-proof cap.',
    price: 34.99,
    originalPrice: 44.99,
    imageUrl:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80',
    ],
    category: 'Fitness',
    stock: 50,
    variants: {
      colors: [
        { name: 'Acero Cepillado', hex: '#94a3b8' },
        { name: 'Negro Noche', hex: '#0f172a' },
        { name: 'Terracota', hex: '#c2410c' },
      ],
      specs: ['500 ml', '750 ml', '1 Litro'],
    },
  },
  {
    id: 6,
    name: 'Smart Home Hub & Speaker',
    description:
      'Control your entire smart home setup with ease. Features a high-fidelity speaker with rich, room-filling sound.',
    price: 89.99,
    originalPrice: 119.99,
    imageUrl:
      'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&auto=format&fit=crop&q=80',
    ],
    category: 'Electronics',
    stock: 12,
    variants: {
      colors: [
        { name: 'Gris Grafito', hex: '#334155' },
        { name: 'Blanco Crema', hex: '#f1f5f9' },
      ],
      specs: ['Con Alexa / Siri', 'Con Google Assistant'],
    },
  },
];
