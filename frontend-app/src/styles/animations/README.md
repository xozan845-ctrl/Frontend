# Animaciones CSS — biblioteca compartida

Biblioteca global de movimiento para las plantillas de `frontend-app`. Centraliza
duraciones, distancias, aceleraciones y secuencias reutilizables para que los
componentes solo declaren **qué** efecto aplican, sin repetir `@keyframes` ni
inventar tiempos.

No sustituye al sistema visual Glass (`R-UX-7`), a `media-background` ni a la
directiva `appScrollReveal`: cada pieza conserva su responsabilidad.

## Estructura

| Archivo              | Responsabilidad                                               |
| -------------------- | ------------------------------------------------------------- |
| `tokens.css`         | Variables `--motion-*`: duración, retraso, distancia y easing |
| `keyframes.css`      | Secuencias compartidas `app-motion-*`                         |
| `utilities.css`      | Clases `motion-*` que se aplican en las plantillas            |
| `reduced-motion.css` | Adaptación a `prefers-reduced-motion: reduce` (`R-AC-6`)      |
| `index.css`          | Punto de entrada que importa los archivos anteriores          |

## Integración

`src/styles.css` importa la biblioteca **una sola vez**, junto al resto de
imports y antes de `@config`:

```css
@import url('https://fonts.googleapis.com/...');
@import 'tailwindcss';
@import './styles/animations/index.css';
@config "../tailwind.config.js";
```

Al ser estilos globales, cualquier componente puede usar las clases en su HTML
sin importar nada en su CSS. El orden interno es
`tokens → keyframes → utilities → reduced-motion`.

Las utilidades son CSS sin capa (`unlayered`), por lo que un efecto explícito
gana sobre utilidades de Tailwind que toquen `animation` o `transform`. Es
intencional, pero implica **no mezclar** ambas APIs en el mismo elemento (ver
[Combinaciones](#combinaciones-y-conflictos)).

## Contrato de nombres

- Clases: `motion-*`.
- Variables: `--motion-*`.
- Keyframes nuevos: `app-motion-*`.

Los keyframes existentes de Tailwind (`fadeIn`, `slideUp`, `slideDown`,
`scaleIn`) y los locales de componentes (`slideUpFade`, `dropdownIn`, `shimmer`,
`barPulse`, `slideIn`, `supportPop`, `fadeIn`, `pageFadeIn`) **no se tocan**.

## Tokens

| Token                      | Valor por defecto               | Uso                            |
| -------------------------- | ------------------------------- | ------------------------------ |
| `--motion-duration-xs`     | `100ms`                         | Microtransiciones              |
| `--motion-duration-sm`     | `150ms`                         | Duración rápida                |
| `--motion-duration-md`     | `250ms`                         | Duración normal                |
| `--motion-duration-lg`     | `400ms`                         | Duración lenta                 |
| `--motion-duration-xl`     | `600ms`                         | Entradas largas                |
| `--motion-duration`        | `var(--motion-duration-md)`     | Duración efectiva del elemento |
| `--motion-delay-1` … `-4`  | `75 / 150 / 300 / 500ms`        | Escalera de retrasos           |
| `--motion-delay`           | `0ms`                           | Retraso efectivo del elemento  |
| `--motion-distance-sm`     | `0.5rem`                        | Desplazamiento corto           |
| `--motion-distance-md`     | `1rem`                          | Desplazamiento por defecto     |
| `--motion-distance-lg`     | `1.5rem`                        | Desplazamiento amplio          |
| `--motion-lift-distance`   | `-0.125rem`                     | Elevación al hover             |
| `--motion-scale-from`      | `0.96`                          | Escala inicial de entrada      |
| `--motion-scale-to`        | `0.96`                          | Escala final de salida         |
| `--motion-ease-standard`   | `cubic-bezier(0.2, 0, 0, 1)`    | Interacción                    |
| `--motion-ease-decelerate` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entradas                       |
| `--motion-ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)`    | Salidas                        |

Los tokens se pueden sobreescribir por elemento (clase propia o `style`) sin
duplicar la biblioteca.

## Catálogo de clases

### Efectos de entrada y salida

Un elemento usa **un solo** efecto de esta tabla. Todos consumen
`--motion-duration`, `--motion-delay` y, opcionalmente, `--motion-ease`.

| Clase               | Efecto                                | Keyframe                | Fill mode   |
| ------------------- | ------------------------------------- | ----------------------- | ----------- |
| `motion-fade-in`    | Aparece por opacidad                  | `app-motion-fade-in`    | `backwards` |
| `motion-fade-out`   | Desaparece por opacidad               | `app-motion-fade-out`   | `forwards`  |
| `motion-slide-up`   | Entra desde abajo (16px por defecto)  | `app-motion-slide-up`   | `backwards` |
| `motion-slide-down` | Entra desde arriba (16px por defecto) | `app-motion-slide-down` | `backwards` |
| `motion-scale-in`   | Entra con escala suave (`0.96 → 1`)   | `app-motion-scale-in`   | `backwards` |
| `motion-scale-out`  | Sale con escala suave (`1 → 0.96`)    | `app-motion-scale-out`  | `forwards`  |

`backwards` evita dejar un `transform` persistente tras la entrada. `forwards`
mantiene el estado final de la salida hasta que el elemento se retire del DOM.

### Interacción

| Clase               | Efecto                                                         |
| ------------------- | -------------------------------------------------------------- |
| `motion-hover-lift` | Eleva el elemento `-2px` al pasar el cursor (solo `transform`) |

Solo se activa en dispositivos con hover real (`@media (hover: hover)`).

### Duración, retraso y pausa

| Clase                               | Efecto                                             |
| ----------------------------------- | -------------------------------------------------- |
| `motion-duration-fast`              | Fija la duración en `--motion-duration-sm` (150ms) |
| `motion-duration-normal`            | Fija la duración en `--motion-duration-md` (250ms) |
| `motion-duration-slow`              | Fija la duración en `--motion-duration-lg` (400ms) |
| `motion-delay-none`                 | Sin retraso                                        |
| `motion-delay-1` … `motion-delay-4` | Retraso de 75 / 150 / 300 / 500ms                  |
| `motion-pause`                      | Pausa cualquier animación del elemento             |
| `motion-pause-on-hover`             | Pausa al pasar el cursor                           |
| `motion-running`                    | Reanuda una animación pausada                      |

Estas clases ajustan tanto la variable como el longhand (`animation-duration` /
`animation-delay` / `animation-play-state`), así que también funcionan sobre
animaciones continuas de Tailwind (`animate-pulse`, `animate-spin`, …).

## Ejemplos de uso

### 1. Animar una tarjeta al incorporarse al DOM

```html
<article class="card motion-fade-in">
  <h2>Resumen del día</h2>
</article>
```

### 2. Cambiar duración y retraso

```html
<article class="card motion-fade-in motion-duration-slow motion-delay-2">
  <h2>Resumen del día</h2>
</article>
```

### 3. Transición de interacción

```html
<article class="glass motion-hover-lift motion-duration-fast">
  <h2>Resumen del día</h2>
</article>
```

No añadas `motion-hover-lift` a un elemento que ya usa `.card-hover` o
`.glass-hover`: esos primitivos ya elevan y definen su propia transición.

### 4. Combinar con `appScrollReveal`

`appScrollReveal` detecta la entrada en el viewport y alterna
`.scroll-reveal` / `.scroll-reveal--visible` (transición de opacidad y
`translateY`). Es un mecanismo distinto de una animación de entrada por DOM.

Combínalos en **elementos distintos**:

```html
<div appScrollReveal>
  <article class="card motion-hover-lift">
    <h2>Resumen del día</h2>
  </article>
</div>
```

No pongas `motion-fade-in`, `motion-slide-*` o `motion-scale-*` en el mismo
elemento que `appScrollReveal`: `.scroll-reveal` deja `opacity: 0` y la
animación de entrada podría devolver el elemento a ese estado al terminar.

### 5. Entrada y salida con Angular 22

Angular 22 incluye las directivas nativas `animate.enter` y `animate.leave`
(no requieren instalar `@angular/animations`). Aplican clases cuando el
elemento entra o sale de un bloque de control de flujo:

```html
@if (showPanel()) {
<aside
  class="glass motion-duration-fast"
  animate.enter="motion-fade-in"
  animate.leave="motion-fade-out"
>
  Contenido del panel
</aside>
}
```

- `animate.leave` mantiene el elemento hasta que termina la animación; por eso
  el efecto debe tener una duración finita (todos los `motion-*` la tienen).
- No apliques `motion-pause` al elemento que está saliendo: impediría que
  termine y que Angular lo retire.
- En cambios de ruta, la destrucción del componente no espera la animación de
  salida; usa `animate.leave` dentro de `@if`/`@for` para piezas internas.

### 6. Pausar un efecto continuo

```html
<div class="animate-pulse motion-pause-on-hover">Sincronizando…</div>
```

La biblioteca no añade bucles por defecto; la pausa sirve para animaciones
continuas que ya existan.

### 7. Añadir un efecto nuevo

1. Añade el keyframe en `keyframes.css` con prefijo `app-motion-`.
2. Añade la clase en `utilities.css` con prefijo `motion-`, usando los tokens.
3. Si usa desplazamiento o escala, neutralízalo en `reduced-motion.css`.
4. Documéntalo en este catálogo y en la tabla de combinaciones.
5. Mantén una sola animación por elemento y anima solo `opacity`/`transform`.

## Combinaciones y conflictos

| Combinación                                               | ¿Permitido? | Nota                                                |
| --------------------------------------------------------- | ----------- | --------------------------------------------------- |
| `motion-fade-in` + `motion-duration-*` / `motion-delay-*` | Sí          | Ajustan el efecto                                   |
| `motion-fade-in` + `motion-hover-lift`                    | Sí          | Opacidad y transform no compiten                    |
| `motion-slide-*` o `motion-scale-*` + `motion-hover-lift` | Con cuidado | El hover no se aprecia hasta que termina la entrada |
| Dos efectos de entrada/salida en el mismo elemento        | No          | Ambos declaran `animation`; gana el último          |
| Efectos `motion-*` de entrada/salida + `animate-*`        | No          | Dos `animation` compitiendo en el mismo nodo        |
| `motion-duration-*` / `motion-delay-*` / `motion-pause*`  | Sí          | Ajustan también animaciones continuas de Tailwind   |
| `motion-*` + keyframes locales del componente             | No          | Evita dos `animation` sobre el mismo nodo           |
| `motion-fade-in` + `appScrollReveal`                      | No          | `.scroll-reveal` controla `opacity` y `transform`   |
| `motion-hover-lift` + `.card-hover` / `.glass-hover`      | No          | Ya elevan; duplicarías transform y transición       |
| `motion-*` + `opacity-0` / `translate-*` de Tailwind      | No          | La utilidad estática pelea con el estado final      |

Tampoco uses `will-change` de forma permanente: la biblioteca no lo declara y
las animaciones de `opacity`/`transform` ya se resuelven en el compositor.

## Efectos nuevos y definiciones reutilizadas

- **Nuevos:** todos los tokens `--motion-*`, los keyframes `app-motion-*` y las
  clases `motion-*`.
- **Reutilizados:** ninguno. Las animaciones existentes de Tailwind
  (`animate-fade-in`, `animate-slide-up`, `animate-slide-down`,
  `animate-scale-in`), los keyframes locales de componentes y `.scroll-reveal`
  se conservan tal cual para no cambiar comportamientos ni duplicar nombres.
- **Demostración de integración:** `shared/ui/coming-soon` usa
  `motion-slide-up motion-duration-slow`, equivalentes a su anterior
  `animate-slide-up` (400ms, misma curva y distancia).

Las animaciones de Tailwind siguen declaradas en `tailwind.config.js`
(`R-UX-5`). Esta biblioteca no las reemplaza ni duplica: añade una capa CSS
explícita de movimiento compartido con su propia API y tokens. Migrar los
`animate-*` existentes a `motion-*` es un cambio aparte, por componente.

## Accesibilidad y rendimiento

- `prefers-reduced-motion: reduce` reduce las duraciones a `0.01ms`, anula
  desplazamiento/escala y desactiva `motion-hover-lift` (`R-AC-6`). El
  contenido queda visible y las salidas siguen emitiendo `animationend`.
- Solo se animan `opacity` y `transform`.
- No hay animaciones automáticas ni bucles decorativos: cada efecto se activa
  con una clase o con `animate.enter`/`animate.leave`.
- No se declara `will-change` permanente.
- La biblioteca no exige cambiar la estructura del HTML, el estado ni las
  interacciones de los componentes.

## Verificación

```bash
npm run format:check
npm run lint:css
npm run rules:check
npm run build
npm test -- --watch=false --coverage=false
```

## Referencias

- `R-AC-6` — movimiento reducido.
- `R-UX-5` — tokens de diseño y animaciones de Tailwind.
- `R-UX-7` — el sistema Glass permanece en `src/styles.css`.
- `R-DO-7` — README del directorio.
