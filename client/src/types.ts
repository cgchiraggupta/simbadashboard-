export interface SensorData {
  rpm: number;
  vibration: number;
  sound: number;
  temperature: number;
  humidity: number;
  pressure: number;
  current: number;
}

export interface DrillData {
  timestamp: number;
  status: 'Running' | 'Stopped' | 'Alert' | 'Critical';
  sensors: SensorData;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  timestamp: number;
}

export interface DrillState {
  data: DrillData | null;
  history: DrillData[];
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendCommand: (command: string, value?: number) => void;
}

export interface HealthData {
  workerId: string;
  timestamp: number;
  status: 'Normal' | 'Warning' | 'Critical';
  vitals: {
    pulseRate: number;
    heartRate: number;
    spO2: number;
    bloodPressure: number;
    temperature: number;
    respirationRate: number;
  };
  faceDetection: {
    faceDetected: boolean;
    eyesOpen: boolean;
    cameraActive: boolean;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'critical';
    message: string;
    timestamp: number;
  }>;
}

