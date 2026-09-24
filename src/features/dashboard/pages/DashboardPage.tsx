import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, ChevronDown, ChevronRight, CircleAlert, MapPin, Radio, Waves, X } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { monitoringPoints, type Trend } from '@/features/dashboard/data/monitoringPoints'

const alerts = [
  { pointIndex: 0, message: 'Nível ultrapassou 60 cm', time: '09:42', tone: 'warning' },
  { pointIndex: 1, message: 'Nível retornou ao normal', time: '08:15', tone: 'normal' },
  { pointIndex: 2, message: 'Sensor voltou a transmitir', time: '07:50', tone: 'info' },
]

const chartSeries = {
  '24h': [34, 29, 42, 63, 55, 87, 119, 91, 97, 78, 85, 63, 66, 48, 48, 39, 29],
  '7dias': [31, 42, 35, 59, 52, 73, 62, 88, 77, 94, 68, 57, 65, 48, 39, 43, 62],
}

const trendDetails = {
  rising: { label: 'Subindo', Icon: ArrowUpRight },
  falling: { label: 'Descendo', Icon: ArrowDownRight },
  stable: { label: 'Estável', Icon: ArrowRight },
}

function TrendLabel({ trend }: { trend: Trend }) {
  const { label, Icon } = trendDetails[trend]
  return <span className={`trend trend-${trend}`}><Icon size={18} strokeWidth={2.5} />{label}</span>
}

function LevelChart({ period, pointIndex }: { period: '24h' | '7dias'; pointIndex: number }) {
  const values = chartSeries[period].map((value) => Math.max(10, value - pointIndex * 9))
  const width = 720
  const height = 112
  const y = (value: number) => height - (value / 150) * height
  const coordinates = values.map((value, index) => `${(index / (values.length - 1)) * width},${y(value)}`).join(' ')
  const area = `0,${height} ${coordinates} ${width},${height}`
  const labels = period === '24h'
    ? ['09:00', '12:00', '15:00', '18:00', '21:00', '00:00', '03:00', '06:00', '09:00']
    : ['Qui', 'Sex', 'Sáb', 'Dom', 'Seg', 'Ter', 'Qua']

  return (
    <div className="chart-plot" role="img" aria-label={`Evolução do nível da água de ${monitoringPoints[pointIndex].name} nos últimos ${period === '24h' ? '24 horas' : '7 dias'}`}>
      <div className="chart-axis-title">Nível (cm)</div>
      <div className="chart-y-labels"><span>150</span><span>100</span><span>50</span><span>0</span></div>
      <div className="chart-drawing">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1ba9bc" stopOpacity=".22" /><stop offset="100%" stopColor="#1ba9bc" stopOpacity=".02" /></linearGradient></defs>
          <line x1="0" x2={width} y1={y(150)} y2={y(150)} className="chart-threshold critical" />
          <line x1="0" x2={width} y1={y(100)} y2={y(100)} className="chart-threshold attention" />
          <line x1="0" x2={width} y1={y(50)} y2={y(50)} className="chart-gridline" />
          <line x1="0" x2={width} y1={height} y2={height} className="chart-gridline" />
          <polygon points={area} fill="url(#chart-fill)" />
          <polyline points={coordinates} className="chart-line" />
        </svg>
        <div className="chart-x-labels">{labels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [selectedPoint, setSelectedPoint] = useState(0)
  const [period, setPeriod] = useState<'24h' | '7dias'>('24h')
  const [modal, setModal] = useState<'details' | null>(null)
  const point = monitoringPoints[selectedPoint]
  const attentionPoint = monitoringPoints[0]

  function openDetails(index: number) {
    setSelectedPoint(index)
    setModal('details')
  }

  function openMap(index?: number) {
    navigate(index === undefined ? '/mapa' : `/mapa?ponto=${index}`)
  }

  return (
    <section className="page dashboard-page">
      <header className="page-header"><div><p className="eyebrow">Painel ambiental</p><h1>Visão geral</h1><p className="subtitle">Situação atual dos pontos monitorados e alertas da cidade.</p></div></header>

      <div className="metrics-grid" aria-label="Resumo do monitoramento">
        <MetricCard label="Pontos monitorados" value="3" detail="Todos os sensores da cidade" icon={<Radio size={27} />} tone="blue" />
        <MetricCard label="Normais" value="2" detail="Dentro da faixa de segurança" icon={<Waves size={27} />} tone="green" />
        <MetricCard label="Em atenção" value="1" detail="Nível acima do ideal" icon={<AlertTriangle size={27} />} tone="amber" />
        <MetricCard label="Críticos" value="0" detail="Nível muito elevado" icon={<CircleAlert size={27} />} tone="red" />
      </div>

      <div className="dashboard-grid overview-grid" id="pontos">
        <article className="panel points-panel">
          <div className="panel-heading"><div><h2>Situação dos pontos</h2><p>Última atualização em tempo real</p></div><button className="text-button" type="button" onClick={() => openMap()}>Ver todos <ArrowRight size={16} /></button></div>
          <div className="points-table-wrap" id="point-list"><table className="points-table"><thead><tr><th>Ponto monitorado</th><th>Status</th><th>Nível atual</th><th>Tendência</th><th>Última atualização</th><th><span className="sr-only">Detalhes</span></th></tr></thead><tbody>{monitoringPoints.map((item, index) => <tr key={item.name}><td><button className="point-name-button" type="button" onClick={() => openDetails(index)}><span className="location-icon"><MapPin size={16} /></span>{item.shortName}</button></td><td><span className={`status-pill ${item.status === 'Atenção' ? 'warning' : 'normal'}`}>{item.status}</span></td><td><strong className="table-level">{item.level} <small>cm</small></strong></td><td><TrendLabel trend={item.trend} /></td><td className="update-cell">Atualizado {item.update}</td><td><button className="row-arrow" type="button" onClick={() => openDetails(index)} aria-label={`Ver detalhes de ${item.name}`}><ChevronRight size={18} /></button></td></tr>)}</tbody></table></div>
        </article>

        <article className="panel current-panel"><div className="panel-heading"><div><h2>Situação atual</h2><p>Ponto que requer atenção no momento.</p></div><button className="text-button" type="button" onClick={() => openMap(0)}>Ver no mapa <ArrowRight size={16} /></button></div><div className="current-card"><div className="current-summary"><span className="current-icon"><AlertTriangle size={25} /></span><div><strong>1 ponto requer atenção</strong><p>Nível acima do ideal</p></div></div><div className="current-location"><span>Ponto</span><strong>{attentionPoint.name}</strong></div><div className="current-stats"><div><span>Nível atual</span><strong>{attentionPoint.level}<small> cm</small></strong></div><div><span>Tendência</span><TrendLabel trend={attentionPoint.trend} /></div><div><span>Última atualização</span><p>Atualizado {attentionPoint.update}</p></div></div><button className="details-button" type="button" onClick={() => openDetails(0)}>Ver detalhes <ChevronRight size={18} /></button></div></article>
      </div>

      <div className="dashboard-grid lower-grid"><article className="panel chart-panel" id="historico"><div className="panel-heading chart-heading"><div><h2>Evolução do nível da água</h2><p>Acompanhamento do nível nas últimas horas.</p></div><div className="chart-controls"><label className="point-select"><MapPin size={16} /><select value={selectedPoint} onChange={(event) => setSelectedPoint(Number(event.target.value))} aria-label="Selecionar ponto do gráfico">{monitoringPoints.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}</select><ChevronDown size={16} /></label><div className="period-switch" aria-label="Período do gráfico"><button type="button" className={period === '24h' ? 'active' : ''} onClick={() => setPeriod('24h')}>24h</button><button type="button" className={period === '7dias' ? 'active' : ''} onClick={() => setPeriod('7dias')}>7 dias</button></div></div></div><LevelChart period={period} pointIndex={selectedPoint} /><div className="chart-legend"><span><i className="legend-line attention" />Atenção: 100 cm</span><span><i className="legend-line critical" />Crítico: 150 cm</span></div><div className="chart-stats"><div><span className="stat-icon maximum"><ArrowUpRight size={19} /></span><p><strong>150 cm</strong><small>Máximo (hoje)</small></p></div><div><span className="stat-icon minimum"><ArrowDownRight size={19} /></span><p><strong>21 cm</strong><small>Mínimo (hoje)</small></p></div><div><span className="stat-icon current"><Waves size={19} /></span><p><strong>{point.level} cm</strong><small>Atual</small></p></div></div></article>

        <article className="panel alerts-panel" id="alertas"><div className="panel-heading"><div><h2>Alertas recentes</h2><p>Eventos recebidos hoje.</p></div><button className="text-button" type="button" onClick={() => navigate('/alertas')}>Ver todos <ArrowRight size={16} /></button></div><div className="alert-list" id="alert-list">{alerts.map((alert) => { const item = monitoringPoints[alert.pointIndex]; return <button className="alert-row" type="button" key={`${item.name}-${alert.time}`} onClick={() => navigate(`/alertas?ponto=${alert.pointIndex}`)}><span className={`alert-icon ${alert.tone}`}>{alert.tone === 'info' ? <Radio size={19} /> : <Waves size={19} />}</span><span className="alert-copy"><strong>{item.shortName}</strong><small>{alert.message}</small></span><time>{alert.time}</time><ChevronRight size={17} /></button> })}</div></article>
      </div>

      {modal && <div className="modal-backdrop" onClick={() => setModal(null)}><div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={`Detalhes de ${point.name}`} onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><h2>{point.name}</h2><p>Leitura mais recente do sensor</p></div><button type="button" className="modal-close" onClick={() => setModal(null)} aria-label="Fechar"><X size={20} /></button></div><div className="modal-point"><div><span>Status</span><strong>{point.status}</strong></div><div><span>Nível atual</span><strong>{point.level} cm</strong></div><div><span>Tendência</span><TrendLabel trend={point.trend} /></div><div><span>Última atualização</span><strong>Atualizado {point.update}</strong></div><button className="details-button" type="button" onClick={() => openMap(selectedPoint)}>Ver no mapa <ArrowRight size={17} /></button></div></div></div>}
    </section>
  )
}
