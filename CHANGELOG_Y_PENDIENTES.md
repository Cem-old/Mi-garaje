# Changelog y pendientes — Mi Garaje V8.2

## Incorporado
- Nuevo almacenamiento de fotos en IndexedDB con migración automática desde localStorage.
- JSON completo sigue incluyendo las fotos para que continúe siendo la copia maestra transportable.
- Nuevos campos técnicos: titular, carburante, cilindrada, distintivo ambiental y NIVE.
- Exportación e importación Excel ampliadas con los nuevos campos.
- Próxima ITV tomada de `nextDate` aunque el registro procedente de DGT no tenga fecha de inspección.
- Los datos DGT sin fecha de inspección no generan una fecha ficticia.
- Se mantienen los ajustes visuales pedidos en V8.1: tipografía de tarjetas a 20 px, menú inferior mayor sin aumentar altura e intensidad uniforme de las opciones.
- Se mantiene exactamente la clave `mi_garaje_public_demo_v1`.

## Pendiente de validar con uso real
- Confirmar en iPhone que la migración inicial de todas las fotos a IndexedDB libera espacio de localStorage.
- Hacer una exportación JSON después de la migración y comprobar que la copia incluye todas las fotos.
- Abrir, editar y reimportar Excel desde iPhone (Excel/Numbers).
- Decidir si los juegos estacionales de neumáticos deben acumular km por juego físico o solo desde el último montaje.
