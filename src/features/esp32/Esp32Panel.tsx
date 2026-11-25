import { useEffect, useState } from 'react'
import { aquaMqtt, telemetryDelayed } from './mqttService'
import { DEFAULT_BROKER_URL, DEFAULT_TOPIC_BASE, MQTT_CONFIG } from './protocol'
import { useSimulation } from '../simulation/hooks/SimulationContext'
const connectionLabels = { offline: 'desconectado', connecting: 'conectando', connected: 'conectado', reconnecting: 'reconectando', error: 'falha' }
const deviceLabels = { online: 'online', offline: 'offline', unknown: 'desconhecido' }
const alarmLabels: Record<string, string> = { none: 'Nenhum', float_conflict: 'Conflito entre boias', sensor_failure: 'Falha do sensor', tank_full: 'Reservatório cheio', reuse_without_water: 'Reúso sem água' }
export function Esp32Panel() {
  const { mode, setMode, virtualInput, setVirtualInput, mqtt, fresh, virtualControls, setVirtualControls } = useSimulation()
  const t = mqtt.telemetry
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const delayed = telemetryDelayed(mqtt, now)
  const age = mqtt.receivedAt === null ? null : Math.max(0, Math.floor((now - mqtt.receivedAt) / 1000))
  const start = mqtt.samples[0]?.at ?? 0
  const duration = Math.max(1, (mqtt.samples.at(-1)?.at ?? start) - start)
  const chartPath = mqtt.samples.map((sample, i) => `${i === 0 || sample.at - mqtt.samples[i - 1].at >= 6000 ? 'M' : 'L'}${(sample.at - start) / duration * 600},${99 - sample.level / 30 * 98}`).join(' ')
  return <div className="esp32-panel">
    <label>Fonte dos dados <select aria-label="Fonte dos dados" value={mode} onChange={e => setMode(e.target.value as 'local' | 'wokwi')}><option value="local">Simulação local</option><option value="wokwi">ESP32 físico / Wokwi · Wi-Fi</option></select></label>
    {mode === 'wokwi' && <>
      <form className="mqtt-credentials" autoComplete="off" onSubmit={event => {
        event.preventDefault()
        const form = event.currentTarget
        const fields = form.elements
        const username = (fields.namedItem('mqtt-user') as HTMLInputElement).value
        const passwordInput = fields.namedItem('mqtt-password') as HTMLInputElement
        aquaMqtt.stop()
        aquaMqtt.start({ username, password: passwordInput.value })
        form.reset()
      }}>
        <label>Usuário MQTT<input name="mqtt-user" autoComplete="off" required /></label>
        <label>Senha temporária<input name="mqtt-password" type="password" autoComplete="new-password" required /></label>
        <button type="submit">Conectar ao EMQX Cloud</button>
        <button type="button" onClick={() => aquaMqtt.stop()}>Desconectar</button>
      </form>
      <p className="sim-help">Credenciais apenas na memória durante a conexão; campos limpos ao conectar. Produção requer bridge/backend autenticado.</p>
      <p className="sim-help">Broker: <code>{new URL(MQTT_CONFIG.url).host}</code>{MQTT_CONFIG.url !== DEFAULT_BROKER_URL && ' (broker de testes)'} • Tópicos MQTT: <code>{MQTT_CONFIG.topicBase}/…</code>{MQTT_CONFIG.topicBase !== DEFAULT_TOPIC_BASE && ' (base de teste, separada do protótipo físico)'}</p>
      <p role="status">Broker: {connectionLabels[mqtt.connection]} • ESP32: {deviceLabels[mqtt.deviceStatus]} • Telemetria: {fresh ? delayed ? `recebimento com atraso (${age} s)` : 'recente' : mqtt.telemetry ? `dados desatualizados (limite ${MQTT_CONFIG.staleMs / 1000} s)` : 'aguardando'}</p>
      <p role="status"><strong>{fresh ? delayed ? 'ESP32 online · aguardando próxima leitura' : 'ESP32 transmitindo' : mqtt.connection === 'connected' ? 'ESP32 desconectado ou telemetria desatualizada' : `MQTT: ${connectionLabels[mqtt.connection]}`}</strong> • Protótipo conectado por Wi-Fi • 30 cm</p>
      <label>Entrada do ESP32 <select aria-label="Entrada do ESP32" value={virtualInput ? 'virtual' : 'sensor'} onChange={e => setVirtualInput(e.target.value === 'virtual')}><option value="sensor">HC-SR04 e chaves do protótipo</option><option value="virtual">Entradas virtuais de demonstração</option></select></label>
      <p className="sim-help">{virtualInput ? 'Envio a cada 2 s. Indicadores e maquete mostram somente a resposta do ESP32. Drenagem liga a ≥20 cm e desliga a ≤12 cm, respeitando alarmes.' : 'As leituras vêm do HC-SR04 e das chaves da placa conectada por Wi-Fi. O simulador hidráulico aguarda neste modo.'} Ao sair, o firmware retorna ao sensor em até 8 s caso a conexão seja interrompida.</p>
      {virtualInput && <fieldset className="mqtt-virtual"><legend>Entradas enviadas ao ESP32</legend>
        <label>Nível solicitado: {virtualControls.level_cm.toFixed(1)} cm<input aria-label="Nível virtual solicitado" type="range" min="0" max="30" step="0.1" value={virtualControls.level_cm} onChange={e => setVirtualControls(previous => ({ ...previous, level_cm: Number(e.target.value) }))} /></label>
        {(['tank_full', 'tank_empty', 'reuse_requested', 'sensor_ok'] as const).map(key => <label key={key}><input type="checkbox" checked={virtualControls[key]} onChange={e => setVirtualControls(previous => ({ ...previous, [key]: e.target.checked }))} />{{ tank_full: 'Boia cheio', tank_empty: 'Boia vazio', reuse_requested: 'Solicitar reúso', sensor_ok: 'Sensor operacional' }[key]}</label>)}
        <small>Valores solicitados; aguarde a confirmação na telemetria. As bombas são controladas pelo ESP32.</small>
      </fieldset>}
      {mqtt.error && <p role="alert">{mqtt.error}</p>}
      {t && <><p>{fresh ? delayed ? `Última leitura há ${age} s` : 'Leitura atual' : 'Última leitura — não representa o estado atual'} • {mqtt.receivedAt ? new Date(mqtt.receivedAt).toLocaleTimeString('pt-BR') : 'aguardando nova transmissão'}</p>
        <dl className="sim-summary"><div><dt>Dispositivo / sequência</dt><dd>{t.device} / {t.seq}</dd></div><div><dt>Uptime / Wi-Fi / MQTT ESP32</dt><dd>{t.uptime_ms} ms / {String(t.wifi_connected)} / {String(t.mqtt_connected)}</dd></div><div><dt>Solicitação de reúso</dt><dd>{String(t.reuse_requested)}</dd></div><div><dt>Nível ESP32</dt><dd>{t.sensor_ok ? `${t.level_cm.toFixed(1)} cm (${t.level_pct.toFixed(1)}%)` : 'Sensor inválido'}</dd></div><div><dt>Distância</dt><dd>{t.distance_cm.toFixed(1)} cm</dd></div><div><dt>Sensor</dt><dd>{t.sensor_ok ? 'OK' : 'Falha'}</dd></div><div><dt>Drenagem / reúso</dt><dd>{fresh ? `${t.drain_on ? 'Ligada' : 'Desligada'} / ${t.reuse_on ? 'Ligada' : 'Desligada'}` : 'Desconhecidos'}</dd></div><div><dt>Boias cheio / vazio</dt><dd>{String(t.tank_full)} / {String(t.tank_empty)}</dd></div><div><dt>Entrada confirmada</dt><dd>{t.input_mode}</dd></div></dl>
        {fresh && t.input_mode !== (virtualInput ? 'virtual' : 'sensor') && <p role="alert">Aguardando o ESP32 confirmar a entrada selecionada.</p>}
        <p role={t.alarm ? 'alert' : 'status'}>Alarme ESP32: {t.alarm ? alarmLabels[t.alarm_code] ?? t.alarm_code : 'Nenhum'} • código: {t.alarm_code}</p>
      </>}
      <p className="sim-help">Último comando transmitido: {mqtt.lastCommandAt ? new Date(mqtt.lastCommandAt).toLocaleTimeString('pt-BR') : 'nenhum'} (a confirmação da entrada vem na telemetria).</p>
      {mqtt.samples.length > 0 && <figure className="esp32-chart"><figcaption>Nível recebido do ESP32 • últimas {mqtt.samples.length} amostras • escala 0–30 cm</figcaption><svg viewBox="0 0 600 100" role="img" aria-label="Evolução do nível da estação virtual ESP32, de zero a trinta centímetros"><path d="M0 1H600M0 99H600" stroke="#c4dce3" /><path fill="none" stroke="#0789b0" strokeWidth="2" d={chartPath} /></svg><small>Histórico da sessão; lacunas maiores que 6 s indicam atraso de recebimento. {fresh ? 'Recebendo' : 'Sem dados atuais'}</small></figure>}
    </>}
  </div>
}
