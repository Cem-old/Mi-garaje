# Mi Garaje — V8.4.1

## Corrección V8.4.1
- Fechas con año de dos cifras: 00–49 se interpretan como 2000–2049 y 50–99 como 1950–1999.
- Reparación automática y limitada a `Fecha de compra`: si una fecha quedó entre 2050 y 2099 y está más de un año en el futuro, se resta exactamente un siglo.
- Ordenación por fecha de compra mantiene los más recientes arriba.
- No cambia la clave de almacenamiento ni el esquema de datos.

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
