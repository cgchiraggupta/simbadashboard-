import { create } from 'zustand';
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

  // Occasionally create warning/critical values
  if (Math.random() > 0.9) {
    baseVitals.heartRate = 55 + Math.random() * 5; // Below normal
  }
  if (Math.random() > 0.95) {
    baseVitals.temperature = 37.5 + Math.random() * 0.5; // Above normal
  }

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
      faceDetected: Math.random() > 0.2,
      eyesOpen: Math.random() > 0.3,
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
  eyesClosedDuration: number; // Duration in seconds
  alertBeeping: boolean;
  connect: () => void;
  disconnect: () => void;
  toggleCamera: () => void;
  updateEyeState: (eyesOpen: boolean) => void;
  stopBeep: () => void;
}>((set, get) => {
  // Initialize with mock data for development
  const initialData = generateMockHealthData();

  return {
    healthData: initialData,
    history: [initialData],
    isConnected: false,
    cameraActive: false,
    eyesClosedDuration: 0,
    alertBeeping: false,

    connect: () => {
      if (get().isConnected) return;

      // Start mock data updates if not already started
      if (!(get() as any).mockInterval) {
        const interval = setInterval(() => {
          const newData = generateMockHealthData();
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

            // Retry connection after 5 seconds
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
          .then((stream) => {
            set({ cameraActive: true, eyesClosedDuration: 0 });
            // Store stream for cleanup
            (get() as any).videoStream = stream;
            // Start eye detection monitoring
            startEyeDetection(stream);
          })
          .catch((error) => {
            console.error('Camera access denied:', error);
          });
      } else {
        const stream = (get() as any).videoStream;
        if (stream) {
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        // Clear intervals
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

    updateEyeState: (eyesOpen: boolean) => {
      const current = get();
      
      // Update healthData with new eye state
      if (current.healthData) {
        const updatedHealthData = {
          ...current.healthData,
          faceDetection: {
            ...current.healthData.faceDetection,
            eyesOpen,
            cameraActive: current.cameraActive,
          }
        };
        set({ healthData: updatedHealthData });
      }
      
      if (eyesOpen) {
        // Eyes opened, reset duration
        set({ eyesClosedDuration: 0, alertBeeping: false });
        // Stop beep if playing
        if ((get() as any).beepInterval) {
          clearInterval((get() as any).beepInterval);
          (get() as any).beepInterval = null;
        }
      } else {
        // Eyes closed, increment duration
        const newDuration = current.eyesClosedDuration + 0.1; // Update every 100ms
        set({ eyesClosedDuration: newDuration });
        
        // If closed for 6 seconds, start beeping
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

  // Helper function to start beep sound
  function startBeep() {
    const beepInterval = setInterval(() => {
      // Create beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Beep frequency
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }, 500); // Beep every 500ms

    (get() as any).beepInterval = beepInterval;
  }

  // Helper function to start eye detection (simulated for now)
  function startEyeDetection(stream: MediaStream) {
    // For now, we'll simulate eye detection
    // In production, you would use face-api.js, MediaPipe, or similar
    let lastEyeState = true;
    let eyeStateChangeTime = Date.now();
    let closedStartTime: number | null = null;

    const eyeDetectionInterval = setInterval(() => {
      if (!get().cameraActive) {
        clearInterval(eyeDetectionInterval);
        return;
      }

      const current = get();
      const now = Date.now();

      // Simulate eye detection - in real implementation, use face detection library
      // For demo: randomly change eye state, but keep it closed for 6+ seconds sometimes
      const timeSinceChange = closedStartTime ? (now - closedStartTime) / 1000 : 0;

      // Simulate: eyes close randomly, stay closed for 6+ seconds sometimes
      if (Math.random() > 0.98) {
        // Randomly close eyes
        if (lastEyeState) {
          lastEyeState = false;
          closedStartTime = now;
          get().updateEyeState(false);
        }
      } else if (Math.random() > 0.85 && !lastEyeState) {
        // Randomly open eyes
        lastEyeState = true;
        closedStartTime = null;
        get().updateEyeState(true);
      } else if (!lastEyeState) {
        // Continue tracking closed duration
        get().updateEyeState(false);
      } else {
        // Eyes are open, ensure state is correct
        if (!current.healthData?.faceDetection.eyesOpen) {
          get().updateEyeState(true);
        }
      }
    }, 100); // Check every 100ms

    (get() as any).eyeDetectionInterval = eyeDetectionInterval;
  }
});