import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Bell, ChevronRight, CircleAlert, CircleCheck, Clock3, Map, Maximize, Navigation, RefreshCw, TriangleAlert, X } from 'lucide-react'
import mapaJuazeiroDoNorte from '@/assets/mapa-juazeiro-do-norte.png'
import { monitoringPoints } from '@/features/dashboard/data/monitoringPoints'
import '@/styles/alerts.css'

type AlertStatus = 'critical' | 'attention' | 'resolved'
type AlertFilter = 'all' | 'active' | 'resolved'

type AlertItem = {
  pointIndex: number
  status: AlertStatus
  title: string
  subtitle: string
  badge: string
  level: number
  time: string
  update: string
  location: string
  trend: string
  notice: string
  advice: string
  timeline: { time: string; text: string; tone: AlertStatus }[]
}

const alerts: AlertItem[] = [
  {
    pointIndex: 0, status: 'critical', title: 'Avenida Leão Sampaio', subtitle: 'Nível crítico de alagamento', badge: 'Crítico', level: 104, time: 'há 2 min', update: '13:17', location: 'PONTO 01 · Centro', trend: 'Subindo rapidamente', notice: 'Trecho com risco de alagamento.', advice: 'Evite transitar pela região neste momento.',
    timeline: [{ time: '13:17', text: 'Entrou em nível crítico', tone: 'critical' }, { time: '13:09', text: 'Nível aumentando rapidamente', tone: 'attention' }, { time: '13:02', text: 'Entrou em atenção', tone: 'attention' }],
  },
  {
    pointIndex: 1, status: 'attention', title: 'Av. Plácido A. Castelo', subtitle: 'Nível em atenção', badge: 'Atenção', level: 62, time: 'há 11 min', update: '13:08', location: 'PONTO 02 · Juazeiro do Norte', trend: 'Subindo', notice: 'Nível acima do ideal.', advice: 'Acompanhe as próximas atualizações do ponto.',
    timeline: [{ time: '13:08', text: 'Entrou em atenção', tone: 'attention' }, { time: '12:54', text: 'Nível da água em elevação', tone: 'attention' }],
  },
  {
    pointIndex: 2, status: 'resolved', title: 'Avenida Padre Cícero', subtitle: 'Situação normalizada', badge: 'Normalizado', level: 31, time: '08:15', update: '08:15', location: 'PONTO 03 · Juazeiro do Norte', trend: 'Descendo', notice: 'Nível voltou à faixa normal.', advice: 'O ponto segue em monitoramento.',
    timeline: [{ time: '08:15', text: 'Situação normalizada', tone: 'resolved' }, { time: '07:42', text: 'Nível da água em queda', tone: 'attention' }],
  },
]

const statusIcon = {
  critical: CircleAlert,
  attention: TriangleAlert,
  resolved: CircleCheck,
}

function MiniMap({ alert, routeShown, onExpand }: { alert: AlertItem; routeShown: boolean; onExpand?: () => void }) {
  return (
    <div className={`alerts-mini-map ${routeShown ? 'route-shown' : ''}`}>
      <img src={mapaJuazeiroDoNorte} alt={`Mapa ilustrativo da região de ${alert.title}`} />
      <span className={`alerts-map-marker ${alert.status}`} style={monitoringPoints[alert.pointIndex].mapPosition}><CircleAlert size={23} /></span>
      {routeShown && <><span className="alerts-route-line" /><span className="alerts-route-label">Trajeto ilustrativo</span></>}
      {onExpand && <button type="button" className="alerts-map-expand" onClick={onExpand} aria-label="Ampliar mapa"><Maximize size={18} /></button>}
    </div>
  )
}

export function AlertsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<AlertFilter>('all')
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [routeShown, setRouteShown] = useState(false)
  const [mapExpanded, setMapExpanded] = useState(false)
  const visibleAlerts = alerts.filter((alert) => filter === 'all' || (filter === 'active' ? alert.status !== 'resolved' : alert.status === 'resolved'))
  const requestedPoint = Number(searchParams.get('ponto'))
  const selectedAlert = visibleAlerts.find((alert) => alert.pointIndex === requestedPoint) ?? visibleAlerts[0]
  const StatusIcon = statusIcon[selectedAlert.status]
  const activeCount = alerts.filter((alert) => alert.status !== 'resolved').length
  const criticalCount = alerts.filter((alert) => alert.status === 'critical').length
  const updateLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastUpdated).replace(', ', ' • ')

  function selectAlert(alert: AlertItem) {
    setSearchParams({ ponto: String(alert.pointIndex) })
    setRouteShown(false)
  }

  return (
    <section className="page alerts-page">
      <header className="page-header alerts-page-header">
        <div><p className="eyebrow">Painel ambiental</p><h1>Alertas</h1><p className="subtitle">Acompanhe avisos ativos e eventos recentes dos pontos monitorados.</p></div>
        <div className="alerts-updated"><Clock3 size={24} /><div><span>Última atualização</span><strong>{updateLabel}</strong></div><button type="button" onClick={() => setLastUpdated(new Date())} aria-label="Atualizar horário"><RefreshCw size={23} /></button></div>
      </header>

      <div className="alerts-summary" aria-label="Resumo dos alertas">
        <div className="alerts-summary-card active"><span><Bell size={27} /></span><p><strong>{activeCount}</strong>ativos</p></div>
        <div className="alerts-summary-card critical"><span><CircleAlert size={29} /></span><p><strong>{criticalCount}</strong>crítico</p></div>
        <div className="alerts-summary-card resolved"><span><CircleCheck size={29} /></span><p><strong>4</strong>resolvidos hoje</p></div>
      </div>

      <div className="alerts-workspace">
        <article className="alerts-list-panel">
          <h2>Alertas ativos</h2>
          <div className="alerts-tabs" aria-label="Filtrar alertas">
            <button type="button" className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Todos ({alerts.length})</button>
            <button type="button" className={filter === 'active' ? 'selected' : ''} onClick={() => setFilter('active')}>Ativos ({activeCount})</button>
            <button type="button" className={filter === 'resolved' ? 'selected' : ''} onClick={() => setFilter('resolved')}><i />Resolvidos ({alerts.length - activeCount})</button>
          </div>
          <div className="alerts-items">
            {visibleAlerts.map((alert) => {
              const Icon = statusIcon[alert.status]
              return <button key={alert.pointIndex} type="button" className={`alerts-item ${alert.status} ${selectedAlert.pointIndex === alert.pointIndex ? 'selected' : ''}`} onClick={() => selectAlert(alert)} aria-pressed={selectedAlert.pointIndex === alert.pointIndex}>
                <span className="alerts-item-icon"><Icon size={24} /></span>
                <span className="alerts-item-copy"><strong>{alert.title}</strong><small>{alert.subtitle}</small><em>{alert.badge}</em></span>
                <span className="alerts-item-reading"><strong>{alert.level} cm {alert.status === 'resolved' ? <ArrowDown size={19} /> : <ArrowUp size={19} />}</strong><small>{alert.time}</small></span>
                <ChevronRight size={21} className="alerts-item-chevron" />
              </button>
            })}
          </div>
        </article>

        <article className={`alerts-detail-panel ${selectedAlert.status}`}>
          <div className="alerts-detail-heading"><span className="alerts-detail-icon"><StatusIcon size={31} /></span><div><h2>{selectedAlert.title}</h2><p>{selectedAlert.location}</p></div><strong className="alerts-detail-badge">{selectedAlert.badge}</strong></div>
          <div className="alerts-detail-main">
            <div className="alerts-detail-reading"><h3>Nível da água</h3><div className="alerts-level-line"><strong>{selectedAlert.level} cm</strong><span>{selectedAlert.status === 'resolved' ? <ArrowDown size={32} /> : <ArrowUp size={32} />}{selectedAlert.trend}</span></div><p>Última atualização: {lastUpdated.toLocaleDateString('pt-BR')} • {selectedAlert.update}</p><div className="alerts-gauge"><div className="alerts-gauge-track"><span style={{ width: `${Math.min(selectedAlert.level / 150 * 100, 100)}%` }} /><i className="attention" /><i className="critical" /></div><div className="alerts-gauge-labels"><span>0</span><span>60 cm<br /><b>Atenção</b></span><span>100 cm<br /><b>Crítico</b></span><span>150 cm</span></div></div><div className="alerts-notice"><CircleAlert size={30} /><p><strong>{selectedAlert.notice}</strong><span>{selectedAlert.advice}</span></p></div></div>
            <div className="alerts-map-column"><MiniMap alert={selectedAlert} routeShown={routeShown} onExpand={() => setMapExpanded(true)} /><div className="alerts-map-actions"><button type="button" onClick={() => navigate(`/mapa?ponto=${selectedAlert.pointIndex}`)}><Map size={21} />Ver no mapa</button><button type="button" onClick={() => setRouteShown((value) => !value)} aria-pressed={routeShown}><Navigation size={20} />{routeShown ? 'Ocultar trajeto' : 'Ver rota segura'}</button></div></div>
          </div>
          <div className="alerts-timeline"><h3>Linha do tempo do incidente</h3>{selectedAlert.timeline.map((event) => <div className={`alerts-timeline-event ${event.tone}`} key={`${event.time}-${event.text}`}><time>{event.time}</time><i /><span>{event.text}</span></div>)}</div>
        </article>
      </div>

      {mapExpanded && <div className="alerts-map-dialog-backdrop" onClick={() => setMapExpanded(false)}><div className="alerts-map-dialog" role="dialog" aria-modal="true" aria-label={`Mapa de ${selectedAlert.title}`} onClick={(event) => event.stopPropagation()}><div className="alerts-map-dialog-heading"><div><h2>{selectedAlert.title}</h2><p>Posição aproximada do ponto monitorado</p></div><button type="button" onClick={() => setMapExpanded(false)} aria-label="Fechar mapa"><X size={22} /></button></div><MiniMap alert={selectedAlert} routeShown={routeShown} /><button type="button" className="alerts-dialog-open-map" onClick={() => navigate(`/mapa?ponto=${selectedAlert.pointIndex}`)}>Abrir mapa dos sensores <ChevronRight size={19} /></button></div></div>}
    </section>
  )
}
