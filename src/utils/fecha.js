// Formato de fechas con Intl. El backend manda dos formas:
// - 'YYYY-MM-DD' (fecha de pedido): se interpreta como fecha local, no UTC,
//   para que no se corra un dia en Ecuador (UTC-5).
// - ISO con hora (fecha de pago): se muestra en la zona del navegador.

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/

function parse(valor) {
  if (!valor) return null
  const d = new Date(SOLO_FECHA.test(valor) ? `${valor}T00:00:00` : valor)
  return isNaN(d) ? null : d
}

const fmtCorta = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtLarga = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
const fmtHora  = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const fechaCorta = (v) => { const d = parse(v); return d ? fmtCorta.format(d) : (v || '—') }
export const fechaLarga = (v) => { const d = parse(v); return d ? fmtLarga.format(d) : (v || '—') }
export const fechaHora  = (v) => { const d = parse(v); return d ? fmtHora.format(d) : (v || '—') }

// Fecha de hoy en hora local como 'YYYY-MM-DD' (toISOString usaria UTC)
export const hoyLocal = () => new Date().toLocaleDateString('en-CA')
