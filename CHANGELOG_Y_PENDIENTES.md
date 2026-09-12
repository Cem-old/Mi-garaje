# Changelog y pendientes — Mi Garaje V8.3

## Incorporado
- Corrección de seguro vigente: póliza sin fecha de fin = vigente, aunque renovación esté vacía.
- Eliminada la pregunta manual “¿Es la póliza actual/vigente?”.
- Renovación anual calculada automáticamente desde la fecha de inicio cuando falta una fecha explícita.
- Histórico de primas preparado para conservar renovaciones/cuotas por fecha e importe y mostrar total anual.
- Cálculo automático de km recorridos por cada registro de neumáticos, incluyendo montajes a 0 km.
- Pantalla Gastos: vehículos pulsables y detalle completo por vehículo.
- Gastos muestra separador de miles español y cero decimales sin alterar los importes guardados.
- Gastos incorpora seguros e ITV con importe al cálculo general.
- Safe area superior e inferior para iPhone instalado como PWA.
- Mensaje específico de restauración cuando una PWA recién instalada se abre sin datos.
- Se mantiene exactamente la clave `mi_garaje_public_demo_v1`.
- IndexedDB de fotos y política de privacidad sin cambios.

## Pendiente de validar con uso real
- Confirmar en iPhone instalado que el botón Atrás queda siempre por debajo del notch/Dynamic Island.
- Confirmar que el menú inferior no invade el indicador Home.
- Revisar en Gastos varios vehículos con muchos movimientos y pagos de seguro.
- Validar que las renovaciones calculadas automáticamente coinciden con las pólizas anuales y usar fecha manual en cualquier excepción.
