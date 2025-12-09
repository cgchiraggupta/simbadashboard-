const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Simulation State
let systemState = {
  isRunning: false,
  rpmTarget: 1000,
  feedRate: 5,
  totalRuntime: 0,
  sessionStartTime: null,
  alerts: [],
  lastUpdate: Date.now()
};

// Sensor Baselines & Ranges
const SENSORS = {
  rpm: { min: 0, max: 3000, baseline: 0, noise: 50 },
  vibration: { min: 0, max: 100, baseline: 2, noise: 5 },
  sound: { min: 30, max: 120, baseline: 35, noise: 2 },
  temperature: { min: 20, max: 80, baseline: 22, noise: 0.5 },
  humidity: { min: 30, max: 90, baseline: 45, noise: 1 },
  pressure: { min: 0, max: 500, baseline: 0, noise: 5 },
  current: { min: 0, max: 15, baseline: 0.1, noise: 0.2 }
};

// Helper to generate realistic sensor data
function generateSensorData() {
  const now = Date.now();
  const dt = (now - systemState.lastUpdate) / 1000;
  systemState.lastUpdate = now;

  // Basic physics simulation
  let currentRpm = systemState.isRunning ? systemState.rpmTarget : 0;
  // Add some lag/ramp-up (simplified)
  
  const vibrationBase = systemState.isRunning ? (currentRpm / 3000) * 60 + 10 : 2;
  const soundBase = systemState.isRunning ? (currentRpm / 3000) * 50 + 60 : 35;
  const pressureBase = systemState.isRunning ? systemState.feedRate * 30 : 0;
  const currentBase = systemState.isRunning ? (currentRpm / 3000) * 10 + (pressureBase / 500) * 2 : 0.1;

  // Temperature rises slowly when running
  if (systemState.isRunning) {
    SENSORS.temperature.baseline = Math.min(SENSORS.temperature.baseline + (0.05 * dt), 75);
  } else {
    SENSORS.temperature.baseline = Math.max(SENSORS.temperature.baseline - (0.1 * dt), 22);
  }

  const data = {
    timestamp: now,
    status: systemState.isRunning ? 'Running' : 'Stopped',
    sensors: {
      rpm: Math.max(0, currentRpm + (Math.random() - 0.5) * SENSORS.rpm.noise),
      vibration: Math.max(0, vibrationBase + (Math.random() - 0.5) * SENSORS.vibration.noise),
      sound: Math.max(30, soundBase + (Math.random() - 0.5) * SENSORS.sound.noise),
      temperature: SENSORS.temperature.baseline + (Math.random() - 0.5) * SENSORS.temperature.noise,
      humidity: SENSORS.humidity.baseline + (Math.random() - 0.5) * SENSORS.humidity.noise,
      pressure: Math.max(0, pressureBase + (Math.random() - 0.5) * SENSORS.pressure.noise),
      current: Math.max(0, currentBase + (Math.random() - 0.5) * SENSORS.current.noise)
    },
    alerts: checkAlerts()
  };

  // Occasionally spike current or vibration
  if (systemState.isRunning && Math.random() > 0.98) {
    data.sensors.vibration += 30; // Spike
    data.sensors.current += 2;
  }

  return data;
}

function checkAlerts() {
  // logic to generate alerts based on thresholds would go here
  // For now, we return active alerts stored in state or generate transient ones
  return systemState.alerts;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const data = generateSensorData();
      ws.send(JSON.stringify({ type: 'UPDATE', data }));
    }
  }, 500); // 500ms update rate

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'CONTROL') {
        handleControl(parsed.payload);
        // Broadcast state change immediately
        const data = generateSensorData();
        ws.send(JSON.stringify({ type: 'UPDATE', data }));
      }
    } catch (e) {
      console.error('Error parsing message', e);
    }
  });

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

function handleControl(payload) {
  if (payload.command === 'START') {
    systemState.isRunning = true;
    systemState.sessionStartTime = Date.now();
  } else if (payload.command === 'STOP') {
    systemState.isRunning = false;
    if (systemState.sessionStartTime) {
        systemState.totalRuntime += (Date.now() - systemState.sessionStartTime);
        systemState.sessionStartTime = null;
    }
  } else if (payload.command === 'SET_RPM') {
    systemState.rpmTarget = payload.value;
  } else if (payload.command === 'SET_FEED') {
    systemState.feedRate = payload.value;
  } else if (payload.command === 'RESET') {
    systemState.alerts = [];
    SENSORS.temperature.baseline = 22;
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

