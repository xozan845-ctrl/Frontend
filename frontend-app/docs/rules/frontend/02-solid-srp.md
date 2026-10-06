# 02 — SOLID y responsabilidad única

Aplica a: clases, componentes, servicios, stores, utilidades y tipos. El objetivo
es que cada unidad tenga **una razón para cambiar** y que el sistema se extienda
por composición, no por parches.

| ID     | Regla                                                                                                                                                                                                                                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-SO-1 | **S — Responsabilidad única (SRP)**: cada unidad hace **una** cosa y tiene un único motivo de cambio. Un componente que calcula, formatea, llama a la API y persiste está sobrecargado: se parte en store/servicio + componente presentacional. Señal de alarma: nombres genéricos (`Manager`, `Helper`, `Utils`) que agrupan temas distintos. |
| R-SO-2 | **O — Abierto/cerrado (OCP)**: se extiende el comportamiento agregando piezas (nuevo store, nueva feature, nuevo pipe, nuevo adaptador) sin modificar las existentes. Prohibido resolver variaciones con cadenas de `if`/`switch` que crecen sin fin.                                                                                          |
| R-SO-3 | **L — Sustitución de Liskov (LSP)**: toda implementación de un puerto cumple **todo** su contrato; los dobles de test (`useClass`/`useValue`) también. Si un consumidor tiene que preguntar "¿qué implementación eres?", el contrato está mal.                                                                                                 |
| R-SO-4 | **I — Segregación de interfaces (ISP)**: las interfaces/tokens son pequeños y específicos. Prohibido un `Repository` gigante: separar por caso de uso (`ProductReader`, `OrderWriter`) cuando los consumidores no usan todo.                                                                                                                   |
| R-SO-5 | **D — Inversión de dependencias (DIP)**: se depende de abstracciones (interfaz + `InjectionToken`), no de clases concretas; la composición vive en `app.config.ts` (`R-AR-3`).                                                                                                                                                                 |
| R-SO-6 | **Componentes presentacionales vs contenedores**: los presentacionales reciben datos por `input` y emiten por `output`, sin inyectar stores ni servicios de dominio; los contenedores orquestan estado y navegación. Reutilizar un presentacional no debe arrastrar lógica de negocio.                                                         |
| R-SO-7 | **Tamaño, cohesión y sin efectos ocultos**: funciones y métodos pequeños, con un único nivel de abstracción; un método no muta estado a distancia ni depende de orden implícito. Si una función necesita un comentario largo para explicar qué hace, se divide.                                                                                |

## Verificación

- Revisión de PR: ¿el cambio toca **una** responsabilidad? ¿Se puede describir en
  una frase sin "y además"? (`R-PR-2`).
- Los tests dan la señal: si una unidad necesita montar medio `TestBed` para
  probarse, probablemente viola `R-SO-1`.
