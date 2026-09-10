# Documento maestro público — Mi Garaje V8.2

## Reglas invariables
- Clave localStorage: `mi_garaje_public_demo_v1`. No cambiar.
- El paquete público no contiene datos reales del garaje.
- JSON sigue siendo la copia de seguridad maestra y puede incluir las fotos.
- Las fotos de uso diario se guardan en IndexedDB; localStorage conserva el resto de los datos.
- Al arrancar V8.2, las fotos antiguas guardadas en localStorage se migran automáticamente a IndexedDB y solo se eliminan de localStorage después de guardarlas correctamente.
- Excel es un formato externo editable; las fotos no se incluyen y se conservan al reimportar.
- Bicicletas: sin matrícula, primera matriculación, seguro, ITV ni impuestos obligatorios.
- Los pinchazos/reparaciones de rueda pertenecen a Taller/Reparación y no reinician km de neumáticos.
- Los cambios o montajes de neumáticos sí alimentan el cálculo de km desde montaje.

## Funciones V8.2
- Mantiene el diseño y los ajustes visuales de V8.1: texto de tarjetas a 20 px y menú inferior más legible sin aumentar su altura.
- Añade a la ficha del vehículo: titular, carburante, cilindrada, distintivo ambiental y NIVE.
- Estos campos pueden editarse desde la ficha completa y se exportan/importan en la hoja Vehiculos de Excel.
- Los vencimientos ITV importados desde fuentes externas funcionan aunque el registro no tenga una fecha de inspección inventada: se usa `nextDate` como próximo vencimiento.
- Los registros ITV con `source: DGT` y sin fecha de inspección se muestran como “Datos DGT”.
- Fotos en IndexedDB para evitar el límite reducido de localStorage en iPhone.
- Exportar JSON reconstruye una copia completa incluyendo las fotos de IndexedDB.
- Restaurar JSON guarda las fotos en IndexedDB y sustituye el resto de los datos después de crear una copia previa.
- Importar/fusionar JSON conserva las fotos existentes y añade fotos del archivo cuando faltan localmente.
- Alta completa, venta/histórico, pólizas, pagos, taller, neumáticos, impuestos, gastos, kilometraje y planes mensuales de mantenimiento continúan funcionando como en V8.1.
