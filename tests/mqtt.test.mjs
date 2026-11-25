import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { AquaMqttService, telemetryFresh, telemetryDelayed } from '../src/features/esp32/mqttService.ts'
import { parseTelemetry, virtualCommand, MQTT_CONFIG as config } from '../src/features/esp32/protocol.ts'
import { createInitialState, simulationReducer as reduce } from '../src/features/simulation/engine/simulation.ts'
const telemetry = (patch = {}) => ({ device:'test-esp32', reuse_requested:false, wifi_connected:true, mqtt_connected:true, seq:1, uptime_ms:1000, level_cm: 22, level_pct: 73.3, distance_cm: 8, sensor_ok: true, drain_on: true, reuse_on: false, tank_full: false, tank_empty: false, alarm: false, alarm_code: 'none', input_mode: 'sensor', ...patch })
function setup() {
  const client = new EventEmitter()
  client.connected = true
  client.subscribe = (topics, options, callback) => { client.topics = topics; callback(null, topics.map(topic => ({topic, qos: 0}))) }
  client.published = []
  client.publish = (...args) => { client.published.push(args.slice(0, 3)); args[3]?.() }
  client.options = {}
  client.end = (_force, _options, done) => { client.ended = true; done?.() }
  let calls = 0
  const service = new AquaMqttService(() => { calls++; return client })
  const receive = (t, retain = false) => client.emit('message', config.telemetry, Buffer.from(JSON.stringify(t)), { retain })
  service.start({username:'test-only',password:'not-a-real-credential'}); client.emit('connect')
  return {service, client, receive, calls: () => calls}
}
test('schema rejects malformed, partial, out-of-range and wrongly typed packets atomically', () => {
  assert.deepEqual(parseTelemetry(JSON.stringify(telemetry())), telemetry())
  for (const p of ['{', 'null', '[]', '{}', JSON.stringify(telemetry({ level_cm: 31 })), JSON.stringify(telemetry({ sensor_ok: 1 })), JSON.stringify(telemetry({ level_pct: 30 })), JSON.stringify(telemetry({ input_mode: 'unknown' }))]) assert.throws(() => parseTelemetry(p))
  assert.doesNotThrow(() => parseTelemetry(JSON.stringify(telemetry({ sensor_ok: false, distance_cm: -1 }))))
})
test('subscribes both topics, updates readings and pumps, rejects invalid/retained replays', () => {
  const {service, client, receive} = setup()
  assert.deepEqual(client.topics, [config.telemetry, config.status])
  receive(telemetry()); assert.equal(service.getSnapshot().telemetry.drain_on, true)
  receive(telemetry({level_cm: 10, level_pct:33.3, drain_on:false})); assert.equal(service.getSnapshot().telemetry.drain_on, false)
  const before = service.getSnapshot().telemetry
  receive({level_cm: 3}); assert.equal(service.getSnapshot().telemetry, before); assert.match(service.getSnapshot().error, /rejeitada/)
  receive(telemetry(), true); assert.equal(service.getSnapshot().telemetry, before)
  assert.equal(service.getSnapshot().samples.length, 2)
  service.stop()
})
test('freshness expires without allowing status online to prove fresh telemetry; reconnect resubscribes', () => {
  const {service, client, receive} = setup()
  receive(telemetry()); const at = service.getSnapshot().receivedAt
  assert.equal(telemetryFresh(service.getSnapshot(), at + config.staleMs - 1), true)
  assert.equal(telemetryFresh(service.getSnapshot(), at + config.staleMs), false)
  client.emit('message', config.status, Buffer.from('offline'), {})
  assert.equal(telemetryFresh(service.getSnapshot(), at), false)
  client.emit('message', config.status, Buffer.from('online'), {})
  assert.equal(telemetryFresh(service.getSnapshot(), at), false)
  client.emit('reconnect'); assert.equal(service.getSnapshot().connection, 'reconnecting')
  client.emit('connect'); assert.equal(service.getSnapshot().connection, 'connected')
  assert.equal(service.getSnapshot().receivedAt, null)
  receive(telemetry()); assert.equal(telemetryFresh(service.getSnapshot(), Date.now()), true)
  service.stop()
})
test('commands match firmware, are not retained/queued offline, and listeners are removed', () => {
  const {service, client, calls} = setup()
  service.start(); assert.equal(calls(), 1)
  let updates = 0; const unsubscribe = service.subscribe(() => updates++)
  const command = virtualCommand(createInitialState())
  assert.deepEqual(command, {mode:'virtual', level_cm:8, tank_full:false, tank_empty:false, reuse_requested:false, sensor_ok:true})
  assert.equal(service.publish(command), true)
  assert.deepEqual(client.published[0], [config.commands, JSON.stringify(command), {qos:0,retain:false}])
  client.emit('close'); assert.equal(service.publish(command), false)
  client.emit('error',new Error('test failure')); assert.match(service.getSnapshot().error,/Falha MQTT/)
  unsubscribe(); const count = updates
  service.stop(); assert.equal(updates,count); assert.equal(client.eventNames().length,0); assert.equal(client.ended,true)
})
test('virtual inputs never overwrite received station measurements', async () => {
  const { stationView } = await import('../src/features/esp32/stationView.ts')
  const {service, receive} = setup()
  const local = {...createInitialState(), galleryLiters:29, rain:100}
  receive(telemetry({ level_cm:10, level_pct:33.3, drain_on:false }))
  const view = stationView(local, service.getSnapshot().telemetry, true)
  assert.equal(view.galleryLiters,10)
  assert.equal(view.rain,0)
  assert.equal(view.drainage,'off')
  assert.equal(local.galleryLiters,29)
  assert.equal(stationView(local,service.getSnapshot().telemetry,false).drainage,'blocked')
  service.stop()
})
test('external pump decisions override local thresholds and reset; local mode restores autonomy', () => {
  let s = {...createInitialState(), running:true, speed:1, galleryLiters:24}
  s = reduce(s,{type:'external',value:{drainage:'off',reuse:'off'}})
  s = reduce(s,{type:'tick',seconds:10}); assert.equal(s.galleryLiters,24); assert.equal(s.drainage,'off')
  s = reduce(s,{type:'external',value:{drainage:'on',reuse:'off'}})
  s = reduce(s,{type:'reset'}); assert.equal(s.drainage,'on')
  s = reduce(s,{type:'external',value:undefined}); assert.equal(s.drainage,'off')
})

test('virtual heartbeat sends current inputs every 2 seconds during pause, stops cleanly', async context => {
  const { startCommandLoop } = await import('../src/features/esp32/commandLoop.ts')
  context.mock.timers.enable({apis:['setInterval']})
  let state = createInitialState()
  const commands = []
  const loop = startCommandLoop(command => commands.push(command), () => virtualCommand(state))
  assert.equal(commands.length,1)
  context.mock.timers.tick(2000); assert.equal(commands.length,2)
  state = {...state, galleryLiters:24, tankLiters:state.capacityLiters}
  context.mock.timers.tick(2000); assert.equal(commands.length,3)
  assert.equal(commands.at(-1).level_cm,24); assert.equal(commands.at(-1).tank_full,true)
  context.mock.timers.tick(6000); assert.equal(commands.length,6)
  loop.stop(); context.mock.timers.tick(10000); assert.equal(commands.length,6)
})

test('validates every new field and never accepts secrets or relay fields in outbound commands', async () => {
  const { encodeCommand } = await import('../src/features/esp32/protocol.ts')
  for (const patch of [{device:''},{seq:-1},{seq:1.5},{uptime_ms:'1000'},{wifi_connected:1},{mqtt_connected:null},{reuse_requested:undefined}]) assert.throws(() => parseTelemetry(JSON.stringify(telemetry(patch))))
  const inputs = {mode:'virtual',level_cm:22,tank_full:false,tank_empty:true,reuse_requested:false,sensor_ok:true}
  assert.deepEqual(JSON.parse(encodeCommand({...inputs,drain_on:true,reuse_on:true,password:'discard-me'})),inputs)
  assert.deepEqual(JSON.parse(encodeCommand({mode:'sensor',drain_on:true})),{mode:'sensor'})
})
test('requires temporary credentials, sanitizes errors, erases MQTT options and returns to sensor on stop', () => {
  let calls = 0
  const empty = new AquaMqttService(() => { calls++ })
  empty.start(); assert.equal(calls,0); assert.match(empty.getSnapshot().error,/credenciais/)
  const {service,client} = setup()
  client.options = {username:'test-only',password:'discard-me'}
  client.emit('error',new Error('discard-me'))
  assert.ok(!JSON.stringify(service.getSnapshot()).includes('discard-me'))
  client.emit('connect')
  service.publish({mode:'virtual',level_cm:22,tank_full:false,tank_empty:true,reuse_requested:false,sensor_ok:true})
  service.stop()
  assert.equal(client.options.password,undefined)
  assert.equal(client.options.username,undefined)
  assert.deepEqual(JSON.parse(client.published.at(-1)[1]),{mode:'sensor'})
  assert.equal(client.eventNames().length,0)
})

// The React render clock ticks every 250 ms; a new arrival may precede its next tick.
test('fresh arrival stays current when the render clock is one tick behind', () => {
  const {service,receive} = setup()
  receive(telemetry())
  const receivedAt = service.getSnapshot().receivedAt
  assert.equal(telemetryFresh(service.getSnapshot(),receivedAt-250),true)
  assert.equal(telemetryFresh(service.getSnapshot(),receivedAt+config.staleMs),false)
  service.stop()
})


test('gateway delay is explicit, bounded, and never overrides disconnect or replays', () => {
  const {service, client, receive} = setup()
  receive(telemetry())
  const at = service.getSnapshot().receivedAt
  assert.equal(telemetryDelayed(service.getSnapshot(), at + config.lateMs - 1), false)
  assert.equal(telemetryDelayed(service.getSnapshot(), at + config.lateMs), true)
  assert.equal(telemetryFresh(service.getSnapshot(), at + 10000), true)
  receive(telemetry({seq:2}), true)
  receive({invalid:true})
  assert.equal(service.getSnapshot().receivedAt, at)
  assert.equal(telemetryFresh(service.getSnapshot(), at + config.staleMs), false)
  assert.equal(telemetryDelayed(service.getSnapshot(), at + config.staleMs), false)
  client.emit('message', config.status, Buffer.from('offline'), {})
  assert.equal(telemetryFresh(service.getSnapshot(), at + 1000), false)
  assert.equal(telemetryDelayed(service.getSnapshot(), at + config.lateMs), false)
  client.emit('message', config.status, Buffer.from('online'), {})
  assert.equal(telemetryFresh(service.getSnapshot(), at + 1000), false)
  receive(telemetry({seq:3}))
  assert.equal(telemetryFresh(service.getSnapshot(), Date.now()), true)
  client.emit('close')
  assert.equal(telemetryFresh(service.getSnapshot(), Date.now()), false)
  service.stop()
})

test('base de tópicos: padrão preservado e base de teste opcional validada', async () => {
  const { resolveTopicBase, DEFAULT_TOPIC_BASE } = await import('../src/features/esp32/protocol.ts')
  assert.equal(config.telemetry, `${DEFAULT_TOPIC_BASE}/telemetria`)
  assert.equal(config.commands, `${DEFAULT_TOPIC_BASE}/comandos`)
  assert.equal(config.status, `${DEFAULT_TOPIC_BASE}/status`)
  assert.equal(resolveTopicBase(undefined), DEFAULT_TOPIC_BASE)
  assert.equal(resolveTopicBase(''), DEFAULT_TOPIC_BASE)
  assert.equal(resolveTopicBase(' aquamonitor/demo-29out-b741d2/wokwi '), 'aquamonitor/demo-29out-b741d2/wokwi')
  for (const unsafe of ['aquamonitor/#', 'a/+/b', '/a', 'a/', 'a//b', 'a b']) assert.equal(resolveTopicBase(unsafe), DEFAULT_TOPIC_BASE)
})

test('broker: original por padrão; broker de testes só com wss:// e sem credenciais na URL', async () => {
  const { resolveBrokerUrl, DEFAULT_BROKER_URL } = await import('../src/features/esp32/protocol.ts')
  assert.equal(config.url, DEFAULT_BROKER_URL)
  assert.equal(resolveBrokerUrl(undefined), DEFAULT_BROKER_URL)
  assert.equal(resolveBrokerUrl(''), DEFAULT_BROKER_URL)
  assert.equal(resolveBrokerUrl(' wss://abc123.ala.us-east-1.emqxsl.com:8084/mqtt '), 'wss://abc123.ala.us-east-1.emqxsl.com:8084/mqtt')
  for (const unsafe of ['ws://abc.emqxsl.com:8083/mqtt', 'mqtts://abc.emqxsl.com:8883', 'wss://user:pass@abc.emqxsl.com:8084/mqtt', 'wss://abc.emqxsl.com:8084/mqtt?password=x', 'nao-e-url']) assert.equal(resolveBrokerUrl(unsafe), DEFAULT_BROKER_URL)
})
