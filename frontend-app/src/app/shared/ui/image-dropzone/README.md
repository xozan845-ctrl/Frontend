# `app-image-dropzone`

Zona reutilizable para elegir imágenes por clic o arrastrar y soltar.

```html
<app-image-dropzone
  label="Logo"
  hint="PNG, JPG o WebP · máximo 5 MB"
  variant="square"
  [previewUrl]="logoUrl()"
  [uploading]="uploading()"
  (fileSelected)="upload($event)"
  (removed)="remove()"
/>
```

## Contrato

| Entrada      | Tipo                 | Uso                                             |
| ------------ | -------------------- | ----------------------------------------------- |
| `label`      | `string`             | Etiqueta visible.                               |
| `hint`       | `string`             | Ayuda bajo la zona.                             |
| `accept`     | `string`             | Tipo MIME aceptado por el selector.             |
| `maxBytes`   | `number`             | Límite de tamaño; `0` desactiva la validación.  |
| `previewUrl` | `string \| null`     | Imagen actual o vista previa gestionada fuera.  |
| `alt`        | `string`             | Texto alternativo de la vista previa.           |
| `uploading`  | `boolean`            | Muestra el overlay de subida y bloquea cambios. |
| `disabled`   | `boolean`            | Modo solo lectura.                              |
| `removable`  | `boolean`            | Permite quitar la imagen.                       |
| `variant`    | `'square' \| 'wide'` | Proporción del marco.                           |

| Salida         | Tipo   | Uso                                |
| -------------- | ------ | ---------------------------------- |
| `fileSelected` | `File` | Archivo validado listo para subir. |
| `removed`      | `void` | El consumidor desasocia la imagen. |

El componente no conoce storage, empresas, tiendas ni productos: solo valida el
archivo y lo entrega. El consumidor decide el flujo de subida y asociación.
