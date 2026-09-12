# Mi Garaje — V8.4

## Cambios
- Reconstrucción de arranque y cambio físico de nombres de JS/CSS para romper cachés antiguas de Safari/PWA.
- Pantalla de error visible si el arranque falla; no vuelve a quedarse en negro sin explicación.
- Safe area iPhone/Dynamic Island.
- Seguros: vigente si la póliza no tiene fecha de fin; renovación anual calculable desde inicio; histórico de pagos soportado.
- Gastos: importes sin decimales y con miles; vehículo pulsable y detalle de gastos.
- Neumáticos: km recorridos = km actuales - km de montaje, aceptando 0 km.
- Sección Bicis renombrada a Otros; admite Bicicleta y Trial.
- Trial puede excluir matrícula, ITV, seguro, impuesto y mantenimiento mediante su clasificación de datos.
- Corregido km actual 0 para que no aparezca como pendiente.

## Seguridad de datos
- localStorage: mi_garaje_public_demo_v1 (sin cambios).
- Fotos: IndexedDB mi_garaje_photos_v1 (sin cambios).
- No incluye datos privados en el paquete público.
