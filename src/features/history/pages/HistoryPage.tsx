import { useMemo, useState } from 'react'
import { Activity, CalendarDays, ChartNoAxesCombined, Check, ChevronDown, ChevronRight, CircleAlert, Clock3, MapPin, Radio, RefreshCw, TriangleAlert, Waves, WifiOff, X } from 'lucide-react'
import { historyEvents, historyPoints, type HistoryEvent, type HistoryTone } from '@/features/history/data/historyData'
import '@/styles/history.css'

type Period = '24h' | '7d' | '30d'
type Tab = 'events' | 'levels'

const toneIcon = { critical: CircleAlert, attention: TriangleAlert, normalized: Check, technical: WifiOff }

function EventIcon({ tone }: { tone: HistoryTone }) {
  const Icon = toneIcon[tone]
  return <span className={`history-event-icon ${tone}`}><Icon size={27} /></span>
}

function LevelChart({ event }: { event: HistoryEvent }) {
  const width = 620
  const height = 170
  const maximumScale = 150
  const points = event.chart.map((value, index) => `${(index / (event.chart.length - 1)) * width},${height - (value / maximumScale) * height}`).join(' ')
  const areaPoints = `0,${height} ${points} ${width},${height}`
  return (
    <div className="history-chart" aria-label={`Gráfico de evolução de ${event.point}`}>
      <div className="history-chart-y"><span>150</span><span>100</span><span>50</span><span>0</span></div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img">
        <defs><linearGradient id={`history-area-${event.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b91ab" stopOpacity=".25" /><stop offset="1" stopColor="#0b91ab" stopOpacity=".02" /></linearGradient></defs>
        <line className="critical-line" x1="0" x2={width} y1={height - (100 / maximumScale) * height} y2={height - (100 / maximumScale) * height} />
        <line className="attention-line" x1="0" x2={width} y1={height - (60 / maximumScale) * height} y2={height - (60 / maximumScale) * height} />
        <polygon points={areaPoints} fill={`url(#history-area-${event.id})`} />
        <polyline points={points} fill="none" stroke="#078da8" strokeWidth="4" vectorEffect="non-scaling-stroke" />
        {event.chart.map((value, index) => <circle key={`${event.id}-${index}`} cx={(index / (event.chart.length - 1)) * width} cy={height - (value / maximumScale) * height} r="5" className={value >= 100 ? 'critical-dot' : value >= 60 ? 'attention-dot' : ''} />)}
      </svg>
      <div className="history-chart-x"><span>12:00</span><span>12:30</span><span>13:00</span><span>13:30</span><span>14:00</span><span>14:30</span><span>15:00</span></div>
      <div className="history-chart-legend"><span><i className="attention" />Atenção: 60 cm</span><span><i className="critical" />Crítico: 100 cm</span></div>
    </div>
  )
}

function EventDetails({ event, mobile = false, onClose }: { event: HistoryEvent; mobile?: boolean; onClose?: () => void }) {
  return (
    <article className={`history-detail ${event.tone} ${mobile ? 'mobile' : ''}`}>
      {mobile && <div className="history-sheet-handle" />}
      <header className="history-detail-heading">
        <EventIcon tone={event.tone} />
        <div><h2>{event.point}</h2><p>{event.location}</p></div>
        <span className={`history-status ${event.tone}`}>{event.status}</span>
        {mobile && <button type="button" className="history-detail-close" onClick={onClose} aria-label="Fechar detalhes"><X size={21} /></button>}
      </header>
      <div className="history-detail-stats">
        <div><span>Início</span><strong>{event.start}</strong><small>24/09/2026</small></div>
        <div><span>Fim</span><strong>{event.end}</strong><small>24/09/2026</small></div>
        <div><span>Duração</span><strong>{event.duration}</strong></div>
        <div><span>Máximo</span><strong className="maximum">{event.maximum === null ? '—' : `${event.maximum} cm`}</strong></div>
        <div><span>Atual</span><strong className="current">{event.current === null ? '—' : `${event.current} cm`}</strong></div>
      </div>
      <section className="history-detail-section"><h3>Evolução do incidente</h3><LevelChart event={event} /></section>
      <section className="history-incident-timeline"><h3>Linha do tempo do incidente</h3>{event.timeline.map((item) => <div className={`history-timeline-row ${item.tone}`} key={`${event.id}-${item.time}-${item.title}`}><time>{item.time}</time><i /><div><strong>{item.title}</strong><span>{item.description}</span></div></div>)}</section>
    </article>
  )
}

function EventCard({ event, selected, onSelect }: { event: HistoryEvent; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`history-event-card ${event.tone} ${selected ? 'selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
    <EventIcon tone={event.tone} />
    <span className="history-event-copy"><strong>{event.point}</strong><small>{event.summary}</small></span>
    <span className={`history-status ${event.tone}`}>{event.status}</span>
    <span className="history-event-metrics"><strong>{event.start} <i>→</i> {event.end}</strong><small>{event.tone === 'technical' ? `Indisponível por ${event.duration}` : `Duração: ${event.duration}`}</small>{event.maximum !== null && <small>Máximo: {event.maximum} cm</small>}</span>
    <ChevronRight size={23} />
  </button>
}

export function HistoryPage() {
  const [tab, setTab] = useState<Tab>('events')
  const [period, setPeriod] = useState<Period>('7d')
  const [point, setPoint] = useState('all')
  const [selectedId, setSelectedId] = useState(historyEvents[0].id)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date(2026, 8, 24, 13, 19, 32))
  const visibleEvents = useMemo(() => historyEvents.filter((event) => point === 'all' || event.pointId === point), [point])
  const selectedEvent = visibleEvents.find((event) => event.id === selectedId) ?? visibleEvents[0] ?? historyEvents[0]
  const groups = [...new Set(visibleEvents.map((event) => event.group))]
  const affectedPoints = new Set(visibleEvents.map((event) => event.pointId)).size
  const highestLevel = Math.max(...visibleEvents.map((event) => event.maximum ?? 0))
  const updateLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastUpdated).replace(', ', ' · ')

  function selectEvent(event: HistoryEvent) {
    setSelectedId(event.id)
    setMobileDetailOpen(true)
  }

  return <section className="page history-page">
    <header className="page-header history-page-header">
      <div><p className="eyebrow">Painel ambiental</p><h1>Histórico</h1><p className="subtitle">Consulte eventos passados e a evolução dos pontos monitorados.</p></div>
      <div className="history-updated"><Clock3 size={23} /><div><span>Última atualização</span><strong>{updateLabel}</strong></div><button type="button" onClick={() => setLastUpdated(new Date())} aria-label="Atualizar horário"><RefreshCw size={22} /></button></div>
    </header>

    <div className="history-controls">
      <div className="history-tabs"><button type="button" className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}><CalendarDays size={18} />Eventos</button><button type="button" className={tab === 'levels' ? 'active' : ''} onClick={() => setTab('levels')}><ChartNoAxesCombined size={19} />Evolução dos níveis</button></div>
      <div className="history-filters"><span>Período:</span><div className="history-periods">{(['24h', '7d', '30d'] as Period[]).map((value) => <button key={value} type="button" className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{value === '7d' ? '7 dias' : value === '30d' ? '30 dias' : value}</button>)}</div><label className="history-point-select"><MapPin size={19} /><select value={point} onChange={(event) => { setPoint(event.target.value); setMobileDetailOpen(false) }}>{historyPoints.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select><ChevronDown size={17} /></label></div>
    </div>

    <div className="history-summary">
      <div><span className="cyan"><CalendarDays size={28} /></span><p><strong>{visibleEvents.length * (period === '30d' ? 2 : period === '24h' ? 1 : 2)}</strong><b>eventos registrados</b><small>No período selecionado</small></p></div>
      <div><span className="green"><MapPin size={30} /></span><p><strong>{affectedPoints}</strong><b>pontos afetados</b><small>Com eventos no período</small></p></div>
      <div><span className="purple"><Waves size={29} /></span><p><strong>{highestLevel} cm</strong><b>maior nível</b><small>Registrado no período</small></p></div>
    </div>

    {tab === 'events' ? <div className="history-workspace">
      <div className="history-list-panel">{groups.map((group) => { const groupEvents = visibleEvents.filter((event) => event.group === group); return <section className="history-day-group" key={group}><div className="history-day-heading"><h2>{group}</h2><span>{groupEvents[0].groupDate}</span></div><div className="history-day-events">{groupEvents.map((event) => <EventCard key={event.id} event={event} selected={selectedEvent.id === event.id} onSelect={() => selectEvent(event)} />)}</div></section> })}</div>
      <EventDetails event={selectedEvent} />
    </div> : <section className="history-levels-view">
      <header><div><h2>Evolução dos pontos</h2><p>Comparativo resumido do período selecionado.</p></div><Activity size={25} /></header>
      <div className="history-level-cards">{historyPoints.slice(1, 4).filter((item) => point === 'all' || item.id === point).map((item) => { const event = historyEvents.find((entry) => entry.pointId === item.id) ?? historyEvents[0]; return <article key={item.id}><div><span className={`history-level-dot ${event.tone}`}><Radio size={18} /></span><p><strong>{item.label}</strong><small>{event.location}</small></p></div><b>{event.current ?? 0} cm</b><LevelChart event={event} /><footer><span>Máximo no período</span><strong>{event.maximum ?? '—'}{event.maximum !== null ? ' cm' : ''}</strong></footer></article> })}</div>
    </section>}

    {mobileDetailOpen && <div className="history-sheet-backdrop" onClick={() => setMobileDetailOpen(false)}><div className="history-sheet" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selectedEvent.point}`} onClick={(event) => event.stopPropagation()}><EventDetails event={selectedEvent} mobile onClose={() => setMobileDetailOpen(false)} /></div></div>}
  </section>
}
