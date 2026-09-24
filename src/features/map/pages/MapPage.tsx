import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, Crosshair, MapPin, Minus, Plus, Radio, Search, Waves } from 'lucide-react'
import mapaJuazeiroDoNorte from '@/assets/mapa-juazeiro-do-norte.png'
import { monitoringPoints, type MonitoringPoint } from '@/features/dashboard/data/monitoringPoints'
import '@/styles/map.css'

type StatusFilter = 'todos' | 'normal' | 'atencao'

const trendDisplay = {
  rising: { label: 'Subindo', Icon: ArrowUpRight },
  falling: { label: 'Descendo', Icon: ArrowDownRight },
  stable: { label: 'Estável', Icon: ArrowRight },
}

function PointTrend({ point }: { point: MonitoringPoint }) {
  const { label, Icon } = trendDisplay[point.trend]
  return <span className={`map-trend map-trend-${point.trend}`}><Icon size={17} />{label}</span>
}

export function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pointFromUrl = Number(searchParams.get('ponto'))
  const [selectedIndex, setSelectedIndex] = useState(pointFromUrl >= 0 && pointFromUrl < monitoringPoints.length ? pointFromUrl : 0)
  const [filter, setFilter] = useState<StatusFilter>('todos')
  const [search, setSearch] = useState('')
  const [zoom, setZoom] = useState(1)

  const visiblePoints = useMemo(() => monitoringPoints.map((point, index) => ({ point, index })).filter(({ point }) => {
    const matchesStatus = filter === 'todos' || (filter === 'normal' ? point.status === 'Normal' : point.status === 'Atenção')
    return matchesStatus && point.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR').trim())
  }), [filter, search])

  const activeIndex = visiblePoints.some(({ index }) => index === selectedIndex) ? selectedIndex : visiblePoints[0]?.index
  const selectedPoint = activeIndex === undefined ? null : monitoringPoints[activeIndex]
  const attentionCount = monitoringPoints.filter((point) => point.status === 'Atenção').length
  const normalCount = monitoringPoints.length - attentionCount

  function selectPoint(index: number) {
    setSelectedIndex(index)
    setSearchParams({ ponto: String(index) })
  }

  return (
    <section className="page map-page">
      <header className="page-header map-page-header">
        <div><p className="eyebrow">Painel ambiental</p><h1>Mapa em tempo real</h1><p className="subtitle">Acompanhe os pontos de monitoramento em Juazeiro do Norte.</p></div>
        <div className="map-header-status"><span className="map-header-pulse" /><div><strong>{monitoringPoints.length} sensores monitorados</strong><small>Leituras demonstrativas</small></div></div>
      </header>

      <div className="map-summary" aria-label="Resumo dos pontos">
        <div className="map-summary-item"><span className="map-summary-icon all"><Radio size={20} /></span><div><strong>{monitoringPoints.length}</strong><small>Pontos monitorados</small></div></div>
        <div className="map-summary-item"><span className="map-summary-icon normal"><Waves size={20} /></span><div><strong>{normalCount}</strong><small>Dentro do normal</small></div></div>
        <div className="map-summary-item"><span className="map-summary-icon attention"><AlertTriangle size={20} /></span><div><strong>{attentionCount}</strong><small>Requer atenção</small></div></div>
      </div>

      <div className="map-workspace">
        <article className="map-panel map-canvas-panel">
          <div className="map-panel-heading"><div><h2>Mapa dos sensores</h2><p>Selecione um marcador para consultar a leitura do ponto.</p></div><span className="map-city"><MapPin size={15} />Juazeiro do Norte, CE</span></div>
          <div className="map-canvas" aria-label="Mapa dos sensores em Juazeiro do Norte">
            <div className="map-canvas-layer" style={{ transform: `scale(${zoom})` }}>
              <img src={mapaJuazeiroDoNorte} alt="Mapa de Juazeiro do Norte" />
              {visiblePoints.map(({ point, index }) => <button key={point.name} type="button" className={`map-point-marker ${point.status === 'Atenção' ? 'attention' : 'normal'} ${activeIndex === index ? 'selected' : ''}`} style={point.mapPosition} onClick={() => selectPoint(index)} aria-label={`${point.name}: ${point.level} centímetros, ${point.status.toLowerCase()}`} aria-pressed={activeIndex === index}><span className="map-point-pin"><MapPin size={21} fill="currentColor" strokeWidth={1.8} /></span><span className="map-point-label">{point.level} cm</span></button>)}
            </div>
            <div className="map-zoom-controls" aria-label="Controles do mapa"><button type="button" onClick={() => setZoom((value) => Math.min(1.6, Math.round((value + .2) * 10) / 10))} aria-label="Aproximar mapa"><Plus size={18} /></button><button type="button" onClick={() => setZoom((value) => Math.max(1, Math.round((value - .2) * 10) / 10))} aria-label="Afastar mapa"><Minus size={18} /></button><button type="button" onClick={() => setZoom(1)} aria-label="Restaurar mapa"><Crosshair size={18} /></button></div>
            <div className="map-scale-note">Mapa ilustrativo · posições aproximadas</div>
          </div>
          <div className="map-legend"><strong>Legenda</strong><span><i className="normal" />Normal</span><span><i className="attention" />Em atenção</span><span><i className="critical" />Crítico</span></div>
        </article>

        <aside className="map-side-column">
          <section className="map-panel map-list-panel"><div className="map-panel-heading"><div><h2>Pontos monitorados</h2><p>{visiblePoints.length} {visiblePoints.length === 1 ? 'ponto encontrado' : 'pontos encontrados'}</p></div></div><label className="map-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ponto" aria-label="Buscar ponto monitorado" /></label><div className="map-filters" aria-label="Filtrar por status"><button type="button" className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos</button><button type="button" className={filter === 'normal' ? 'active' : ''} onClick={() => setFilter('normal')}>Normais</button><button type="button" className={filter === 'atencao' ? 'active' : ''} onClick={() => setFilter('atencao')}>Em atenção</button></div><div className="map-point-list">{visiblePoints.length ? visiblePoints.map(({ point, index }) => <button key={point.name} type="button" className={`map-point-row ${activeIndex === index ? 'selected' : ''}`} onClick={() => selectPoint(index)} aria-pressed={activeIndex === index}><span className={`map-point-row-icon ${point.status === 'Atenção' ? 'attention' : 'normal'}`}><MapPin size={17} /></span><span className="map-point-row-copy"><strong>{point.shortName}</strong><small><i className={point.status === 'Atenção' ? 'attention' : 'normal'} />{point.status} · Atualizado {point.update}</small></span><span className="map-point-row-level">{point.level}<small> cm</small></span><ChevronRight size={16} /></button>) : <p className="map-empty">Nenhum ponto corresponde à busca.</p>}</div></section>

          {selectedPoint && <section className={`map-panel map-detail-panel ${selectedPoint.status === 'Atenção' ? 'attention' : 'normal'}`}><div className="map-detail-top"><span className="map-detail-icon">{selectedPoint.status === 'Atenção' ? <AlertTriangle size={23} /> : <Waves size={23} />}</span><span className={`map-detail-status ${selectedPoint.status === 'Atenção' ? 'attention' : 'normal'}`}>{selectedPoint.status}</span></div><p className="map-detail-kicker">Ponto selecionado</p><h2>{selectedPoint.name}</h2><div className="map-detail-reading"><div><span>Nível atual</span><strong>{selectedPoint.level}<small> cm</small></strong></div><div><span>Tendência</span><PointTrend point={selectedPoint} /></div></div><div className="map-detail-update"><Radio size={15} />Atualizado {selectedPoint.update}</div></section>}
        </aside>
      </div>
    </section>
  )
}
