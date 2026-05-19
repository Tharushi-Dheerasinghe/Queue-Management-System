/**
 * Queue Management System — ESP32 unit button + OLED
 *
 * Setup: AP "QMS-Setup-XXXX" → http://192.168.4.1 → WiFi + counter config → reboot
 * Run: OLED shows waiting count & current token; hold button 3s = Call Next (complete + next)
 *
 * Libraries (Arduino Library Manager):
 *   Adafruit GFX Library, Adafruit SSD1306, ArduinoJson (optional — not required here)
 *
 * Board: ESP32 Dev Module
 */

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ---------- Pins (change if needed) ----------
#define BUTTON_PIN 27
#define BUZZER_PIN 25
#define OLED_SDA 21
#define OLED_SCL 22
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

#define HOLD_MS 3000
#define STATUS_POLL_MS 3000
#define AP_PASSWORD ""  // open hotspot

// Default server if admin link has no api= query (change to your Render URL)
#define FALLBACK_API_BASE "https://queue-management-system-2e13.onrender.com/api"

Preferences prefs;
WebServer server(80);
DNSServer dnsServer;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

String wifiSsid;
String wifiPass;
String apiBase;      // e.g. https://your-app.onrender.com/api
String counterId;
String unitLabel;

bool configPortalActive = false;
unsigned long buttonDownAt = 0;
bool actionTriggered = false;
unsigned long lastStatusPoll = 0;

int waitingCount = 0;
String activeToken = "---";
bool wifiOk = false;

// ---------- Preferences ----------
bool loadConfig() {
  prefs.begin("qms", true);
  wifiSsid = prefs.getString("ssid", "");
  wifiPass = prefs.getString("pass", "");
  apiBase = prefs.getString("api", "");
  counterId = prefs.getString("cid", "");
  unitLabel = prefs.getString("unit", "Unit");
  prefs.end();
  return wifiSsid.length() > 0 && apiBase.length() > 0 && counterId.length() > 0;
}

void saveConfig(const String& ssid, const String& pass, const String& api, const String& cid, const String& unit) {
  prefs.begin("qms", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  prefs.putString("api", api);
  prefs.putString("cid", cid);
  prefs.putString("unit", unit);
  prefs.end();
}

void clearConfig() {
  prefs.begin("qms", false);
  prefs.clear();
  prefs.end();
}

// ---------- Display / Buzzer ----------
void beep(int ms) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

void showLine(const char* line1, const char* line2 = "", const char* line3 = "", const char* line4 = "") {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(line1);
  if (strlen(line2)) display.println(line2);
  if (strlen(line3)) display.println(line3);
  if (strlen(line4)) display.println(line4);
  display.display();
}

void showSetupAp(const String& apName) {
  showLine("SETUP MODE", apName.c_str(), "Connect phone", "Open 192.168.4.1");
}

void showQueueScreen() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(unitLabel.substring(0, 16));
  display.println(wifiOk ? "WiFi: OK" : "WiFi: ...");

  // Large number — how many customers waiting in this unit queue
  display.setTextSize(1);
  display.setCursor(0, 18);
  display.print("In queue:");

  display.setTextSize(2);
  display.setCursor(0, 30);
  display.println(String(waitingCount));

  display.setTextSize(1);
  display.setCursor(0, 50);
  display.print("Now: ");
  display.println(activeToken.substring(0, 12));

  display.setCursor(0, 58);
  display.print("Hold 3s = Next");

  display.display();
}

// ---------- HTTP helpers ----------
bool isHttps(const String& url) {
  return url.startsWith("https://");
}

String buildStatusUrl() {
  return apiBase + "/tokens/iot/status?counterId=" + counterId;
}

String buildNextUrl() {
  return apiBase + "/tokens/iot/complete-and-next";
}

bool httpGet(const String& url, String& outBody) {
  outBody = "";
  if (isHttps(url)) {
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    if (!http.begin(client, url)) return false;
    int code = http.GET();
    if (code == 200) outBody = http.getString();
    http.end();
    return code == 200;
  }
  HTTPClient http;
  if (!http.begin(url)) return false;
  int code = http.GET();
  if (code == 200) outBody = http.getString();
  http.end();
  return code == 200;
}

bool httpPostJson(const String& url, const String& json, String& outBody) {
  outBody = "";
  if (isHttps(url)) {
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    if (!http.begin(client, url)) return false;
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(json);
    if (code > 0) outBody = http.getString();
    http.end();
    return code >= 200 && code < 300;
  }
  HTTPClient http;
  if (!http.begin(url)) return false;
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(json);
  if (code > 0) outBody = http.getString();
  http.end();
  return code >= 200 && code < 300;
}

// Minimal JSON parse for status (no ArduinoJson required)
int parseRemainingCount(const String& body) {
  int idx = body.indexOf("\"remainingCount\"");
  if (idx < 0) return -1;
  int colon = body.indexOf(':', idx);
  if (colon < 0) return -1;
  return body.substring(colon + 1).toInt();
}

String parseActiveToken(const String& body) {
  int idx = body.indexOf("\"activeTokenNumber\"");
  if (idx < 0) return "---";
  int q1 = body.indexOf('"', body.indexOf(':', idx) + 1);
  if (q1 < 0) return "---";
  int q2 = body.indexOf('"', q1 + 1);
  if (q2 < 0) return "---";
  String val = body.substring(q1 + 1, q2);
  if (val == "null" || val.length() == 0) return "---";
  return val;
}

void refreshQueueStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    wifiOk = false;
    return;
  }
  wifiOk = true;
  String body;
  if (!httpGet(buildStatusUrl(), body)) {
    return;
  }
  int rc = parseRemainingCount(body);
  if (rc >= 0) waitingCount = rc;
  activeToken = parseActiveToken(body);
  showQueueScreen();
}

void callNextAction() {
  showLine("Calling next...", "Hold on");
  String payload = String("{\"counterId\":\"") + counterId + "\"}";
  String body;
  bool ok = httpPostJson(buildNextUrl(), payload, body);
  if (ok) {
    beep(120);
    delay(80);
    beep(120);
    refreshQueueStatus();
  } else {
    showLine("API Error", "Check WiFi/API");
    beep(400);
  }
}

// ---------- Config portal HTML ----------
String htmlConfigPage() {
  String unit = server.hasArg("unit") ? server.arg("unit") : unitLabel;
  String cid = server.hasArg("counterId") ? server.arg("counterId") : counterId;
  String api = server.hasArg("api") ? server.arg("api") : apiBase;
  if (api.length() == 0) {
    api = FALLBACK_API_BASE;
  }

  String page = R"rawliteral(
<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>QMS Unit Setup</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#0f172a;color:#fff}
  .card{max-width:420px;margin:0 auto;background:#1e293b;border-radius:16px;padding:20px}
  h1{font-size:1.25rem;margin:0 0 8px}
  p{font-size:0.85rem;color:#94a3b8;margin:0 0 16px}
  label{display:block;font-size:0.75rem;font-weight:700;margin:12px 0 4px;color:#cbd5e1}
  input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:16px}
  button{width:100%;margin-top:20px;padding:14px;border:none;border-radius:12px;background:#2563eb;color:#fff;font-weight:700;font-size:1rem}
  .hint{font-size:0.7rem;color:#64748b;margin-top:6px}
</style></head><body>
<div class="card">
<h1>Queue Unit WiFi Setup</h1>
<p>Enter branch WiFi (not QMS-Setup). After save, OLED shows how many tokens are waiting in this unit queue. Hold button 3 seconds to call next.</p>
<form method="POST" action="/save">
<label>WiFi SSID</label>
<input name="ssid" required placeholder="Branch WiFi name" autocomplete="off"/>
<label>WiFi Password</label>
<input name="password" type="password" placeholder="Password" autocomplete="off"/>
<label>API Base URL</label>
<input name="api" required value=")rawliteral";
  page += api;
  page += R"rawliteral(" placeholder="https://queue-management-system-2e13.onrender.com/api"/>
<p class="hint">From admin panel — include /api at the end</p>
<label>Counter ID (unit)</label>
<input name="counterId" required value=")rawliteral";
  page += cid;
  page += R"rawliteral(" placeholder="MongoDB counter id"/>
<label>Unit name (display)</label>
<input name="unit" value=")rawliteral";
  page += unit;
  page += R"rawliteral(" placeholder="e.g. Cashier 1"/>
<button type="submit">Save &amp; Connect</button>
</form>
</div></body></html>
)rawliteral";
  return page;
}

void handleRoot() {
  server.send(200, "text/html", htmlConfigPage());
}

void handleSave() {
  String ssid = server.arg("ssid");
  String pass = server.arg("password");
  String api = server.arg("api");
  String cid = server.arg("counterId");
  String unit = server.arg("unit");

  if (ssid.length() == 0 || api.length() == 0 || cid.length() == 0) {
    server.send(400, "text/plain", "Missing required fields");
    return;
  }

  saveConfig(ssid, pass, api, cid, unit.length() ? unit : "Unit");

  String okPage = "<html><body style='font-family:sans-serif;text-align:center;padding:40px'>"
                    "<h2>Saved!</h2><p>Connecting to WiFi... Device will restart.</p></body></html>";
  server.send(200, "text/html", okPage);
  delay(800);
  ESP.restart();
}

void handleCaptive() {
  server.sendHeader("Location", "http://192.168.4.1/", true);
  server.send(302, "text/plain", "");
}

String apName() {
  uint64_t chipId = ESP.getEfuseMac();
  char suffix[5];
  snprintf(suffix, sizeof(suffix), "%04X", (uint16_t)(chipId & 0xFFFF));
  return String("QMS-Setup-") + suffix;
}

void startConfigPortal() {
  configPortalActive = true;
  String ap = apName();
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap.c_str(), AP_PASSWORD);
  IPAddress ip = WiFi.softAPIP();

  dnsServer.start(53, "*", ip);

  server.on("/", HTTP_GET, handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.on("/generate_204", HTTP_GET, handleCaptive);
  server.on("/fwlink", HTTP_GET, handleCaptive);
  server.on("/connecttest.txt", HTTP_GET, []() { server.send(200, "text/plain", "OK"); });
  server.on("/hotspot-detect.html", HTTP_GET, handleCaptive);
  server.onNotFound(handleCaptive);
  server.begin();

  showSetupAp(ap);
  beep(80);

  while (true) {
    dnsServer.processNextRequest();
    server.handleClient();
    delay(10);
  }
}

bool connectWifi(uint32_t timeoutMs) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSsid.c_str(), wifiPass.c_str());
  showLine("WiFi connect", wifiSsid.c_str());

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    wifiOk = true;
    showLine("WiFi OK", WiFi.localIP().toString().c_str());
    beep(100);
    delay(400);
    return true;
  }
  wifiOk = false;
  return false;
}

void handleButton() {
  bool pressed = digitalRead(BUTTON_PIN) == LOW;

  if (pressed) {
    if (buttonDownAt == 0) {
      buttonDownAt = millis();
      actionTriggered = false;
    } else if (!actionTriggered && millis() - buttonDownAt >= HOLD_MS) {
      actionTriggered = true;
      callNextAction();
    } else if (!actionTriggered && millis() - buttonDownAt > 500) {
      int pct = (int)((millis() - buttonDownAt) * 100 / HOLD_MS);
      if (pct > 100) pct = 100;
      showLine("Hold button...", (String(pct) + "%").c_str(), "3 sec = Call Next");
    }
  } else {
    buttonDownAt = 0;
    actionTriggered = false;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
  }
  display.clearDisplay();
  display.display();

  showLine("QMS Unit", "Starting...");

  // Factory reset: hold button on boot 8s
  if (digitalRead(BUTTON_PIN) == LOW) {
    uint32_t t0 = millis();
    while (digitalRead(BUTTON_PIN) == LOW && millis() - t0 < 8000) {
      delay(10);
    }
    if (millis() - t0 >= 8000) {
      clearConfig();
      showLine("Config cleared", "Restarting...");
      beep(300);
      delay(1000);
      ESP.restart();
    }
  }

  if (!loadConfig()) {
    startConfigPortal();
  }

  if (!connectWifi(20000)) {
    showLine("WiFi failed", "Setup mode...");
    delay(1500);
    startConfigPortal();
  }

  unitLabel = unitLabel.length() ? unitLabel : "Unit";
  refreshQueueStatus();
  lastStatusPoll = millis();
}

void loop() {
  if (configPortalActive) return;

  if (WiFi.status() != WL_CONNECTED) {
    wifiOk = false;
    showLine("WiFi lost", "Reconnecting...");
    if (!connectWifi(15000)) {
      startConfigPortal();
    }
  }

  handleButton();

  if (millis() - lastStatusPoll >= STATUS_POLL_MS) {
    refreshQueueStatus();
    lastStatusPoll = millis();
  }

  delay(20);
}
