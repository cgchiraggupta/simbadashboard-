import { create } from 'zustand';
import * as faceapi from 'face-api.js';
import type { HealthData } from '../types';

const MAX_HISTORY = 60;

// Generate mock health data for development
const generateMockHealthData = (): HealthData => {
  const now = Date.now();
  const baseVitals = {
    pulseRate: 72 + Math.random() * 10 - 5,
    heartRate: 68 + Math.random() * 8 - 4,
    spO2: 98 + Math.random() * 2 - 1,
    bloodPressure: 120 + Math.random() * 20 - 10,
    temperature: 36.8 + Math.random() * 0.4 - 0.2,
    respirationRate: 16 + Math.random() * 4 - 2,
  };

  const alerts: HealthData['alerts'] = [];
  if (baseVitals.heartRate < 60) {
    alerts.push({
      id: `alert-${now}`,
      type: 'warning',
      message: 'Heart Rate below normal range (60-100 bpm)',
      timestamp: now,
    });
  }
  if (baseVitals.temperature > 37.2) {
    alerts.push({
      id: `alert-${now + 1}`,
      type: 'critical',
      message: 'Temperature critical - outside safe range (36.1-37.2°C)',
      timestamp: now,
    });
  }

  const status: 'Normal' | 'Warning' | 'Critical' = alerts.some(a => a.type === 'critical') ? 'Critical' :
    alerts.length > 0 ? 'Warning' : 'Normal';

  return {
    workerId: `LB-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    timestamp: now,
    status,
    vitals: baseVitals,
    faceDetection: {
      faceDetected: false,
      eyesOpen: true,
      cameraActive: false,
    },
    alerts,
  };
};

export const useHealthStore = create<{
  healthData: HealthData | null;
  history: HealthData[];
  isConnected: boolean;
  cameraActive: boolean;
  eyesClosedDuration: number;
  alertBeeping: boolean;
  modelsLoaded: boolean;
  connect: () => void;
  disconnect: () => void;
  toggleCamera: () => void;
  updateEyeState: (eyesOpen: boolean, faceDetected: boolean) => void;
  stopBeep: () => void;
  loadModels: () => Promise<void>;
}>((set, get) => {
  const initialData = generateMockHealthData();

  return {
    healthData: initialData,
    history: [initialData],
    isConnected: false,
    cameraActive: false,
    eyesClosedDuration: 0,
    alertBeeping: false,
    modelsLoaded: false,

    loadModels: async () => {
      if (get().modelsLoaded) return;
      
      try {
        // Use jsdelivr CDN for face-api.js models
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        set({ modelsLoaded: true });
        console.log('Face detection models loaded successfully');
      } catch (error) {
        console.error('Failed to load face detection models:', error);
        // Try alternative CDN
        try {
          const ALT_MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(ALT_MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(ALT_MODEL_URL),
          ]);
          set({ modelsLoaded: true });
          console.log('Face detection models loaded from alternative CDN');
        } catch (altError) {
          console.error('Failed to load from alternative CDN:', altError);
        }
      }
    },

    connect: () => {
      if (get().isConnected) return;

      // Load models first
      get().loadModels();

      // Start mock data updates if not already started
      if (!(get() as any).mockInterval) {
        const interval = setInterval(() => {
          const newData = generateMockHealthData();
          const current = get();
          // Preserve face detection state from real detection
          if (current.healthData) {
            newData.faceDetection = current.healthData.faceDetection;
          }
          set((state) => {
            const newHistory = [...(state.history || []), newData].slice(-MAX_HISTORY);
            return {
              healthData: newData,
              history: newHistory
            };
          });
        }, 2000);
        (get() as any).mockInterval = interval;
      }

      const tryConnect = () => {
        try {
          const ws = new WebSocket('ws://localhost:3002');

          ws.onopen = () => {
            console.log('Connected to Health Monitoring System');
            set({ isConnected: true });
          };

          ws.onclose = () => {
            console.log('Disconnected from Health Monitoring System');
            set({ isConnected: false });
            setTimeout(() => {
              if (!get().isConnected) {
                tryConnect();
              }
            }, 5000);
          };

          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              if (message.type === 'HEALTH_UPDATE') {
                const newData = message.data as HealthData;
                set((state) => {
                  const newHistory = [...(state.history || []), newData].slice(-MAX_HISTORY);
                  return {
                    healthData: newData,
                    history: newHistory
                  };
                });
              }
            } catch (e) {
              console.error('Failed to parse message', e);
            }
          };

          ws.onerror = () => {
            console.log('WebSocket error, continuing with mock data');
          };

          (get() as any).socket = ws;
        } catch (error) {
          console.error('WebSocket connection failed, using mock data:', error);
        }
      };

      tryConnect();
    },

    disconnect: () => {
      const ws = (get() as any).socket;
      if (ws) {
        ws.close();
      }
      const mockInterval = (get() as any).mockInterval;
      if (mockInterval) {
        clearInterval(mockInterval);
        (get() as any).mockInterval = null;
      }
      set({ isConnected: false });
    },

    toggleCamera: () => {
      const active = get().cameraActive;
      if (!active) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(async (stream) => {
            // Ensure models are loaded
            await get().loadModels();
            set({ cameraActive: true, eyesClosedDuration: 0 });
            (get() as any).videoStream = stream;
          })
          .catch((error) => {
            console.error('Camera access denied:', error);
          });
      } else {
        const stream = (get() as any).videoStream;
        if (stream) {
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        if ((get() as any).eyeDetectionInterval) {
          clearInterval((get() as any).eyeDetectionInterval);
          (get() as any).eyeDetectionInterval = null;
        }
        if ((get() as any).beepInterval) {
          clearInterval((get() as any).beepInterval);
          (get() as any).beepInterval = null;
        }
        set({ cameraActive: false, eyesClosedDuration: 0, alertBeeping: false });
      }
    },

    updateEyeState: (eyesOpen: boolean, faceDetected: boolean) => {
      const current = get();
      
      if (eyesOpen) {
        set({ eyesClosedDuration: 0, alertBeeping: false });
        if ((get() as any).beepInterval) {
          clearInterval((get() as any).beepInterval);
          (get() as any).beepInterval = null;
        }
        
        if (current.healthData) {
          const updatedHealthData = {
            ...current.healthData,
            faceDetection: {
              faceDetected,
              eyesOpen: true,
              cameraActive: current.cameraActive,
            }
          };
          set({ healthData: updatedHealthData });
        }
      } else {
        const newDuration = current.eyesClosedDuration + 0.1;
        set({ eyesClosedDuration: newDuration });
        
        if (current.healthData) {
          const updatedHealthData = {
            ...current.healthData,
            faceDetection: {
              faceDetected,
              eyesOpen: false,
              cameraActive: current.cameraActive,
            }
          };
          set({ healthData: updatedHealthData });
        }
        
        if (newDuration >= 6 && !current.alertBeeping) {
          set({ alertBeeping: true });
          startBeep();
        }
      }
    },

    stopBeep: () => {
      if ((get() as any).beepInterval) {
        clearInterval((get() as any).beepInterval);
        (get() as any).beepInterval = null;
      }
      set({ alertBeeping: false });
    }
  };

  function startBeep() {
    const beepInterval = setInterval(() => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (error) {
        console.error('Beep error:', error);
      }
    }, 500);

    (get() as any).beepInterval = beepInterval;
  }
});
