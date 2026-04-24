import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getPagos, createPago, anularPago, getResumenHoy, METODOS_PAGO } from '../../services/pagosService'
import { useAuth } from '../../context/AuthContext'
import { DollarSign, Search, Plus, Receipt, TrendingUp, X } from 'lucide-react'
import toast from 'react-hot-toast'
import RegistroPagoModal from './RegistroPagoModal'
import './PanelCobro.css'

export default function PanelCobroView() {
  const { perfil } = useAuth()
  const [pagos, setPagos] = useState([])
  const [resumen, setResumen] = useState({ totalUSD: 0, totalBs: 0, cantidad: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalPago, setModalPago] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const hoy = new Date()
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString()
      const [pgos, res] = await Promise.all([
        getPagos({ desde: inicio, hasta: fin }),
        getResumenHoy(),
      ])
      setPagos(pgos)
      setResumen(res)
    } catch (err) {
      toast.error('Error cargando cobros: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const pagosFiltrados = search
    ? pagos.filter(p =>
        p.paciente?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        p.paciente?.apellido?.toLowerCase().includes(search.toLowerCase()) ||
        p.paciente?.cedula?.includes(search)
      )
    : pagos

  async function handleAnular(id) {
    if (!confirm('¿Anular este pago?')) return
    try { await anularPago(id, 'Anulado por asistente'); toast.success('Pago anulado'); cargar() }
    catch (err) { toast.error('Error: ' + err.message) }
  }

  const metodoCfg = METODOS_PAGO.reduce((acc, m) => ({ ...acc, [m.value]: m }), {})

  return (
    <div className="panel-cobro-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Cobros</h1>
          <p className="page-subtitle">Registro de pagos de hoy</p>
        </div>
        <button id="btn-nuevo-pago" className="btn btn-primary" onClick={() => setModalPago(true)}>
          <Plus size={16} /> Registrar Cobro
        </button>
      </div>

      {/* KPIs */}
      <div className="cobro-kpis">
        <div className="card cobro-kpi">
          <div className="cobro-kpi-icon kpi-green"><DollarSign size={20} /></div>
          <div>
            <p className="cobro-kpi-label">Total USD hoy</p>
            <p className="cobro-kpi-valor">${resumen.totalUSD.toFixed(2)}</p>
          </div>
        </div>
        <div className="card cobro-kpi">
          <div className="cobro-kpi-icon kpi-blue"><TrendingUp size={20} /></div>
          <div>
            <p className="cobro-kpi-label">Total Bs hoy</p>
            <p className="cobro-kpi-valor">Bs {Number(resumen.totalBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card cobro-kpi">
          <div className="cobro-kpi-icon kpi-teal"><Receipt size={20} /></div>
          <div>
            <p className="cobro-kpi-label">Cobros</p>
            <p className="cobro-kpi-valor">{resumen.cantidad}</p>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="card" style={{ padding: '0.875rem 1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'var(--outline)' }} />
          <input type="text" className="form-input" placeholder="Buscar por paciente o cédula…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : pagosFiltrados.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--on-surface-variant)' }}>
          <Receipt size={48} strokeWidth={1} style={{ margin:'0 auto 1rem' }} />
          <p>No hay cobros registrados hoy</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Concepto</th>
                  <th>Método</th>
                  <th>USD</th>
                  <th>Bs</th>
                  <th>Estado</th>
                  <th>Hora</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map(p => {
                  const m = metodoCfg[p.metodo_pago]
                  return (
                    <tr key={p.id} className={p.estado === 'anulado' ? 'usuario-inactivo' : ''}>
                      <td>
                        <div className="usuario-cell">
                          <div className="paciente-avatar" style={{ width:34, height:34, fontSize:'0.65rem' }}>
                            {p.paciente?.nombre?.[0]}{p.paciente?.apellido?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{p.paciente?.nombre} {p.paciente?.apellido}</p>
                            <p className="text-xs text-muted">{p.paciente?.cedula}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{p.concepto}</td>
                      <td><span className="chip chip-neutral">{m?.icon} {m?.label ?? p.metodo_pago}</span></td>
                      <td className="font-semibold text-sm">{p.monto_usd ? `$${Number(p.monto_usd).toFixed(2)}` : '—'}</td>
                      <td className="font-semibold text-sm">{p.monto_bs ? `Bs ${Number(p.monto_bs).toLocaleString()}` : '—'}</td>
                      <td>
                        <span className={`chip ${p.estado === 'pagado' ? 'chip-success' : p.estado === 'anulado' ? 'chip-error' : 'chip-warning'}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(p.fecha_pago).toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td style={{ textAlign:'right' }}>
                        {p.estado === 'pagado' && (
                          <button className="btn-icon btn-icon-danger" title="Anular" onClick={() => handleAnular(p.id)}>
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalPago && (
        <RegistroPagoModal
          asistente_id={perfil?.id}
          onClose={(recargar) => { setModalPago(false); if (recargar) cargar() }}
        />
      )}
    </div>
  )
}
