# Mi Garaje · V9.0

## Cambios incluidos
- Histórico: tarjetas simplificadas con fecha de compra y fecha de venta (Desde → Hasta).
- Taller / mantenimiento / reparación / revisión:
  - km obligatorios al registrar una intervención nueva o editarla;
  - por defecto propone los km actuales;
  - muestra los km del vehículo en la intervención;
  - calcula y muestra automáticamente los km recorridos desde entonces cuando existe km actual.
- Pantalla de detalle:
  - corregida la capa que podía oscurecer/difuminar tarjetas;
  - mayor margen inferior para que el contenido no quede detrás del pie y navegación.
- Privacidad:
  - bloqueo opcional con WebAuthn y autenticación del dispositivo (Face ID en iPhone compatible);
  - no se guarda ni transmite información biométrica;
  - bloqueo manual y rebloqueo tras más de 30 segundos en segundo plano.

## Compatibilidad
- Se conserva `mi_garaje_public_demo_v1`.
- `schemaVersion` se mantiene en 8.4 porque no hay cambio incompatible de estructura.
- Fotos continúan en IndexedDB `mi_garaje_photos_v1`.
