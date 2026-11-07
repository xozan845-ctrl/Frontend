# modules/shared/ — Módulos compartidos empresa/tienda

Composición de módulos que consumen tanto el workspace de empresa como el de
tienda: clientes, bancos, cuentas por pagar, códigos de barras, créditos,
reportes y ventas/pedidos.

Cada módulo declara su contrato como `modules/shared/<módulo>` y consume
dominios por su API pública.
