import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getHistorialCliente } from '../api'
import { initials, avatarClass } from '../utils/avatar'
import toast from 'react-hot-toast'

function StatCell({ label, value, sub, accent, last }) {
  return (
    <div className={`flex-1 min-w-0 px-5 py-3.5 ${last ? '' : 'border-r border-ldg-line'}`}>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-ldg-muted mb-1.5">{label}</p>
      <p className={`text-[20px] font-bold font-mono leading-none ${accent || 'text-ldg-ink'}`}>{value}</p>
      {sub && <p className="text-[11px] text-ldg-muted mt-1">{sub}</p>}
    </div>
  )
}

function Pill({ kind, children }) {
  const cls = {
    pending: 'text-ldg-accent bg-ldg-accent-soft',
    ok:      'text-ldg-success bg-ldg-success-soft',
  }[kind] || 'text-ldg-muted bg-ldg-surface-alt'
  return (
    <span className={`inline-block text-[10px] font-bold font-mono tracking-wide px-2 py-0.5 rounded-sm ${cls}`}>
      {children}
    </span>
  )
}

const COL = '80px 110px 72px 1fr 104px 104px 110px'
const COL_TX = '150px 80px 120px 1fr 108px 120px'

function formatFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return d.toLocaleString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('pedidos')

  const copiarEnlace = () => {
    const url = `${window.location.origin}/c/${data.cliente.token_publico}`
    navigator.clipboard.writeText(url).then(() => toast.success('Enlace copiado'))
  }

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data: res } = await getHistorialCliente(id)
        setData(res)
      } catch {
        toast.error('Error al cargar historial')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  if (loading) return <p className="text-center py-16 text-ldg-muted text-sm">Cargando...</p>
  if (!data)   return null

  const { cliente, resumen, historial } = data
  const transacciones = data.transacciones ?? []

  const totalGastado = resumen.total_gastado ?? historial.reduce((s, h) => s + h.total, 0)
  const totalItems   = historial.reduce((s, h) => s + (h.total_items ?? 0), 0)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-ldg-muted mb-2">
        <button onClick={() => navigate('/clientes')} className="hover:text-ldg-ink transition-colors">Clientes</button>
        <span className="mx-2">/</span>
        <span>{cliente.nombre}</span>
      </div>

      {/* Page header */}
      <div className="flex items-end justify-between mb-5 pb-4 border-b border-ldg-line">
        <div className="flex items-center gap-4">
          <span
            className={`w-14 h-14 rounded-full inline-flex items-center justify-center text-xl font-bold text-ldg-ink flex-shrink-0 ${avatarClass(cliente.nombre)}`}
          >
            {initials(cliente.nombre)}
          </span>
          <div>
            <h1 className="text-[28px] font-bold text-ldg-ink tracking-tight">{cliente.nombre}</h1>
            <p className="text-sm text-ldg-muted mt-1 font-mono">comisión ${Number(cliente.comision_por_item).toFixed(2)}/item</p>
          </div>
        </div>
        <div className="flex gap-2">
          {data.cliente.token_publico && (
            <button onClick={copiarEnlace} className="ldg-btn-secondary">Copiar enlace</button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-ldg-surface border border-ldg-line rounded flex mb-6 overflow-hidden">
        <StatCell label="Pedidos"         value={resumen.total_pedidos} sub="histórico" />
        <StatCell label="Items totales"   value={totalItems} sub="comprados" />
        <StatCell label="Total gastado"   value={`$${totalGastado.toFixed(2)}`} sub="histórico" />
        <StatCell label="Promedio/pedido" value={historial.length > 0 ? `$${(totalGastado / historial.length).toFixed(2)}` : '—'} />
        <StatCell
          label="Saldo actual"
          value={`$${resumen.total_pendiente.toFixed(2)}`}
          accent={resumen.total_pendiente > 0 ? 'text-ldg-accent' : 'text-ldg-success'}
          sub={resumen.total_pendiente > 0 ? 'por cobrar' : 'al día'}
          last
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          <button
            onClick={() => setVista('pedidos')}
            className={`text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-sm transition-colors ${
              vista === 'pedidos'
                ? 'text-ldg-ink bg-ldg-surface-alt'
                : 'text-ldg-muted hover:text-ldg-ink-soft'
            }`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setVista('transacciones')}
            className={`text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-sm transition-colors ${
              vista === 'transacciones'
                ? 'text-ldg-ink bg-ldg-surface-alt'
                : 'text-ldg-muted hover:text-ldg-ink-soft'
            }`}
          >
            Transacciones
          </button>
        </div>
        <span className="text-[11px] text-ldg-muted font-mono">
          {vista === 'pedidos'
            ? `${historial.length} pedidos · ordenados por fecha`
            : `${transacciones.length} pagos · más recientes primero`}
        </span>
      </div>

      {vista === 'transacciones' ? (
        transacciones.length === 0 ? (
          <p className="text-center py-10 text-ldg-muted text-sm">Sin pagos registrados aún.</p>
        ) : (
          <div className="bg-ldg-surface border border-ldg-line rounded overflow-hidden">
            {/* Table header */}
            <div
              className="grid gap-3 px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase text-ldg-muted bg-ldg-surface-alt border-b border-ldg-line items-center"
              style={{ gridTemplateColumns: COL_TX }}
            >
              <span>Fecha</span>
              <span>Pedido</span>
              <span>Tipo</span>
              <span>Nota</span>
              <span className="text-right">Monto</span>
              <span className="text-right">Acumulado</span>
            </div>

            {transacciones.map((t, i) => (
              <div
                key={t.pago_id}
                onClick={() => navigate(`/pedidos/${t.pedido_id}`)}
                className={`grid gap-3 px-4 py-3 text-sm items-center cursor-pointer hover:bg-ldg-surface-alt transition-colors ${
                  i < transacciones.length - 1 ? 'border-b border-ldg-line-soft' : ''
                }`}
                style={{ gridTemplateColumns: COL_TX }}
              >
                <span className="font-mono text-ldg-ink-soft text-xs">{formatFecha(t.fecha)}</span>
                <span className="font-mono font-bold text-ldg-ink">
                  #{String(t.pedido_numero ?? t.pedido_id).padStart(3, '0')}
                </span>
                <span className="text-xs text-ldg-ink-soft capitalize truncate">{t.tipo || '—'}</span>
                <span className="text-xs text-ldg-muted truncate flex items-center gap-2 min-w-0">
                  <span className="truncate">{t.notas || '—'}</span>
                  {t.comprobante_url && (
                    <a
                      href={t.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-ldg-accent hover:underline flex-shrink-0"
                    >
                      comprobante
                    </a>
                  )}
                </span>
                <span className="text-right font-mono font-semibold text-ldg-success">
                  +${Number(t.monto).toFixed(2)}
                </span>
                <span className="text-right font-mono font-semibold text-xs text-ldg-ink-soft">
                  ${Number(t.acumulado_pagado).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )
      ) : historial.length === 0 ? (
        <p className="text-center py-10 text-ldg-muted text-sm">Sin pedidos aún.</p>
      ) : (
        <div className="bg-ldg-surface border border-ldg-line rounded overflow-hidden">
          {/* Table header */}
          <div
            className="grid gap-3 px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase text-ldg-muted bg-ldg-surface-alt border-b border-ldg-line items-center"
            style={{ gridTemplateColumns: COL }}
          >
            <span>#</span>
            <span>Fecha</span>
            <span className="text-right">Items</span>
            <span></span>
            <span className="text-right">Total</span>
            <span className="text-right">Saldo</span>
            <span className="text-center">Estado</span>
          </div>

          {historial.map((h, i) => {
            const pagado  = (h.saldo ?? h.total - h.pagado) <= 0
            const saldo   = h.saldo ?? (h.total - h.pagado)
            const pct     = h.total > 0 ? Math.min(100, (h.pagado / h.total) * 100) : 100

            return (
              <div key={h.pedido_cliente_id ?? h.pedido_id}>
                <div
                  onClick={() => navigate(`/pedidos/${h.pedido_id}`)}
                  className={`grid gap-3 px-4 py-3 text-sm items-center cursor-pointer hover:bg-ldg-surface-alt transition-colors ${
                    i < historial.length - 1 ? 'border-b border-ldg-line-soft' : ''
                  }`}
                  style={{ gridTemplateColumns: COL }}
                >
                  <span className="font-mono font-bold text-ldg-ink">#{String(h.pedido_numero ?? h.pedido_id).padStart(3, '0')}</span>
                  <span className="font-mono text-ldg-ink-soft text-xs">{h.fecha}</span>
                  <span className="text-right font-mono text-ldg-ink-soft text-xs">{h.total_items ?? h.items_activos ?? '—'}</span>
                  <div className="h-1 bg-ldg-line-soft rounded-full overflow-hidden mx-2">
                    <div className={`h-full rounded-full ${pagado ? 'bg-ldg-success' : 'bg-ldg-accent'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-right font-mono font-semibold">${h.total.toFixed(2)}</span>
                  <span className={`text-right font-mono font-semibold text-xs ${saldo > 0 ? 'text-ldg-accent' : 'text-ldg-muted-soft'}`}>
                    ${saldo.toFixed(2)}
                  </span>
                  <span className="text-center">
                    {h.estado_pago === 'PAGADO' || pagado
                      ? <Pill kind="ok">OK</Pill>
                      : <Pill kind="pending">PEND</Pill>}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
