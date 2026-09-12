# Documento maestro público — Mi Garaje V8.3.2

## Reglas invariables
- Clave localStorage: `mi_garaje_public_demo_v1`. No cambiar.
- El paquete público no contiene datos reales del garaje.
- JSON sigue siendo la copia de seguridad maestra y puede incluir las fotos.
- Las fotos de uso diario se guardan en IndexedDB; localStorage conserva el resto de los datos.
- Excel es un formato externo editable; las fotos no se incluyen y se conservan al reimportar.
- Bicicletas: sin matrícula, primera matriculación, seguro, ITV ni impuestos obligatorios.
- Los pinchazos/reparaciones de rueda pertenecen a Taller/Reparación y no reinician km de neumáticos.

## Funciones V8.3.2
- Mantiene el diseño oscuro y los ajustes visuales de V8.1/V8.2.
- Seguro vigente se deduce de la existencia de una póliza sin fecha de fin; no depende de que exista una fecha de renovación.
- Se elimina la pregunta manual “actual/vigente” al editar una póliza.
- Si una póliza vigente tiene fecha de inicio pero no próxima renovación, la aplicación calcula la siguiente anualidad para agenda y visualización. La renovación introducida manualmente siempre tiene prioridad.
- El histórico de primas muestra cuotas individuales por fecha e importe y total anual.
- Neumáticos: km recorridos = km actuales del vehículo − km al montaje. Un montaje a 0 km es válido.
- Gastos: importes visibles con separador español de miles y sin decimales, conservando internamente los céntimos.
- Gastos incorpora navegación por vehículo con total, desglose por concepto y listado de movimientos.
- El resumen de Gastos incluye taller, seguros, neumáticos, ITV con importe, impuestos y otros gastos.
- iPhone/PWA: cabecera y menú inferior respetan `safe-area` para evitar notch/Dynamic Island y zona del indicador inferior.
- Cuando la PWA se abre sin datos, la pantalla inicial explica cómo importar la copia JSON completa exportada desde Safari.
- Fotos continúan en IndexedDB y la exportación JSON completa vuelve a incorporarlas a la copia transportable.

## Compatibilidad
- V8.3.2 migra datos de versiones anteriores sin cambiar la clave localStorage.
- `schemaVersion`: 8.3.


## Categoría Otros
- Sustituye a la antigua sección Bicis.
- Agrupa vehículos que no requieren documentación de circulación en la aplicación.
- No muestra matrícula, ITV, seguro ni impuestos.
- Puede ocultar también mantenimiento con el indicador `skipMaintenance`.
