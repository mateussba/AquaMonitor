# Firmware EMQX Cloud para Wokwi

## Montar o projeto Wokwi do zero

Esta pasta contém tudo o que o Wokwi precisa:

| Arquivo | Função |
| --- | --- |
| `sketch.ino` | Firmware do ESP32 (o mesmo do protótipo físico) |
| `diagram.json` | Circuito: ESP32 DevKit v1, HC-SR04, 2 relés, 3 chaves, LEDs |
| `libraries.txt` | Bibliotecas: PubSubClient e ArduinoJson 7 |
| `config.example.h` | Modelo de configuração sem segredos |

1. Em https://wokwi.com/projects/new/esp32, crie um projeto ESP32.
2. Substitua o conteúdo das abas `sketch.ino` e `diagram.json` pelo conteúdo destes arquivos.
3. Use a seta ao lado das abas → **New file…** para criar `libraries.txt` e `config.example.h` com o conteúdo destes arquivos.
4. Para conectar ao broker, crie também `config.h` (copie `config.example.h`) e preencha `MQTT_USERNAME` e `MQTT_PASSWORD` apenas nessa cópia. Projetos Wokwi salvos podem ser públicos: use credenciais temporárias e apague-as antes de salvar ou compartilhar.

Circuito (pinos idênticos ao firmware e à imagem `circuito.png` da maquete):

| Componente | Ligação | Representa |
| --- | --- | --- |
| HC-SR04 | TRIG→GPIO5, ECHO→GPIO18, VCC→VIN (5 V) | Sensor de nível; nível = 30 cm − distância |
| Relé 1 | IN→GPIO26 | Relé da bomba de drenagem |
| Relé 2 | IN→GPIO27 | Relé do reúso |
| LED “BOMBA DRENAGEM” | Contato NO do relé 1 alimentado por 3V3 | A bomba física (só acende se o relé fechar) |
| LED “SAIDA REUSO” | Contato NO do relé 2 alimentado por 3V3 | Atuador do reúso |
| Chave 1 | GPIO32 | Boia “tanque cheio” |
| Chave 2 | GPIO33 | Boia “há água disponível” |
| Chave 3 | GPIO25 | Interruptor de pedido de reúso |
| LEDs azul/verde/vermelho | GPIO14/13/21 | Indicadores de drenagem, reúso e alerta |
| Protoboard | Trilha + = 3V3, trilha − = GND | Distribui alimentação para relés, chaves e LEDs |

### Broker de testes próprio (opcional)

Sem acesso ao broker original, crie um EMQX Cloud **Serverless** gratuito (spend limit US$ 0), um usuário MQTT e as regras de autorização descritas em `docs/INTEGRACAO-EMQX.md`. No `config.h` do Wokwi acrescente `#define MQTT_BROKER_HOST "<id>.ala.<região>.emqxsl.com"` junto com usuário e senha; no dashboard use `VITE_MQTT_URL=wss://<id>.ala.<região>.emqxsl.com:8084/mqtt` no `.env.local`. O certificado já incluso no firmware serve para esse endereço. Mantenha a aba do Wokwi visível: em segundo plano o navegador desacelera a simulação e o broker desconecta o ESP32 por keep-alive (ele reconecta sozinho).

### Tópicos de teste separados do protótipo físico (opcional)

Sem configuração, firmware e dashboard usam os tópicos originais `aquamonitor/demo-29out-b741d2/{telemetria,comandos,status}`. Para testar o Wokwi enquanto a placa física funciona, use a mesma base nos dois lados:

- Wokwi: no `config.h`, descomente `#define MQTT_TOPIC_BASE "aquamonitor/demo-29out-b741d2/wokwi"`.
- Dashboard: crie `.env.local` na raiz com `VITE_MQTT_TOPIC_BASE=aquamonitor/demo-29out-b741d2/wokwi` e reinicie `npm run dev`. O painel ESP32 mostra a base em uso.

A credencial MQTT precisa ter permissão (ACL no EMQX) para a nova base. Bases com `#`, `+` ou barras sobrando são ignoradas e o padrão é usado.

As chaves usam `INPUT_PULLUP`: chave para a **direita** = ligada ao GND = entrada ativa. No início todas ficam à esquerda (inativas). Clique no HC-SR04 durante a simulação e mova o controle de distância: distância ≤ 10 cm (nível ≥ 20 cm) liga a drenagem; distância ≥ 18 cm (nível ≤ 12 cm) desliga.

Os módulos de relé usam `"transistor": "pnp"` (acionados em LOW), igual ao firmware e aos módulos físicos comuns. O padrão do Wokwi (`npn`) é acionado em HIGH e deixava a bomba ligada com `drain_on=false`. No módulo `pnp` do Wokwi o LED verde “LED1” do relé acende quando a entrada está em HIGH (bomba desligada); confira a bomba pelo LED “BOMBA DRENAGEM”.

Combinações das boias: chave 1 sozinha gera `float_conflict` (cheio e sem água ao mesmo tempo); chaves 1 e 2 geram `tank_full`; chave 3 sem a chave 2 gera `reuse_without_water`; chaves 2 e 3 ligam o reúso.

Validado no Wokwi em 25/11/2026 (sem credenciais MQTT): compilação, Wi-Fi Wokwi-GUEST, telemetria serial, histerese 22 → 15,8 (mantém) → 9,8 cm (desliga), LED da bomba seguindo `drain_on`, as quatro combinações das chaves e a protoboard (trilhas 3V3/GND).

Adicione `config.example.h` ao projeto e substitua o `sketch.ino` do projeto https://wokwi.com/projects/478540696015596545 pelo arquivo desta pasta. A versão salva nesse link em 29/10/2026 ainda usava o broker público `broker.emqx.io:1883`, que não entrega mensagens ao EMQX Cloud do painel.

Na sua cópia do Wokwi, copie `config.example.h` para `config.h` e preencha `MQTT_USERNAME` e `MQTT_PASSWORD` nesse arquivo com credenciais temporárias de cliente MQTT do EMQX Cloud. Os valores distribuídos aqui são vazios. Não envie senhas pelo chat e não publique um projeto Wokwi contendo credenciais. A senha do console EMQX não substitui a credencial de cliente MQTT.

O firmware usa `d684655e.ala.us-east-1.emqxsl.com:8883`, WiFiClientSecure com DigiCert Global Root G2 e sincronização NTP antes de validar o certificado. O navegador usa WSS na porta 8084; as portas são diferentes por usarem transportes diferentes. Pinos, telemetria, tópicos e decisões dos relés foram preservados. Bibliotecas do Wokwi: PubSubClient e ArduinoJson (7).

Inicie a simulação e acompanhe: `[WIFI] Conectado`, depois `[MQTT] Conectando`, depois o resultado. O envio de uma inscrição pela PubSubClient não comprova que a ACL a autorizou: confirme a resposta das entradas virtuais na telemetria.

- Aguardando relógio NTP: ainda não tentou TLS; confira acesso do gateway Wokwi à internet/NTP.
- Código -2: falha de transporte TCP/TLS; veja a linha `[TLS]` seguinte.
- Código -4: não recebeu resposta MQTT no prazo.
- Código 4: usuário/senha recusados.
- Código 5: não autorizado; confira autenticação e regras do EMQX.
- Conectado sem leituras no painel: confira permissão do ESP32 para publicar telemetria/status e assinar comandos, e as permissões correspondentes do painel.

Conexões TLS/MQTT são síncronas e podem pausar o loop durante uma tentativa; o handshake tem limite de 8 s e a resposta MQTT de 5 s. Não use este protótipo para bombas reais. Há intervalo de 5 s após cada tentativa e um clientId aleatório por execução, evitando colisão entre MACs emulados.

Validação desta revisão: o endpoint respondeu ao handshake TLS com cadeia válida no computador; os builds e testes das maquetes são conferidos separadamente. Isso não comprova o gateway Wokwi, a compilação Arduino, as credenciais, a ACL ou telemetria real. Esses passos precisam ser confirmados ao executar o sketch no Wokwi. O projeto remoto não foi salvo ou alterado por esta revisão.

## ESP32 físico com Wi-Fi

1. Copie `config.example.h` para `config.h` na mesma pasta do sketch. O arquivo `config.h` é ignorado pelo Git.
2. Preencha `WIFI_SSID` e `WIFI_PASSWORD` com uma rede de 2,4 GHz com internet. Preencha `MQTT_USERNAME` e `MQTT_PASSWORD` com credenciais do broker EMQX Cloud usado pelo Dashboard. Identifique a placa em `DEVICE_ID`.
3. Use Arduino IDE com suporte ESP32, PubSubClient e ArduinoJson 7. Abra o sketch, mantenha os headers na mesma pasta, selecione a placa e a porta USB e grave. Se a IDE pedir, aceite mover o sketch para uma pasta com o mesmo nome e copie os headers para ela.
4. Abra o monitor serial em 115200 e confirme `[WIFI] Conectado` e `[MQTT] Conectado`. O firmware usa os sensores locais por padrão e reconecta à rede configurada sem fixar o canal 6 do Wokwi.
5. Execute o aplicativo principal em `/home/mateus/Downloads/Aquaonitor` com `npm run dev`. Na Visão geral, abra **Conectar protótipo físico por Wi-Fi**, selecione **ESP32 físico / Wokwi · Wi-Fi** e conecte com credenciais MQTT autorizadas. Mantenha a entrada no sensor físico.
6. No sino do Dashboard, clique **Ativar notificações** e permita no navegador. Alertas de nível (18/26 cm), bombas, falhas e perda de telemetria aparecem no Dashboard e no navegador, inclusive em outra aba. O Dashboard precisa permanecer aberto; fechar o aplicativo encerra a recepção. Use localhost ou HTTPS para as notificações do sistema.

A placa publica em TLS/8883 e o Dashboard recebe em WSS/8084 no mesmo broker e tópicos. Não precisam estar na mesma rede local; ambos precisam de internet. Com um único protótipo, desligue o Wokwi ao usar a placa física para não misturar publicações nos mesmos tópicos. Pinos e polaridade dos relés continuam os do circuito existente; confira a montagem física antes de energizar. O Echo de um HC-SR04 de 5 V precisa de adequação para a entrada de 3,3 V do ESP32.

Esta revisão prepara a configuração para hardware real. Compilação Arduino, gravação USB, credenciais, rede e leituras da placa precisam de validação no dispositivo.
