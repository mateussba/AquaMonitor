import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  CircleAlert,
  Droplets,
  Radio,
  Waves,
} from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import mapaJuazeiroDoNorte from '@/assets/mapa-juazeiro-do-norte.png'

// Enquanto não há dados reais, estes objetos funcionam como um pequeno banco
// local. Depois você pode trocar este array pelo resultado de uma consulta ao Supabase.
const monitoringPoints = [
  {
    name: 'Avenida Leão Sampaio',
    level: 62,
    status: 'Atenção',
    update: 'há 2 min',
    // Posição aproximada no mapa enviado, próxima ao eixo sul da cidade.
    mapPosition: { left: '38%', top: '72%' },
  },
  {
    name: 'Avenida Padre Cícero',
    level: 45,
    status: 'Normal',
    update: 'há 5 min',
    // Trecho aproximado na região do Triângulo, a oeste do centro.
    mapPosition: { left: '35%', top: '53%' },
  },
  {
    name: 'Avenida Plácido Aderaldo Castelo',
    level: 78,
    status: 'Normal',
    update: 'há 8 min',
    // Trecho aproximado de Lagoa Seca/Planalto, ao sul do centro.
    mapPosition: { left: '46%', top: '78%' },
  },
]

const alerts = [
  { point: 'Avenida Leão Sampaio', message: 'Nível de atenção atingido (60 cm)', time: '09:42', tone: 'warning' },
  { point: 'Avenida Plácido Aderaldo Castelo', message: 'Nível normalizado (78 cm)', time: '08:15', tone: 'normal' },
  { point: 'Avenida Padre Cícero', message: 'Sensor voltou a transmitir', time: '07:50', tone: 'normal' },
]

// Os pontos deste atributo formam a linha do gráfico svg. É uma solução simples
// para estudar antes de adicionar uma biblioteca como recharts ou chart.js.
const levelPath = 'M 0 132 L 35 138 L 70 120 L 105 94 L 140 103 L 175 65 L 210 20 L 245 55 L 280 50 L 315 74 L 350 68 L 385 93 L 420 90 L 455 112 L 490 116 L 525 130 L 560 143'

export function DashboardPage() {
  // useState guarda uma informação que pode mudar enquanto a página está aberta.
  // selectedPoint é o valor atual; setSelectedPoint é a função que o atualiza.
  const [selectedPoint, setSelectedPoint] = useState(0)

  // Em arrays, a contagem começa em zero. Portanto, o índice 0 representa o
  // primeiro ponto, 1 representa o segundo e assim por diante.
  const point = monitoringPoints[selectedPoint]

  function showNextPoint() {
    // O % faz a seleção voltar ao primeiro item depois do último.
    setSelectedPoint((current) => (current + 1) % monitoringPoints.length)
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Painel ambiental</p>
          <h1>Visão geral</h1>
          <p className="subtitle">Acompanhe o nível da água nos pontos da cidade.</p>
        </div>
      </header>

      <section className="overview-strip" aria-labelledby="monitoring-title">
        <h2 id="monitoring-title">Monitoramento em tempo real</h2>
        <div className="metrics-grid">
          {/* O mesmo componente é reutilizado com dados diferentes. Evita
              copiar toda a marcação visual de um cartão várias vezes. */}
          <MetricCard label="pontos monitorados" value="3" icon={<Radio size={22} />} tone="blue" />
          <MetricCard label="em atenção" value="1" icon={<AlertTriangle size={22} />} tone="amber" />
          <MetricCard label="críticos" value="0" icon={<CircleAlert size={22} />} tone="red" />
        </div>
      </section>

      <div className="dashboard-grid" id="pontos">
        <article className="panel point-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Ponto {String(selectedPoint + 1).padStart(2, '0')}</p><h2>{point.name}</h2></div>
            <button className="icon-button" type="button" onClick={showNextPoint} aria-label="Exibir próximo ponto"><ChevronRight size={20} /></button>
          </div>
          <div className="point-content">
            {/* aria-label descreve o medidor para leitores de tela. A expressão
                entre chaves permite inserir valores js dentro do JSX. */}
            <div className="water-gauge" aria-label={`Nível atual: ${point.level} centímetros`}>
              <span className="gauge-sensor"><Radio size={18} /></span>
              {/* O estilo depende do nível selecionado. Math.min limita a altura
                  a 100% para o preenchimento não escapar do medidor. */}
              <div className="water-fill" style={{ height: `${Math.min(point.level, 100)}%` }} />
              <span className="gauge-label gauge-max">100 cm</span>
              <span className="gauge-label gauge-mid">50 cm</span>
              <span className="gauge-label gauge-min">0 cm</span>
            </div>
            <div className="point-reading">
              <div><strong>{point.level}</strong><span>cm</span></div>
              <b className={`status status-${point.status.toLowerCase()}`}>{point.status}</b>
              <small>Atualizado {point.update}</small>
            </div>
          </div>
        </article>

        <article className="panel map-panel" aria-labelledby="map-title">
          <div className="panel-heading"><h2 id="map-title">Mapa dos pontos</h2><button className="text-button">Abrir mapa <ArrowRight size={15} /></button></div>
          <div className="map-placeholder" aria-label="Mapa de Juazeiro do Norte com três pontos de monitoramento selecionáveis">
            {/* A imagem foi fornecida para o projeto. Os botões são posicionados
                sobre ela por porcentagens, que acompanham o tamanho do mapa. */}
            <img className="map-image" src={mapaJuazeiroDoNorte} alt="Mapa de Juazeiro do Norte" />
            {monitoringPoints.map((item, index) => (
              <button
                type="button"
                key={item.name}
                // A classe "selected" só é incluída no marcador atualmente ativo.
                className={`map-marker ${index === selectedPoint ? 'selected' : ''}`}
                style={item.mapPosition}
                // A arrow function adia a atualização: ela só roda após o clique.
                onClick={() => setSelectedPoint(index)}
                aria-label={`Selecionar ${item.name}`}
                title={item.name}
                data-label={item.name}
              >
                <Droplets size={17} />
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="dashboard-grid lower-grid">
        <article className="panel chart-panel" id="historico">
          <div className="panel-heading"><div><h2>Nível da água</h2><p>Últimas 24 horas · em centímetros</p></div></div>
          <div className="chart-wrap" role="img" aria-label="Gráfico: nível subiu no fim da tarde e voltou a cair durante a madrugada">
            <div className="chart-scale"><span>150</span><span>100</span><span>50</span><span>0</span></div>
            <svg className="line-chart" viewBox="0 0 560 170" preserveAspectRatio="none" aria-hidden="true">
              {/* SVG desenha formas vetoriais. O primeiro path fecha uma área
                  colorida e o segundo usa os mesmos pontos para traçar a linha. */}
              <defs><linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#13a5b5" stopOpacity=".28" /><stop offset="100%" stopColor="#13a5b5" stopOpacity=".02" /></linearGradient></defs>
              <path d={`${levelPath} L 560 170 L 0 170 Z`} fill="url(#chartArea)" />
              <path d={levelPath} fill="none" stroke="#149bac" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="0" y1="70" x2="560" y2="70" className="limit-line" />
            </svg>
            <div className="chart-labels"><span>09:00</span><span>15:00</span><span>21:00</span><span>03:00</span><span>09:00</span></div>
          </div>
          <div className="chart-legend"><span><i className="legend-line attention" />Atenção: 100 cm</span><span><i className="legend-line critical" />Crítico: 150 cm</span></div>
        </article>

        <article className="panel alerts-panel" id="alertas">
          <div className="panel-heading"><div><h2>Alertas recentes</h2><p>Eventos recebidos hoje</p></div><button className="text-button">Ver todos</button></div>
          <div className="alert-list">
            {/* Esta lista também nasce de dados. Ao receber alertas do banco,
                a estrutura visual poderá continuar praticamente igual. */}
            {alerts.map((alert) => (
              <button className="alert-row" type="button" key={`${alert.point}-${alert.time}`}>
                <span className={`alert-icon ${alert.tone}`}><Waves size={18} /></span>
                <span className="alert-copy"><strong>{alert.point}</strong><small>{alert.message}</small></span>
                <time>{alert.time}</time><ChevronRight size={17} />
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
