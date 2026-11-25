// AquaMonitor Virtual | ESP32 + Wokwi + MQTT
// Demonstracao academica: nao conecta bombas reais.
// EMQX Cloud TLS. Preencha credenciais temporarias apenas na sua copia do Wokwi.
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>
#include <esp_system.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <math.h>
#if __has_include("config.h")
#include "config.h"
#else
#include "config.example.h"
#endif
// Entradas
constexpr int PIN_TRIG = 5;
constexpr int PIN_ECHO = 18;
constexpr int PIN_TANK_FULL = 32;    // Chave superior: LOW = cheio
constexpr int PIN_TANK_WATER = 33;   // Chave inferior: LOW = agua disponivel
constexpr int PIN_REUSE_REQUEST = 25;// Chave de reuso: LOW = solicitar
// Saidas: modulos de rele Wokwi padrao, acionados em LOW (NPN)
constexpr int PIN_RELAY_DRAIN = 26;
constexpr int PIN_RELAY_REUSE = 27;
constexpr int PIN_LED_DRAIN = 14;
constexpr int PIN_LED_REUSE = 13;
constexpr int PIN_LED_ALARM = 21;
constexpr float GALLERY_HEIGHT_CM = 30.0f;
constexpr float DRAIN_START_CM = 20.0f;
constexpr float DRAIN_STOP_CM = 12.0f;
constexpr uint32_t VIRTUAL_TIMEOUT_MS = 8000;
constexpr uint32_t SAMPLE_INTERVAL_MS = 650;
constexpr uint32_t TELEMETRY_INTERVAL_MS = 1500;
constexpr uint32_t MQTT_RETRY_MS = 5000;
constexpr uint32_t WIFI_RETRY_MS = 15000;
constexpr uint32_t WIFI_LOG_INTERVAL_MS = 5000;

// Broker padrao = EMQX Cloud original. Para um broker de testes, defina
// MQTT_BROKER_HOST (e, se preciso, MQTT_BROKER_PORT) no config.h local.
#ifndef MQTT_BROKER_HOST
#define MQTT_BROKER_HOST "d684655e.ala.us-east-1.emqxsl.com"
#endif
#ifndef MQTT_BROKER_PORT
#define MQTT_BROKER_PORT 8883
#endif
const char* MQTT_HOST = MQTT_BROKER_HOST;
constexpr uint16_t MQTT_PORT = MQTT_BROKER_PORT;
// Vazios por seguranca: use credenciais de cliente MQTT do EMQX, nao o login do painel.


// DigiCert Global Root G2, trust anchor do certificado deste endpoint.
const char MQTT_ROOT_CA[] PROGMEM = R"PEM(-----BEGIN CERTIFICATE-----
MIIDjjCCAnagAwIBAgIQAzrx5qcRqaC7KGSxHQn65TANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH
MjAeFw0xMzA4MDExMjAwMDBaFw0zODAxMTUxMjAwMDBaMGExCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IEcyMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuzfNNNx7a8myaJCtSnX/RrohCgiN9RlUyfuI
2/Ou8jqJkTx65qsGGmvPrC3oXgkkRLpimn7Wo6h+4FR1IAWsULecYxpsMNzaHxmx
1x7e/dfgy5SDN67sH0NO3Xss0r0upS/kqbitOtSZpLYl6ZtrAGCSYP9PIUkY92eQ
q2EGnI/yuum06ZIya7XzV+hdG82MHauVBJVJ8zUtluNJbd134/tJS7SsVQepj5Wz
tCO7TG1F8PapspUwtP1MVYwnSlcUfIKdzXOS0xZKBgyMUNGPHgm+F6HmIcr9g+UQ
vIOlCsRnKPZzFBQ9RnbDhxSJITRNrw9FDKZJobq7nMWxM4MphQIDAQABo0IwQDAP
BgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBhjAdBgNVHQ4EFgQUTiJUIBiV
5uNu5g/6+rkS7QYXjzkwDQYJKoZIhvcNAQELBQADggEBAGBnKJRvDkhj6zHd6mcY
1Yl9PMWLSn/pvtsrF9+wX3N3KjITOYFnQoQj8kVnNeyIv/iPsGEMNKSuIEyExtv4
NeF22d+mQrvHRAiGfzZ0JFrabA0UWTW98kndth/Jsw1HKj2ZL7tcu7XUIOGZX1NG
Fdtom/DzMNU+MeKNhJ7jitralj41E6Vf8PlwUHBHQRFXGU7Aj64GxJUTFy8bJZ91
8rGOmaFvE7FBcf6IKshPECBV1/MUReXgRPTqh5Uykw7+U0b6LJ3/iyK5S9kJRaTe
pLiaWN0bfVKfjllDiIGknibVb63dDcY3fe0Dkhvld1927jyNxF1WW6LZZm6zNTfl
MrY=
-----END CERTIFICATE-----
)PEM";
// Base dos topicos. Padrao = topicos originais. Para testes isolados do prototipo
// fisico, defina MQTT_TOPIC_BASE no config.h (ex.: ".../wokwi") e use a mesma base no dashboard.
#ifndef MQTT_TOPIC_BASE
#define MQTT_TOPIC_BASE "aquamonitor/demo-29out-b741d2"
#endif
const char* TOPIC_COMMAND = MQTT_TOPIC_BASE "/comandos";
const char* TOPIC_TELEMETRY = MQTT_TOPIC_BASE "/telemetria";
const char* TOPIC_STATUS = MQTT_TOPIC_BASE "/status";
WiFiClientSecure wifiClient;
PubSubClient mqtt(wifiClient);
struct Inputs {
  float levelCm = 0.0f;
  float distanceCm = 30.0f;
  bool tankFull = false;
  bool tankEmpty = true;
  bool reuseRequested = false;
  bool sensorOk = false;
};
Inputs liveInputs;
Inputs remoteInputs;
bool virtualActive = false;
uint32_t lastVirtualCommand = 0;
uint32_t lastSample = 0;
uint32_t lastPublish = 0;
uint32_t lastMqttAttempt = 0;
uint32_t lastWifiAttempt = 0;
uint32_t lastWifiLog = 0;
wl_status_t lastWifiStatus = WL_IDLE_STATUS;
bool wifiWasConnected = false;
uint32_t sequenceNumber = 0;
bool drainOn = false;
bool reuseOn = false;
bool alarmOn = false;
const char* alarmCode = "none";
void applyRelays() {
  // Relay module padrao Wokwi: ativo em LOW.
  digitalWrite(PIN_RELAY_DRAIN, drainOn ? LOW : HIGH);
  digitalWrite(PIN_RELAY_REUSE, reuseOn ? LOW : HIGH);
  digitalWrite(PIN_LED_DRAIN, drainOn ? HIGH : LOW);
  digitalWrite(PIN_LED_REUSE, reuseOn ? HIGH : LOW);
  digitalWrite(PIN_LED_ALARM, alarmOn ? HIGH : LOW);
}

float clampLevel(float value) {
  return fmaxf(0.0f, fminf(GALLERY_HEIGHT_CM, value));
}

Inputs readLocalInputs() {
  Inputs data;
  data.tankFull = digitalRead(PIN_TANK_FULL) == LOW;
  data.tankEmpty = digitalRead(PIN_TANK_WATER) != LOW;
  data.reuseRequested = digitalRead(PIN_REUSE_REQUEST) == LOW;
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  const unsigned long microseconds = pulseIn(PIN_ECHO, HIGH, 30000UL);
  if (microseconds == 0) {
    data.sensorOk = false;
    data.distanceCm = -1.0f;
    data.levelCm = 0;
  } else {
    data.distanceCm = microseconds / 58.0f;
    data.sensorOk = data.distanceCm >= 2.0f && data.distanceCm <= 400.0f;
    data.levelCm = clampLevel(GALLERY_HEIGHT_CM - data.distanceCm);
  }
  return data;
}
// Valida todos os campos antes de aceitar o comando (evita estado parcial).
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  if (strcmp(topic, TOPIC_COMMAND) != 0 || length == 0 || length > 384) return;
  JsonDocument json;
  const DeserializationError error = deserializeJson(json, payload, length);
  if (error || !json["mode"].is<const char*>()) return;
  const char* mode = json["mode"].as<const char*>();
  if (strcmp(mode, "sensor") == 0) {
    virtualActive = false;
    Serial.println("[MQTT] Retornando ao HC-SR04 e chaves locais.");
    return;
  }
  if (strcmp(mode, "virtual") != 0) return;
  JsonVariant level = json["level_cm"];
  bool numeric = level.is<int>() || level.is<float>() || level.is<double>();
  if (!numeric || !json["tank_full"].is<bool>() ||
      !json["tank_empty"].is<bool>() ||
      !json["reuse_requested"].is<bool>() ||
      !json["sensor_ok"].is<bool>()) {
    Serial.println("[MQTT] Comando incompleto ou com tipos invalidos.");
    return;
  }
  float newLevel = level.as<float>();
  if (!isfinite(newLevel) || newLevel < 0 || newLevel > GALLERY_HEIGHT_CM) {
    Serial.println("[MQTT] level_cm fora de 0..30.");
    return;
  }
  Inputs next;
  next.levelCm = newLevel;
  next.distanceCm = GALLERY_HEIGHT_CM - newLevel; // Equivalente matematico, NAO move o sensor Wokwi
  next.tankFull = json["tank_full"].as<bool>();
  next.tankEmpty = json["tank_empty"].as<bool>();
  next.reuseRequested = json["reuse_requested"].as<bool>();
  next.sensorOk = json["sensor_ok"].as<bool>();
  remoteInputs = next;
  virtualActive = true;
  lastVirtualCommand = millis();
}

bool usingVirtualNow(uint32_t now) {
  if (virtualActive && (uint32_t)(now - lastVirtualCommand) > VIRTUAL_TIMEOUT_MS) {
    virtualActive = false;
    Serial.println("[SEGURANCA] Sem comando virtual recente: voltando ao sensor local.");
  }
  return virtualActive;
}

void updateControl(const Inputs& input) {
  liveInputs = input;
  alarmCode = "none";
  alarmOn = false;
  if (input.tankFull && input.tankEmpty) {
    drainOn = false;
    reuseOn = false;
    alarmCode = "float_conflict";
    alarmOn = true;
  } else if (!input.sensorOk) {
    drainOn = false;
    reuseOn = false;
    alarmCode = "sensor_failure";
    alarmOn = true;
  } else {
    if (input.tankFull) {
      drainOn = false;
      alarmCode = "tank_full";
      alarmOn = true;
    } else if (input.levelCm >= DRAIN_START_CM) {
      drainOn = true;
    } else if (input.levelCm <= DRAIN_STOP_CM) {
      drainOn = false;
    } // Faixa intermediaria: mantem o estado anterior (histerese)
    reuseOn = input.reuseRequested && !input.tankEmpty;
    if (input.reuseRequested && input.tankEmpty) {
      if (!alarmOn) alarmCode = "reuse_without_water";
      alarmOn = true;
    }
  }
  applyRelays();
}

void publishTelemetry(uint32_t now) {
  JsonDocument json;
  json["device"] = DEVICE_ID;
  json["input_mode"] = virtualActive ? "virtual" : "sensor";
  json["level_cm"] = roundf(liveInputs.levelCm * 10.0f) / 10.0f;
  json["level_pct"] = roundf(liveInputs.levelCm * 1000.0f / GALLERY_HEIGHT_CM) / 10.0f;
  json["distance_cm"] = roundf(liveInputs.distanceCm * 10.0f) / 10.0f;
  json["tank_full"] = liveInputs.tankFull;
  json["tank_empty"] = liveInputs.tankEmpty;
  json["reuse_requested"] = liveInputs.reuseRequested;
  json["sensor_ok"] = liveInputs.sensorOk;
  json["drain_on"] = drainOn;
  json["reuse_on"] = reuseOn;
  json["alarm"] = alarmOn;
  json["alarm_code"] = alarmCode;
  json["wifi_connected"] = WiFi.status() == WL_CONNECTED;
  json["mqtt_connected"] = mqtt.connected();
  json["seq"] = sequenceNumber++;
  json["uptime_ms"] = now;
  char output[640];
  const size_t n = serializeJson(json, output, sizeof(output));
  if (n >= sizeof(output) - 1) {
    Serial.println("[ERRO] Telemetria excedeu o buffer.");
    return;
  }
  Serial.println(output);
  if (mqtt.connected() && !mqtt.publish(TOPIC_TELEMETRY, output, false)) {
    Serial.println("[AVISO] Publicacao MQTT falhou.");
  }
}

// Nomes dos estados facilitam o diagnostico no monitor serial.
const char* wifiStatusName(wl_status_t status) {
  switch (status) {
    case WL_IDLE_STATUS: return "INICIANDO";
    case WL_NO_SSID_AVAIL: return "REDE_NAO_ENCONTRADA";
    case WL_CONNECTED: return "CONECTADO";
    case WL_CONNECT_FAILED: return "FALHA_NA_CONEXAO";
    case WL_CONNECTION_LOST: return "CONEXAO_PERDIDA";
    case WL_DISCONNECTED: return "DESCONECTADO";
    default: return "OUTRO";
  }
}

void maintainNetwork(uint32_t now) {
  const wl_status_t status = WiFi.status();

  if (status != lastWifiStatus) {
    Serial.printf("[WIFI] Mudanca de estado: %s (%d) -> %s (%d)\n",
                  wifiStatusName(lastWifiStatus), (int)lastWifiStatus,
                  wifiStatusName(status), (int)status);
    lastWifiStatus = status;
  }

  if (status != WL_CONNECTED) {
    wifiWasConnected = false;

    if ((uint32_t)(now - lastWifiLog) >= WIFI_LOG_INTERVAL_MS) {
      lastWifiLog = now;
      Serial.printf("[WIFI] Ainda sem conexao: %s (%d)\n",
                    wifiStatusName(status), (int)status);
    }

    if ((uint32_t)(now - lastWifiAttempt) >= WIFI_RETRY_MS) {
      lastWifiAttempt = now;
      Serial.println("[WIFI] Repetindo tentativa de conexao a rede configurada...");
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
    return;  // Leitura e controle locais seguem funcionando.
  }

  if (!wifiWasConnected) {
    wifiWasConnected = true;
    Serial.print("[WIFI] Conectado. IP: ");
    Serial.println(WiFi.localIP());
    configTime(0, 0, "pool.ntp.org", "time.google.com");
    lastMqttAttempt = now - MQTT_RETRY_MS;
  }

  if (mqtt.connected()) {
    mqtt.loop();
    return;
  }

  if ((uint32_t)(now - lastMqttAttempt) >= MQTT_RETRY_MS) {
    lastMqttAttempt = now;
    if (!MQTT_USERNAME[0] || !MQTT_PASSWORD[0]) {
      Serial.println("[MQTT] Preencha MQTT_USERNAME e MQTT_PASSWORD no config.h local. Nao envie a senha pelo chat.");
      return;
    }
    if (time(nullptr) < 1700000000) {
      Serial.println("[TLS] Aguardando relogio NTP para validar o certificado. Controle local continua.");
      return;
    }
    static const String clientId = "aquaESP32-" + String((uint32_t)ESP.getEfuseMac(), HEX) + "-" + String(esp_random(), HEX);
    Serial.printf("[MQTT] Conectando a %s:%u...\n", MQTT_HOST, (unsigned)MQTT_PORT);
    if (mqtt.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD, TOPIC_STATUS, 0, true, "offline")) {
      const bool subscribed = mqtt.subscribe(TOPIC_COMMAND);
      mqtt.publish(TOPIC_STATUS, "online", true);
      Serial.printf("[MQTT] Conectado; envio da inscricao em comandos: %s\n",
                    subscribed ? "OK" : "FALHOU");
    } else {
      const int code = mqtt.state();
      Serial.printf("[MQTT] Falhou; estado PubSubClient=%d. Nova tentativa em 5s.\n", code);
      switch (code) {
        case -4: Serial.println("[MQTT] Sem resposta MQTT no prazo (timeout)."); break;
        case -3: Serial.println("[MQTT] Conexao perdida."); break;
        case -2: Serial.println("[MQTT] Falha TCP/TLS: confira gateway Wokwi, DNS, porta e certificado."); break;
        case 1: Serial.println("[MQTT] Versao de protocolo recusada."); break;
        case 2: Serial.println("[MQTT] Identificador de cliente recusado."); break;
        case 3: Serial.println("[MQTT] Broker indisponivel."); break;
        case 4: Serial.println("[MQTT] Usuario ou senha recusados."); break;
        case 5: Serial.println("[MQTT] Nao autorizado: confira credenciais e regras de acesso no EMQX."); break;
      }
      if (code == -2) {
        char detail[160] = {};
        const int tlsError = wifiClient.lastError(detail, sizeof(detail));
        Serial.printf("[TLS] codigo=%d; %s\n", tlsError, detail);
      }
      wifiClient.stop();
    }
    // Aguarda o intervalo inteiro depois do handshake, inclusive quando ele falha.
    lastMqttAttempt = millis();
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  digitalWrite(PIN_TRIG, LOW);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_TANK_FULL, INPUT_PULLUP);
  pinMode(PIN_TANK_WATER, INPUT_PULLUP);
  pinMode(PIN_REUSE_REQUEST, INPUT_PULLUP);
  pinMode(PIN_RELAY_DRAIN, OUTPUT);
  pinMode(PIN_RELAY_REUSE, OUTPUT);
  pinMode(PIN_LED_DRAIN, OUTPUT);
  pinMode(PIN_LED_REUSE, OUTPUT);
  pinMode(PIN_LED_ALARM, OUTPUT);
  // Falha segura no boot: ambos reles desligados (ativos em LOW).
  drainOn = false;
  reuseOn = false;
  alarmOn = false;
  applyRelays();
  wifiClient.setCACert(MQTT_ROOT_CA);
  wifiClient.setHandshakeTimeout(8); // segundos; nao desativa validacao TLS
  mqtt.setSocketTimeout(5); // segundos aguardando resposta MQTT
  mqtt.setKeepAlive(15);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(768);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  Serial.printf("[WIFI] Iniciando conexao: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWifiStatus = WiFi.status();
  lastWifiAttempt = millis();
  lastMqttAttempt = millis() - MQTT_RETRY_MS;
  Serial.println("AquaMonitor Virtual | ESP32 iniciando...");
  Serial.println("Controle local funciona mesmo sem MQTT.");
}

void loop() {
  maintainNetwork(millis());
  const uint32_t now = millis();
  if ((uint32_t)(now - lastSample) >= SAMPLE_INTERVAL_MS) {
    lastSample = now;
    const Inputs current = usingVirtualNow(now) ? remoteInputs : readLocalInputs();
    updateControl(current);
  }
  if ((uint32_t)(now - lastPublish) >= TELEMETRY_INTERVAL_MS) {
    lastPublish = now;
    publishTelemetry(now);
  }
  delay(10);
}
