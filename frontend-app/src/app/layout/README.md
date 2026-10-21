# layout/ — Chrome de la aplicación

Estructura visual persistente: navbar, footer y contenedores de navegación.
Puede consumir la API pública de un feature (`public-api.ts`/`public-ui.ts`),
pero no sus capas internas (`R-AR-2`).

| Carpeta   | Contenido                                                   |
| --------- | ----------------------------------------------------------- |
| `navbar/` | Navegación principal, carrito, wishlist, tema y menú móvil. |
| `footer/` | Enlaces, información corporativa y redes.                   |

## Reglas

- Sin reglas de negocio ni acceso a red.
- No inyectar stores de feature si la información puede llegar por inputs
  (`R-AR-2`); cuando el chrome necesita estado global, usa la API pública.
