/**
 * ============================================================================
 * HEALTH STORE - EYE TRACKING DROWSINESS DETECTION
 * ============================================================================
 * 
 * 🎯 MISSION: Track EYES specifically, not just face!
 * 
 * THREE SCENARIOS:
 * 
 * ✅ SAFE STATE: EYES VISIBLE + EYES OPEN
 *   → Timer resets to 0
 *   → No alert
 * 
 * 🚨 ALERT SCENARIO 1: EYES VISIBLE but CLOSED
 *   → Face detected AND eyes have valid landmarks (6 points each)
 *   → But EAR (Eye Aspect Ratio) ≤ threshold (eyes closed)
 *   → Timer starts counting (real-time based)
 *   → At 5 seconds: ALERT triggers with beep + overlay
 *   → Console: "👁️ EYES CLOSED - Timer: X.Xs / 5.0s"
 * 
 * 🚨 ALERT SCENARIO 2: EYES NOT VISIBLE
 *   → Sub-case A: No face detected at all
 *   → Sub-case B: Face detected BUT eyes don't have valid landmarks
 *     (person looking away, eyes occluded, etc.)
 *   → Timer starts counting (real-time based)
 *   → At 5 seconds: ALERT triggers with beep + overlay
 *   → Console: "👁️ EYES NOT VISIBLE - Timer: X.Xs / 5.0s"
 * 
 * ALERT BEHAVIOR:
 * - Timer uses REAL TIME (Date.now() timestamps), not frame-based
 * - Triggers when eyesClosedDuration >= 5 seconds
 * - Does NOT auto-stop when eyes reopen or become visible again
 * - Only stops via stopBeep() (STOP ALERT button click)
 * - Beep sound (800Hz) plays every 500ms continuously
 * 
 * FUNCTION SIGNATURE:
 * updateEyeState(eyesOpen: boolean, eyesVisible: boolean, faceDetected: boolean)
 * 
 * ============================================================================
 */

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
  lastEyeState: 'open' | 'closed' | null;
  lastEyeStateTime: number;
  eyesClosedStartTime: number | null; // Track when eyes first closed (real timestamp)
  connect: () => void;
  disconnect: () => void;
  toggleCamera: () => void;
  updateEyeState: (eyesOpen: boolean, eyesVisible: boolean, faceDetected: boolean) => void;
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
    lastEyeState: null,
    lastEyeStateTime: 0,
    eyesClosedStartTime: null,

    loadModels: async () => {
      if (get().modelsLoaded) return;

      try {
        // Use correct model URL for face-api.js
        const MODEL_URL = '/models';

        console.log('Loading face detection models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        set({ modelsLoaded: true });
        console.log('✅ Face detection models loaded successfully');
      } catch (error) {
        console.error('Failed to load face detection models from /models:', error);
        // Try CDN as fallback
        try {
          const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
          console.log('Trying CDN fallback...');
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
          ]);
          set({ modelsLoaded: true });
          console.log('✅ Face detection models loaded from CDN');
        } catch (altError) {
          console.error('Failed to load from CDN:', altError);
          // Try jsdelivr with different path
          try {
            const ALT_CDN = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
            console.log('Trying alternative CDN...');
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(ALT_CDN),
              faceapi.nets.faceLandmark68Net.loadFromUri(ALT_CDN),
            ]);
            set({ modelsLoaded: true });
            console.log('✅ Face detection models loaded from alternative CDN');
          } catch (finalError) {
            console.error('All model loading attempts failed:', finalError);
          }
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
        // Just toggle state - let HealthMonitor.tsx useEffect handle the actual stream
        // Ensure models are loaded first
        get().loadModels().then(() => {
          set({ cameraActive: true, eyesClosedDuration: 0, eyesClosedStartTime: null });
        });
      } else {
        // Stop camera - cleanup is handled by HealthMonitor.tsx useEffect cleanup
        set({ cameraActive: false, eyesClosedDuration: 0, alertBeeping: false, eyesClosedStartTime: null });
        // Stop beep if active
        if ((get() as any).beepInterval) {
          clearInterval((get() as any).beepInterval);
          (get() as any).beepInterval = null;
        }
      }
    },

    updateEyeState: (eyesOpen: boolean, eyesVisible: boolean, faceDetected: boolean) => {
      const current = get();
      
      // DEBUG: Log all state updates
      console.log(`🔄 updateEyeState called: eyesOpen=${eyesOpen}, eyesVisible=${eyesVisible}, faceDetected=${faceDetected}`);

      // SCENARIO 1: Eyes VISIBLE and OPEN - SAFE STATE ✅
      if (eyesVisible && eyesOpen) {
        // CRITICAL FIX: Only reset timer if eyes have been open for at least 0.5 seconds
        // This prevents timer from resetting due to brief flickering
        // Use a debounce mechanism - only reset after sustained open state
        const lastEyeState = current.lastEyeState;
        const lastEyeStateTime = current.lastEyeStateTime || Date.now();
        
        if (lastEyeState !== 'open') {
          // Eyes just opened - start debounce timer
          set({ lastEyeState: 'open', lastEyeStateTime: Date.now() });
        } else {
          // Eyes have been open - check if it's been long enough to reset timer
          const timeSinceOpen = Date.now() - lastEyeStateTime;
          if (timeSinceOpen >= 500) { // 500ms debounce - eyes must be open for 0.5s before reset
            set({ eyesClosedDuration: 0, eyesClosedStartTime: null });
          }
        }

        if (current.healthData) {
          const updatedHealthData = {
            ...current.healthData,
            faceDetection: {
              faceDetected: true,
              eyesOpen: true,
              cameraActive: current.cameraActive,
            }
          };
          set({ healthData: updatedHealthData });
        }
      } 
      // SCENARIO 2: Eyes VISIBLE but CLOSED - DANGER! Start timer 🚨
      else if (eyesVisible && !eyesOpen) {
        console.log(`🚨 SCENARIO 2 TRIGGERED: Eyes visible but CLOSED!`);
        
        // Reset debounce state immediately when eyes close
        set({ lastEyeState: 'closed', lastEyeStateTime: Date.now() });
        
        // FIX: Use REAL TIME instead of frame-based increments
        const now = Date.now();
        let startTime = current.eyesClosedStartTime;
        
        // If timer not started yet, start it now
        if (startTime === null) {
          startTime = now;
          set({ eyesClosedStartTime: startTime });
          console.log(`⚠️⚠️⚠️ EYES CLOSED DETECTED! (Eyes visible but closed) Starting 5-second timer...`);
          console.log(`⏱️ Timer started at: ${new Date(startTime).toISOString()}`);
        } else {
          // Timer already running - log progress
          const elapsed = (now - startTime) / 1000;
          console.log(`⏱️ Timer running: ${elapsed.toFixed(1)}s / 5.0s`);
        }
        
        // Calculate REAL elapsed time in seconds
        const elapsedMs = now - startTime;
        const newDuration = elapsedMs / 1000; // Convert to seconds
        set({ eyesClosedDuration: newDuration });

        // Log every 0.5 seconds for better visibility
        if (Math.floor(newDuration * 2) !== Math.floor((current.eyesClosedDuration) * 2)) {
          console.log(`👁️ EYES CLOSED - Timer: ${newDuration.toFixed(1)}s / 5.0s`);
        }

        if (current.healthData) {
          const updatedHealthData = {
            ...current.healthData,
            faceDetection: {
              faceDetected: true,
              eyesOpen: false,
              cameraActive: current.cameraActive,
            }
          };
          set({ healthData: updatedHealthData });
        }

        // Trigger alert when eyes closed for 5+ seconds
        if (newDuration >= 5 && !current.alertBeeping) {
          set({ alertBeeping: true });
          startBeep();
          console.log('🚨 ALERT TRIGGERED: Eyes closed for 5+ seconds!');
        }
      }
      // SCENARIO 3: EYES NOT VISIBLE - DANGER! Start timer 🚨
      // This includes: no face OR face detected but eyes not trackable
      else if (!eyesVisible) {
        // Reset debounce state
        set({ lastEyeState: 'closed', lastEyeStateTime: Date.now() });
        
        // FIX: Use REAL TIME instead of frame-based increments
        const now = Date.now();
        let startTime = current.eyesClosedStartTime;
        
        // If timer not started yet, start it now
        if (startTime === null) {
          startTime = now;
          set({ eyesClosedStartTime: startTime });
          const reason = faceDetected 
            ? 'Eyes not visible (face detected but eyes not trackable)' 
            : 'Eyes not visible (no face in frame)';
          console.log(`⚠️ ${reason} - Starting 5-second timer...`);
        }
        
        // Calculate REAL elapsed time in seconds
        const elapsedMs = now - startTime;
        const newDuration = elapsedMs / 1000; // Convert to seconds
        set({ eyesClosedDuration: newDuration });

        // Log every 0.5 seconds
        if (Math.floor(newDuration * 2) !== Math.floor((current.eyesClosedDuration) * 2)) {
          const reason = faceDetected ? 'eyes not trackable' : 'no face';
          console.log(`👁️ EYES NOT VISIBLE (${reason}) - Timer: ${newDuration.toFixed(1)}s / 5.0s`);
        }

        if (current.healthData) {
          const updatedHealthData = {
            ...current.healthData,
            faceDetection: {
              faceDetected: faceDetected, // Keep faceDetected state
              eyesOpen: false,
              cameraActive: current.cameraActive,
            }
          };
          set({ healthData: updatedHealthData });
        }

        // Trigger alert when eyes not visible for 5+ seconds
        if (newDuration >= 5 && !current.alertBeeping) {
          set({ alertBeeping: true });
          startBeep();
          const reason = faceDetected ? 'eyes not visible' : 'no face detected';
          console.log(`🚨 ALERT TRIGGERED: ${reason} for 5+ seconds!`);
        }
      }
    },

    stopBeep: () => {
      if ((get() as any).beepInterval) {
        clearInterval((get() as any).beepInterval);
        (get() as any).beepInterval = null;
      }
      set({ alertBeeping: false });
      console.log('✅ Alert stopped by user');
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
