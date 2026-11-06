# media-background — fondos multimedia

Feature de dominio que lee, normaliza, edita y escribe los fondos
`background_*` de plataforma, empresa, tienda y el bloque `panel_ai_background_*`
del panel de IA (ADR-38/ADR-43). El binario vive en `storage-service`; este
feature solo consume ids, metadatos y URLs públicas derivadas por el backend.

| Capa            | Contenido                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `adapters/`     | Normalización tolerante de `background_*` (snake_case/camelCase, envelopes).                                                       |
| `repositories/` | Puerto `MediaBackgroundRepository` + `MEDIA_BACKGROUND_REPOSITORY`.                                                                |
| `services/`     | Implementación HTTP (`MediaBackgroundService`, `MediaBackgroundWriteService`) y subida a storage (`MediaBackgroundUploadService`). |
| `state/`        | `MediaBackgroundStore` (NgRx Signals) con una ranura por ámbito.                                                                   |

## Uso

```ts
const backgrounds = inject(MediaBackgroundStore);
backgrounds.loadPlatform();
backgrounds.loadPanelAi();
backgrounds.loadCompany(companyId);
backgrounds.loadStore(storeId);
```

La página consume `backgrounds.platform()`, `backgrounds.panelAi()`,
`backgrounds.company()` o `backgrounds.store()` y pasa la configuración al
componente presentacional `shared/ui/media-background-editor`. Ese componente
no inyecta stores, servicios ni puertos (`R-SO-8`): recibe `save` (borrador →
configuración normalizada) y `upload` (archivo → objeto confirmado).

## Escritura y roles

| Ámbito      | Servicio                                             | Pantalla                     | Rol                      |
| ----------- | ---------------------------------------------------- | ---------------------------- | ------------------------ |
| Plataforma  | `MediaBackgroundWriteService.updateSite('platform')` | `/app/admin/personalizacion` | `admin` / `super_admin`  |
| Panel de IA | `MediaBackgroundWriteService.updateSite('panel-ai')` | `/app/admin/personalizacion` | `admin` / `super_admin`  |
| Empresa     | `updateCompany(id)`                                  | `/app/empresa/configuracion` | `empresario` propietario |
| Tienda      | `updateStore(id)`                                    | `/app/tienda/tienda`         | `vendedor` propietario   |

El backend vuelve a validar rol y propiedad en cada `PATCH`; la UI solo evita
mostrar controles fuera de rol. El chat `/ia/chat` visualiza el fondo del panel
de IA y nunca lo edita.
