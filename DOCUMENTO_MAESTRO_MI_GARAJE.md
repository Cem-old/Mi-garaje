# Documento maestro público — Mi Garaje V8.1

## Reglas invariables
- Clave localStorage: `mi_garaje_public_demo_v1`. No cambiar.
- El paquete público no contiene datos reales del garaje.
- JSON es la copia de seguridad maestra y puede incluir las fotos.
- Excel es un formato externo editable; las fotos no se incluyen y se conservan al reimportar.
- Bicicletas: sin matrícula, primera matriculación, seguro, ITV ni impuestos obligatorios.
- Los pinchazos/reparaciones de rueda pertenecen a Taller/Reparación y no reinician km de neumáticos.
- Los cambios o montajes de neumáticos sí alimentan el cálculo de km desde montaje.

## Funciones V8.1
- Alta completa desde cero.
- Venta con fecha, importe y destinatario. Al vender, el vehículo pasa a Histórico.
- Histórico conserva todos los registros pero no genera avisos futuros de ITV/seguro ni datos pendientes.
- Navegación del vehículo mediante tarjetas informativas grandes.
- No se muestra el tipo de vehículo encima de la fotografía.
- Detalles de módulos con tipografía de 20 px.
- Fotos comprimidas/adaptadas antes de guardar para reducir uso de almacenamiento en iOS.
- Exportación/importación Excel por ID con hojas: Vehiculos, Ventas, Seguros, PagosSeguro, Taller, Neumaticos, ITV, Impuestos, OtrosGastos y Kilometraje.
- Importar Excel actualiza registros coincidentes por ID, añade nuevos y conserva las fotos locales.
- Importación JSON por fusión y restauración JSON completa, ambas con copia de seguridad previa.
- Los planes mensuales de mantenimiento son configurables por vehículo y quedan guardados en datos privados, no en el código público.
