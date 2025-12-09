import { create } from 'zustand';
import type { DrillData, DrillState } from '../types';

const MAX_HISTORY = 60; // 60 seconds of history (approx, depending on update rate)

export const useDrillStore = create<DrillState>((set, get) => ({
  data: null,
  history: [],
  isConnected: false,
  socket: null,

  connect: () => {
    if (get().isConnected) return;

    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('Connected to Drill System');
      set({ isConnected: true });
    };

    ws.onclose = () => {
      console.log('Disconnected from Drill System');
      set({ isConnected: false });
      // Try to reconnect after 3 seconds
      setTimeout(() => get().connect(), 3000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'UPDATE') {
          const newData = message.data as DrillData;
          set((state) => {
            const newHistory = [...state.history, newData].slice(-MAX_HISTORY);
            return {
              data: newData,
              history: newHistory
            };
          });
        }
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    };

    (get() as any).ws = ws;
  },

  disconnect: () => {
    const ws = (get() as any).ws;
    if (ws) {
      ws.close();
    }
    set({ isConnected: false });
  },

  sendCommand: (command: string, value?: number) => {
    const ws = (get() as any).ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'CONTROL',
        payload: { command, value }
      }));
    } else {
      console.warn('Socket not connected');
    }
  }
}));

