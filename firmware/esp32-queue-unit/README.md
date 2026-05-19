# ESP32 Queue Unit — one code for all devices

Upload **the same** `esp32_queue_unit.ino` to every ESP32. Each device is configured with the **unit setup link** from the admin panel (no code change per branch).

Production API example:

`https://queue-management-system-2e13.onrender.com/api`

## Hardware

| Part | GPIO |
|------|------|
| Button → GND | 27 |
| Buzzer | 25 |
| OLED 0.96" I2C | SDA 21, SCL 22 (0x3C) |

## Arduino IDE

1. Board: **ESP32 Dev Module**
2. Libraries: **Adafruit GFX**, **Adafruit SSD1306**
3. Upload `esp32_queue_unit.ino`

## Setup (once per device)

1. Power on → WiFi **`QMS-Setup-XXXX`** appears.
2. Phone → connect to that WiFi.
3. Admin → **Organizations → View Links** → copy **Unit setup link** for this unit (includes API + Counter ID).
4. Open link on phone (or `http://192.168.4.1`) — setup page opens automatically.
5. Enter **branch WiFi SSID + password** → **Save & Connect**.
6. Hotspot turns off; device joins WiFi; OLED shows **In queue: N** (live from server).

## Normal use (OLED)

| Screen | Meaning |
|--------|---------|
| **In queue: 5** | 5 customers waiting for this unit (same as staff/TV queue) |
| **Now: HOS-01-003** | Token currently being served |
| **Hold 3s = Next** | Same as staff **Call Next** button |

Polls every 3s: `GET .../api/tokens/iot/status?counterId=...`  
Button (3s hold): `POST .../api/tokens/iot/complete-and-next` with `{"counterId":"..."}`

## Factory reset

Hold button **while powering on** for **8 seconds** → WiFi settings cleared → setup mode again.

## Admin link format

```
http://192.168.4.1/?counterId=<ID>&api=https://queue-management-system-2e13.onrender.com/api&unit=Cashier+1
```

Phone must be on **QMS-Setup-XXXX** WiFi when opening this URL.
