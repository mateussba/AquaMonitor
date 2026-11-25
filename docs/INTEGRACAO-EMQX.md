# AquaMonitor — integração EMQX Cloud

## Executar

```bash
cd "/home/mateus/Downloads/Aquaonitor"
npm ci
npm run dev
```

Abra http://localhost:5173. O dashboard usa uma única instância `aquaMqtt` dentro do `SimulationProvider`, preservado entre rotas. A maquete em `/prototype/index.html?source=dashboard&embed=true` acompanha o mesmo snapshot pelo `BroadcastChannel`; ela não conecta ao broker nesse modo. O serviço não transfere credenciais pelo canal.

O `predev`/`prebuild` compila a pasta integrada `prototype-3d`. Alterações posteriores nessa pasta exigem `npm --prefix prototype-3d run build` enquanto o Vite principal está aberto. A cópia independente fica em `/home/mateus/Downloads/prototype aqau` e pode rodar seu próprio `npm run dev -- --port 5174`. As duas cópias mantêm os módulos MQTT equivalentes; a integrada conserva seu adaptador, controles Dashboard e modo incorporado.

## Conexão e segurança

- Broker: `wss://d684655e.ala.us-east-1.emqxsl.com:8084/mqtt`.
- Assinaturas: `aquamonitor/demo-29out-b741d2/telemetria` e `/status`.
- Publicação: `aquamonitor/demo-29out-b741d2/comandos`, QoS 0, não retido, sem fila de comandos offline.
- MQTT.js com clientId UUID, sessão limpa, reconexão em 2 s e reinscrição depois de cada conexão; falhas de assinatura são apresentadas na interface.
- Selecione ESP32/Wokwi e insira usuário/senha temporários na interface. Os campos são limpos após conectar. A senha só permanece nas opções do cliente em memória para a reconexão durante a sessão; é removida ao desconectar. Não há persistência, logs, senha em fonte, VITE_, NEXT_PUBLIC_, URL ou BroadcastChannel.
- Mensagens de erro MQTT são sanitizadas. Não envie credenciais pelo chat ou inclua-as nos testes/documentação.
- Em produção é necessário um **bridge/backend autenticado**: o browser deve autenticar no backend, que mantém o segredo MQTT no servidor, valida comandos, autoriza acesso por dispositivo e retransmite telemetria por WS/SSE. Não distribuir uma senha de produção no bundle.

## Fontes e animação

A simulação local conserva o motor hidráulico, chuva, pausa, velocidades, proteções e balanço de volumes. No modo ESP32/Wokwi esse motor fica parado: nível, bombas, alarmes e entradas confirmadas vêm exclusivamente do JSON recebido, mesmo quando as entradas virtuais estão selecionadas. As entradas solicitadas são separadas do estado exibido; não há cálculo local das decisões do ESP32.

Validação atômica dos campos `device`, `input_mode`, `level_cm`, `level_pct`, `distance_cm`, `tank_full`, `tank_empty`, `reuse_requested`, `sensor_ok`, `drain_on`, `reuse_on`, `alarm`, `alarm_code`, `wifi_connected`, `mqtt_connected`, `seq`, `uptime_ms`: tipos, números finitos, faixas, inteiros não negativos e coerência cm/percentual em 30 cm. JSON inválido, parcial ou telemetria retida não renova a última leitura. Falha do sensor é uma telemetria válida de falha, mas não gera uma amostra de medição no gráfico.

Broker conectado, ESP32 online e telemetria recente são estados distintos. `online` retido não prova que há telemetria atual. Ao completar 6 s sem JSON válido, indicadores ficam desatualizados e os fluxos param; os gráficos preservam o histórico da sessão e suas lacunas. Desconexão/status offline invalidam a atualidade imediatamente.

O dashboard preserva seu layout: no modo local mantém os dados urbanos de demonstração; no modo Wokwi seus cartões, tabela, gráfico e alertas apresentam a única galeria ESP32. O nível corresponde à escala de 30 cm da galeria e à representação associada na maquete existente. `drain_on` anima bomba e tubulação diretamente até a barragem; `reuse_on` anima o circuito de reúso. A cena não recebeu reservatório ou bomba adicionais. O JSON não mede volume da barragem: a UI informa “não medido” e o 3D não inventa água armazenada a partir de integrações ou boias.

## Comandos

Selecione **Entradas virtuais de demonstração**; valores iniciais:

```json
{"mode":"virtual","level_cm":22,"tank_full":false,"tank_empty":true,"reuse_requested":false,"sensor_ok":true}
```

A UI altera nível e flags; publica imediatamente ao ativar a entrada e repete a cada 2 s com os valores atuais. Ao selecionar sensor, sair do modo Wokwi, desconectar ou desmontar a aplicação, limpa o intervalo e tenta publicar `{"mode":"sensor"}` antes do fechamento. Sem rede, não é possível garantir a entrega: o timeout de 8 s já existente no firmware é a proteção de retorno. Navegadores podem suspender timers em segundo plano; ao retornar à aba, as entradas são reenviadas e a confirmação deve ser verificada em `input_mode`.

A serialização usa uma lista explícita dos campos permitidos; `drain_on` e `reuse_on` nunca são enviados como comandos. O controlador ESP32 decide drenagem com histerese ≥20 cm / ≤12 cm e suas proteções. Nenhum arquivo do firmware foi alterado.

## Roteiro ao vivo

1. Inicie o ESP32 no Wokwi, mantendo o firmware MQTT TLS 8883 atual.
2. No dashboard escolha ESP32/Wokwi, informe as credenciais temporárias com permissão de assinatura em telemetria/status e publicação em comandos, e conecte.
3. Confira separadamente broker conectado, ESP32 online e telemetria recente; verifique device/seq/uptime. Navegue para Simulação sem recarregar para manter a sessão.
4. Abra “Conexão ESP32, alarmes e histórico” e escolha entradas virtuais. Com 22 cm, cheio=false, vazio=true, reúso=false e sensor_ok=true, aguarde `input_mode=virtual` e a decisão de drenagem. Compare nível/alertas no dashboard e animação da bomba/tubulação na maquete.
5. Peça 16 cm: drenagem mantém o estado por histerese; peça 12 cm: deve desligar. Teste sensor_ok=false e boia cheio, conferindo a proteção enviada pelo ESP32. Para testar reúso, configure vazio=false e reuse_requested=true.
6. Selecione sensor: confira `input_mode=sensor`. Volte a virtual e depois à simulação local para verificar retorno ao sensor e preservação offline. Interrompa o Wokwi: após 6 s sem telemetria válida os estados devem indicar dados desatualizados e as animações parar.
7. Mantenha uma única aba controladora; múltiplas abas podem disputar os mesmos tópicos. O firmware confirma modo/estado por telemetria e não oferece ACK individual por comando.

## Verificação automatizada

```bash
# Aplicação principal: tipos, build da maquete + React, lint e testes
npm run build
npm run lint
npm test
# Protótipo integrado
npm --prefix prototype-3d test
# Protótipo independente
cd "/home/mateus/Downloads/prototype aqau"
npm run build
npm test
```

`tests/mqttTransport.test.mjs` exercita MQTT.js real sobre um broker MQTT/WebSocket de teste limitado a localhost: conectar, assinar, receber JSON, projetar o estado do dashboard, compartilhar com o controlador Three.js, ativar partículas, publicar comando, receber nova telemetria, observar histerese/proteções emuladas e devolver ao sensor ao desconectar. O teste de transporte usa WS local; a configuração de produção permanece WSS com validação TLS normal. Não é uma execução real do firmware ou do EMQX Cloud. Os demais testes cobrem contrato completo, pacotes inválidos/retidos, expiração, reconexão, limpeza e separação das entradas virtuais.

O ensaio real com EMQX Cloud/Wokwi requer as credenciais inseridas na interface. Sem isso, testes locais não comprovam autenticação, ACL ou firmware remoto. O build pode informar aviso não bloqueante de bundles maiores que 500 kB.

## Arquivos desta integração

Na aplicação principal (`/home/mateus/Downloads/Aquaonitor`):

- `src/features/esp32/protocol.ts`, `mqttService.ts`, `Esp32Panel.tsx`, `useStationView.ts`, novo `stationView.ts`.
- `src/features/simulation/components/SimulationProvider.tsx`, `SimulationChart.tsx`, `VirtualMonitoring.tsx`; `hooks/SimulationContext.ts`; `pages/SimulationPage.tsx`; `styles/simulation.css`.
- `src/features/dashboard/pages/DashboardPage.tsx`, `src/styles/dashboard.css`, `src/components/layout/AppShell.tsx` (status lateral e contagem de alarmes acompanham o ESP32).
- `tests/mqtt.test.mjs`, novo `tests/mqttTransport.test.mjs`.
- `package.json`, `package-lock.json` (dependências de teste ws/mqtt-packet), `README.md`, este documento.

Nas duas pastas de protótipo (`prototype-3d` integrada e `prototype aqau` independente):

- `src/features/esp32/protocol.ts`, `mqttService.ts`; `src/mqtt/mqttClient.js`.
- `src/main.js`; `src/simulation/SimulationController.js`.
- `src/ui/Controls.js`, novo `src/ui/MqttSession.js`; `src/styles/main.css`.
- `src/scene/SceneManager.js` (visibilidade de água sem medição; a cena existente foi preservada).
- `tests/simulation.test.mjs`, `README.md`.
- Somente na integrada: `src/simulation/DashboardSimulationController.js`, preservando o adaptador e encaminhando as operações do serviço para o modo MQTT direto.

As pastas já continham alterações locais anteriores. Esta integração não reverteu esses trabalhos nem modificou firmware.

## Resultado da validação local (29/10/2026)

Builds da aplicação principal e das duas maquetes passaram; lint da aplicação passou. Testes: 22 na aplicação, 26 na maquete integrada e 23 na independente. O Vite serviu a maquete compilada com o endpoint EMQX Cloud correto; o formulário e a ausência de leituras sem conexão foram inspecionados no navegador. O teste de transporte completo usa broker/ESP32 emulados em localhost. A autenticação e a telemetria do EMQX Cloud/Wokwi real ainda dependem das credenciais temporárias inseridas pela interface.

## Verificação no EMQX Cloud (29/10/2026)

Autenticação WSS realizada pela interface com credenciais temporárias fornecidas pelo usuário, sem gravação em arquivos. O dashboard confirmou as assinaturas de telemetria/status e recebeu o status `offline` do ESP32. A publicação das entradas virtuais foi iniciada pela interface, com atualização do horário de transmissão. Como os comandos usam QoS 0, esse horário comprova envio pelo cliente, não confirmação de processamento pelo ESP32. Ainda não havia telemetria recebida nesta etapa; o teste de resposta do dispositivo e animação ao vivo depende de iniciar o projeto Wokwi conectado a este broker.

## Percurso real confirmado com Wokwi (29/10/2026)

Após o usuário iniciar o Wokwi, o dashboard recebeu o JSON completo de `aquamonitor-wokwi-esp32`, com sequência/uptime crescentes, Wi-Fi/MQTT verdadeiros e `input_mode=sensor`. A sessão autenticada enviou entradas virtuais e recebeu confirmação `input_mode=virtual`. Resultados observados no dashboard e na maquete conectada pelo modo Dashboard: drenagem ligada a 22 cm; mantida ligada a 16 cm; desligada a 12 cm; reúso ativado com `tank_empty=false` e `reuse_requested=true`; falha do sensor retornando `alarm_code=sensor_failure` e desligando as bombas. A maquete mostrou bomba ligada/fluxo para a barragem, parada e circuito de reúso conforme a telemetria. O modo sensor foi novamente selecionado ao terminar.

Foi corrigida uma oscilação da indicação de atualidade quando o relógio de renderização de 250 ms ficava ligeiramente atrás da chegada de um pacote. Há teste de regressão, preservando a expiração em 6 s. Também foram atualizados o rodapé lateral e os badges de alarme para acompanhar o ESP32. Nenhuma senha foi gravada em arquivo.

Evidências visuais: `emqx-maquete-22cm.png` e `emqx-maquete-reuso.png` nesta pasta. A limitação de autenticação citada nas etapas anteriores foi superada nesta sessão.


## Diagnóstico de conexão do ESP32 (29/10/2026)

O link Wokwi informado no atendimento ainda servia um sketch salvo com `broker.emqx.io:1883`; o print do usuário mostrava outra revisão tentando o Cloud em `8883`, sem o resultado da tentativa. A diferença de revisão foi confirmada, mas a causa da falha da revisão do print ainda não foi comprovada. O firmware local em `firmware-wokwi/sketch.ino` foi alinhado ao Cloud, com CA DigiCert Global Root G2, NTP, credenciais vazias para preencher apenas na cópia privada, clientId aleatório e diagnóstico PubSubClient/TLS. Cópias idênticas acompanham as duas maquetes. Veja o README dessa pasta para aplicação e limites de validação.

O painel das duas maquetes agora diferencia telemetria recente/desatualizada e explica que a conexão do navegador ao broker não comprova a conexão do ESP32; o estilo do formulário também foi ajustado para legibilidade. Adaptador Dashboard e modo incorporado preservados. Testes: 23 na independente e 26 na integrada; os dois builds passaram. O handshake TLS do Cloud foi validado no computador, sem autenticação MQTT. Não houve compilação ou autenticação do novo sketch no Wokwi, nem alteração/salvamento remoto.

## Integração física e notificações (19/11/2026)

O firmware nas três pastas aceita `config.h` local com SSID, senha Wi-Fi, credenciais MQTT e DEVICE_ID; `config.example.h` mantém a configuração Wokwi sem segredos. A conexão deixa de fixar o canal 6 e usa a rede configurada também na reconexão. Veja `firmware-wokwi/README.md` para gravação na placa.

A Visão geral agora permite conectar o ESP32 diretamente. O modo interno `wokwi` continua compatível com o adaptador existente e recebe também a placa física. A mesma sessão alimenta Dashboard, notificações e maquete 3D incorporada, sem credenciais no BroadcastChannel.

O sino oferece **Ativar notificações**: pede permissão por clique e guarda somente a preferência local. Novos eventos confirmados do ESP32 são enviados ao sistema do navegador; histórico antigo e eventos da simulação local não são reenviados. Falhas de entrega pelo sistema preservam os avisos no Dashboard. Funciona enquanto o Dashboard permanece aberto em localhost ou HTTPS; não implementa push com o aplicativo fechado.

Referências: https://docs.espressif.com/projects/arduino-esp32/en/latest/api/wifi.html e https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API.

## Simulação Wokwi e broker de testes próprio (25/11/2026)

Branch `simulacao-wokwi`. O broker original continua sendo o padrão; tudo abaixo é opcional e só vale quando configurado localmente.

**Configuração (nada disso é versionado):**

| Parte | Arquivo local | Chave |
| --- | --- | --- |
| Firmware (Wokwi/placa) | `config.h` | `MQTT_USERNAME`, `MQTT_PASSWORD`, `#define MQTT_BROKER_HOST "<id>.ala.<região>.emqxsl.com"`, opcional `MQTT_BROKER_PORT`, `MQTT_TOPIC_BASE` |
| Dashboard | `.env.local` | `VITE_MQTT_URL=wss://<id>.ala.<região>.emqxsl.com:8084/mqtt`, opcional `VITE_MQTT_TOPIC_BASE` |
| Maquetes | `.env.local` da pasta | as mesmas `VITE_MQTT_URL` / `VITE_MQTT_TOPIC_BASE` |

`VITE_MQTT_URL` só aceita `wss://` sem usuário, senha, query ou fragmento; qualquer outro valor volta ao broker original. Credenciais continuam digitadas na tela. O CA DigiCert Global Root G2 do firmware vale para os endereços `*.emqxsl.com` do EMQX Cloud Serverless (handshake verificado nas portas 8883 e 8084 do broker de testes).

**Broker de testes (EMQX Cloud Serverless, cota gratuita, spend limit US$ 0):** um usuário MQTT com duas regras de autorização: Allow Publish & Subscribe em `aquamonitor/demo-29out-b741d2/#` e Deny Publish & Subscribe em `#`. O console do Serverless usa blacklist por padrão; a regra Deny restringe o usuário aos tópicos do projeto.

**Circuito Wokwi:** `firmware-wokwi/diagram.json` (ESP32 DevKit v1, HC-SR04, 2 relés `pnp`/ativos em LOW, 3 chaves, protoboard, LEDs indicadores e LEDs “BOMBA DRENAGEM”/“SAIDA REUSO” no contato NO dos relés) e `libraries.txt` (PubSubClient, ArduinoJson). O padrão `npn` do Wokwi é ativo em HIGH e deixava a bomba ligada com `drain_on=false`; corrigido no diagrama, sem alterar o firmware.

**Validação ponta a ponta realizada (Wokwi ↔ EMQX Cloud ↔ dashboard local):**

- ESP32 virtual: Wi-Fi Wokwi-GUEST, NTP, TLS 8883 e autenticação: `[MQTT] Conectado; envio da inscricao em comandos: OK`.
- Dashboard (WSS 8084): broker conectado, `ESP32: online`, telemetria de `aquamonitor-wokwi` com `seq`/`uptime_ms` iguais aos do monitor serial.
- Comandos: entradas virtuais 22 cm → `input_mode=virtual` e drenagem ligada; 16 cm mantém (histerese); 12 cm desliga; `tank_empty=false` + `reuse_requested=true` → `reuse_on=true`; volta ao sensor → `[MQTT] Retornando ao HC-SR04` e `input_mode=sensor`.
- Tempo real: HC-SR04 do Wokwi a 8 cm → dashboard 21,9 cm e drenagem ligada.
- Perda e recuperação: simulação parada → aviso de atraso (6 s), dados desatualizados (15 s) e `offline` pelo testamento MQTT; simulação reiniciada → `online` e nova sequência. Com a aba do Wokwi em segundo plano o navegador desacelera a simulação, o keep-alive de 15 s expira e o firmware reconecta sozinho; mantenha a aba do Wokwi visível durante demonstrações.
- Evidência: `docs/evidencias/dashboard-wokwi-broker-teste.jpg`.

Não validado aqui: protótipo físico, reconexão do dashboard após queda da internet do navegador (coberta pelos testes automatizados com broker local) e a maquete standalone conectada ao broker de testes.
