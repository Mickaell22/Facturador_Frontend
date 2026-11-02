// Normaliza lo que se escribe o pega en un campo de dinero: deja solo digitos y
// un punto decimal (max 2 decimales). Acepta coma decimal ("13,67") y basura
// pegada ("$16.57", "US$ 2.32"). Si vienen coma y punto, la coma es de miles.
// Se usa con <input type="text" inputMode="decimal">: con type="number" Firefox
// deja escribir letras y el navegador entrega el campo vacio.
export function limpiarMonto(valor) {
  let s = String(valor ?? '')
  s = s.includes('.') ? s.replace(/,/g, '') : s.replace(/,/g, '.')
  s = s.replace(/[^\d.]/g, '')
  const i = s.indexOf('.')
  if (i === -1) return s
  return s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '').slice(0, 2)
}

// Enteros (numero de pedido): solo digitos
export const limpiarEntero = (valor) => String(valor ?? '').replace(/\D/g, '')
