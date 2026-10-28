# applications/ — Features de aplicación

Aquí viven las experiencias completas de la aplicación: tienen rutas y pueden
combinar páginas, estado, servicios, adapters, repositorios y modelos propios.

Cada carpeta debe corresponder a un contrato `kind: 'application'` en
`scripts/config/project.mjs`. Un feature de aplicación puede consumir dominios
por sus APIs públicas, pero no debe duplicar la composición de
`features/modules/`.
