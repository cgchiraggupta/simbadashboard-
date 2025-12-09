import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Heart, Wind, Thermometer, Bell, Video, VideoOff, Eye, EyeOff } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { HealthVitalCard } from '../components/HealthVitalCard';
import { Card, Button, cn } from '../components/ui/design-system';
import { useHealthStore } from '../store/useHealthStore';

export const HealthMonitor: React.FC = () => {
  const { healthData, cameraActive, eyesClosedDuration, alertBeeping, modelsLoaded, connect, disconnect, toggleCamera, updateEyeState, stopBeep, loadModels } = useHealthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

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

  // Calculate Eye Aspect Ratio (EAR) - moved before use
  const calculateEAR = useCallback((eye: faceapi.Point[]) => {
    // Vertical distances
    const vertical1 = Math.abs(eye[1].y - eye[5].y);
    const vertical2 = Math.abs(eye[2].y - eye[4].y);
    // Horizontal distance
    const horizontal = Math.abs(eye[0].x - eye[3].x);
    
    // EAR formula
    const ear = (vertical1 + vertical2) / (2.0 * horizontal);
    return ear;
  }, []);

  // Real-time eye detection from video feed
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const detectEyes = async () => {
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      try {
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detections) {
          const landmarks = detections.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          // Calculate eye aspect ratio (EAR) to determine if eyes are open or closed
          const leftEAR = calculateEAR(leftEye);
          const rightEAR = calculateEAR(rightEye);
          const avgEAR = (leftEAR + rightEAR) / 2;

          // EAR threshold: below 0.25 typically means eyes are closed
          const EYE_CLOSED_THRESHOLD = 0.25;
          const eyesOpen = avgEAR > EYE_CLOSED_THRESHOLD;

          updateEyeState(eyesOpen, true);

          // Draw on canvas for debugging (optional)
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Draw face detection box
              const box = detections.detection.box;
              ctx.strokeStyle = eyesOpen ? '#10b981' : '#ef4444';
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);

              // Draw eye landmarks
              ctx.fillStyle = eyesOpen ? '#10b981' : '#ef4444';
              leftEye.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
              });
              rightEye.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
              });
            }
          }
        } else {
          updateEyeState(false, false);
        }
      } catch (error) {
        console.error('Eye detection error:', error);
        updateEyeState(false, false);
      }
    };

    // Run detection every 100ms for real-time updates
    detectionIntervalRef.current = window.setInterval(detectEyes, 100);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [cameraActive, modelsLoaded, updateEyeState, calculateEAR]);

  // Handle video stream
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            
            // Set canvas size to match video
            if (canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth || 640;
              canvasRef.current.height = videoRef.current.videoHeight || 480;
            }
          }
        })
        .catch((error) => {
          console.error('Camera access error:', error);
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
      <div className="flex flex-col items-center justify-center h-full text-white gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-400 font-medium animate-pulse">Connecting to Health Monitoring System...</p>
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
      <motion.header variants={itemVariants} className="flex justify-between items-end pb-4 border-b border-white/10">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Labour Health Monitor</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time vital signs monitoring dashboard</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Worker ID</span>
            <span className="text-primary font-mono font-bold">{healthData.workerId}</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time</span>
            <span className="text-white font-mono font-bold">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
          <div className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <Bell size={20} />
          </div>
        </div>
      </motion.header>

      {/* Alert Summary Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Alert Summary</h3>
              <p className={cn(
                "text-sm font-medium",
                criticalCount > 0 ? "text-danger" : warningCount > 0 ? "text-accent" : "text-success"
              )}>
                {criticalCount > 0 || warningCount > 0 ? (
                  <>
                    <span className="font-bold">{criticalCount} critical</span>
                    {warningCount > 0 && <span> · <span className="font-bold">{warningCount} warning</span></span>}
                    <span> — Immediate attention recommended</span>
                  </>
                ) : (
                  "All vitals within normal range"
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
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Video size={20} className="text-primary" />
              Face Detection Monitor
            </h3>
            <Button
              variant={cameraActive ? "outline" : "primary"}
              onClick={toggleCamera}
              className="flex items-center gap-2"
            >
              {cameraActive ? <VideoOff size={16} /> : <Video size={16} />}
              {cameraActive ? "Stop Camera" : "Start Camera"}
            </Button>
          </div>
          {cameraActive ? (
            <>
              {/* Video Feed with Overlay */}
              <div className="mb-4 relative rounded-lg overflow-hidden border border-white/10 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                />
                {alertBeeping && (
                  <div className="absolute inset-0 bg-danger/20 animate-pulse flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="bg-danger/80 text-white px-4 py-2 rounded-lg font-bold text-lg"
                    >
                      ⚠️ EYES CLOSED ALERT
                    </motion.div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    {faceDetection.faceDetected ? <Eye size={16} className="text-success" /> : <EyeOff size={16} className="text-gray-500" />}
                    <span className="text-sm font-medium text-gray-400">Face Detection</span>
                  </div>
                  <p className={cn("text-lg font-bold", faceDetection.faceDetected ? "text-success" : "text-gray-500")}>
                    {faceDetection.faceDetected ? "Face Detected" : "No Face Detected"}
                  </p>
                </div>
                <div className={cn(
                  "bg-black/20 rounded-lg p-4 border",
                  alertBeeping ? "border-danger/50 bg-danger/10" : "border-white/5"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {faceDetection.eyesOpen ? <Eye size={16} className="text-success" /> : <EyeOff size={16} className={alertBeeping ? "text-danger" : "text-gray-500"} />}
                    <span className="text-sm font-medium text-gray-400">Eye Activity</span>
                  </div>
                  <p className={cn(
                    "text-lg font-bold",
                    faceDetection.eyesOpen ? "text-success" : alertBeeping ? "text-danger" : "text-gray-500"
                  )}>
                    {faceDetection.eyesOpen ? "Eyes Open - Active" : "Eyes Closed - Inactive"}
                  </p>
                  {!faceDetection.eyesOpen && eyesClosedDuration > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Closed Duration:</span>
                        <span className={cn("font-bold", eyesClosedDuration >= 6 ? "text-danger" : "text-gray-400")}>
                          {eyesClosedDuration.toFixed(1)}s
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <motion.div
                          className={cn("h-1.5 rounded-full", eyesClosedDuration >= 6 ? "bg-danger" : "bg-accent")}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((eyesClosedDuration / 6) * 100, 100)}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                      {eyesClosedDuration >= 6 && (
                        <p className="text-xs text-danger font-bold mt-1 animate-pulse">
                          ⚠️ Alert: Eyes closed for {eyesClosedDuration.toFixed(1)}s
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
                  className="mt-4 p-4 bg-danger/20 border border-danger/50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="text-danger animate-pulse" size={24} />
                    <div>
                      <p className="text-danger font-bold">ALERT: Eyes Closed for 6+ Seconds</p>
                      <p className="text-danger/80 text-sm">Beep sound is active</p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={stopBeep}
                    className="flex items-center gap-2"
                  >
                    Stop Alert
                  </Button>
                </motion.div>
              )}
            </>
          ) : (
            <div className="mt-4 p-8 bg-black/20 rounded-lg border border-white/5 text-center">
              <VideoOff size={48} className="mx-auto mb-2 text-gray-500 opacity-50" />
              <p className="text-gray-500">Camera not active</p>
              <p className="text-gray-600 text-sm mt-2">Click "Start Camera" to begin eye detection monitoring</p>
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
        <p className="text-gray-500 text-sm">
          Labour Health Monitoring System • MAX30102 Sensor • ESP32 Connected
        </p>
      </motion.div>
    </motion.div>
  );
};
