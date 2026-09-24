export type HistoryTone = 'critical' | 'attention' | 'normalized' | 'technical'

export type HistoryTimelineItem = {
  time: string
  title: string
  description: string
  tone: HistoryTone
}

export type HistoryEvent = {
  id: string
  group: 'Hoje' | 'Ontem' | '22 de setembro'
  groupDate: string
  pointId: string
  point: string
  location: string
  tone: HistoryTone
  status: string
  summary: string
  start: string
  end: string
  duration: string
  maximum: number | null
  current: number | null
  chart: number[]
  timeline: HistoryTimelineItem[]
}

export const historyEvents: HistoryEvent[] = [
  {
    id: 'evt-001', group: 'Hoje', groupDate: '24 de setembro de 2026', pointId: 'point-01', point: 'Avenida Leão Sampaio', location: 'PONTO 01 · Centro', tone: 'critical', status: 'Crítico', summary: 'Incidente crítico encerrado', start: '13:02', end: '14:08', duration: '1h06min', maximum: 112, current: 42,
    chart: [12, 18, 62, 96, 112, 94, 48, 35, 24],
    timeline: [
      { time: '13:02', title: 'Entrou em atenção', description: 'Nível atingiu 60 cm.', tone: 'attention' },
      { time: '13:17', title: 'Entrou em nível crítico', description: 'Nível ultrapassou 100 cm.', tone: 'critical' },
      { time: '13:34', title: 'Nível máximo: 112 cm', description: 'Maior nível registrado durante o incidente.', tone: 'critical' },
      { time: '14:08', title: 'Situação normalizada', description: 'Nível voltou para 42 cm.', tone: 'normalized' },
    ],
  },
  {
    id: 'evt-002', group: 'Hoje', groupDate: '24 de setembro de 2026', pointId: 'point-02', point: 'Av. Plácido A. Castelo', location: 'PONTO 02 · Triângulo', tone: 'attention', status: 'Atenção', summary: 'Entrou em atenção', start: '09:18', end: '09:47', duration: '29 min', maximum: 68, current: 38,
    chart: [19, 26, 44, 61, 68, 55, 43, 38],
    timeline: [
      { time: '09:18', title: 'Nível em elevação', description: 'Sensor registrou subida constante.', tone: 'attention' },
      { time: '09:31', title: 'Nível máximo: 68 cm', description: 'Pico registrado no período.', tone: 'attention' },
      { time: '09:47', title: 'Nível em queda', description: 'Ponto retornando à faixa segura.', tone: 'normalized' },
    ],
  },
  {
    id: 'evt-003', group: 'Hoje', groupDate: '24 de setembro de 2026', pointId: 'point-03', point: 'Avenida Padre Cícero', location: 'PONTO 03 · Lagoa Seca', tone: 'technical', status: 'Técnico', summary: 'Sensor ficou offline', start: '18:21', end: '18:34', duration: '13 min', maximum: null, current: 21,
    chart: [28, 27, 26, 0, 0, 24, 22, 21],
    timeline: [
      { time: '18:21', title: 'Comunicação interrompida', description: 'Sensor parou de enviar leituras.', tone: 'technical' },
      { time: '18:34', title: 'Comunicação restabelecida', description: 'Transmissão de dados normalizada.', tone: 'normalized' },
    ],
  },
  {
    id: 'evt-004', group: 'Ontem', groupDate: '23 de setembro de 2026', pointId: 'point-04', point: 'Rua José de Alencar', location: 'PONTO 04 · Salesianos', tone: 'normalized', status: 'Normalizado', summary: 'Situação normalizada', start: '08:05', end: '08:41', duration: '36 min', maximum: 44, current: 18,
    chart: [21, 28, 36, 44, 39, 31, 22, 18],
    timeline: [
      { time: '08:05', title: 'Elevação identificada', description: 'Nível começou a subir.', tone: 'attention' },
      { time: '08:22', title: 'Nível máximo: 44 cm', description: 'Pico dentro da faixa segura.', tone: 'attention' },
      { time: '08:41', title: 'Situação normalizada', description: 'Leitura estabilizada.', tone: 'normalized' },
    ],
  },
  {
    id: 'evt-005', group: 'Ontem', groupDate: '23 de setembro de 2026', pointId: 'point-01', point: 'Avenida Leão Sampaio', location: 'PONTO 01 · Centro', tone: 'attention', status: 'Atenção', summary: 'Chuva elevou o nível do ponto', start: '16:12', end: '16:54', duration: '42 min', maximum: 73, current: 35,
    chart: [25, 34, 49, 66, 73, 57, 41, 35],
    timeline: [
      { time: '16:12', title: 'Entrou em atenção', description: 'Nível atingiu 60 cm.', tone: 'attention' },
      { time: '16:32', title: 'Nível máximo: 73 cm', description: 'Maior leitura do evento.', tone: 'attention' },
      { time: '16:54', title: 'Faixa segura', description: 'Nível continuou em queda.', tone: 'normalized' },
    ],
  },
  {
    id: 'evt-006', group: '22 de setembro', groupDate: '22 de setembro de 2026', pointId: 'point-02', point: 'Av. Plácido A. Castelo', location: 'PONTO 02 · Triângulo', tone: 'normalized', status: 'Normalizado', summary: 'Oscilação sem risco', start: '11:20', end: '11:48', duration: '28 min', maximum: 51, current: 29,
    chart: [26, 33, 41, 51, 47, 38, 29],
    timeline: [
      { time: '11:20', title: 'Oscilação detectada', description: 'Aumento rápido na leitura.', tone: 'attention' },
      { time: '11:48', title: 'Leitura estabilizada', description: 'Sem risco para a região.', tone: 'normalized' },
    ],
  },
]

export const historyPoints = [
  { id: 'all', label: 'Todos os pontos' },
  { id: 'point-01', label: 'Avenida Leão Sampaio' },
  { id: 'point-02', label: 'Av. Plácido A. Castelo' },
  { id: 'point-03', label: 'Avenida Padre Cícero' },
  { id: 'point-04', label: 'Rua José de Alencar' },
]
