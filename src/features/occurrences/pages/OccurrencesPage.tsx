import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, ChevronRight, Clock3, FileText, Image as ImageIcon, Map, MapPin, Navigation, Plus, Radio, Search, UserRound, X } from 'lucide-react'
import mapaJuazeiroDoNorte from '@/assets/mapa-juazeiro-do-norte.png'
import avenidaAlagada from '@/assets/occurrences/avenida-alagada.png'
import ruaAlagada from '@/assets/occurrences/rua-alagada.png'
import bueiroAlagado from '@/assets/occurrences/bueiro-alagado.png'
import '@/styles/occurrences.css'

type OccurrenceStatus = 'confirmed' | 'analysis' | 'closed'
type OccurrenceFilter = 'all' | OccurrenceStatus
type Occurrence = {
  id: number
  title: string
  neighborhood: string
  city: string
  summary: string
  description: string
  status: OccurrenceStatus
  time: string
  minutesAgo: number
  photos: string[]
  confirmation: string
  pointIndex?: number
}

const initialOccurrences: Occurrence[] = [
  { id: 1, title: 'Avenida Leão Sampaio', neighborhood: 'Centro', city: 'Juazeiro do Norte - CE', summary: 'Alagamento afetando o trânsito na via.', description: 'Alagamento afetando o trânsito na via. Nível da água subiu rapidamente com a chuva da tarde.', status: 'confirmed', time: 'Há 18 min', minutesAgo: 18, photos: [avenidaAlagada, ruaAlagada, avenidaAlagada], confirmation: 'Confirmada por sensor próximo (Ponto 01)', pointIndex: 0 },
  { id: 2, title: 'Rua São Pedro', neighborhood: 'Centro', city: 'Juazeiro do Norte - CE', summary: 'Água cobrindo parcialmente a via.', description: 'Moradores relataram acúmulo de água em parte da rua. Equipe acompanha a situação após a chuva.', status: 'analysis', time: 'Há 42 min', minutesAgo: 42, photos: [ruaAlagada, avenidaAlagada], confirmation: 'Aguardando confirmação', pointIndex: 0 },
  { id: 3, title: 'Rua José de Alencar', neighborhood: 'Salesianos', city: 'Juazeiro do Norte - CE', summary: 'Via liberada após queda de árvore.', description: 'O trecho foi liberado após a retirada de galhos que impediam a passagem. A água da chuva está escoando.', status: 'closed', time: 'Hoje · 10:14', minutesAgo: 185, photos: [ruaAlagada], confirmation: 'Ocorrência encerrada' },
  { id: 4, title: 'Av. Plácido A. Castelo', neighborhood: 'Triângulo', city: 'Juazeiro do Norte - CE', summary: 'Acúmulo de água após forte chuva.', description: 'Acúmulo de água após forte chuva. A via permanece transitável com atenção redobrada.', status: 'analysis', time: 'Hoje · 09:37', minutesAgo: 222, photos: [avenidaAlagada], confirmation: 'Aguardando confirmação', pointIndex: 1 },
  { id: 5, title: 'Rua da Matriz', neighborhood: 'Centro', city: 'Juazeiro do Norte - CE', summary: 'Bueiro entupido causando alagamento.', description: 'Bueiro entupido causando alagamento pontual na rua. Equipe de manutenção foi informada.', status: 'confirmed', time: 'Hoje · 08:21', minutesAgo: 298, photos: [bueiroAlagado, ruaAlagada], confirmation: 'Confirmada pela equipe' },
  { id: 6, title: 'Avenida Padre Cícero', neighborhood: 'Lagoa Seca', city: 'Juazeiro do Norte - CE', summary: 'Ponto de água acumulada na lateral da via.', description: 'Acúmulo de água na lateral da avenida após a chuva. O trecho segue em observação.', status: 'confirmed', time: 'Hoje · 08:04', minutesAgo: 315, photos: [ruaAlagada], confirmation: 'Confirmada por sensor próximo (Ponto 03)', pointIndex: 2 },
  { id: 7, title: 'Rua do Cruzeiro', neighborhood: 'Centro', city: 'Juazeiro do Norte - CE', summary: 'Água retornando pela drenagem.', description: 'Relato de retorno de água pela drenagem da rua durante o período de chuva.', status: 'analysis', time: 'Hoje · 07:46', minutesAgo: 333, photos: [bueiroAlagado], confirmation: 'Aguardando confirmação' },
  { id: 8, title: 'Rua Santa Rosa', neighborhood: 'Franciscanos', city: 'Juazeiro do Norte - CE', summary: 'Trecho alagado após chuva intensa.', description: 'Trecho alagado após chuva intensa. A equipe confirmou a situação no local.', status: 'confirmed', time: 'Ontem · 18:40', minutesAgo: 1100, photos: [avenidaAlagada], confirmation: 'Confirmada pela equipe' },
  { id: 9, title: 'Avenida Ailton Gomes', neighborhood: 'Pirajá', city: 'Juazeiro do Norte - CE', summary: 'Trânsito lento por água na pista.', description: 'Trânsito lento após acúmulo de água na pista. Condições confirmadas por moradores.', status: 'confirmed', time: 'Ontem · 17:22', minutesAgo: 1178, photos: [ruaAlagada], confirmation: 'Confirmada pela comunidade' },
  { id: 10, title: 'Rua São Paulo', neighborhood: 'Centro', city: 'Juazeiro do Norte - CE', summary: 'Pista liberada após escoamento.', description: 'A água escoou e a via voltou a ficar livre para passagem.', status: 'closed', time: 'Ontem · 16:10', minutesAgo: 1250, photos: [avenidaAlagada], confirmation: 'Ocorrência encerrada' },
  { id: 11, title: 'Rua Padre Cícero', neighborhood: 'Centro', city: 'Juazeiro do Norte - CE', summary: 'Acúmulo de água confirmado.', description: 'Ponto de alagamento confirmado durante a chuva. A situação segue em acompanhamento.', status: 'confirmed', time: 'Ontem · 15:32', minutesAgo: 1288, photos: [ruaAlagada], confirmation: 'Confirmada pela comunidade' },
  { id: 12, title: 'Rua São José', neighborhood: 'Centro', city: 'Juazeiro do Norte - CE', summary: 'Alagamento resolvido no início da tarde.', description: 'A água recuou após a limpeza da drenagem e a rua foi liberada.', status: 'closed', time: 'Ontem · 13:05', minutesAgo: 1435, photos: [bueiroAlagado], confirmation: 'Ocorrência encerrada' },
]

const statusLabels: Record<OccurrenceStatus, string> = { confirmed: 'Confirmada', analysis: 'Em análise', closed: 'Encerrada' }

export function OccurrencesPage() {
  const navigate = useNavigate()
  const [occurrences, setOccurrences] = useState(initialOccurrences)
  const [filter, setFilter] = useState<OccurrenceFilter>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [selectedId, setSelectedId] = useState<number | null>(1)
  const [activePhoto, setActivePhoto] = useState(0)
  const [showReport, setShowReport] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportNeighborhood, setReportNeighborhood] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  const counts = useMemo(() => ({ all: occurrences.length, analysis: occurrences.filter((item) => item.status === 'analysis').length, confirmed: occurrences.filter((item) => item.status === 'confirmed').length, closed: occurrences.filter((item) => item.status === 'closed').length }), [occurrences])
  const visible = useMemo(() => {
    const query = search.toLocaleLowerCase('pt-BR').trim()
    return occurrences.filter((item) => (filter === 'all' || item.status === filter) && `${item.title} ${item.neighborhood} ${item.summary}`.toLocaleLowerCase('pt-BR').includes(query)).sort((a, b) => sort === 'oldest' ? b.minutesAgo - a.minutesAgo : a.minutesAgo - b.minutesAgo)
  }, [occurrences, filter, search, sort])
  const selected = occurrences.find((item) => item.id === selectedId) ?? null

  function selectOccurrence(id: number) {
    setSelectedId(id)
    setActivePhoto(0)
    setShowRoute(false)
  }

  function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const item: Occurrence = { id: Date.now(), title: reportTitle.trim(), neighborhood: reportNeighborhood.trim(), city: 'Juazeiro do Norte - CE', summary: reportDescription.trim(), description: reportDescription.trim(), status: 'analysis', time: 'Agora', minutesAgo: 0, photos: [], confirmation: 'Aguardando confirmação' }
    setOccurrences((current) => [item, ...current])
    setFilter('all')
    setSearch('')
    setSort('recent')
    selectOccurrence(item.id)
    setShowReport(false)
    setReportTitle('')
    setReportNeighborhood('')
    setReportDescription('')
  }

  return (
    <section className="page occurrences-page">
      <header className="occurrences-header">
        <div><p className="eyebrow">Painel ambiental</p><h1>Ocorrências</h1><p className="subtitle">Relatos de alagamentos e outras situações observadas pela comunidade.</p></div>
        <button type="button" className="occurrences-report-button" onClick={() => setShowReport(true)}><Plus size={24} />Reportar ocorrência</button>
      </header>

      <div className="occurrences-toolbar">
        <div className="occurrences-filters" aria-label="Filtrar ocorrências">
          {([['all', 'Todas'], ['analysis', 'Em análise'], ['confirmed', 'Confirmadas'], ['closed', 'Encerradas']] as const).map(([key, label]) => <button key={key} type="button" className={filter === key ? 'active' : ''} onClick={() => setFilter(key)} aria-pressed={filter === key}><i className={key} />{label} ({counts[key]})</button>)}
        </div>
        <div className="occurrences-tools"><label className="occurrences-search"><Search size={21} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar local, rua ou bairro..." aria-label="Buscar ocorrência" /></label><label className="occurrences-sort"><span className="sr-only">Ordenar ocorrências</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Mais recentes</option><option value="oldest">Mais antigas</option></select><ChevronDown size={17} /></label></div>
      </div>

      <div className="occurrences-workspace">
        <div className="occurrences-list" aria-label="Lista de ocorrências">
          {visible.length ? visible.map((item) => <button type="button" key={item.id} className={`occurrence-card ${item.status} ${selectedId === item.id ? 'selected' : ''}`} onClick={() => selectOccurrence(item.id)} aria-pressed={selectedId === item.id}>
            {item.photos[0] ? <img className="occurrence-card-photo" src={item.photos[0]} alt="" /> : <span className="occurrence-card-no-photo"><ImageIcon size={28} /></span>}
            <span className="occurrence-card-body"><span className="occurrence-card-top"><span className={`occurrence-status ${item.status}`}><i />{statusLabels[item.status]}</span><small>{item.time}</small></span><strong>{item.title}</strong><span className="occurrence-neighborhood">{item.neighborhood}</span><span className="occurrence-summary">{item.summary}</span><span className="occurrence-card-meta"><span><ImageIcon size={16} />{item.photos.length} {item.photos.length === 1 ? 'foto' : 'fotos'}</span><span>{item.status === 'confirmed' ? <Radio size={16} /> : <UserRound size={16} />}{item.status === 'confirmed' ? item.confirmation.replace(/ \(.*\)/, '') : 'Relato da comunidade'}</span></span></span><ChevronRight className="occurrence-card-arrow" size={20} />
          </button>) : <div className="occurrences-empty"><Search size={28} /><strong>Nenhuma ocorrência encontrada</strong><span>Tente outro local ou selecione um filtro diferente.</span></div>}
        </div>

        <aside className="occurrence-detail">
          {selected ? <><div className="occurrence-detail-heading"><div><h2>{selected.title}</h2><p>{selected.neighborhood} · {selected.city}</p></div><button type="button" onClick={() => setSelectedId(null)} aria-label="Fechar detalhes"><X size={22} /></button></div>
            <div className="occurrence-detail-meta"><span className={`occurrence-status ${selected.status}`}><i />{statusLabels[selected.status]}</span><span><Clock3 size={17} />{selected.time === 'Agora' ? 'Agora' : selected.time.replace('Há ', 'Há ').replace('min', 'minutos')}</span></div>
            {selected.photos.length ? <div className="occurrence-gallery"><img className="occurrence-gallery-main" src={selected.photos[activePhoto] ?? selected.photos[0]} alt={`Registro de ${selected.title}`} /><div className="occurrence-gallery-thumbs"><button type="button" className={activePhoto === 0 ? 'active' : ''} onClick={() => setActivePhoto(0)} aria-label="Ver foto 1"><img src={selected.photos[0]} alt="" /></button>{selected.photos.length > 1 && <button type="button" className={activePhoto > 0 ? 'active' : ''} onClick={() => setActivePhoto((current) => current === 1 && selected.photos.length > 2 ? 2 : 1)} aria-label={selected.photos.length > 2 ? 'Ver próximas fotos' : 'Ver foto 2'}><img src={selected.photos[activePhoto > 1 ? activePhoto : 1]} alt="" />{selected.photos.length > 2 && <span>+{selected.photos.length - 2}</span>}</button>}</div></div> : <div className="occurrence-gallery-placeholder"><ImageIcon size={28} /><span>Sem fotos adicionadas</span></div>}
            <div className="occurrence-description occurrence-info"><span className="occurrence-info-icon"><FileText size={19} /></span><div><strong>Descrição</strong><p>{selected.description}</p></div></div>
            <div className="occurrence-info-grid"><div className="occurrence-info"><span className="occurrence-info-icon"><MapPin size={20} /></span><div><strong>Localização</strong><p>{selected.title}, {selected.neighborhood}</p></div></div><div className="occurrence-info"><span className="occurrence-info-icon"><UserRound size={20} /></span><div><strong>Origem</strong><p>Relato da comunidade</p></div></div></div>
            <div className="occurrence-confirmation"><Radio size={28} /><div><strong>Confirmação</strong><span>{selected.confirmation}</span></div><ChevronRight size={20} /></div>
            <div className={`occurrence-map ${showRoute ? 'show-route' : ''}`}><img src={mapaJuazeiroDoNorte} alt="Mapa ilustrativo da região da ocorrência" /><span className="occurrence-map-area" /><span className="occurrence-map-pin"><MapPin size={22} fill="currentColor" /></span>{showRoute && <span className="occurrence-route-tag">Rota ilustrativa</span>}<button type="button" onClick={() => setShowMap(true)} aria-label="Ampliar mapa"><Map size={20} /></button></div>
            <div className="occurrence-map-actions"><button type="button" onClick={() => selected.pointIndex === undefined ? setShowMap(true) : navigate(`/mapa?ponto=${selected.pointIndex}`)}><Map size={22} />Ver no mapa</button><button type="button" onClick={() => setShowRoute((current) => !current)} aria-pressed={showRoute}><Navigation size={21} />{showRoute ? 'Ocultar rota' : 'Traçar rota segura'}</button></div>
          </> : <div className="occurrence-detail-empty"><MapPin size={30} /><strong>Selecione uma ocorrência</strong><span>Escolha um relato na lista para ver os detalhes.</span></div>}
        </aside>
      </div>

      {showReport && <div className="occurrence-modal-backdrop" onClick={() => setShowReport(false)}><div className="occurrence-modal" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={(event) => event.stopPropagation()}><div className="occurrence-modal-heading"><div><h2 id="report-title">Reportar ocorrência</h2><p>Compartilhe uma situação observada em Juazeiro do Norte.</p></div><button type="button" onClick={() => setShowReport(false)} aria-label="Fechar"><X size={22} /></button></div><form onSubmit={submitReport}><label>Rua ou local<input required value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} placeholder="Ex.: Rua São Pedro" /></label><label>Bairro<input required value={reportNeighborhood} onChange={(event) => setReportNeighborhood(event.target.value)} placeholder="Ex.: Centro" /></label><label>Descrição<textarea required rows={4} value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} placeholder="Descreva o que está acontecendo..." /></label><div className="occurrence-modal-actions"><button type="button" onClick={() => setShowReport(false)}>Cancelar</button><button type="submit"><Check size={18} />Enviar relato</button></div></form></div></div>}
      {showMap && selected && <div className="occurrence-modal-backdrop" onClick={() => setShowMap(false)}><div className="occurrence-map-modal" role="dialog" aria-modal="true" aria-label={`Mapa de ${selected.title}`} onClick={(event) => event.stopPropagation()}><div className="occurrence-modal-heading"><div><h2>{selected.title}</h2><p>Localização ilustrativa · {selected.neighborhood}</p></div><button type="button" onClick={() => setShowMap(false)} aria-label="Fechar mapa"><X size={22} /></button></div><div className={`occurrence-map ${showRoute ? 'show-route' : ''}`}><img src={mapaJuazeiroDoNorte} alt="Mapa ilustrativo da região da ocorrência" /><span className="occurrence-map-area" /><span className="occurrence-map-pin"><MapPin size={25} fill="currentColor" /></span>{showRoute && <span className="occurrence-route-tag">Rota ilustrativa</span>}</div></div></div>}
    </section>
  )
}
