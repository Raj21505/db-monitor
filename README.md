# 🔊 Smart Noise Level Monitor (dBA)

A **real-time noise monitoring web application** that measures environmental sound levels using a microphone, converts audio signals into **approximate dBA values**, and visualizes them live on an interactive dashboard.

This project combines **audio signal processing**, **real-time web sockets**, and **data visualization**, making it a strong example of full-stack Python development.

---

## 🚀 Features

- 🎤 Real-time microphone audio capture
- 📊 Accurate RMS-based dBA approximation
- ⚡ Live updates using WebSockets (Socket.IO)
- 🧭 Circular dBA gauge (0–120 dBA)
- 📈 Historical noise graph (last ~30 seconds)
- 📏 Linear noise health scale
- 🏷 Noise classification:
  - Quiet / Low
  - Moderate Noise
  - High Risk (Loud)
  - EXTREME DANGER
- 🔥 Tracks highest sound level detected
- 🎨 Modern, responsive dashboard UI

---

## 🧠 How It Works

1. **Microphone Input**
   - Captures real-time audio using `sounddevice`
   - Processes audio in chunks (1024 samples)

2. **Signal Processing**
   - Calculates RMS (Root Mean Square)
   - Converts RMS → dBFS
   - Maps dBFS → approximate real-world **dBA**
   - Clamps values between `0–120 dBA`

3. **Real-Time Communication**
   - Flask-SocketIO streams data to the browser
   - Updates UI without page reloads

4. **Visualization**
   - Circular dBA gauge
   - Linear health bar
   - Historical time-series graph using `<canvas>`

---

## 🛠 Tech Stack

### Backend
- **Python**
- **Flask**
- **Flask-SocketIO**
- **NumPy**
- **SoundDevice**
- **Threading**

### Frontend
- **HTML5**
- **CSS3**
- **JavaScript**
- **Socket.IO**
- **Canvas API**

---

## 📂 Project Structure

smart-noise-monitor/
│
├── app.py # Flask + audio processing backend
│
├── templates/
│ └── index.html # Dashboard UI
│
├── static/
│ ├── style.css # Dashboard styling
│ └── script.js # Real-time UI logic & graph rendering
│
└── README.md # Project documentation


---
