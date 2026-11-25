#pragma once
// Copie para config.h e preencha apenas no computador/Arduino IDE.
// ESP32 fisico: use a rede Wi-Fi de 2,4 GHz e sua senha.
// Wokwi: mantenha Wokwi-GUEST e senha vazia.
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";
const char* MQTT_USERNAME = "";
const char* MQTT_PASSWORD = "";
// Use um identificador diferente para distinguir a placa fisica do Wokwi.
const char* DEVICE_ID = "aquamonitor-esp32";
// Opcional: broker de testes (EMQX Cloud Serverless proprio). Sem estas linhas,
// o firmware usa o broker original. O certificado DigiCert Global Root G2 ja
// incluso vale para os enderecos *.emqxsl.com do EMQX Cloud Serverless.
// #define MQTT_BROKER_HOST "xxxxxxxx.ala.us-east-1.emqxsl.com"
// #define MQTT_BROKER_PORT 8883
// Opcional: topicos de teste separados do prototipo fisico.
// Descomente a linha abaixo e use a mesma base em VITE_MQTT_TOPIC_BASE no dashboard.
// #define MQTT_TOPIC_BASE "aquamonitor/demo-29out-b741d2/wokwi"
