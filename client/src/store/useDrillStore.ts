import { create } from 'zustand';
import type { DrillData, DrillState } from '../types';

const MAX_HISTORY = 60; // 60 seconds of history (approx, depending on update rate)

// Store for mock control state
let mockControlState = {
  isRunning: true,
  targetRpm: 1500,
  feedLevel: 5,
};

// Generate mock drill data for development
const generateMockDrillData = (): DrillData => {
  const now = Date.now();
  
  // Base values influenced by control state
  const baseRpm = mockControlState.isRunning ? mockControlState.targetRpm : 0;
  const basePressure = mockControlState.feedLevel * 30;
  
  const sensors = {
    rpm: mockControlState.isRunning ? baseRpm + Math.random() * 100 - 50 : 0,
    vibration: mockControlState.isRunning ? 30 + Math.random() * 20 - 10 : 0,
    sound: mockControlState.isRunning ? 70 + Math.random() * 15 - 7 : 20,
    temperature: mockControlState.isRunning ? 45 + Math.random() * 10 - 5 : 25,
    humidity: 55 + Math.random() * 10 - 5,
    pressure: mockControlState.isRunning ? basePressure + Math.random() * 20 - 10 : 0,
    current: mockControlState.isRunning ? 6 + Math.random() * 2 - 1 : 0,
  };

  const alerts: DrillData['alerts'] = [];
  if (sensors.temperature > 60) {
    alerts.push({
      id: `alert-${now}`,
      type: 'warning',
      message: 'Motor temperature elevated',
      timestamp: now,
    });
  }
  if (sensors.vibration > 50) {
    alerts.push({
      id: `alert-${now + 1}`,
      type: 'critical',
      message: 'High vibration detected',
      timestamp: now,
    });
  }

  const status: DrillData['status'] = !mockControlState.isRunning ? 'Stopped' :
    alerts.some(a => a.type === 'critical') ? 'Critical' :
    alerts.length > 0 ? 'Alert' : 'Running';

  return {
    timestamp: now,
    status,
    sensors,
    alerts,
  };
};

export const useDrillStore = create<DrillState>((set, get) => {
  // Generate initial mock data
  const initialData = generateMockDrillData();

  return {
    data: initialData,
    history: [initialData],
    isConnected: false,

    connect: () => {
      if (get().isConnected) return;

      // Start mock data updates immediately and set connected
      if (!(get() as any).mockInterval) {
        // Set connected true for mock mode (controls will work)
        set({ isConnected: true });
        
        const interval = setInterval(() => {
          const newData = generateMockDrillData();
          set((state) => {
            const newHistory = [...state.history, newData].slice(-MAX_HISTORY);
            return {
              data: newData,
              history: newHistory
            };
          });
        }, 1000); // Update every second
        (get() as any).mockInterval = interval;
      }

      // Also try real WebSocket connection
      try {
        const ws = new WebSocket('ws://localhost:3001');

        ws.onopen = () => {
          console.log('Connected to Drill System');
          set({ isConnected: true });
        };

        ws.onclose = () => {
          console.log('Disconnected from Drill System');
          // Don't set disconnected if mock data is running
          if (!(get() as any).mockInterval) {
            set({ isConnected: false });
          }
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

        ws.onerror = () => {
          console.log('WebSocket error, using mock data');
        };

        (get() as any).ws = ws;
      } catch (error) {
        console.log('WebSocket connection failed, using mock data');
      }
    },

    disconnect: () => {
      const ws = (get() as any).ws;
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

    sendCommand: (command: string, value?: number) => {
      const ws = (get() as any).ws;
      
      // Handle commands locally for mock mode
      console.log(`🎮 Command: ${command}`, value !== undefined ? `Value: ${value}` : '');
      
      switch (command) {
        case 'START':
          mockControlState.isRunning = true;
          console.log('✅ System STARTED');
          break;
        case 'STOP':
          mockControlState.isRunning = false;
          console.log('🛑 System STOPPED');
          break;
        case 'RESET':
          mockControlState.isRunning = true;
          mockControlState.targetRpm = 1500;
          mockControlState.feedLevel = 5;
          console.log('🔄 System RESET');
          break;
        case 'SET_RPM':
          if (value !== undefined) {
            mockControlState.targetRpm = value;
            console.log(`⚙️ RPM set to ${value}`);
          }
          break;
        case 'SET_FEED':
          if (value !== undefined) {
            mockControlState.feedLevel = value;
            console.log(`⚙️ Feed level set to ${value}`);
          }
          break;
      }
      
      // Immediately update data to reflect changes
      const newData = generateMockDrillData();
      set((state) => ({
        data: newData,
        history: [...state.history, newData].slice(-MAX_HISTORY)
      }));
      
      // Also send to WebSocket if connected
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'CONTROL',
          payload: { command, value }
        }));
      }
    }
  };
});

