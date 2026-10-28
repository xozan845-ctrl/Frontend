# domains/ — Dominios reutilizables

Aquí viven los dominios compartidos por varias experiencias de la aplicación.

Cada carpeta debe corresponder a un contrato `kind: 'domain'` en
`scripts/config/project.mjs`. Estos dominios no contienen páginas, componentes
ni rutas; exponen modelos, estado, servicios, puertos y adapters para que las
experiencias y los módulos los consuman por su API pública.
