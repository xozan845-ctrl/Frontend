# modules/ — Capa de composición de módulos

Aquí viven los módulos de workspace: páginas, rutas y componentes que componen
uno o varios dominios. No contienen modelos, adapters ni stores duplicados.

```text
features/modules/<módulo>/
├── pages/       # pantallas del módulo
├── components/  # UI propia del módulo
├── <módulo>.routes.ts
└── README.md
```

## Dominio vs módulo

- `features/<dominio>/` es reutilizable y declara `kind: 'domain'`: mantiene
  modelos, adapters, state, servicios y puertos, sin páginas ni rutas.
- `features/modules/<módulo>/` compone dominios por su `public-api.ts`.
  Su contrato declara solo las capas de presentación que necesita.

Ejemplo piloto: `features/clients` es el dominio compartido y
`features/modules/clients` es la composición que consumen empresa y vendedor
(ADR-59). `cart` no es un módulo de workspace y sigue fuera de esta carpeta.
