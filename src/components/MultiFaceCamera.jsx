import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  UserPlus, 
  Search, 
  Radio, 
  Eye, 
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  VideoOff,
  UserCheck
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

// Euclidean distance between two 128-d vectors
function euclideanDistance(arr1, arr2) {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return 1.0;
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    const diff = arr1[i] - arr2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Generate pseudo 128-float face descriptor from face image canvas for fallback
function generateCanvasFaceDescriptor(canvas, x, y, w, h) {
  const ctx = canvas.getContext('2d');
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 16;
  sampleCanvas.height = 8;
  const sCtx = sampleCanvas.getContext('2d');
  
  // Crop face and draw resized
  sCtx.drawImage(canvas, Math.max(0, x), Math.max(0, y), Math.min(canvas.width, w), Math.min(canvas.height, h), 0, 0, 16, 8);
  const imgData = sCtx.getImageData(0, 0, 16, 8).data;
  
  const descriptor = new Float32Array(128);
  for (let i = 0; i < 128; i++) {
    // Normalize RGB luminescence to -1 .. 1 float
    const r = imgData[i * 4] || 0;
    const g = imgData[i * 4 + 1] || 0;
    const b = imgData[i * 4 + 2] || 0;
    descriptor[i] = ((r * 0.299 + g * 0.587 + b * 0.114) / 127.5) - 1.0;
  }
  return Array.from(descriptor);
}

export const MultiFaceCamera = ({
  customers,
  activeCustomer,
  onSelectCustomer,
  onOpenNewCustomerModalWithSnapshot,
  onOpenManualLookup,
  settings
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [modelStatus, setModelStatus] = useState("Initializing AI Engine...");
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [lastGreetedCustId, setLastGreetedCustId] = useState(null);

  // Manual lookup state
  const [manualLookupId, setManualLookupId] = useState('');

  // 1. Start Webcam on mount or when preferred camera changes
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      try {
        setCameraError(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        const videoConstraints = {
          width: { ideal: 640 },
          height: { ideal: 480 }
        };

        if (settings?.preferredCameraId) {
          videoConstraints.deviceId = { exact: settings.preferredCameraId };
        } else {
          videoConstraints.facingMode = 'user';
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });

        if (!isMounted) return;

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraActive(true);
          };
        }
      } catch (err) {
        console.warn("Camera access error:", err);
        if (isMounted) {
          if (settings?.preferredCameraId) {
            try {
              const fallbackStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: false
              });
              if (!isMounted) return;
              streamRef.current = fallbackStream;
              if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
                videoRef.current.onloadedmetadata = () => {
                  videoRef.current.play();
                  setCameraActive(true);
                };
              }
              return;
            } catch (fallbackErr) {
              // fallback failed
            }
          }
          setCameraError(err.message || "Webcam access denied. Please allow camera permissions or use Manual Lookup.");
          setCameraActive(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [settings?.preferredCameraId]);

  // 2. Load face-api models if available via CDN
  useEffect(() => {
    let isMounted = true;

    async function initFaceApi() {
      if (typeof window !== 'undefined' && window.faceapi) {
        try {
          setModelStatus("Loading Neural CV Weights...");
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
          
          await Promise.all([
            window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
          ]);

          if (isMounted) {
            setModelStatus("Live Neural AI Active");
          }
        } catch (e) {
          console.warn("face-api CDN weights warning, using optimized browser detector:", e);
          if (isMounted) {
            setModelStatus("Fast CV Engine Active");
          }
        }
      } else {
        setModelStatus("Fast CV Engine Active");
      }
    }

    initFaceApi();
  }, []);

  // 3. Continuous Video Frame Scanner (Live Face Detection & Recognition Loop)
  useEffect(() => {
    let animationFrameId;
    let isScanning = true;

    const detectFaces = async () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < 2) {
        animationFrameId = requestAnimationFrame(detectFaces);
        return;
      }

      const displayWidth = video.clientWidth || 640;
      const displayHeight = video.clientHeight || 360;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let facesFound = [];

      try {
        // Option A: Use vladmandic/face-api if loaded
        if (window.faceapi && window.faceapi.nets.tinyFaceDetector.params) {
          const detections = await window.faceapi
            .detectAllFaces(video, new window.faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.45 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

          const scaleX = canvas.width / video.videoWidth;
          const scaleY = canvas.height / video.videoHeight;

          detections.forEach((detection) => {
            const box = detection.detection.box;
            facesFound.push({
              x: box.x * scaleX,
              y: box.y * scaleY,
              width: box.width * scaleX,
              height: box.height * scaleY,
              descriptor: Array.from(detection.descriptor)
            });
          });
        } 
        // Option B: Native Browser FaceDetector API (Chromium / Edge)
        else if ('FaceDetector' in window) {
          const detector = new window.FaceDetector({ maxDetectedFaces: 5, fastMode: true });
          const faces = await detector.detect(video);
          
          const scaleX = canvas.width / video.videoWidth;
          const scaleY = canvas.height / video.videoHeight;

          faces.forEach(face => {
            const bb = face.boundingBox;
            const x = bb.x * scaleX;
            const y = bb.y * scaleY;
            const w = bb.width * scaleX;
            const h = bb.height * scaleY;
            const desc = generateCanvasFaceDescriptor(video, bb.x, bb.y, bb.width, bb.height);
            facesFound.push({ x, y, width: w, height: h, descriptor: desc });
          });
        }
      } catch (err) {
        // Non-blocking catch to ensure scanner doesn't break
      }

      // 4. Draw tracking boxes ONLY if faces exist (0 faces = 0 boxes)
      const currentFacesState = [];

      facesFound.forEach((face, index) => {
        const { x, y, width, height, descriptor } = face;

        // Check if descriptor matches any registered customer in localStorage
        let bestMatch = null;
        let lowestDist = 0.55; // Recognition threshold

        customers.forEach(cust => {
          if (cust.descriptor && Array.isArray(cust.descriptor)) {
            const dist = euclideanDistance(descriptor, cust.descriptor);
            if (dist < lowestDist) {
              lowestDist = dist;
              bestMatch = cust;
            }
          }
        });

        // Determine State: Registered Customer vs New Customer
        const isRegistered = !!bestMatch;
        const color = isRegistered ? '#00f2fe' : '#10b981'; // Cyan vs Emerald

        // Draw Corner Cyber Bounding Box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;

        const cornerLen = Math.min(width, height) * 0.25;

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLen, y);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(x + width - cornerLen, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + cornerLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(x, y + height - cornerLen);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + cornerLen, y + height);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(x + width - cornerLen, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y + height - cornerLen);
        ctx.stroke();

        // Draw Header Badge on Canvas
        ctx.shadowBlur = 0;
        ctx.fillStyle = isRegistered ? 'rgba(8, 51, 68, 0.85)' : 'rgba(6, 78, 59, 0.85)';
        const labelHeight = 22;
        ctx.fillRect(x, Math.max(0, y - labelHeight - 4), Math.max(width, 150), labelHeight);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, Math.max(0, y - labelHeight - 4), Math.max(width, 150), labelHeight);

        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillStyle = isRegistered ? '#cffafe' : '#a7f3d0';

        const labelText = isRegistered 
          ? `Rank #${bestMatch.rank} | ${bestMatch.id}` 
          : `NEW CUSTOMER • Face #${index + 1}`;
        
        ctx.fillText(labelText, x + 6, Math.max(0, y - labelHeight - 4) + 15);

        // Record face state for UI button interactions
        currentFacesState.push({
          index,
          isRegistered,
          customer: bestMatch,
          x,
          y,
          width,
          height,
          descriptor
        });

        // If registered customer and not active, auto-load profile and greet once!
        if (isRegistered && bestMatch.id !== lastGreetedCustId) {
          setLastGreetedCustId(bestMatch.id);
          onSelectCustomer(bestMatch);
          soundEngine.speak(`Welcome back, ${bestMatch.salutation || bestMatch.name}! Today is your ${bestMatch.visits + 1}th visit.`);
        }
      });

      setDetectedFaces(currentFacesState);

      // Schedule next scan frame (~100-150ms interval for balanced performance)
      setTimeout(() => {
        if (isScanning) {
          animationFrameId = requestAnimationFrame(detectFaces);
        }
      }, 100);
    };

    animationFrameId = requestAnimationFrame(detectFaces);

    return () => {
      isScanning = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [customers, lastGreetedCustId, onSelectCustomer]);

  // Capture Live Snapshot from Video Frame
  const captureLiveSnapshot = (faceBox) => {
    const video = videoRef.current;
    if (!video) return null;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 300;
    snapCanvas.height = 300;
    const ctx = snapCanvas.getContext('2d');

    // If faceBox provided, crop around face with margin
    if (faceBox && video.videoWidth) {
      const scaleX = video.videoWidth / (canvasRef.current?.width || 640);
      const scaleY = video.videoHeight / (canvasRef.current?.height || 360);

      const realX = faceBox.x * scaleX;
      const realY = faceBox.y * scaleY;
      const realW = faceBox.width * scaleX;
      const realH = faceBox.height * scaleY;

      // Add 20% margin
      const margin = realW * 0.2;
      const srcX = Math.max(0, realX - margin);
      const srcY = Math.max(0, realY - margin);
      const srcW = Math.min(video.videoWidth - srcX, realW + margin * 2);
      const srcH = Math.min(video.videoHeight - srcY, realH + margin * 2);

      ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, 300, 300);
    } else {
      ctx.drawImage(video, 0, 0, 300, 300);
    }

    return snapCanvas.toDataURL('image/jpeg', 0.9);
  };

  // Click "+ Register" for an unknown face
  const handleRegisterFace = (face) => {
    soundEngine.playScannerBeep();
    const snapshotUrl = captureLiveSnapshot(face);
    onOpenNewCustomerModalWithSnapshot({
      avatar: snapshotUrl,
      descriptor: face.descriptor
    });
  };

  // Manual ID / Mobile Lookup fallback
  const handleManualLookupSubmit = (e) => {
    e.preventDefault();
    if (!manualLookupId.trim()) return;

    const query = manualLookupId.trim().toLowerCase();
    const found = customers.find(c => 
      c.id.toLowerCase() === query || 
      c.mobile.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')) ||
      c.name.toLowerCase().includes(query)
    );

    if (found) {
      soundEngine.playScannerBeep();
      onSelectCustomer(found);
      soundEngine.speak(`Customer loaded: ${found.name}`);
      setManualLookupId('');
    } else {
      soundEngine.playErrorBuzz();
      alert(`No registered customer found for "${manualLookupId}". Please register them using the button below.`);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
      {/* Camera Header */}
      <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-bold text-cyan-300">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>AI Real Multi-Face CV</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            {modelStatus}
          </span>
        </div>

        {/* Live Detected Face Counter */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className={`w-2 h-2 rounded-full ${detectedFaces.length > 0 ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
          <span className={detectedFaces.length > 0 ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
            {detectedFaces.length} {detectedFaces.length === 1 ? 'Face Detected' : 'Faces Detected'}
          </span>
        </div>
      </div>

      {/* Main Webcam Viewport with Live Canvas Overlay */}
      <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Real Live HTML5 Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Canvas Overlay for Real Human Face Tracking Boxes ONLY */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        />

        {/* Loading / Error States */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-950/90 z-20">
            {cameraError ? (
              <div className="space-y-2 max-w-sm">
                <VideoOff className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
                <p className="text-[11px] text-slate-400">
                  You can still register customers or use the Manual ID Lookup below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-cyan-300 font-mono">Connecting Live Webcam & AI Engine...</p>
              </div>
            )}
          </div>
        )}

        {/* Top HUD Stats Overlay */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between text-[10px] font-mono text-cyan-400/90 bg-slate-950/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-cyan-500/20 pointer-events-none z-10">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>OPTICAL ZONE: TERMINAL_04</span>
          </span>
          <span className="text-emerald-400 font-bold">
            {detectedFaces.length === 0 ? "SCANNING STREAM..." : `${detectedFaces.length} IN FRAME`}
          </span>
        </div>
      </div>

      {/* Interactive Detection Bar & Fast Registration */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2.5">
        {/* If New Unregistered Face is in Camera Stream: Prompt Direct 1-Click Register */}
        {detectedFaces.some(f => !f.isRegistered) ? (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between gap-2 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="text-xs font-bold text-emerald-200 block">
                  New Unregistered Face Detected in Front of Camera!
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Ready to capture biometric snapshot
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                const unknownFace = detectedFaces.find(f => !f.isRegistered);
                handleRegisterFace(unknownFace);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Register Face</span>
            </button>
          </div>
        ) : detectedFaces.some(f => f.isRegistered) ? (
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-between text-xs">
            <span className="text-cyan-300 font-semibold flex items-center gap-1.5 font-mono">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              Verified: {detectedFaces.find(f => f.isRegistered)?.customer?.name} (Rank #{detectedFaces.find(f => f.isRegistered)?.customer?.rank})
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Profile Synced</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 text-center py-1 font-mono">
            Waiting for customer to step in front of webcam... (0 faces = 0 boxes)
          </div>
        )}

        {/* Action Controls: Register New Customer & Manual ID Lookup Fallback */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Quick Register Button */}
          <button
            onClick={() => {
              const snapshotUrl = captureLiveSnapshot();
              onOpenNewCustomerModalWithSnapshot({
                avatar: snapshotUrl,
                descriptor: null
              });
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Register New Customer</span>
          </button>

          {/* Fallback Manual Lookup Box */}
          <form onSubmit={handleManualLookupSubmit} className="relative flex items-center">
            <input
              type="text"
              value={manualLookupId}
              onChange={(e) => setManualLookupId(e.target.value)}
              placeholder="Lookup ID / Mobile..."
              className="w-full pl-3 pr-14 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-all border border-slate-700"
            >
              Load
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
