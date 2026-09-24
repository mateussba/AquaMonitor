import { useEffect, useState } from 'react'
import { Bell, Check, ChevronDown, Clock3, Map, MapPin, Radio, Settings2, ShieldCheck, UserRound, Waves, WifiOff, CircleAlert, TriangleAlert, LocateFixed, Eye, LockKeyhole, SlidersHorizontal } from 'lucide-react'
import { monitoringPoints } from '@/features/dashboard/data/monitoringPoints'
import '@/styles/settings.css'

type Section = 'notifications' | 'points' | 'map' | 'privacy' | 'account' | 'sensors' | 'rules'
type AlertType = 'critical' | 'attention' | 'normalized' | 'offline'
type Interest = 'all' | 'followed' | 'nearby'
type SettingsState = {
  alerts: Record<AlertType, boolean>
  interest: Interest
  radius: string
  followedPoints: string[]
  scheduleStart: string
  scheduleEnd: string
  scheduleEnabled: boolean
  mapLabels: boolean
  mapCoverage: boolean
  shareLocation: boolean
  publicProfile: boolean
  criticalLevel: number
  attentionLevel: number
}

const storageKey = 'aquamonitor-settings'
const initialSettings: SettingsState = {
  alerts: { critical: true, attention: true, normalized: true, offline: false },
  interest: 'followed', radius: '2',
  followedPoints: monitoringPoints.map((point) => point.name),
  scheduleStart: '00:00', scheduleEnd: '23:59', scheduleEnabled: true,
  mapLabels: true, mapCoverage: true, shareLocation: false, publicProfile: false,
  criticalLevel: 100, attentionLevel: 60,
}
const menu = [
  { group: 'Geral', items: [
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'points', label: 'Pontos acompanhados', icon: MapPin },
    { id: 'map', label: 'Mapa', icon: Map },
    { id: 'privacy', label: 'Privacidade', icon: ShieldCheck },
    { id: 'account', label: 'Conta', icon: UserRound },
  ] },
  { group: 'Administração', items: [
    { id: 'sensors', label: 'Sensores e pontos', icon: Radio },
    { id: 'rules', label: 'Regras de alerta', icon: Settings2 },
  ] },
] as const
const alertOptions = [
  { id: 'critical', title: 'Nível crítico', description: 'Quando o nível da água atinge o limite crítico.', icon: CircleAlert },
  { id: 'attention', title: 'Nível de atenção', description: 'Quando o nível da água atinge o limite de atenção.', icon: TriangleAlert },
  { id: 'normalized', title: 'Normalização', description: 'Quando o nível volta para a situação normal.', icon: Check },
  { id: 'offline', title: 'Sensor offline', description: 'Quando o sensor fica sem comunicação.', icon: WifiOff },
] as const

function loadSettings(): SettingsState {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return initialSettings
    const parsed = JSON.parse(saved) as Partial<SettingsState>
    return { ...initialSettings, ...parsed, alerts: { ...initialSettings.alerts, ...parsed.alerts } }
  } catch { return initialSettings }
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" className={`settings-toggle ${checked ? 'on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={onChange}><span /></button>
}

export function SettingsPage() {
  const [section, setSection] = useState<Section>('notifications')
  const [settings, setSettings] = useState<SettingsState>(loadSettings)
  const [editingSchedule, setEditingSchedule] = useState(false)
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(settings)) }, [settings])

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((current) => ({ ...current, [key]: value }))
  }
  function toggleAlert(type: AlertType) {
    setSettings((current) => ({ ...current, alerts: { ...current.alerts, [type]: !current.alerts[type] } }))
  }
  function togglePoint(name: string) {
    setSettings((current) => ({ ...current, followedPoints: current.followedPoints.includes(name)
      ? current.followedPoints.filter((point) => point !== name)
      : [...current.followedPoints, name] }))
  }
  const activeTitle = menu.flatMap((group) => group.items).find((item) => item.id === section)?.label ?? 'Configurações'
  const descriptions: Record<Section, string> = {
    notifications: 'Escolha quando e como deseja ser avisado sobre os eventos do AquaMonitor.',
    points: 'Escolha os pontos que deseja acompanhar de perto.',
    map: 'Personalize as informações exibidas no mapa.',
    privacy: 'Controle o uso da sua localização e visibilidade do perfil.',
    account: 'Veja as informações da sua conta.',
    sensors: 'Acompanhe os sensores disponíveis no painel.',
    rules: 'Defina os limites usados nos avisos de nível da água.',
  }

  return <section className="page settings-page">
    <header className="settings-page-header"><h1>Configurações</h1><p>Gerencie suas preferências e o funcionamento do AquaMonitor.</p></header>
    <div className="settings-layout">
      <nav className="settings-menu" aria-label="Seções de configurações">
        {menu.map((group) => <div className="settings-menu-group" key={group.group}>
          <span className="settings-menu-title">{group.group}</span>
          {group.items.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={section === id ? 'active' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}><Icon size={19} /><span>{label}</span></button>)}
        </div>)}
      </nav>
      <div className="settings-main">
        <div className="settings-main-header"><div><h2>{activeTitle}</h2><p>{descriptions[section]}</p></div>{section === 'notifications' && <span className="settings-status"><Check size={14} /> Preferências ativas</span>}</div>

        {section === 'notifications' && <div className="settings-notification-grid">
          <div className="settings-card"><h3>Tipos de notificação</h3><div className="settings-option-list">
            {alertOptions.map(({ id, title, description, icon: Icon }) => <div className="settings-alert-row" key={id}><span className={`settings-alert-icon ${id}`}><Icon size={19} /></span><span className="settings-option-copy"><strong>{title}</strong><small>{description}</small></span><Toggle checked={settings.alerts[id]} onChange={() => toggleAlert(id)} label={`${title}: ${settings.alerts[id] ? 'ativado' : 'desativado'}`} /></div>)}
          </div></div>
          <div className="settings-right-stack"><div className="settings-card"><h3>Área de interesse</h3><div className="settings-radio-list">
            <label><input type="radio" name="interest" checked={settings.interest === 'all'} onChange={() => update('interest', 'all')} /><span><strong>Todos os pontos da cidade</strong><small>Receba alertas de qualquer ponto monitorado.</small></span></label>
            <label><input type="radio" name="interest" checked={settings.interest === 'followed'} onChange={() => update('interest', 'followed')} /><span><strong>Somente pontos acompanhados</strong><small>Receba alertas apenas dos pontos que você segue.</small></span></label>
            <label><input type="radio" name="interest" checked={settings.interest === 'nearby'} onChange={() => update('interest', 'nearby')} /><span><strong>Pontos próximos da minha localização</strong><small>Receba alertas em um raio de:</small><span className="settings-radius"><select value={settings.radius} disabled={settings.interest !== 'nearby'} onChange={(event) => update('radius', event.target.value)} aria-label="Raio de interesse"><option value="1">1 km</option><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option></select><ChevronDown size={15} /></span></span></label>
          </div></div>
          <div className="settings-card settings-schedule"><Clock3 size={21} /><div><h3>Horário de recebimento</h3><p>{settings.scheduleEnabled ? <>Receber notificações todos os dias<br />das <strong>{settings.scheduleStart}</strong> às <strong>{settings.scheduleEnd}</strong></> : 'Notificações pausadas'}</p></div><button type="button" className="settings-outline-button" onClick={() => setEditingSchedule((value) => !value)}>{editingSchedule ? 'Concluir' : 'Alterar'}</button>
            {editingSchedule && <div className="settings-schedule-editor"><label>Início<input type="time" value={settings.scheduleStart} onChange={(event) => update('scheduleStart', event.target.value)} /></label><label>Fim<input type="time" value={settings.scheduleEnd} onChange={(event) => update('scheduleEnd', event.target.value)} /></label><label className="settings-schedule-enabled"><input type="checkbox" checked={settings.scheduleEnabled} onChange={(event) => update('scheduleEnabled', event.target.checked)} /> Receber notificações</label></div>}
          </div></div>
        </div>}

        {section === 'points' && <div className="settings-card settings-wide-card"><div className="settings-card-heading"><h3>Pontos monitorados</h3><span>{settings.followedPoints.length} de {monitoringPoints.length} acompanhados</span></div><div className="settings-point-list">{monitoringPoints.map((point) => <label className="settings-point-row" key={point.name}><span className="settings-point-icon"><MapPin size={20} /></span><span><strong>{point.name}</strong><small>Nível atual: {point.level} cm · {point.status}</small></span><input type="checkbox" checked={settings.followedPoints.includes(point.name)} onChange={() => togglePoint(point.name)} /></label>)}</div></div>}

        {section === 'map' && <div className="settings-card settings-wide-card"><h3>Exibição do mapa</h3><div className="settings-choice-row"><span className="settings-choice-icon"><MapPin size={20} /></span><span className="settings-option-copy"><strong>Nomes dos pontos</strong><small>Mostrar os nomes junto aos marcadores.</small></span><Toggle checked={settings.mapLabels} onChange={() => update('mapLabels', !settings.mapLabels)} label="Mostrar nomes dos pontos" /></div><div className="settings-choice-row"><span className="settings-choice-icon"><Waves size={20} /></span><span className="settings-option-copy"><strong>Áreas de cobertura</strong><small>Mostrar a região acompanhada pelos sensores.</small></span><Toggle checked={settings.mapCoverage} onChange={() => update('mapCoverage', !settings.mapCoverage)} label="Mostrar áreas de cobertura" /></div></div>}

        {section === 'privacy' && <div className="settings-card settings-wide-card"><h3>Suas preferências</h3><div className="settings-choice-row"><span className="settings-choice-icon"><LocateFixed size={20} /></span><span className="settings-option-copy"><strong>Usar minha localização</strong><small>Permite encontrar pontos próximos quando essa área de interesse estiver selecionada.</small></span><Toggle checked={settings.shareLocation} onChange={() => update('shareLocation', !settings.shareLocation)} label="Usar minha localização" /></div><div className="settings-choice-row"><span className="settings-choice-icon"><Eye size={20} /></span><span className="settings-option-copy"><strong>Perfil visível</strong><small>Mostrar seu nome nos relatos enviados à comunidade.</small></span><Toggle checked={settings.publicProfile} onChange={() => update('publicProfile', !settings.publicProfile)} label="Perfil visível" /></div></div>}

        {section === 'account' && <div className="settings-card settings-wide-card"><h3>Informações da conta</h3><div className="settings-account"><span className="settings-account-avatar"><UserRound size={26} /></span><div><strong>Usuário</strong><small>Visualização geral</small></div></div><div className="settings-info-note"><LockKeyhole size={18} /><span>Os dados de conta estarão disponíveis quando a autenticação for conectada.</span></div></div>}

        {section === 'sensors' && <div className="settings-card settings-wide-card"><div className="settings-card-heading"><h3>Sensores e pontos</h3><span className="settings-online-dot">3 online</span></div><div className="settings-point-list">{monitoringPoints.map((point, index) => <div className="settings-point-row" key={point.name}><span className="settings-point-icon"><Radio size={20} /></span><span><strong>{point.name}</strong><small>Ponto 0{index + 1} · Nível atual: {point.level} cm</small></span><span className="settings-sensor-online">Online</span></div>)}</div></div>}

        {section === 'rules' && <div className="settings-card settings-wide-card"><h3>Limites de alerta</h3><p className="settings-card-description">Defina os níveis exibidos nos avisos deste painel.</p><div className="settings-rule-row"><span className="settings-alert-icon attention"><TriangleAlert size={19} /></span><label><strong>Nível de atenção</strong><small>Primeiro aviso de elevação do nível.</small></label><div className="settings-number-field"><input type="number" min="0" max={settings.criticalLevel - 1} value={settings.attentionLevel} onChange={(event) => update('attentionLevel', Number(event.target.value))} aria-label="Nível de atenção" /><span>cm</span></div></div><div className="settings-rule-row"><span className="settings-alert-icon critical"><CircleAlert size={19} /></span><label><strong>Nível crítico</strong><small>Água em patamar de risco.</small></label><div className="settings-number-field"><input type="number" min={settings.attentionLevel + 1} value={settings.criticalLevel} onChange={(event) => update('criticalLevel', Number(event.target.value))} aria-label="Nível crítico" /><span>cm</span></div></div><div className="settings-info-note"><SlidersHorizontal size={18} /><span>Valores ilustrativos até a conexão das regras com os sensores.</span></div></div>}
      </div>
    </div>
  </section>
}
