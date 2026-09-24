export type Trend = 'rising' | 'falling' | 'stable'

export type MonitoringPoint = {
  name: string
  shortName: string
  level: number
  status: 'Atenção' | 'Normal'
  trend: Trend
  update: string
  mapPosition: { left: string; top: string }
}

export const monitoringPoints: MonitoringPoint[] = [
  { name: 'Avenida Leão Sampaio', shortName: 'Avenida Leão Sampaio', level: 62, status: 'Atenção', trend: 'rising', update: 'há 2 min', mapPosition: { left: '38%', top: '72%' } },
  { name: 'Avenida Plácido Aderaldo Castelo', shortName: 'Av. Plácido Aderaldo Castelo', level: 38, status: 'Normal', trend: 'falling', update: 'há 1 min', mapPosition: { left: '46%', top: '78%' } },
  { name: 'Avenida Padre Cícero', shortName: 'Avenida Padre Cícero', level: 21, status: 'Normal', trend: 'stable', update: 'agora', mapPosition: { left: '35%', top: '53%' } },
]
