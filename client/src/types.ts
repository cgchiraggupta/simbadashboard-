// ============================================================================
// OPERATOR AUTHENTICATION TYPES
// ============================================================================

export interface Operator {
  id: string;
  name: string;
  email: string;
  role: 'operator' | 'supervisor' | 'admin';
  avatar?: string;
}

export interface OperatorSession {
  id: string;
  operatorId: string;
  operatorName: string;
  loginTime: number;
  logoutTime?: number;
  status: 'active' | 'completed';
  healthAlerts: number;
  drillAlerts: number;
}

export interface AuthState {
  operator: Operator | null;
  isAuthenticated: boolean;
  currentSession: OperatorSession | null;
  sessionHistory: OperatorSession[];
  login: (operatorId: string, password: string) => boolean;
  logout: () => void;
}

// ============================================================================
// SENSOR & DRILL TYPES
// ============================================================================

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

