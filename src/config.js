// Feature flag espejo del backend (utils/facturacion.py).
// Cuando esta en true, la factura solo muestra y cuenta los items marcados como
// "llegado" (el cliente paga unicamente lo que llego). Por ahora en false: se
// factura TODO y se oculta la columna "Llego".
//
// Para reactivar la mecanica de "llego": poner true aqui Y FACTURAR_SOLO_LLEGADOS
// = True en Facturador_Backend/utils/facturacion.py (deben ir siempre en sincronia).
export const FACTURAR_SOLO_LLEGADOS = false
