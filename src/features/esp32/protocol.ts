export const DEFAULT_TOPIC_BASE = 'aquamonitor/demo-29out-b741d2'
/** Optional test namespace (e.g. Wokwi apart from the physical board). Never a secret. */
export function resolveTopicBase(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  return /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/.test(value) && value.length <= 120 ? value : DEFAULT_TOPIC_BASE
}
export const DEFAULT_BROKER_URL = 'wss://d684655e.ala.us-east-1.emqxsl.com:8084/mqtt'
/** Optional test broker (e.g. your own EMQX Cloud Serverless). Only secure WebSocket URLs; never credentials. */
export function resolveBrokerUrl(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  try {
    const url = new URL(value)
    if (url.protocol === 'wss:' && url.hostname && !url.username && !url.password && !url.search && !url.hash && value.length <= 200) return value
  } catch { /* invalid or empty: keep the original broker */ }
  return DEFAULT_BROKER_URL
}
const env = (import.meta as { env?: Record<string, unknown> }).env
const topicBase = resolveTopicBase(env?.VITE_MQTT_TOPIC_BASE)
export const MQTT_CONFIG = {
  url: resolveBrokerUrl(env?.VITE_MQTT_URL),
  topicBase,
  telemetry: `${topicBase}/telemetria`,
  commands: `${topicBase}/comandos`,
  status: `${topicBase}/status`,
  lateMs: 6000,
  staleMs: 15000,
  commandIntervalMs: 2000,
} as const
export interface Telemetry {
  device: string; reuse_requested: boolean; wifi_connected: boolean; mqtt_connected: boolean
  seq: number; uptime_ms: number
  level_cm: number; level_pct: number; distance_cm: number
  sensor_ok: boolean; drain_on: boolean; reuse_on: boolean
  tank_full: boolean; tank_empty: boolean; alarm: boolean
  alarm_code: string; input_mode: 'virtual' | 'sensor'
}
export interface VirtualCommand {
  mode: 'virtual'; level_cm: number; tank_full: boolean; tank_empty: boolean
  reuse_requested: boolean; sensor_ok: boolean
}
export type Command = VirtualCommand | { mode: 'sensor' }
export function parseTelemetry(raw: string): Telemetry {
  const p = JSON.parse(raw)
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('Pacote não é um objeto')
  for (const key of ['sensor_ok', 'drain_on', 'reuse_on', 'tank_full', 'tank_empty', 'alarm', 'reuse_requested', 'wifi_connected', 'mqtt_connected']) {
    if (typeof p[key] !== 'boolean') throw new Error(`Campo inválido: ${key}`)
  }
  for (const [key, min, max] of [['level_cm', 0, 30], ['level_pct', 0, 100], ['distance_cm', -1, 1000]] as const) {
    if (typeof p[key] !== 'number' || !Number.isFinite(p[key]) || p[key] < min || p[key] > max) throw new Error(`Campo inválido: ${key}`)
  }
  if (typeof p.device !== 'string' || !p.device.trim() || p.device.length > 128) throw new Error('Device inválido')
  for (const key of ['seq', 'uptime_ms']) {
    if (!Number.isSafeInteger(p[key]) || p[key] < 0 || p[key] > 4294967295) throw new Error(`Campo inválido: ${key}`)
  }
  if (Math.abs(p.level_pct - p.level_cm / 30 * 100) > 0.5) throw new Error('Percentual incompatível com nível')
  if (!['sensor', 'virtual'].includes(p.input_mode) || typeof p.alarm_code !== 'string' || p.alarm_code.length > 80) throw new Error('Modo ou alarme inválido')
  return p as Telemetry
}
export function virtualCommand(s: { galleryLiters: number; tankLiters: number; capacityLiters: number; reuseRequested: boolean; sensorFault: boolean }): VirtualCommand {
  return { mode: 'virtual', level_cm: Math.min(30, Math.max(0, s.galleryLiters)), tank_full: s.tankLiters >= s.capacityLiters - 1e-9, tank_empty: s.tankLiters <= 1e-9, reuse_requested: s.reuseRequested, sensor_ok: !s.sensorFault }
}

/** Runtime allowlist: UI inputs can never become direct relay commands. */
export function encodeCommand(command: Command): string {
  if (command.mode === 'sensor') return JSON.stringify({ mode: 'sensor' })
  if (command.mode !== 'virtual' || !Number.isFinite(command.level_cm) || command.level_cm < 0 || command.level_cm > 30) throw new Error('Nível virtual inválido')
  for (const key of ['tank_full', 'tank_empty', 'reuse_requested', 'sensor_ok'] as const) {
    if (typeof command[key] !== 'boolean') throw new Error('Entrada virtual inválida')
  }
  return JSON.stringify({ mode: 'virtual', level_cm: command.level_cm, tank_full: command.tank_full, tank_empty: command.tank_empty, reuse_requested: command.reuse_requested, sensor_ok: command.sensor_ok })
}
