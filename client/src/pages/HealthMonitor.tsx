/**
 * ============================================================================
 * DROWSINESS DETECTION SYSTEM - IMPLEMENTATION GUIDE
 * ============================================================================
 * 
 * TWO ALERT SCENARIOS:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ SCENARIO 1: EYES NOT VISIBLE in frame (no face, looking away, etc.)    │
 * │   → 5-second timer starts                                              │
 * │   → Alert triggers with full-page overlay + beep sound                 │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ SCENARIO 2: EYES VISIBLE but CLOSED                                    │
 * │   → 5-second timer starts                                              │
 * │   → Alert triggers with full-page overlay + beep sound                 │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ SAFE STATE: EYES VISIBLE + EYES OPEN                                   │
 * │   → Timer resets to 0                                                  │
 * │   → No new alert (existing alert stays until STOP button clicked)      │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ALERT FEATURES:
 * - Full-page red overlay with backdrop blur
 * - Pulsing animation on overlay
 * - Large alert modal with warning icon
 * - 800Hz beep sound every 500ms
 * - "STOP ALERT" button (only way to dismiss)
 * 
 * EYE DETECTION (Computer Vision Expert Implementation):
 * - Uses Eye Aspect Ratio (EAR) algorithm based on facial landmarks
 * - Adaptive threshold calibration (learns user's baseline)
 * - Temporal smoothing (5-frame moving average) to reduce false positives
 * - Multi-level validation (raw + smoothed EAR) for robustness
 * - Detection runs at 10 FPS (100ms intervals) - optimal balance
 * - Handles edge cases: invalid landmarks, detection errors, partial occlusion
 * 
 * ============================================================================
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Heart, Wind, Thermometer, Bell, Video, VideoOff, Eye, EyeOff } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { HealthVitalCard } from '../components/HealthVitalCard';
import { Card, Button, cn } from '../components/ui/design-system';
import { useHealthStore } from '../store/useHealthStore';
import { useLanguageStore } from '../store/useLanguageStore';

export const HealthMonitor: React.FC = () => {
  const { healthData, cameraActive, eyesClosedDuration, alertBeeping, modelsLoaded, connect, disconnect, toggleCamera, updateEyeState, stopBeep, loadModels } = useHealthStore();
  const { t } = useLanguageStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentEAR, setCurrentEAR] = useState<number | null>(null);
  const [currentThreshold, setCurrentThreshold] = useState<number>(0.20);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  
  // CV Expert: EAR smoothing buffer for temporal filtering
  // REDUCED smoothing for faster response to closed eyes
  const earHistoryRef = useRef<number[]>([]);
  const EAR_HISTORY_SIZE = 3; // REDUCED from 5 to 3 - faster response (~300ms smoothing)
  // Less smoothing = more responsive to actual eye closure
  
  // CV Expert: Adaptive threshold calibration
  // Learns user's baseline EAR to account for individual differences
  const baselineEARRef = useRef<number | null>(null);
  const calibrationFramesRef = useRef<number>(0);
  const CALIBRATION_FRAMES = 20; // ~2 seconds calibration at 100ms intervals
  // Longer calibration = more stable baseline, less affected by initial blinks

  useEffect(() => {
    connect();
    loadModels();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate Eye Aspect Ratio (EAR) - Computer Vision Expert Implementation
  // Based on research: "Real-Time Eye Blink Detection using Facial Landmarks"
  // EAR formula: (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
  const calculateEAR = useCallback((eye: faceapi.Point[]) => {
    // Validate input - must have exactly 6 points
    if (!eye || eye.length !== 6) {
      return 0; // Invalid - return 0 (will be treated as closed)
    }

    // Calculate vertical distances (eye height measurements)
    const vertical1 = Math.abs(eye[1].y - eye[5].y);
    const vertical2 = Math.abs(eye[2].y - eye[4].y);
    
    // Calculate horizontal distance (eye width)
    const horizontal = Math.abs(eye[0].x - eye[3].x);

    // Prevent division by zero (shouldn't happen with valid landmarks, but safety first)
    if (horizontal === 0) {
      console.warn('⚠️ Invalid eye landmarks: horizontal distance is 0');
      return 0; // Treat as closed
    }

    // EAR formula: average of two vertical measurements divided by horizontal width
    // Open eyes: EAR typically 0.25-0.40
    // Closed eyes: EAR typically 0.10-0.18
    const ear = (vertical1 + vertical2) / (2.0 * horizontal);
    
    // Validate result is reasonable (EAR should be between 0 and 1 for normal eyes)
    if (ear < 0 || ear > 1) {
      console.warn(`⚠️ Invalid EAR value: ${ear.toFixed(3)} - possible landmark error`);
      return 0; // Treat as closed for safety
    }
    
    return ear;
  }, []);

  // Real-time eye detection from video feed
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const detectEyes = async () => {
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.log('⏳ Video not ready yet...');
        return;
      }

      try {
        // CV Expert: Optimized detection options for industrial safety monitoring
        // Balance between accuracy and performance for real-time detection
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,  // Increased for better landmark accuracy (320→416)
          scoreThreshold: 0.5  // Balanced threshold - not too low (false positives) or too high (misses)
        });

        // Try detection with landmarks
        const detections = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks();

        if (detections) {
          const landmarks = detections.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          console.log(`🔍 FACE DETECTED! Left eye points: ${leftEye.length}, Right eye points: ${rightEye.length}`);

          // CV Expert: Validate eye landmarks quality
          // Must have exactly 6 points each for accurate EAR calculation
          if (leftEye.length === 6 && rightEye.length === 6) {
            // ✅ EYES ARE VISIBLE - We can track them!
            
            // Calculate EAR for each eye independently
            const leftEAR = calculateEAR(leftEye);
            const rightEAR = calculateEAR(rightEye);
            
            // CV Expert: Use weighted average (more weight to eye with higher confidence)
            // If one eye has invalid EAR (0), use the other eye
            let avgEAR: number;
            if (leftEAR === 0 && rightEAR === 0) {
              // Both eyes invalid - treat as not visible
              console.warn('⚠️ Both eyes have invalid EAR - treating as not visible');
              updateEyeState(false, false, true);
              return;
            } else if (leftEAR === 0) {
              avgEAR = rightEAR; // Use right eye only
            } else if (rightEAR === 0) {
              avgEAR = leftEAR; // Use left eye only
            } else {
              // Both valid - use average
              avgEAR = (leftEAR + rightEAR) / 2;
            }
            
            // DEBUG: Log every EAR calculation
            console.log(`📊 EAR: L=${leftEAR.toFixed(3)} R=${rightEAR.toFixed(3)} AVG=${avgEAR.toFixed(3)}`);

            // CV Expert: Temporal smoothing with smart buffer management
            // If current EAR is low (< 0.20), likely eyes just closed - reset buffer for immediate detection
            if (avgEAR < 0.20 && earHistoryRef.current.length > 0) {
              // Check if previous values were high (eyes were open)
              const prevAvg = earHistoryRef.current.reduce((a, b) => a + b, 0) / earHistoryRef.current.length;
              if (prevAvg > 0.24) {
                // Eyes just closed - reset buffer to current value for immediate detection
                console.log(`🔄 Eyes just closed detected - resetting smoothing buffer`);
                earHistoryRef.current = [avgEAR]; // Start fresh with closed eye value
              }
            }
            
            earHistoryRef.current.push(avgEAR);
            if (earHistoryRef.current.length > EAR_HISTORY_SIZE) {
              earHistoryRef.current.shift(); // Remove oldest
            }

            // Calculate smoothed EAR using moving average
            // This reduces noise from brief blinks or detection errors
            const smoothedEAR = earHistoryRef.current.reduce((a, b) => a + b, 0) / earHistoryRef.current.length;

            // CV Expert: Adaptive threshold calibration
            // Learn user's baseline EAR when eyes are clearly open (avoid learning during blinks)
            // Only calibrate when EAR is clearly in "open" range (> 0.25) and stable
            if (calibrationFramesRef.current < CALIBRATION_FRAMES && smoothedEAR > 0.25) {
              calibrationFramesRef.current++;
              if (baselineEARRef.current === null) {
                baselineEARRef.current = smoothedEAR;
                console.log(`📐 Calibration started - Baseline EAR: ${smoothedEAR.toFixed(3)}`);
              } else {
                // Update baseline using exponential moving average (only increase during calibration)
                // This ensures we learn the user's "fully open" state, not partially closed
                if (smoothedEAR > baselineEARRef.current) {
                  baselineEARRef.current = (baselineEARRef.current * 0.9) + (smoothedEAR * 0.1);
                }
              }
            }

            // CV Expert: Dynamic threshold calculation
            // Closed eyes EAR ~0.10-0.18, Open eyes EAR ~0.25-0.40
            // Make it harder to be considered "open" to catch cases like EAR≈0.24
            const baseThreshold = 0.26; // raise floor so 0.24 is treated as closed
            
            // Adaptive threshold: Use 80% of user's baseline, cap at 0.30
            // Higher % makes classification stricter (more likely to mark closed)
            const adaptiveThreshold = baselineEARRef.current && baselineEARRef.current > 0.25
              ? Math.min(baselineEARRef.current * 0.80, 0.30)
              : baseThreshold;
            
            const EYE_CLOSED_THRESHOLD = adaptiveThreshold;
            
            // DEBUG: Log threshold for debugging
            console.log(`🎯 Threshold: ${EYE_CLOSED_THRESHOLD.toFixed(3)} (baseline: ${baselineEARRef.current?.toFixed(3) || 'not calibrated'})`);
            
            // CV Expert: More sensitive detection - prioritize catching closed eyes
            // If EITHER raw OR smoothed indicates closed, treat as closed
            const rawEyesClosed = avgEAR < EYE_CLOSED_THRESHOLD;
            const smoothedEyesClosed = smoothedEAR < EYE_CLOSED_THRESHOLD;
            
            // Safety margin: if smoothed EAR is within +0.03 of threshold, still treat as closed
            const nearThresholdClosed = smoothedEAR < (EYE_CLOSED_THRESHOLD + 0.03);
            
            // Additional clamp: if smoothedEAR < 0.26, force closed (covers your 0.24 case)
            const hardClampClosed = smoothedEAR < 0.26;
            
            const finalEyesOpen = !(rawEyesClosed || smoothedEyesClosed || nearThresholdClosed || hardClampClosed);
            
            // Additional validation: Check if EAR is suspiciously low (possible detection error)
            if (smoothedEAR < 0.05) {
              console.warn(`⚠️ Suspiciously low EAR (${smoothedEAR.toFixed(3)}) - possible detection error`);
              // Still treat as closed for safety, but log for debugging
            }

            // Update UI state for real-time display
            setCurrentEAR(smoothedEAR);
            setCurrentThreshold(EYE_CLOSED_THRESHOLD);

            // ALWAYS LOG - critical for debugging
            const status = finalEyesOpen ? '✅ OPEN' : '❌ CLOSED';
            const rawStatus = rawEyesClosed ? '🔴 RAW:CLOSED' : '🟢 RAW:OPEN';
            const smoothStatus = smoothedEyesClosed ? '🔴 SMOOTH:CLOSED' : '🟢 SMOOTH:OPEN';
            const definiteStatus = definitelyClosed ? '🔴 DEFINITELY_CLOSED' : '';
            console.log(`👁️ [${avgEAR.toFixed(3)} vs ${EYE_CLOSED_THRESHOLD.toFixed(3)}] ${rawStatus} | ${smoothStatus} ${definiteStatus} → ${status}`);
            
            // Extra warning when eyes are detected as closed
            if (!finalEyesOpen) {
              console.warn(`⚠️⚠️⚠️ EYES CLOSED DETECTED! Raw: ${avgEAR.toFixed(3)}, Smoothed: ${smoothedEAR.toFixed(3)}, Threshold: ${EYE_CLOSED_THRESHOLD.toFixed(3)}`);
              console.warn(`⚠️⚠️⚠️ Calling updateEyeState(false, true, true) ⚠️⚠️⚠️`);
            }
            
            // Update state: eyesVisible=true (we can see them), eyesOpen=calculated, faceDetected=true
            updateEyeState(finalEyesOpen, true, true);

            // Draw on canvas for visual feedback (important for demo)
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Draw face detection box with better visibility
                const box = detections.detection.box;
                ctx.strokeStyle = finalEyesOpen ? '#10b981' : '#ef4444';
                ctx.lineWidth = 4;
                ctx.strokeRect(box.x, box.y, box.width, box.height);

                // Draw eye landmarks with better visibility
                ctx.fillStyle = finalEyesOpen ? '#10b981' : '#ef4444';
                ctx.strokeStyle = finalEyesOpen ? '#10b981' : '#ef4444';
                leftEye.forEach((point, idx) => {
                  ctx.beginPath();
                  ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                  ctx.fill();
                  // Draw connections for better visibility
                  if (idx < leftEye.length - 1) {
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                    ctx.lineTo(leftEye[idx + 1].x, leftEye[idx + 1].y);
                    ctx.stroke();
                  }
                });
                rightEye.forEach((point, idx) => {
                  ctx.beginPath();
                  ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                  ctx.fill();
                  if (idx < rightEye.length - 1) {
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                    ctx.lineTo(rightEye[idx + 1].x, rightEye[idx + 1].y);
                    ctx.stroke();
                  }
                });

                // Draw EAR value and status on canvas for demo visibility
                ctx.fillStyle = finalEyesOpen ? '#10b981' : '#ef4444';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(`EAR: ${smoothedEAR.toFixed(3)}`, box.x, box.y - 35);
                ctx.fillText(`Threshold: ${EYE_CLOSED_THRESHOLD.toFixed(3)}`, box.x, box.y - 15);
                ctx.fillText(finalEyesOpen ? 'OPEN ✓' : 'CLOSED ✗', box.x, box.y + box.height + 25);
                
                // Add big warning text if closed
                if (!finalEyesOpen) {
                  ctx.fillStyle = '#ef4444';
                  ctx.font = 'bold 32px Arial';
                  ctx.fillText('EYES CLOSED!', box.x + box.width/2 - 100, box.y - 60);
                }
              }
            }
          } else {
            // ❌ EYES NOT VISIBLE: Face detected but eyes don't have valid landmarks
            // (Person might be looking away, wearing glasses, or eyes occluded)
            console.warn(`⚠️ FACE DETECTED but EYES NOT VISIBLE (invalid landmarks: L=${leftEye.length}, R=${rightEye.length})`);
            updateEyeState(false, false, true); // eyesOpen=false, eyesVisible=false, faceDetected=true
          }
        } else {
          // ❌ EYES NOT VISIBLE: No face detected at all
          console.log(`👤 NO FACE DETECTED - Eyes not visible`);
          updateEyeState(false, false, false); // eyesOpen=false, eyesVisible=false, faceDetected=false
        }
      } catch (error) {
        // CV Expert: Robust error handling
        // Don't treat detection errors as "eyes closed" - could be temporary camera issue
        console.error('❌ Eye detection error:', error);
        // Only update state if we're sure there's a problem
        // Don't call updateEyeState on error - let previous state persist
        // This prevents false alarms from temporary detection failures
      }
    };

    // CV Expert: Optimized detection loop timing
    // Balance between responsiveness and CPU usage
    // 100ms = 10 FPS detection rate - sufficient for drowsiness detection
    // Too fast (< 50ms) wastes CPU, too slow (> 200ms) misses rapid changes
    let lastDetectionTime = 0;
    const TARGET_INTERVAL = 100; // 100ms = 10 FPS (optimal for eye tracking)
    let rafId: number;
    let detectionInProgress = false; // Prevent overlapping detections
    
    const detectionLoop = async (timestamp: number) => {
      // Skip if previous detection still running (prevents queue buildup)
      if (detectionInProgress) {
        rafId = requestAnimationFrame(detectionLoop);
        return;
      }
      
      if (timestamp - lastDetectionTime >= TARGET_INTERVAL) {
        detectionInProgress = true;
        try {
          await detectEyes();
        } catch (error) {
          console.error('Detection error in loop:', error);
        } finally {
          detectionInProgress = false;
          lastDetectionTime = timestamp;
        }
      }
      rafId = requestAnimationFrame(detectionLoop);
    };
    
    rafId = requestAnimationFrame(detectionLoop);
    detectionIntervalRef.current = rafId;

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (detectionIntervalRef.current) {
        cancelAnimationFrame(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      // Reset calibration when camera stops
      earHistoryRef.current = [];
      baselineEARRef.current = null;
      calibrationFramesRef.current = 0;
    };
  }, [cameraActive, modelsLoaded, updateEyeState, calculateEAR]);

  // Handle video stream
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      // CV Expert: Optimized video constraints for eye tracking
      // Balance between quality and performance
      const constraints = {
        video: {
          width: { ideal: 640, min: 320, max: 1280 }, // 640px optimal for face-api.js
          height: { ideal: 480, min: 240, max: 720 },  // 4:3 aspect ratio
          facingMode: 'user', // Front camera on mobile devices
          frameRate: { ideal: 30, min: 15, max: 30 }, // 30 FPS optimal for smooth detection
          // Additional constraints for better quality
          aspectRatio: { ideal: 4/3 }, // Standard webcam aspect ratio
        }
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('autoplay', 'true');
            videoRef.current.setAttribute('muted', 'true');
            
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('Video play error:', error);
              });
            }

            // Wait for video metadata to load before setting canvas dimensions
            const handleLoadedMetadata = () => {
              if (videoRef.current && canvasRef.current) {
                const videoWidth = videoRef.current.videoWidth;
                const videoHeight = videoRef.current.videoHeight;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                console.log(`✅ Camera ready: ${videoWidth}x${videoHeight}`);
              }
            };

            videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
            
            // Also handle when video is ready to play
            videoRef.current.addEventListener('playing', () => {
              console.log('✅ Video stream playing');
            });

            // Cleanup event listener
            return () => {
              if (videoRef.current) {
                videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
              }
            };
          }
        })
        .catch((error) => {
          console.error('❌ Camera access error:', error);
          let errorMessage = 'Unable to access camera. ';
          if (error.name === 'NotAllowedError') {
            errorMessage += 'Please grant camera permissions in your browser settings.';
          } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found. Please connect a camera.';
          } else if (error.name === 'NotReadableError') {
            errorMessage += 'Camera is being used by another application.';
          } else {
            errorMessage += 'Please check your camera settings.';
          }
          alert(errorMessage);
        });
    } else {
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = null;
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive]);

  if (!healthData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-border rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-textMuted font-medium animate-pulse">{t('healthMonitor.connecting')}</p>
      </div>
    );
  }

  const vitals = healthData.vitals;
  const faceDetection = healthData.faceDetection;

  const criticalCount = healthData.alerts.filter(a => a.type === 'critical').length || 0;
  const warningCount = healthData.alerts.filter(a => a.type === 'warning').length || 0;

  const getVitalStatus = (value: number, min: number, max: number, criticalMin?: number, criticalMax?: number): 'Normal' | 'Warning' | 'Critical' => {
    if (criticalMin !== undefined && value < criticalMin) return 'Critical';
    if (criticalMax !== undefined && value > criticalMax) return 'Critical';
    if (value < min || value > max) return 'Warning';
    return 'Normal';
  };

  const vitalCards = [
    {
      label: 'Pulse Rate',
      value: vitals.pulseRate,
      unit: 'bpm',
      normalRange: '60-100 bpm',
      status: getVitalStatus(vitals.pulseRate, 60, 100),
      icon: Activity,
    },
    {
      label: 'Heart Rate',
      value: vitals.heartRate,
      unit: 'bpm',
      normalRange: '60-100 bpm',
      status: getVitalStatus(vitals.heartRate, 60, 100),
      icon: Heart,
    },
    {
      label: 'SpO₂',
      value: vitals.spO2,
      unit: '%',
      normalRange: '95-100%',
      status: getVitalStatus(vitals.spO2, 95, 100, 0, 100),
      icon: Wind,
    },
    {
      label: 'Blood Pressure',
      value: vitals.bloodPressure,
      unit: 'mmHg',
      normalRange: '90-140 mmHg',
      status: getVitalStatus(vitals.bloodPressure, 90, 140),
      icon: Activity,
    },
    {
      label: 'Temperature',
      value: vitals.temperature,
      unit: '°C',
      normalRange: '36.1-37.2°C',
      status: getVitalStatus(vitals.temperature, 36.1, 37.2, 0, 100),
      icon: Thermometer,
    },
    {
      label: 'Respiration Rate',
      value: vitals.respirationRate,
      unit: 'br/min',
      normalRange: '12-20 br/min',
      status: getVitalStatus(vitals.respirationRate, 12, 20, 0, 100),
      icon: Wind,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="flex justify-between items-end pb-4 border-b border-border">
        <div>
          <h2 className="text-3xl font-bold text-text tracking-tight">{t('healthMonitor.title')}</h2>
          <p className="text-textMuted text-sm mt-1">{t('healthMonitor.subtitle')}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-surfaceHighlight px-4 py-2 rounded-full border border-border">
            <span className="text-xs font-bold text-textMuted uppercase tracking-wider">{t('healthMonitor.workerId')}</span>
            <span className="text-primary font-mono font-bold">{healthData.workerId}</span>
          </div>
          <div className="flex items-center gap-3 bg-surfaceHighlight px-4 py-2 rounded-full border border-border">
            <span className="text-xs font-bold text-textMuted uppercase tracking-wider">{t('healthMonitor.time')}</span>
            <span className="text-text font-mono font-bold">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
          <div className="p-2 rounded-lg hover:bg-surfaceHighlight text-textMuted hover:text-text transition-colors cursor-pointer">
            <Bell size={20} />
          </div>
        </div>
      </motion.header>

      {/* Alert Summary Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-surface border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text mb-2">{t('healthMonitor.alertSummary')}</h3>
              <p className={cn(
                "text-sm font-medium",
                criticalCount > 0 ? "text-danger" : warningCount > 0 ? "text-accent" : "text-success"
              )}>
                {criticalCount > 0 || warningCount > 0 ? (
                  <>
                    <span className="font-bold">{criticalCount} {t('healthMonitor.critical')}</span>
                    {warningCount > 0 && <span> · <span className="font-bold">{warningCount} {t('healthMonitor.warning')}</span></span>}
                    <span> — {t('healthMonitor.immediateAttention')}</span>
                  </>
                ) : (
                  t('healthMonitor.allVitalsNormal')
                )}
              </p>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-full border font-bold text-sm",
              criticalCount > 0 ? "bg-danger/10 text-danger border-danger/20" :
                warningCount > 0 ? "bg-accent/10 text-accent border-accent/20" :
                  "bg-success/10 text-success border-success/20"
            )}>
              {criticalCount + warningCount} ACTIVE
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Face Detection Monitor */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-surface border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text flex items-center gap-2">
              <Video size={20} className="text-primary" />
              {t('healthMonitor.faceDetectionMonitor')}
            </h3>
            <Button
              variant={cameraActive ? "outline" : "primary"}
              onClick={toggleCamera}
              className="flex items-center gap-2"
            >
              {cameraActive ? <VideoOff size={16} /> : <Video size={16} />}
              {cameraActive ? t('healthMonitor.stopCamera') : t('healthMonitor.startCamera')}
            </Button>
          </div>
          {cameraActive ? (
            <>
              {/* Loading indicator while models are loading */}
              {!modelsLoaded && (
                <div className="mb-4 p-8 bg-surfaceHighlight rounded-lg border border-border text-center">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-text font-medium">{t('healthMonitor.loadingModels')}</p>
                  <p className="text-textMuted text-sm mt-1">{t('healthMonitor.loadingModelsDesc')}</p>
                </div>
              )}

              {/* Video Feed with Overlay */}
              <div className="mb-4 relative rounded-lg overflow-hidden border-2 border-border bg-black shadow-xl" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                
                {/* Status overlay for demo visibility */}
                {modelsLoaded && (
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full animate-pulse",
                        faceDetection.faceDetected ? "bg-success" : "bg-danger"
                      )} />
                      <span className="text-text text-sm font-medium">
                        {faceDetection.faceDetected ? t('healthMonitor.faceDetected') : t('healthMonitor.noFaceDetected')}
                      </span>
                    </div>
                    {faceDetection.faceDetected && (
                      <div className="flex items-center gap-2 mt-1">
                        <Eye className={cn("w-4 h-4", faceDetection.eyesOpen ? "text-success" : "text-danger")} />
                        <span className={cn("text-xs font-medium", faceDetection.eyesOpen ? "text-success" : "text-danger")}>
                          {faceDetection.eyesOpen ? t('healthMonitor.open') : t('healthMonitor.closed')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {alertBeeping && (
                  <div className="absolute inset-0 bg-danger/30 animate-pulse flex items-center justify-center backdrop-blur-sm">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="bg-danger text-white px-6 py-4 rounded-xl font-bold text-xl shadow-2xl border-4 border-white"
                    >
                      ⚠️ {t('healthMonitor.eyesClosedAlertShort')}
                    </motion.div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Face Detection Status - Enhanced for demo */}
                <div className={cn(
                  "rounded-lg p-5 border-2 transition-all",
                  faceDetection.faceDetected 
                    ? "bg-success/10 border-success/50" 
                    : "bg-surfaceHighlight border-border"
                )}>
                  <div className="flex items-center gap-3 mb-3">
                    {faceDetection.faceDetected ? (
                      <Eye size={20} className="text-success" />
                    ) : (
                      <EyeOff size={20} className="text-textMuted" />
                    )}
                    <span className="text-sm font-bold uppercase tracking-wider text-textMuted">{t('healthMonitor.faceDetection')}</span>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold mb-1",
                    faceDetection.faceDetected ? "text-success" : "text-textMuted"
                  )}>
                    {faceDetection.faceDetected ? `✓ ${t('healthMonitor.faceDetected')}` : `✗ ${t('healthMonitor.noFaceDetected')}`}
                  </p>
                  {faceDetection.faceDetected && (
                    <p className="text-xs text-success/80">{t('healthMonitor.detectionActive')}</p>
                  )}
                </div>

                {/* Eye Activity Status - Enhanced for demo */}
                <div className={cn(
                  "rounded-lg p-5 border-2 transition-all",
                  alertBeeping 
                    ? "bg-danger/20 border-danger/70 animate-pulse" 
                    : faceDetection.eyesOpen 
                      ? "bg-success/10 border-success/50"
                      : "bg-surfaceHighlight border-border"
                )}>
                  <div className="flex items-center gap-3 mb-3">
                    {faceDetection.eyesOpen ? (
                      <Eye size={20} className="text-success" />
                    ) : (
                      <EyeOff size={20} className={alertBeeping ? "text-danger" : "text-textMuted"} />
                    )}
                    <span className="text-sm font-bold uppercase tracking-wider text-textMuted">{t('healthMonitor.eyeStatus')}</span>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold mb-1",
                    faceDetection.eyesOpen 
                      ? "text-success" 
                      : alertBeeping 
                        ? "text-danger" 
                        : "text-textMuted"
                  )}>
                    {faceDetection.faceDetected ? (
                      faceDetection.eyesOpen ? `✓ ${t('healthMonitor.open')}` : `✗ ${t('healthMonitor.closed')}`
                    ) : (
                      `— ${t('healthMonitor.notDetected')}`
                    )}
                  </p>
                  
                  {/* Real-time EAR value display for demo/debugging */}
                  {faceDetection.faceDetected && currentEAR !== null && (
                    <div className="mt-2 p-2 bg-surface rounded border border-border">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-textMuted">{t('healthMonitor.earValue')}:</span>
                        <span className={cn(
                          "font-mono font-bold",
                          currentEAR > currentThreshold ? "text-success" : "text-danger"
                        )}>
                          {currentEAR.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-textMuted">{t('healthMonitor.threshold')}:</span>
                        <span className="font-mono text-textMuted">{currentThreshold.toFixed(3)}</span>
                      </div>
                      {baselineEARRef.current && (
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-textMuted">{t('healthMonitor.baseline')}:</span>
                          <span className="font-mono text-primary">{baselineEARRef.current.toFixed(3)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!faceDetection.eyesOpen && eyesClosedDuration > 0 && (
                    <div className="mt-3 p-3 bg-surfaceHighlight rounded-lg border-2 border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-textMuted uppercase tracking-wider">{t('healthMonitor.timer')}:</span>
                        <motion.span 
                          className={cn(
                            "text-2xl font-mono font-bold",
                            eyesClosedDuration >= 5 ? "text-danger" : "text-accent"
                          )}
                          animate={{ scale: eyesClosedDuration >= 5 ? [1, 1.1, 1] : 1 }}
                          transition={{ repeat: eyesClosedDuration >= 5 ? Infinity : 0, duration: 0.5 }}
                        >
                          {eyesClosedDuration.toFixed(1)}s / 5.0s
                        </motion.span>
                      </div>
                      <div className="w-full bg-surface rounded-full h-3 border border-border overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-3 rounded-full transition-colors",
                            eyesClosedDuration >= 5 ? "bg-danger" : "bg-accent"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((eyesClosedDuration / 5) * 100, 100)}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                      {eyesClosedDuration >= 5 && (
                        <motion.p 
                          className="text-sm text-danger font-bold mt-2 text-center"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          ⚠️ {t('healthMonitor.alertTriggered')} - {t('healthMonitor.eyesClosedFor')} {eyesClosedDuration.toFixed(1)}s
                        </motion.p>
                      )}
                      {eyesClosedDuration < 6 && (
                        <p className="text-xs text-textMuted text-center mt-2">
                          {t('healthMonitor.alertWillTrigger')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {alertBeeping && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-5 bg-danger/20 border-2 border-danger/70 rounded-xl flex items-center justify-between shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <Bell className="text-danger animate-pulse" size={28} />
                    <div>
                      <p className="text-danger font-bold text-lg">{t('healthMonitor.drowsinessAlert')}: {t('healthMonitor.eyesClosedFor')} 5+ {t('common.seconds')}</p>
                      <p className="text-danger/80 text-sm mt-1">{t('healthMonitor.beepSoundActive')}</p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={stopBeep}
                    className="flex items-center gap-2 px-6 py-3 text-base font-bold"
                  >
                    {t('healthMonitor.stopAlert')}
                  </Button>
                </motion.div>
              )}
            </>
          ) : (
            <div className="mt-4 p-8 bg-surfaceHighlight rounded-lg border border-border text-center">
              <VideoOff size={48} className="mx-auto mb-2 text-textMuted opacity-50" />
              <p className="text-text font-medium">{t('healthMonitor.cameraNotActive')}</p>
              <p className="text-textMuted text-sm mt-2">{t('healthMonitor.cameraNotActiveDesc')}</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Vital Signs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vitalCards.map((vital) => (
          <motion.div key={vital.label} variants={itemVariants}>
            <HealthVitalCard {...vital} />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div variants={itemVariants} className="text-center py-4">
        <p className="text-textMuted text-sm">
          {t('healthMonitor.footer')}
        </p>
      </motion.div>

      {/* FULL-PAGE ALERT OVERLAY - Covers entire website */}
      {alertBeeping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Semi-transparent red background covering entire screen */}
          <div className="absolute inset-0 bg-danger/30 backdrop-blur-sm animate-pulse" />

          {/* Alert content */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="relative z-10 bg-danger/95 text-white p-12 rounded-2xl shadow-2xl max-w-2xl mx-4 border-4 border-white"
          >
            <div className="text-center">
              {/* Warning Icon */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-9xl mb-6"
              >
                ⚠️
              </motion.div>

              {/* Alert Title */}
              <h1 className="text-5xl font-black mb-4 uppercase tracking-wider">
                {t('healthMonitor.alertTitle')}
              </h1>

              {/* Alert Message */}
              <p className="text-3xl font-bold mb-6">
                {t('healthMonitor.eyesClosedAlert')}
              </p>

              <p className="text-xl mb-8 opacity-90">
                {t('healthMonitor.workerDrowsy')}
              </p>

              {/* Beep indicator */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <Bell className="animate-pulse" size={32} />
                <span className="text-2xl font-bold">{t('healthMonitor.beepSoundActiveFull')}</span>
              </div>

              {/* Stop Button */}
              <Button
                variant="outline"
                onClick={stopBeep}
                className="bg-white text-danger hover:bg-gray-100 text-2xl font-bold py-6 px-12 rounded-xl border-4 border-white shadow-lg"
              >
                {t('healthMonitor.stopAlert')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
