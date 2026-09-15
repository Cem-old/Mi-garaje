# Mi Garaje · V9.0 consolidada

Incluye:
- Face ID/WebAuthn opcional.
- Histórico: Desde (compra) → Hasta (venta).
- Taller: km obligatorios y km recorridos desde intervención.
- Corrección de solapamiento/difuminado en detalle.
- Neumáticos: marca, modelo, medidas delantera/trasera, fecha, km, taller, posición e importe.
- ID de vehículo = alias. Alias únicos; al renombrar se actualizan referencias y foto.
- Migración automática de IDs antiguos a alias, solo si todos los alias son únicos.
- Parser revisado de importes, km y fechas.
- Fechas de 2 dígitos: 00–49 → 2000–2049; 50–99 → 1950–1999.
- Excel exporta IDs legibles basados en alias y los nuevos campos de neumáticos.

Se conserva la clave local `mi_garaje_public_demo_v1` y la base de fotos `mi_garaje_photos_v1`.
