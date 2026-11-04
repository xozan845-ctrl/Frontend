# media-background — fondos multimedia

Feature de aplicación que lee y normaliza los fondos `background_*` de
plataforma, empresa y tienda. El binario vive en `storage-service`; este feature
solo consume ids, metadatos y URLs públicas derivadas por el backend.

| Capa            | Contenido                                                                    |
| --------------- | ---------------------------------------------------------------------------- |
| `adapters/`     | Normalización tolerante de `background_*` (snake_case/camelCase, envelopes). |
| `repositories/` | Puerto `MediaBackgroundRepository` + `MEDIA_BACKGROUND_REPOSITORY`.          |
| `services/`     | Implementación HTTP de los tres ámbitos.                                     |
| `state/`        | `MediaBackgroundStore` (NgRx Signals) con una ranura por ámbito.             |

## Uso

```ts
const backgrounds = inject(MediaBackgroundStore);
backgrounds.loadPlatform();
backgrounds.loadCompany(companyId);
backgrounds.loadStore(storeId);
```

La página consume `backgrounds.platform()`, `backgrounds.company()` o
`backgrounds.store()` y pasa la configuración al componente presentacional
`shared/ui/media-background`. El store no se inyecta dentro del componente
compartido (`R-SO-8`).
