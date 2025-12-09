import { create } from 'zustand';
import type { HealthData } from '../types';

const MAX_HISTORY = 60;

export const useHealthStore = create<{
  healthData: HealthData | null;
  history: HealthData[];
  isConnected: boolean;
  cameraActive: boolean;
  connect: () => void;
  disconnect: () => void;
  toggleCamera: () => void;
}>((set, get) => ({
  healthData: null,
  history: [],
  isConnected: false,
  cameraActive: false,
  socket: null,

  connect: () => {
    if (get().isConnected) return;

    const ws = new WebSocket('ws://localhost:3002');

    ws.onopen = () => {
      console.log('Connected to Health Monitoring System');
      set({ isConnected: true });
    };

    ws.onclose = () => {
      console.log('Disconnected from Health Monitoring System');
      set({ isConnected: false });
      setTimeout(() => get().connect(), 3000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'HEALTH_UPDATE') {
          const newData = message.data as HealthData;
          set((state) => {
            const newHistory = [...state.history, newData].slice(-MAX_HISTORY);
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

    (get() as any).socket = ws;
  },

  disconnect: () => {
    const ws = (get() as any).socket;
    if (ws) {
      ws.close();
    }
    set({ isConnected: false });
  },

  toggleCamera: () => {
    const active = get().cameraActive;
    if (!active) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          set({ cameraActive: true });
          // Store stream for cleanup
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
      set({ cameraActive: false });
    }
  }
}));

