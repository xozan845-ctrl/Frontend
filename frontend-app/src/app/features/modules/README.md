# modules/ — Capa de composición de módulos

Aquí viven los módulos de workspace: páginas, rutas y componentes que componen
uno o varios dominios. No contienen modelos, adapters ni stores duplicados.

```text
features/modules/
├── shared/                 # módulos usados por empresa y tienda
│   └── <módulo>/
│       ├── pages/
│       ├── components/
│       ├── <módulo>.routes.ts
│       └── README.md
└── company/                # módulos exclusivos de empresa
    └── <módulo>/
```

## Dominio vs módulo

- `features/domains/<dominio>/` es reutilizable y declara `kind: 'domain'`: mantiene
  modelos, adapters, state, servicios y puertos, sin páginas ni rutas.
- `features/modules/<scope>/<módulo>/` compone dominios por su `public-api.ts`.
  Su contrato se declara como `modules/<scope>/<módulo>` y solo incluye capas de
  presentación.

Ejemplo piloto: `features/domains/clients` es el dominio compartido y
`features/modules/shared/clients` es la composición que consumen empresa y vendedor
(ADR-59). `cart` no es un módulo de workspace y sigue fuera de esta carpeta.
