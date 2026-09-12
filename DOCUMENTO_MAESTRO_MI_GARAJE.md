# DOCUMENTO MAESTRO — MI GARAJE V8.4

Base estable reconstruida a partir de V8.2/V8.3.2, manteniendo diseño y almacenamiento.

- Clave localStorage invariable: `mi_garaje_public_demo_v1`.
- Fotos en IndexedDB: `mi_garaje_photos_v1`.
- Nunca publicar JSON privados.
- Secciones: Motos, Coches, Otros, Histórico.
- Otros contiene bicicletas y vehículos trial no matriculables cuando estén clasificados como tal.
- Los trial pueden quedar fuera de matrícula, ITV, seguro, impuesto y mantenimiento.
- V8.4 usa archivos físicos `app-v84.js` y `app-v84.css` para evitar mezclas de caché con V8.3.x.
