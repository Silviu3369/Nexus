import { useEffect, useState, useRef, useMemo } from 'react';
import { NexusSphere } from './components/NexusSphere';
import { AudioVisualizer } from './components/AudioVisualizer';
import { UserVoiceLine } from './components/UserVoiceLine';
import { ChatPanel } from './components/ChatPanel';
import { ImagePanel } from './components/ImagePanel';
import { DataPanel } from './components/DataPanel';
import { HomeAssistantPanel } from './components/HomeAssistantPanel';
import { IsolatedObjectPanel } from './components/IsolatedObjectPanel';
import { useAIStore } from './store/aiStore';
import { audioManager } from './services/audioManager';
import { establishNeuralLink, severNeuralLink, toggleCameraSync } from './services/nexusLiveService';
import { videoManager } from './services/videoManager';
import { Mic, MicOff, AlertCircle, Activity, Cpu, TerminalSquare, Server, Clock, Camera, CameraOff, X, Bell, Layers, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Component mapping to camera feed
const renderObjectForm = (id: string) => {
  const normId = id.toLowerCase();
  const isCylinder = normId.includes('mug') || normId.includes('cup') || normId.includes('glass') || normId.includes('bottle') || normId.includes('can') || normId.includes('speaker') || normId.includes('jar') || normId.includes('water');
  const isScreen = normId.includes('monitor') || normId.includes('screen') || normId.includes('tv') || normId.includes('laptop') || normId.includes('display') || normId.includes('webcam');
  const isKeyboardOrDeck = normId.includes('keyboard') || normId.includes('mouse') || normId.includes('book') || normId.includes('controller') || normId.includes('desk') || normId.includes('table') || normId.includes('deck') || normId.includes('phone') || normId.includes('smartphone') || normId.includes('tablet');
  const isOrganic = normId.includes('plant') || normId.includes('flower') || normId.includes('pot') || normId.includes('tree') || normId.includes('pet') || normId.includes('nature') || normId.includes('fruit') || normId.includes('apple') || normId.includes('orange');
  const isHuman = normId.includes('person') || normId.includes('man') || normId.includes('woman') || normId.includes('hand') || normId.includes('face') || normId.includes('user') || normId.includes('guest');

  if (isCylinder) {
    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
        {/* Top Ellipse Wireframe */}
        <div className="w-full h-[16px] relative overflow-visible">
          <svg className="absolute -top-[8px] left-0 w-full h-[16px] stroke-cyan-400/50 fill-cyan-400/5 overflow-visible">
            <ellipse cx="50%" cy="50%" rx="50%" ry="6px" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>
        
        {/* Center Vertical Axis and Radial Ribs */}
        <div className="flex-1 w-full relative flex items-center justify-center">
          <div className="h-full w-[1px] border-l border-dashed border-cyan-400/20" />
          <div className="absolute w-[80%] h-[1px] border-t border-cyan-400/10" />
          <div className="absolute w-[60%] h-[1px] border-t border-cyan-400/15" />
        </div>

        {/* Bottom Ellipse Wireframe */}
        <div className="w-full h-[16px] relative overflow-visible">
          <svg className="absolute -bottom-[8px] left-0 w-full h-[16px] stroke-cyan-400/70 fill-cyan-400/10 overflow-visible">
            <ellipse cx="50%" cy="50%" rx="50%" ry="6px" strokeWidth="1" />
          </svg>
        </div>
      </div>
    );
  }

  if (isScreen) {
    return (
      <div className="absolute inset-0 pointer-events-none p-1.5">
        {/* Double-frame offset */}
        <div className="w-full h-full border border-cyan-400/30 flex items-center justify-center">
          {/* Inner alignment cross */}
          <div className="absolute w-4 h-[1px] bg-cyan-400/40" />
          <div className="absolute h-4 w-[1px] bg-cyan-400/40" />
          
          {/* Dotted HUD grid splitter lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
            <div className="border-r border-b border-dashed border-cyan-400/15" />
            <div className="border-r border-b border-dashed border-cyan-400/15" />
            <div className="border-b border-dashed border-cyan-400/15" />
            <div className="border-r border-b border-dashed border-cyan-400/15" />
            <div className="border-r border-b border-dashed border-cyan-400/15" />
            <div className="border-b border-dashed border-cyan-400/15" />
          </div>
        </div>
      </div>
    );
  }

  if (isKeyboardOrDeck) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Tech grid texture inside to mimic keys or control elements */}
        <div className="absolute inset-1 bg-[linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:8px_6px] opacity-40" />
        
        {/* Chamfered deck layout border */}
        <div className="absolute top-1 left-2 right-2 border-t border-cyan-400/40" />
        <div className="absolute bottom-1 left-2 right-2 border-b border-cyan-400/40" />
        <div className="absolute left-1 top-2 bottom-2 border-l border-cyan-400/40" />
        <div className="absolute right-1 top-2 bottom-2 border-r border-cyan-400/40" />
        
        {/* Corner angled cuts mockup lines */}
        <svg className="absolute inset-0 w-full h-full stroke-cyan-400/30 fill-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0 10 L 10 0 M 90 0 L 100 10 M 100 90 L 90 100 M 10 100 L 0 90" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  if (isOrganic) {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Hexagonal organic node web */}
        <div className="absolute w-[80%] h-[80%] rounded-full border border-dashed border-emerald-500/15 animate-[spin_20s_linear_infinite]" />
        
        {/* Dynamic mesh connection nodes */}
        <svg className="absolute inset-0 w-full h-full stroke-emerald-500/35 fill-none opacity-40 animate-[pulse_3s_infinite_alternate]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,15 85,35 85,65 50,85 15,65 15,35" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="50" y1="15" x2="50" y2="85" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="15" y1="35" x2="85" y2="65" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="15" y1="65" x2="85" y2="35" strokeWidth="0.5" strokeDasharray="2 2" />
        </svg>

        {/* Emerald active pulsing node circles */}
        <div className="absolute top-[14%] left-[50%] -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-ping" />
        <div className="absolute bottom-[14%] left-[50%] -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
        <div className="absolute top-[35%] left-[14%] w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
        <div className="absolute bottom-[35%] right-[14%] w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
      </div>
    );
  }

  if (isHuman) {
    return (
      <div className="absolute inset-0 pointer-events-none rounded-[6px]">
        {/* Capsule silhouette bounding brackets */}
        <div className="absolute inset-0 rounded-[20px] border border-cyan-400/25 m-0.5" />
        
        {/* Facial/Eye target crosshair overlay dots in the top-middle segment */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-8 h-4 flex justify-between">
          <div className="w-1 h-1 rounded-full bg-cyan-400/80 animate-pulse" />
          <div className="w-1.5 h-1 rounded-full bg-cyan-400/40" />
          <div className="w-1 h-1 rounded-full bg-cyan-400/80 animate-pulse" />
        </div>

        {/* Soft respiratory pulse line near chest/center */}
        <div className="absolute top-[45%] left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-[pulse_2s_infinite]" />
      </div>
    );
  }

  // Fallback Modern Generic Cyber Reticle
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div className="absolute inset-2 border border-dashed border-cyan-400/10" />
      <div className="w-3 h-3 relative">
        <div className="absolute top-[50%] left-0 w-3 h-[1px] bg-cyan-400/30" />
        <div className="absolute top-0 left-[50%] w-[1px] h-3 bg-cyan-400/30" />
      </div>
    </div>
  );
};

// Physics-based depth estimation heuristic based on normalized focal height & screen coverage area
const getObjectDepth = (boundingBox: number[]) => {
  if (!boundingBox || boundingBox.length < 4) return 2.5; 
  const [top, , width, height] = boundingBox;
  
  // Calculate relative area bounding box takes up in viewport (0 to 1)
  const area = (width * height) / 10000;
  
  // Approximate depth inversely with size (larger objects are closer)
  let distance = 0.55 / Math.sqrt(area || 0.04);
  
  // High-precision perspective adjustments (items near bottom are closer to camera baseline posture)
  const bottomEdge = top + height;
  const perspectiveFactor = 1 - (bottomEdge / 100); 
  distance = distance * (0.8 + perspectiveFactor * 0.4);
  
  // Return values bound beautifully within human/interior environment scales: 0.5m to 8.5m
  return parseFloat(Math.min(8.5, Math.max(0.5, distance)).toFixed(1));
};

function CameraOverlay() {
  const { detectedObjects, setIsolatedObject, setIsolatedPanelOpen, addPhotographedObject } = useAIStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [resolution, setResolution] = useState<string>("1280x720");
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [showDepthView, setShowDepthView] = useState<boolean>(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const [containerSize, setContainerSize] = useState({ width: 640, height: 400 });

  // Persistent deck of dislocated/off-frame objects that vanished or left the frame
  const [dockedNotifications, setDockedNotifications] = useState<any[]>([]);

  // Derive active viewport objects dynamically
  const activeViewportObjects = useMemo(() => {
    return detectedObjects.filter((obj: any) => {
      const isDismissed = dismissedIds.includes(obj.id);
      // Let targets expire in 5 seconds so they identify and fade away cleanly!
      const expirationThreshold = 5000; 
      const isExpired = obj.timestamp ? (now - obj.timestamp > expirationThreshold) : false;
      return !isDismissed && !isExpired;
    });
  }, [detectedObjects, dismissedIds, now]);

  // Capture real-time cropping from the live camera feed
  const captureCrop = (obj: any) => {
    if (!videoRef.current) return undefined;
    try {
      const video = videoRef.current;
      const vWidth = video.videoWidth || video.clientWidth;
      const vHeight = video.videoHeight || video.clientHeight;
      if (!vWidth || !vHeight) return undefined;

      // Find best boundingBox:
      // 1. Direct boundingBox on the object
      // 2. If same ID exists in activeViewportObjects
      // 3. Or if same/similar ID exist (e.g., "user" mappings to "person")
      // 4. Default fallback box for center of stream
      let box = obj.boundingBox;
      if (!box) {
        const liveMatch = activeViewportObjects.find(
          (o: any) => o.id.toLowerCase() === obj.id.toLowerCase() || 
                      (obj.id.toLowerCase() === 'user' && o.id.toLowerCase() === 'person')
        );
        if (liveMatch && liveMatch.boundingBox) {
          box = liveMatch.boundingBox;
        } else {
          const personObj = activeViewportObjects.find((o: any) => o.id.toLowerCase().includes('person'));
          if (personObj && personObj.boundingBox) {
            box = personObj.boundingBox;
          } else {
            box = [15, 15, 70, 70]; // Center crop fallback
          }
        }
      }

      const [top, left, width, height] = box;

      // Translate percentages to real resolution coordinates
      const sx = (left / 100) * vWidth;
      const sy = (top / 100) * vHeight;
      const sw = (width / 100) * vWidth;
      const sh = (height / 100) * vHeight;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, sw);
      canvas.height = Math.max(1, sh);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        return canvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (e) {
      console.warn("Failed to capture crop from stream", e);
    }
    return undefined;
  };

  const isolateAnalyseObject = (obj: any) => {
    let box = obj.boundingBox;
    if (!box) {
      const liveMatch = activeViewportObjects.find(
        (o: any) => o.id.toLowerCase() === obj.id.toLowerCase() || 
                    (obj.id.toLowerCase() === 'user' && o.id.toLowerCase() === 'person')
      );
      if (liveMatch && liveMatch.boundingBox) {
        box = liveMatch.boundingBox;
      } else {
        const personObj = activeViewportObjects.find((o: any) => o.id.toLowerCase().includes('person'));
        if (personObj && personObj.boundingBox) {
          box = personObj.boundingBox;
        } else {
          box = [15, 15, 70, 70]; // Center crop fallback
        }
      }
    }
    const enrichedObj = { ...obj, boundingBox: box };
    const croppedUrl = captureCrop(enrichedObj);
    const enriched = croppedUrl ? { ...enrichedObj, croppedImage: croppedUrl } : enrichedObj;
    setIsolatedObject(enriched);
    setIsolatedPanelOpen(true);
  };

  // High-performance target tracking: Detections are overlaid and tracked continuously.
  // Isolated target analysis & photography happens strictly ON REQUEST (at user click / model action).
  // No automatic target switching or continuous video cropping is run, keeping the panel 100% stable.

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Initial fetch if already running
    setStream(videoManager.stream); 

    // Hook to onStreamChange
    videoManager.onStreamChange = (newStream) => {
      setStream(newStream);
      if (newStream) {
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.width && settings.height) {
            setResolution(`${settings.width}x${settings.height}`);
          }
        }
      }
    };

    return () => {
      videoManager.onStreamChange = null;
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Hook to track container resizing and calculate stable viewport pixel coordinates
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width && entry.contentRect.height) {
          setContainerSize({
            width: Math.round(entry.contentRect.width),
            height: Math.round(entry.contentRect.height)
          });
        }
      }
    });
    observer.observe(containerRef.current);

    // Initial rect size
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width && rect.height) {
      setContainerSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    }

    return () => observer.disconnect();
  }, [stream]);

  // Track the transition of leaving the direct viewport frame to put in Dock
  const prevActiveObjectsRef = useRef<any[]>([]);

  useEffect(() => {
    const prevActive = prevActiveObjectsRef.current;

    prevActive.forEach((prevObj: any) => {
      const isStillActive = activeViewportObjects.some((curr: any) => curr.id === prevObj.id);
      if (!isStillActive) {
        // Object left direct viewport! Record its coordinates and dock it
        const [top, left, , height] = prevObj.boundingBox || [25, 25, 30, 30];
        const xPx = Math.round((left / 100) * containerSize.width);
        const yPx = Math.round(((top + height) / 100) * containerSize.height);

        setDockedNotifications((prev) => {
          const filtered = prev.filter((item) => item.id !== prevObj.id);
          const dockedItem = {
            ...prevObj,
            lastX: xPx,
            lastY: yPx,
            dockedAt: Date.now()
          };
          // Keep only the 4 most recent departed notifications to preserve viewport space elegance
          return [dockedItem, ...filtered].slice(0, 4);
        });
      }
    });

    prevActiveObjectsRef.current = activeViewportObjects;
  }, [activeViewportObjects, containerSize]);

  if (!stream) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 w-[760px] max-w-[95vw] aspect-[16/10] sm:aspect-video bg-gradient-to-br from-cyan-400 via-cyan-500/20 to-cyan-400 p-[1.5px] shadow-[0_0_60px_rgba(34,211,238,0.25)] z-10 flex flex-col"
      style={{
        clipPath: "polygon(50px 0%, 100% 0%, 100% calc(100% - 50px), calc(100% - 50px) 100%, 0% 100%, 0% 50px)"
      }}
    >
      {/* Inner Clipped Core Viewport */}
      <div 
        className="w-full h-full bg-[#02050c]/90 backdrop-blur-xl flex flex-col overflow-hidden relative"
        style={{
          clipPath: "polygon(49px 0%, 100% 0%, 100% calc(100% - 49px), calc(100% - 49px) 100%, 0% 100%, 0% 49px)"
        }}
      >
        {/* Outer Console Boundary Header */}
        <div className="flex items-center justify-between pl-14 pr-6 py-2.5 border-b border-cyan-500/25 font-mono text-[9px] text-cyan-400 bg-black/40">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold tracking-[0.15em]">OPTICAL TARGETING RECEIVER</span>
          </div>
          <div className="flex items-center space-x-3 pointer-events-auto">
            <button
              onClick={() => {
                setShowOverlays(!showOverlays);
                if (!showOverlays) {
                  setDismissedIds([]);
                  setDockedNotifications([]);
                }
              }}
              className={`px-1.5 py-0.5 border rounded font-mono text-[8.5px] transition-all tracking-wider font-semibold cursor-pointer ${
                showOverlays
                  ? 'border-cyan-400/40 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/30'
                  : 'border-white/10 bg-black/20 text-[#64748b] hover:text-slate-400 hover:border-white/20'
              }`}
            >
              AR TARGETS: {showOverlays ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowDepthView(!showDepthView)}
              className={`px-1.5 py-0.5 border rounded font-mono text-[8.5px] transition-all tracking-wider font-semibold cursor-pointer ${
                showDepthView
                  ? 'border-purple-500/40 bg-purple-950/25 text-purple-300 hover:bg-purple-900/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                  : 'border-white/10 bg-black/20 text-[#64748b] hover:text-slate-400 hover:border-white/20'
              }`}
            >
              DEPTH MAP: {showDepthView ? 'ON' : 'OFF'}
            </button>
            {(dismissedIds.length > 0 || dockedNotifications.length > 0) && (
              <button
                onClick={() => {
                  setDismissedIds([]);
                  setDockedNotifications([]);
                }}
                className="px-1.5 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-300 rounded font-mono text-[8.5px] tracking-wider hover:bg-amber-500/20 transition-all font-semibold cursor-pointer"
              >
                RESTORE ALL
              </button>
            )}
            <span className="text-cyan-500/40">|</span>
            <span>SOURCE: LENS_01</span>
            <span className="text-cyan-500/40">|</span>
            <span>RESOLUTION: {resolution}</span>
          </div>
        </div>

        {/* Main Video Viewport with High-Tech HUD Elements */}
        <div 
          ref={containerRef} 
          className="relative flex-1 bg-black/30 overflow-hidden group"
        >
          <motion.div
            className="w-full h-full relative"
            animate={{
              scale: 1,
              x: 0,
              y: 0
            }}
            transition={{ type: "spring", damping: 26, stiffness: 100 }}
            style={{ originX: 0.5, originY: 0.5 }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-75 mix-blend-screen"
            />

            {/* Dynamic Spatial AR Hologram Target Overlays */}
            <AnimatePresence>
              {showOverlays && activeViewportObjects.map((obj: any) => {
                const [top, left, width, height] = obj.boundingBox || [25, 25, 30, 30];
                const objDepth = getObjectDepth(obj.boundingBox || [25, 25, 30, 30]);

                let depthBadgeText = "FAR SECTOR";
                let depthThemeBorder = "border-indigo-500 bg-gradient-to-br from-indigo-500/10 via-slate-500/5 to-indigo-500/15 hover:bg-indigo-500/20";
                let depthThemeText = "text-indigo-400 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]";
                let depthThemeStatusBg = "bg-indigo-500/20 text-indigo-300 border-indigo-400/20";
                let depthThemeCorner = "border-indigo-400";
                let depthPulsarColor = "bg-indigo-400";

                if (objDepth < 1.5) {
                  depthBadgeText = "NEAR FIELD";
                  depthThemeBorder = "border-emerald-500 bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-emerald-500/10 hover:bg-emerald-500/15";
                  depthThemeText = "text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.35)]";
                  depthThemeStatusBg = "bg-emerald-500/20 text-emerald-300 border-emerald-400/20";
                  depthThemeCorner = "border-emerald-400";
                  depthPulsarColor = "bg-emerald-400";
                } else if (objDepth < 3.5) {
                  depthBadgeText = "MID REGION";
                  depthThemeBorder = "border-cyan-400 bg-gradient-to-br from-cyan-400/15 via-blue-500/5 to-cyan-400/10 hover:bg-cyan-400/15";
                  depthThemeText = "text-cyan-400 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.35)]";
                  depthThemeStatusBg = "bg-cyan-500/20 text-cyan-300 border-cyan-400/20";
                  depthThemeCorner = "border-cyan-400";
                  depthPulsarColor = "bg-cyan-400";
                }

                const isOrganic = obj.id.toLowerCase().includes('plant') || obj.id.toLowerCase().includes('flower') || obj.id.toLowerCase().includes('pot') || obj.id.toLowerCase().includes('tree') || obj.id.toLowerCase().includes('nature');
                const finalBorderClass = showDepthView ? depthThemeBorder : (isOrganic ? 'border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10' : 'border-cyan-400 bg-cyan-400/5 hover:bg-cyan-400/15');
                const finalTxtClass = showDepthView ? depthThemeText : (isOrganic ? 'text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-cyan-400 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]');
                const finalBadgeClass = showDepthView ? depthThemeStatusBg : (isOrganic ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/20' : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/20');
                const finalCornerClass = showDepthView ? depthThemeCorner : (isOrganic ? 'border-emerald-400' : 'border-cyan-400');

                // Calculating real-time pixel coordinates relative to the feed viewport
                const xPx = Math.round((left / 100) * containerSize.width);
                const yPx = Math.round(((top + height) / 100) * containerSize.height);

                return (
                  <motion.div
                    key={obj.id}
                    initial={{ opacity: 0, scale: 0.85, top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
                    animate={{ opacity: 1, scale: 1, top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 150, damping: 22 }}
                    onClick={() => {
                      isolateAnalyseObject(obj);
                    }}
                    className={`absolute border cursor-pointer flex flex-col justify-between group z-20 animate-[pulse_6s_infinite_alternate] ${finalBorderClass}`}
                    style={{
                      borderRadius: obj.id.toLowerCase().includes('person') ? '16px' : '0px'
                    }}
                  >
                    {/* Category-Specific Geometric Shape Overlays */}
                    {renderObjectForm(obj.id)}

                    {/* Calibration Corner bracket indicators */}
                    <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${finalCornerClass}`} />
                    <div className={`absolute top-0 right-0 w-1.5 h-1.5 border-t border-r ${finalCornerClass}`} />
                    <div className={`absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l ${finalCornerClass}`} />
                    <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${finalCornerClass}`} />

                    {/* J.A.R.V.I.S. Manual Photograph Trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Real-time crop frame analysis & snap registry
                        const box = obj.boundingBox || [25, 25, 30, 30];
                        const enrichedObj = { ...obj, boundingBox: box };
                        const croppedUrl = captureCrop(enrichedObj);
                        const enriched = croppedUrl ? { ...enrichedObj, croppedImage: croppedUrl } : enrichedObj;
                        
                        // Register in holographic database snap history stack
                        addPhotographedObject(enriched);
                        
                        // Instantly isolate targeted diagnostics
                        setIsolatedObject(enriched);
                        setIsolatedPanelOpen(true);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-950/90 border border-cyan-500/35 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:scale-110 active:scale-95 transition-all pointer-events-auto z-30 shadow-[0_0_10px_rgba(6,182,212,0.2)] focus:outline-none"
                      title="Fotografiază obiect"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>

                    {/* Proximity visualizer meter bars */}
                    {showDepthView && (
                      <div className="absolute left-1.5 right-1.5 bottom-6 h-1 bg-slate-950/80 rounded-full overflow-hidden border border-white/5 p-[0.3px]">
                        <div 
                          className={`h-full rounded-full ${depthPulsarColor} shadow-[0_0_6px_rgba(168,85,247,0.4)]`} 
                          style={{ width: `${Math.min(100, Math.max(10, (1 - (objDepth / 8.5)) * 100))}%` }}
                        />
                      </div>
                    )}

                    {/* Embedded depth sensor HUD tag at top of box */}
                    {showDepthView && (
                      <div className={`absolute top-1.5 left-1.5 px-1 py-0.5 rounded-sm text-[6.5px] font-mono leading-none tracking-widest bg-slate-950/90 border border-slate-800/40 font-bold uppercase flex items-center gap-1 ${finalTxtClass}`}>
                        <Gauge className="w-2 h-2 animate-pulse" />
                        <span>{objDepth}m ({depthBadgeText})</span>
                      </div>
                    )}

                    {/* High-tech telemetry tag pinned to the exact bottom-left corner of the object container */}
                    <div className={`absolute bottom-[-1px] left-[-0.5px] bg-slate-950/95 border border-l-0 border-b-0 rounded-tr-sm font-mono text-[8.5px] font-bold px-2 py-0.5 tracking-wider uppercase flex items-center space-x-1.5 whitespace-nowrap pointer-events-auto z-10 ${finalTxtClass}`}>
                      <span className="w-1 h-1 bg-current rounded-full animate-pulse mr-0.5" />
                      <span>{obj.name}</span>
                      <span className="opacity-75 text-[7.5px]">({Math.round(obj.confidence * 100)}%)</span>
                      <span className={`opacity-60 text-[7px] font-bold ${isOrganic ? 'text-emerald-300' : 'text-cyan-300'}`}>[{xPx}x, {yPx}y]</span>
                      {showDepthView ? (
                        <span className={`text-[6.5px] px-1 rounded font-semibold border ${finalBadgeClass}`}>
                          {objDepth}m DST
                        </span>
                      ) : (
                        obj.status && (
                          <span className={`text-[6.5px] px-1 rounded font-semibold border ${finalBadgeClass}`}>
                            {obj.status}
                          </span>
                        )
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissedIds((prev) => [...prev, obj.id]);
                        }}
                        className={`ml-1.5 p-0.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors hover:scale-110 ${showDepthView ? finalTxtClass : (isOrganic ? 'text-emerald-400/70' : 'text-cyan-400/70')}`}
                        title="Dismiss Object"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Depth Perception Palette Legend Panel */}
          {showOverlays && showDepthView && (
            <div className="absolute top-4 right-4 z-30 bg-slate-950/95 border border-purple-500/30 rounded px-2.5 py-1.5 font-mono text-[7px] md:text-[8px] text-purple-300 w-[160px] md:w-[185px] shadow-[0_0_20px_rgba(168,85,247,0.15)] pointer-events-auto backdrop-blur-md select-none animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center justify-between mb-1.5 border-b border-purple-500/20 pb-1">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-purple-400 animate-pulse" />
                  Depth Analyzer
                </span>
                <span className="text-[6.5px] font-semibold text-purple-400/70">PROXIMITY RADAR</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-sm bg-rose-500 animate-pulse" />
                    <span>NEAR FIELD</span>
                  </div>
                  <span className="font-bold text-rose-400">&lt; 1.5m</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-sm bg-amber-400" />
                    <span>MID REGION</span>
                  </div>
                  <span className="font-bold text-amber-400">1.5m - 3.5m</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-sm bg-cyan-400" />
                    <span>FAR SECTOR</span>
                  </div>
                  <span className="font-bold text-cyan-400">&gt; 3.5m</span>
                </div>
              </div>
            </div>
          )}

          {/* High-Tech Notification Dock (Lower-Left Corner of Camera Feed) */}
          {showOverlays && dockedNotifications.length > 0 && (
            <div className="absolute bottom-16 left-6 z-30 max-w-[290px] flex flex-col space-y-1.5 pointer-events-auto">
              <div className="flex items-center space-x-1.5 text-cyan-400/50 font-mono text-[7.5px] uppercase tracking-[0.2em] pl-1 select-none">
                <Bell className="w-2.5 h-2.5 animate-pulse" />
                <span>OFF-FRAME TELEMETRY DECK</span>
                <span className="text-[6.5px] opacity-75">({dockedNotifications.length})</span>
              </div>
              
              <div className="flex flex-col space-y-1">
                <AnimatePresence>
                  {dockedNotifications.map((dockedObj) => {
                    const isOrganic = dockedObj.id.toLowerCase().includes('plant') || dockedObj.id.toLowerCase().includes('flower') || dockedObj.id.toLowerCase().includes('pot') || dockedObj.id.toLowerCase().includes('tree') || dockedObj.id.toLowerCase().includes('nature');
                    const dockedDepth = getObjectDepth(dockedObj.boundingBox || [25, 25, 30, 30]);

                    const textThemeClass = isOrganic ? 'text-emerald-400 border-emerald-500/20 bg-slate-950/90 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'text-cyan-400 border-cyan-400/20 bg-slate-950/90 shadow-[0_0_10px_rgba(34,211,238,0.15)]';
                    const activeBorderColor = isOrganic ? 'border-emerald-500/30' : 'border-cyan-400/30';

                    return (
                      <motion.div
                        key={dockedObj.id}
                        initial={{ opacity: 0, x: -25, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -25, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => {
                          isolateAnalyseObject(dockedObj);
                        }}
                        className={`group border rounded-sm font-mono text-[8px] font-bold px-2 py-1.5 tracking-wider uppercase flex items-center justify-between cursor-pointer hover:border-amber-500/40 hover:bg-slate-950 transition-colors pointer-events-auto ${activeBorderColor} ${textThemeClass}`}
                      >
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-1">
                            <span className="w-1 h-1 bg-amber-400 rounded-full mr-0.5 animate-ping" />
                            <span>{dockedObj.name}</span>
                            <span className="opacity-60 text-[7px] text-slate-400">({Math.round(dockedObj.confidence * 100)}%)</span>
                          </div>
                          <div className="text-[6.5px] text-slate-500 font-medium flex items-center space-x-1.5 leading-none">
                            <span>LST_POS:</span>
                            <span className="text-amber-400/80 font-mono font-semibold">[{dockedObj.lastX}x, {dockedObj.lastY}y]</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-purple-400 font-semibold">{dockedDepth}m</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-red-400 font-semibold">[OFF-FRAME]</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDockedNotifications((prev) => prev.filter((item) => item.id !== dockedObj.id));
                          }}
                          className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded ml-2 transition-colors pointer-events-auto"
                          title="Purge Node"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Stream Overlay Indicator */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-black/60 border border-cyan-500/20 font-mono text-[8px] text-cyan-400 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Real Telemetry hook
function useTelemetry() {
  const [ping, setPing] = useState<number | null>(null);
  const [memoryLimit, setMemoryLimit] = useState<string>('N/A');
  const [uptime, setUptime] = useState<string>('00:00:00');

  useEffect(() => {
    // 1. Precise Uptime
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);

    // 2. Real Network Ping (Measuring latency to the current host)
    const measurePing = async () => {
      const start = performance.now();
      try {
        await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
        setPing(Math.round(performance.now() - start));
      } catch (e) {
        setPing(null);
      }
    };
    measurePing();
    const pingInterval = setInterval(measurePing, 5000);

    // 3. Real Memory usage (Chrome specific API, fallback gracefully)
    const memoryInterval = setInterval(() => {
      const perf = performance as any;
      if (perf.memory && perf.memory.usedJSHeapSize) {
        const usedMB = (perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
        setMemoryLimit(`${usedMB} MB`);
      } else {
        setMemoryLimit('STABLE'); // fallback
      }
    }, 2000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(pingInterval);
      clearInterval(memoryInterval);
    };
  }, []);

  return { ping, memoryLimit, uptime };
}

export default function App() {
  const { 
    systemState, 
    connectionState, 
    errorMessage, 
    isChatOpen, 
    isImagePanelOpen, 
    isDataPanelOpen, 
    isHAPanelOpen, 
    isIsolatedPanelOpen, 
    setChatOpen, 
    setHAPanelOpen, 
    isCameraActive
  } = useAIStore();
  const { ping, memoryLimit, uptime } = useTelemetry();



  const isLive = connectionState === 'connected' || connectionState === 'connecting';
  const isMinimized = isCameraActive || isChatOpen || isImagePanelOpen || isDataPanelOpen || isHAPanelOpen || isIsolatedPanelOpen;

  const toggleLink = async () => {
    if (isLive) {
      severNeuralLink();
    } else {
      try {
        await audioManager.init();
      } catch(e) {
        console.error("Audio init error:", e);
      }
      establishNeuralLink();
    }
  };

  return (
    <div className="w-screen h-screen bg-[#010204] flex flex-col items-center justify-center relative font-sans overflow-hidden select-none text-cyan-50">
      
      {/* Dynamic Popups */}
      <AnimatePresence>
        {isChatOpen && <ChatPanel />}
      </AnimatePresence>
      <AnimatePresence>
        {isImagePanelOpen && <ImagePanel />}
      </AnimatePresence>
      <AnimatePresence>
        {isDataPanelOpen && <DataPanel />}
      </AnimatePresence>
      <AnimatePresence>
        {isHAPanelOpen && <HomeAssistantPanel onClose={() => setHAPanelOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {isIsolatedPanelOpen && <IsolatedObjectPanel />}
      </AnimatePresence>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#000000_100%)] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYwIDBMMCAwTDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgzNCwgMjExLCAyMzgsIDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-50 z-0 pointer-events-none" />

      {/* Dynamic Sphere Placement based on Camera link status */}
      <AnimatePresence mode="popLayout">
        {!isMinimized ? (
          <motion.div
            key="sphere-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
            className="absolute inset-0 z-0 w-full h-full pointer-events-none"
          >
            <NexusSphere className="absolute inset-0 w-full h-full pointer-events-none" />
          </motion.div>
        ) : isCameraActive ? (
          <motion.div
            key="sphere-camera-active"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="absolute right-8 bottom-8 w-44 h-44 bg-black/45 border border-cyan-500/20 rounded-full overflow-hidden backdrop-blur-md flex items-center justify-center shadow-[0_0_35px_rgba(34,211,238,0.15)] z-10 pointer-events-none"
          >
            <div className="w-full h-full relative">
              <NexusSphere className="absolute inset-0 w-full h-full pointer-events-none scale-105" />
            </div>
            
            {/* Minimal Circular Corners/HUD for cyberpunk feel */}
            <div className="absolute inset-2 border border-dashed border-cyan-500/10 rounded-full animate-[spin_40s_linear_infinite] pointer-events-none" />
            <div className="absolute inset-1 border border-cyan-500/10 rounded-full pointer-events-none" />
          </motion.div>
        ) : (
          <motion.div
            key="sphere-minimized"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="absolute right-8 bottom-8 w-80 h-[380px] bg-[#020617]/85 border border-cyan-500/25 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col p-4 shadow-[0_0_35px_rgba(6,182,212,0.15)] z-10"
          >
            {/* Header of the container */}
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-[9px] tracking-wider text-cyan-300 font-bold uppercase">NEXUS COGNITIVE CELL</span>
              </div>
              <span className="font-mono text-[8px] text-cyan-500/40">SYS_CORE_MIN</span>
            </div>

            {/* Minimised 3D Sphere Container */}
            <div className="relative w-full h-44 flex items-center justify-center bg-black/60 rounded-xl border border-cyan-500/10 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:10px_10px] opacity-40 pointer-events-none z-0" />
              
              <div className="w-full h-full relative z-10">
                <NexusSphere className="absolute inset-0 w-full h-full pointer-events-none" />
              </div>
              
              {/* Dynamic status nodes overlays inside container */}
              <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-cyan-400/40" />
              <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-cyan-400/40" />
              <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-cyan-400/40" />
              <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-cyan-400/40" />
              
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/75 px-2 py-0.5 rounded border border-cyan-500/20 text-[7px] font-mono tracking-widest text-[#a5b4fc]">
                RESONANCE: {systemState.toUpperCase()}
              </div>
            </div>

            {/* Neural System Diagnostics Matrix */}
            <div className="mt-3 flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono tracking-widest text-cyan-400/75">
                <div className="bg-[#030712]/50 border border-cyan-500/10 p-2 rounded-lg">
                  <span className="text-cyan-500/40 block mb-0.5 uppercase text-[6.5px]">ORBITAL DYNAMICS</span>
                  <span className="text-cyan-200">DECENTRALIZED</span>
                </div>
                <div className="bg-[#030712]/50 border border-cyan-500/10 p-2 rounded-lg">
                  <span className="text-cyan-500/40 block mb-0.5 uppercase text-[6.5px]">RESOURCE ALLOC</span>
                  <span className="text-purple-300">98.4% CAP</span>
                </div>
              </div>

              {/* Glowing horizontal divider */}
              <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent my-1.5" />

              <div className="flex items-center justify-between text-[8px] font-mono text-cyan-500/50">
                <div className="flex items-center space-x-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-ping" />
                  <span>MATRIX RESPONSIVE</span>
                </div>
                <span className="text-cyan-300">v3.1.2_SYS</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visual Camera Feed when active */}
      <AnimatePresence>
        {isCameraActive && <CameraOverlay />}
      </AnimatePresence>

      {/* TOP LEFT: Brand & Core Ident */}
      <motion.div 
        initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }} 
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} 
        transition={{ type: 'spring', damping: 25, stiffness: 100, delay: 0.1 }}
        className="absolute top-8 left-8 flex flex-col z-10 pointer-events-none"
      >
        <div className="flex items-center space-x-6 mb-1">
           <div className="relative flex items-center justify-center w-14 h-14">
             {/* Core engine state configuration mapping */}
             {(() => {
               const stateConfig = {
                 idle: {
                   accent: 'from-cyan-400 via-slate-100 to-cyan-500',
                   text: 'text-cyan-400',
                   badge: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/20',
                   radialGlow: 'rgba(34,211,238,0.22)',
                   orbColor: '#22d3ee',
                   outerSpeed: 90,
                   innerSpeed: 45,
                   ringScale: 1,
                   techLabel: 'STANDBY // REGULAR',
                   hologramText: 'NXS_SYS_IDLE_01'
                 },
                 listening: {
                   accent: 'from-blue-400 via-white to-cyan-500',
                   text: 'text-blue-400',
                   badge: 'border-blue-500/40 text-blue-300 bg-blue-950/25 animate-pulse',
                   radialGlow: 'rgba(59,130,246,0.35)',
                   orbColor: '#3b82f6',
                   outerSpeed: 30,
                   innerSpeed: 15,
                   ringScale: 1.15,
                   techLabel: 'LISTENING // AUDIO',
                   hologramText: 'REC_STRM_ACTIVE'
                 },
                 thinking: {
                   accent: 'from-purple-400 via-white to-pink-500',
                   text: 'text-purple-400',
                   badge: 'border-purple-500/40 text-purple-300 bg-purple-950/25',
                   radialGlow: 'rgba(192,132,252,0.4)',
                   orbColor: '#c084fc',
                   outerSpeed: 14,
                   innerSpeed: 7,
                   ringScale: 1.28,
                   techLabel: 'THINKING // QUANTUM',
                   hologramText: 'PROC_NEURAL_LINK'
                 },
                 speaking: {
                   accent: 'from-blue-400 via-white to-indigo-500',
                   text: 'text-blue-400',
                   badge: 'border-blue-500/40 text-blue-300 bg-blue-950/25',
                   radialGlow: 'rgba(96,165,250,0.3)',
                   orbColor: '#60a5fa',
                   outerSpeed: 40,
                   innerSpeed: 20,
                   ringScale: 1.1,
                   techLabel: 'SPEAKING // TRANSMITTING',
                   hologramText: 'TTS_AUDIO_OUT_ON'
                 }
               }[systemState] || {
                 accent: 'from-cyan-400 via-slate-100 to-cyan-500',
                 text: 'text-cyan-400',
                 badge: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/20',
                 radialGlow: 'rgba(34,211,238,0.22)',
                 orbColor: '#22d3ee',
                 outerSpeed: 90,
                 innerSpeed: 45,
                 ringScale: 1,
                 techLabel: 'STANDBY // REGULAR',
                 hologramText: 'NXS_SYS_IDLE_01'
               };

               return (
                 <>
                   {/* Radial Ambient Glow */}
                   <div 
                     className="absolute inset-[-12px] rounded-full filter blur-[14px] transition-all duration-1000 opacity-60"
                     style={{
                       background: `radial-gradient(circle, ${stateConfig.radialGlow} 0%, transparent 70%)`
                     }}
                   />

                   {/* Concentric Premium Vector Logo Symbol */}
                   <svg className="absolute w-15 h-15 overflow-visible" viewBox="0 0 100 100" fill="none">
                     <defs>
                       <radialGradient id="logoCoreGlow" cx="50%" cy="50%" r="50%">
                         <stop offset="0%" stopColor={stateConfig.orbColor} stopOpacity="1" />
                         <stop offset="40%" stopColor={stateConfig.orbColor} stopOpacity="0.45" />
                         <stop offset="100%" stopColor={stateConfig.orbColor} stopOpacity="0" />
                       </radialGradient>
                       <filter id="vectorDropShadow" x="-20%" y="-20%" width="140%" height="140%">
                         <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={stateConfig.orbColor} floodOpacity="0.7" />
                       </filter>
                     </defs>

                     {/* Circle A: Ultimate Outer Compass Boundary */}
                     <circle
                       cx="50" cy="50" r="48"
                       stroke="currentColor"
                       className={`${stateConfig.text} opacity-15`}
                       strokeWidth="0.5"
                     />

                     {/* Vector Compass Dial Ticks (24 intervals) */}
                     {Array.from({ length: 24 }).map((_, i) => {
                       const angle = (i * 15 * Math.PI) / 180;
                       const isMajor = i % 6 === 0;
                       const isMedium = i % 3 === 0 && !isMajor;
                       const len = isMajor ? 5.5 : (isMedium ? 3.5 : 2);
                       const rStart = 48 - len;
                       const rEnd = 48;
                       const x1 = 50 + Math.cos(angle) * rStart;
                       const y1 = 50 + Math.sin(angle) * rStart;
                       const x2 = 50 + Math.cos(angle) * rEnd;
                       const y2 = 50 + Math.sin(angle) * rEnd;
                       return (
                         <line
                           key={`compass-tick-${i}`}
                           x1={x1}
                           y1={y1}
                           x2={x2}
                           y2={y2}
                           stroke="currentColor"
                           className={`${stateConfig.text} ${isMajor ? 'opacity-40' : (isMedium ? 'opacity-25' : 'opacity-10')}`}
                           strokeWidth={isMajor ? '0.75' : '0.5'}
                         />
                       );
                     })}

                     {/* Navigation/Calibration Angular Marks */}
                     <g className={`${stateConfig.text} font-mono text-[4.5px] font-bold opacity-30 select-none`}>
                       <text x="50" y="8" textAnchor="middle">00</text>
                       <text x="94" y="51.5" textAnchor="middle">90</text>
                       <text x="50" y="95" textAnchor="middle">18</text>
                       <text x="6" y="51.5" textAnchor="middle">27</text>
                     </g>

                     {/* Rotating Calibration Ring with high-tech offset dash arrays */}
                     <motion.circle
                       cx="50" cy="50" r="41"
                       stroke="currentColor"
                       className={`${stateConfig.text} opacity-20`}
                       strokeWidth="0.75"
                       strokeDasharray="4 8 20 8"
                       animate={{ rotate: 360 }}
                       transition={{ repeat: Infinity, ease: 'linear', duration: stateConfig.outerSpeed }}
                     />

                     {/* Reverse Rotating Secondary Circular Ring */}
                     <motion.circle
                       cx="50" cy="50" r="37"
                       stroke="currentColor"
                       className={`${stateConfig.text} opacity-15`}
                       strokeWidth="0.5"
                       strokeDasharray="1 5"
                       animate={{ rotate: -360 }}
                       transition={{ repeat: Infinity, ease: 'linear', duration: stateConfig.outerSpeed * 0.6 }}
                     />

                     {/* High-Tech Cardinal Crosshair Lines (Gapped in center for the reactor) */}
                     <line x1="50" y1="13" x2="50" y2="28" stroke="currentColor" className={`${stateConfig.text} opacity-20`} strokeWidth="0.75" />
                     <line x1="50" y1="72" x2="50" y2="87" stroke="currentColor" className={`${stateConfig.text} opacity-20`} strokeWidth="0.75" />
                     <line x1="13" y1="50" x2="28" y2="50" stroke="currentColor" className={`${stateConfig.text} opacity-20`} strokeWidth="0.75" />
                     <line x1="72" y1="50" x2="87" y2="50" stroke="currentColor" className={`${stateConfig.text} opacity-20`} strokeWidth="0.75" />

                     {/* Rotating Middle Group: Hexagonal vector geometry */}
                     <motion.g
                       animate={{ 
                         rotate: 360,
                         scale: stateConfig.ringScale 
                       }}
                       transition={{ 
                         rotate: { repeat: Infinity, ease: 'linear', duration: stateConfig.innerSpeed },
                         scale: { type: 'spring', stiffness: 220, damping: 22 }
                       }}
                       style={{ originX: '50px', originY: '50px' }}
                     >
                       {/* High-tech main Hexagon */}
                       <polygon
                         points="50,23 73.4,36.5 73.4,63.5 50,77 26.6,63.5 26.6,36.5"
                         stroke="currentColor"
                         className={`${stateConfig.text} opacity-30`}
                         strokeWidth="1"
                       />
                       {/* Subtle inner boundary ticks on the hexagon */}
                       <circle cx="50" cy="50" r="27.5" stroke="currentColor" className={`${stateConfig.text} opacity-10`} strokeWidth="0.5" strokeDasharray="1 2" />
                     </motion.g>

                     {/* Counter-Rotating Middle Group: Star of David / Merkabah crystalline structure */}
                     <motion.g
                       animate={{ 
                         rotate: -360,
                         scale: stateConfig.ringScale * 0.95
                       }}
                       transition={{ 
                         rotate: { repeat: Infinity, ease: 'linear', duration: stateConfig.innerSpeed * 0.75 },
                         scale: { type: 'spring', stiffness: 220, damping: 22 }
                       }}
                       style={{ originX: '50px', originY: '50px' }}
                     >
                       {/* Triangle pointing up */}
                       <polygon
                         points="50,27 69.5,61 30.5,61"
                         stroke="currentColor"
                         className={`${stateConfig.text} opacity-25`}
                         strokeWidth="0.75"
                       />
                       {/* Triangle pointing down */}
                       <polygon
                         points="50,73 69.5,39 30.5,39"
                         stroke="currentColor"
                         className={`${stateConfig.text} opacity-20`}
                         strokeWidth="0.5"
                       />

                       {/* Orbiting Tech Carrier Nodes */}
                       <circle cx="50" cy="27" r="1.5" fill="currentColor" className={`${stateConfig.text}`} />
                       <circle cx="69.5" cy="61" r="1.5" fill="currentColor" className={`${stateConfig.text}`} />
                       <circle cx="30.5" cy="61" r="1.5" fill="currentColor" className={`${stateConfig.text}`} />
                     </motion.g>

                     {/* Tech Info Readout Arc inside Logo */}
                     <path
                       d="M 28 50 A 22 22 0 0 1 72 50"
                       stroke="currentColor"
                       className={`${stateConfig.text} opacity-30`}
                       strokeWidth="0.5"
                       strokeDasharray="2 2"
                     />

                     {/* Deep Core Interactive Glowing Halos */}
                     <circle
                       cx="50"
                       cy="50"
                       r="16"
                       fill="url(#logoCoreGlow)"
                       className="opacity-40 animate-pulse"
                     />
                   </svg>

                   {/* Active physical state-colored core orb with true physical blur and micro glow */}
                   <div className="absolute flex items-center justify-center pointer-events-none">
                     <motion.div
                       animate={{
                         scale: systemState === 'listening' ? [1, 1.45, 1] : (systemState === 'speaking' ? [1, 1.25, 1] : [1, 1.05, 1]),
                         opacity: systemState === 'thinking' ? [0.4, 0.8, 0.4] : 0.6
                       }}
                       transition={{
                         repeat: Infinity,
                         duration: systemState === 'listening' ? 1.2 : (systemState === 'speaking' ? 1.7 : (systemState === 'thinking' ? 0.8 : 4.5)),
                         ease: 'easeInOut'
                       }}
                       className={`absolute w-7 h-7 rounded-full filter blur-[1px] transition-all duration-1000 border ${
                         systemState === 'idle' ? 'border-cyan-500/20 bg-cyan-950/10' :
                         systemState === 'listening' ? 'border-emerald-500/40 bg-emerald-950/20' :
                         systemState === 'thinking' ? 'border-purple-500/40 bg-purple-950/20' :
                         'border-blue-500/40 bg-blue-950/20'
                       }`}
                     />
                     <motion.div
                       animate={{
                         scale: systemState === 'listening' ? 1.15 : (systemState === 'thinking' ? 0.9 : 1)
                       }}
                       className={`w-2.5 h-2.5 rounded-full transition-all duration-700 shadow-[0_0_15px_currentColor] ${
                         systemState === 'idle' ? 'bg-cyan-400 text-cyan-400' :
                         systemState === 'listening' ? 'bg-emerald-400 text-emerald-400' :
                         systemState === 'thinking' ? 'bg-purple-400 text-purple-400' :
                         'bg-blue-400 text-blue-400'
                       }`}
                       style={{ filter: 'url(#vectorDropShadow)' as any }}
                     />
                   </div>
                 </>
               );
             })()}
           </div>
           
           <div className="flex flex-col">
             {(() => {
               const textConfig = {
                 idle: {
                   accent: 'from-cyan-400 via-slate-100 to-cyan-500',
                   text: 'text-cyan-500/70',
                   badge: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/20',
                   techLabel: 'STANDBY // REGULAR'
                 },
                 listening: {
                   accent: 'from-blue-400 via-white to-cyan-400',
                   text: 'text-blue-500/70',
                   badge: 'border-blue-500/40 text-blue-300 bg-blue-950/25 animate-pulse',
                   techLabel: 'LISTENING // AUDIO'
                 },
                 thinking: {
                   accent: 'from-purple-400 via-white to-pink-400',
                   text: 'text-purple-500/70',
                   badge: 'border-purple-500/40 text-purple-300 bg-purple-950/25',
                   techLabel: 'THINKING // QUANTUM'
                 },
                 speaking: {
                   accent: 'from-blue-400 via-white to-indigo-400',
                   text: 'text-blue-500/70',
                   badge: 'border-blue-500/40 text-blue-300 bg-blue-950/25',
                   techLabel: 'SPEAKING // TRANSMITTING'
                 }
               }[systemState] || {
                 accent: 'from-cyan-400 via-slate-100 to-cyan-500',
                 text: 'text-cyan-500/70',
                 badge: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/20',
                 techLabel: 'STANDBY // REGULAR'
               };

               return (
                 <>
                   <div className="flex items-center space-x-2.5">
                     <motion.h1 
                       className={`text-transparent bg-clip-text bg-gradient-to-r ${textConfig.accent} text-sm font-black tracking-[0.6em] uppercase leading-none filter drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]`}
                       animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                       transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                       style={{ backgroundSize: '200% auto' }}
                     >
                       NEXUS
                     </motion.h1>
                     <span className={`px-1.5 py-0.5 rounded text-[7px] tracking-widest font-mono font-bold transition-all duration-500 border ${textConfig.badge}`}>
                       {textConfig.techLabel}
                     </span>
                   </div>
                   <p className={`${textConfig.text} font-mono text-[8.5px] tracking-[0.35em] uppercase mt-1.5 flex items-center space-x-2`}>
                     <span>Neural Engine 3.1</span>
                     <span className="w-1 h-1 bg-cyan-500 rounded-full animate-ping"></span>
                   </p>
                 </>
               );
             })()}
           </div>
        </div>
        <div className="ml-[3.5rem] mt-2">
            <UserVoiceLine />
        </div>
      </motion.div>

      {/* TOP RIGHT: Telemetry Data */}
      <motion.div 
        initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} transition={{ type: 'spring', damping: 25, stiffness: 100, delay: 0.2 }}
        className="absolute top-8 right-8 flex flex-col items-end z-10 font-mono text-[10px] text-cyan-500/60 tracking-widest text-right pointer-events-none"
      >
        <motion.div 
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center space-x-3 pointer-events-auto cursor-pointer group" onClick={() => setChatOpen(!isChatOpen)}>
          <span className="group-hover:text-cyan-300 transition-colors duration-500">TERMINAL // MSG</span>
          <div className={`p-1.5 rounded-md border backdrop-blur-md transition-all duration-500 ${isChatOpen ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-black/40 border-white/10 text-white/40 group-hover:bg-white/10 group-hover:border-white/30'}`}>
            <TerminalSquare className="w-3 h-3" />
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-2 flex items-center space-x-3 pointer-events-auto cursor-pointer group" onClick={() => setHAPanelOpen(!isHAPanelOpen)}>
          <span className="group-hover:text-cyan-300 transition-colors duration-500">UPLINK // IOT</span>
          <div className={`p-1.5 rounded-md border backdrop-blur-md transition-all duration-500 ${isHAPanelOpen ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-black/40 border-white/10 text-white/40 group-hover:bg-white/10 group-hover:border-white/30'}`}>
            <Server className="w-3 h-3" />
          </div>
        </motion.div>
        
        <div className="mt-4 flex flex-col bg-black/40 border border-white/10 rounded-xl backdrop-blur-md p-3 space-y-3 pointer-events-auto shadow-lg hover:border-white/20 transition-colors duration-500">
          <motion.div whileHover={{ x: -2 }} className="flex justify-between items-center space-x-8 group cursor-default">
            <span className="text-white/40 group-hover:text-white/60 transition-colors">UPTIME</span>
            <div className="flex items-center space-x-2">
               <span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">{uptime}</span>
               <Clock className="w-3 h-3 text-cyan-400/50 group-hover:text-cyan-400 transition-colors" />
            </div>
          </motion.div>
          <div className="h-[1px] w-full bg-white/5 group-hover:bg-white/10 transition-colors" />
          <motion.div whileHover={{ x: -2 }} className="flex justify-between items-center space-x-8 group cursor-default">
            <span className="text-white/40 group-hover:text-white/60 transition-colors">MEM</span>
            <div className="flex items-center space-x-2">
               <span className="text-purple-400 group-hover:text-purple-300 transition-colors">{memoryLimit}</span>
               <Cpu className="w-3 h-3 text-purple-400/50 group-hover:text-purple-400 transition-colors" />
            </div>
          </motion.div>
          <div className="h-[1px] w-full bg-white/5 group-hover:bg-white/10 transition-colors" />
          <motion.div whileHover={{ x: -2 }} className="flex justify-between items-center space-x-8 group cursor-default">
            <span className="text-white/40 group-hover:text-white/60 transition-colors">NET</span>
            <div className="flex items-center space-x-2">
               <span className={`${ping ? (ping > 150 ? 'text-orange-400 group-hover:text-orange-300' : 'text-emerald-400 group-hover:text-emerald-300') : 'text-cyan-400 group-hover:text-cyan-300'} transition-colors`}>
                 {ping ? `${ping} MS` : 'MEASURING'}
               </span>
               <Activity className={`w-3 h-3 transition-colors ${ping ? (ping > 150 ? 'text-orange-400/50 group-hover:text-orange-400' : 'text-emerald-400/50 group-hover:text-emerald-400') : 'text-cyan-400/50 group-hover:text-cyan-400'}`} />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* BOTTOM LEFT: System Status Blocks */}
      <motion.div 
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ type: 'spring', damping: 25, stiffness: 100, delay: 0.3 }}
        className="absolute bottom-8 left-8 flex flex-col z-10 pointer-events-none space-y-4"
      >
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center justify-center w-12 h-12 border border-white/10 bg-black/40 backdrop-blur-md rounded-lg transition-colors duration-700">
             <span className="font-mono text-[8px] text-white/40 mb-1">LINK</span>
             <div className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${connectionState === 'connected' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] scale-110' : 'bg-red-500/50 scale-100'}`}></div>
          </div>
          <div className="flex flex-col items-center justify-center w-12 h-12 border border-white/10 bg-black/40 backdrop-blur-md rounded-lg transition-colors duration-700">
             <span className="font-mono text-[8px] text-white/40 mb-1">STATE</span>
             <div className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
               systemState === 'idle' ? 'bg-cyan-500/50' : 
               systemState === 'listening' ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6] scale-125' : 
               systemState === 'thinking' ? 'bg-purple-400 shadow-[0_0_8px_#c084fc] scale-110' : 
               'bg-blue-400 shadow-[0_0_8px_#60a5fa] scale-110'
             }`}></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 max-w-xs">
          <div className="h-[1px] w-8 bg-cyan-900/50"></div>
          <div className="font-mono text-[9px] uppercase tracking-widest flex items-center relative h-4 overflow-hidden">
             <AnimatePresence mode="popLayout">
               <motion.span 
                 key={connectionState + systemState}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 10 }}
                 transition={{ duration: 0.4, ease: "easeOut" }}
                 className={`whitespace-nowrap transition-colors duration-500 ${
                   connectionState === 'error' ? 'text-red-500' :
                   systemState === 'listening' ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]' :
                   systemState === 'thinking' ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]' :
                   systemState === 'speaking' ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]' :
                   'text-cyan-600'
                 }`}
               >
                 {connectionState === 'offline' && '[ UPLINK_OFFLINE — AWAITING_INIT ]'}
                 {connectionState === 'connecting' && '[ ESTABLISHING_NEURAL_LINK... ]'}
                 {connectionState === 'error' && '[ LINK_ERROR — RETRY_REQUIRED ]'}
                 {connectionState === 'connected' && systemState === 'listening' && '[ LISTENING — AWAITING_COMMAND ]'}
                 {connectionState === 'connected' && systemState === 'thinking' && '[ PROCESSING_NEURAL_QUERY... ]'}
                 {connectionState === 'connected' && systemState === 'speaking' && '[ TRANSMITTING_AUDIO_RESPONSE ]'}
                 {connectionState === 'connected' && systemState === 'idle' && '[ SYSTEM_IDLE — STANDING_BY ]'}
               </motion.span>
             </AnimatePresence>
          </div>
        </div>
      </motion.div>


      {/* MAIN CONTROL: Quantum Core Mic */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center justify-end z-20">
        
        <AnimatePresence>
          {errorMessage && (
             <motion.div 
               initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
               transition={{ type: 'spring', damping: 20, stiffness: 200 }}
               className="absolute bottom-full mb-6 flex items-center space-x-3 px-6 py-2 rounded-lg bg-red-950/80 border-[0.5px] border-red-500/50 text-red-200 text-[10px] tracking-widest uppercase shadow-[0_0_15px_rgba(239,68,68,0.2)] backdrop-blur-xl whitespace-nowrap"
             >
               <AlertCircle className="w-3 h-3 text-red-500" />
               <span>{errorMessage}</span>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Control Cluster */}
        <div className="relative flex items-center justify-center mt-2 group">
          
          <AudioVisualizer />
          
          {/* Master Control Button */}
          <div className="relative flex items-center justify-center w-24 h-24">
            
            {/* Outer Dash Ring */}
            <div className={`absolute inset-0 rounded-full border-[0.5px] border-dashed transition-all ease-[cubic-bezier(0.16,1,0.3,1)] duration-1000 ${isLive ? 'border-cyan-500/50 scale-110 opacity-70 animate-[spin_20s_linear_infinite]' : 'border-white/20 scale-100 opacity-20 group-hover:scale-105 group-hover:border-cyan-500/40'}`} />
            
            {/* Inner Asymmetrical Tech Ring */}
            <div className={`absolute inset-3 rounded-full transition-all ease-[cubic-bezier(0.16,1,0.3,1)] duration-700 border border-transparent ${isLive ? 'scale-105 border-t-cyan-400/60 border-r-cyan-400/20 animate-[spin_4s_linear_infinite_reverse]' : 'scale-100 border-t-white/10 group-hover:border-t-cyan-500/50 group-hover:block'}`} />
            
            {/* Dynamic Core Aura */}
            <div className={`absolute inset-6 rounded-full transition-colors duration-1000 pointer-events-none blur-[20px] ${
               !isLive ? 'bg-transparent' :
               systemState === 'listening' ? 'bg-blue-500/40' :
               systemState === 'thinking' ? 'bg-purple-500/40' :
               systemState === 'speaking' ? 'bg-blue-500/40' :
               'bg-cyan-500/30'
            }`} />

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              onClick={toggleLink}
              disabled={connectionState === 'connecting'}
              className={`
                relative w-12 h-12 rounded-full backdrop-blur-md transition-colors duration-500 border flex items-center justify-center overflow-hidden z-20
                ${connectionState === 'connected' 
                    ? 'bg-black/60 shadow-[0_0_25px_rgba(34,211,238,0.3)] border-cyan-500/50' 
                    : 'bg-black/40 border-white/20 hover:bg-cyan-900/20'
                }
                ${connectionState === 'connecting' ? 'opacity-50 cursor-wait' : ''}
              `}
            >
              {/* Target Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                 <div className="w-full h-[1px] bg-cyan-300" />
                 <div className="absolute h-full w-[1px] bg-cyan-300" />
              </div>
              
              {connectionState === 'connected' 
                ? <Mic className={`w-5 h-5 relative z-10 transition-colors duration-700 ${
                    systemState === 'listening' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' :
                    systemState === 'thinking' ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' :
                    systemState === 'speaking' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' :
                    'text-cyan-400'
                  }`} /> 
                : <MicOff className="w-5 h-5 text-white/50 relative z-10 group-hover:text-cyan-400 transition-colors" />
              }
            </motion.button>
          </div>

          {/* Camera Access Toggle */}
          <motion.button
            whileHover={{ scale: 1.05, x: 2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={toggleCameraSync}
            className={`absolute -right-14 w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-500 z-10
              ${isCameraActive 
                  ? 'bg-cyan-900/40 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                  : 'bg-black/40 border-white/10 text-white/30 hover:border-white/30 hover:text-white/60'
              }
            `}
          >
             {isCameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
          </motion.button>

        </div>

        {/* Uplink Status Text */}
        <div className="mt-4 text-center pointer-events-none h-4">
          <AnimatePresence mode="wait">
            <motion.p 
              key={connectionState + systemState}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="text-[8px] tracking-[0.4em] uppercase font-mono text-cyan-600/70"
            >
              {connectionState === 'connecting' ? '[ INIT_LINK_PROTOCOL ]' : 
               connectionState === 'connected' ? `[ SYS: ${systemState} ]` : 
               '[ UPLINK_OFFLINE ]'}
            </motion.p>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
