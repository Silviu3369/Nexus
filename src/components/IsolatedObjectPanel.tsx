import { useState } from 'react';
import { useAIStore } from '../store/aiStore';
import { motion } from 'framer-motion';
import { X, Cpu, Zap, ShieldCheck, Thermometer, Gauge, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';

export function IsolatedObjectPanel() {
  const { isolatedObject, setIsolatedObject, setIsolatedPanelOpen } = useAIStore();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [powerState, setPowerState] = useState(true);

  if (!isolatedObject) return null;

  const handleClose = () => {
    setIsolatedObject(null);
    setIsolatedPanelOpen(false);
  };

  const startCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      setIsCalibrating(false);
    }, 2000);
  };

  // Safe parse for custom telemetry attributes if available
  let parsedTelemetry: Record<string, string> = {
    "Detection confidence": `${Math.round(isolatedObject.confidence * 100)}%`,
    "Optic stream link": "LENS_01_SECURE",
    "Current range": "1.45m",
    "Power consumption": "MINIMAL (STBY)",
  };

  if (isolatedObject.mockAttributes) {
    try {
      const parsed = JSON.parse(isolatedObject.mockAttributes);
      parsedTelemetry = { ...parsedTelemetry, ...parsed };
    } catch (e) {
      // Ignore fallback
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: -50, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, x: -50, filter: 'blur(10px)' }}
      transition={{ type: "spring", damping: 22, stiffness: 120 }}
      className="absolute left-8 top-10 md:top-24 max-w-[90vw] w-[340px] md:w-[380px] bg-slate-950/85 backdrop-blur-xl border border-cyan-500/25 rounded-2xl overflow-hidden shadow-[0_0_45px_rgba(6,182,212,0.18)] z-30 flex flex-col pointer-events-auto"
      style={{
        clipPath: "polygon(0% 0%, 100% 0%, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0% 100%)"
      }}
    >
      {/* Decorative colored glow line top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500" />

      {/* Header section with telemetry label */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/15 bg-black/40">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-[9px] tracking-[0.16em] text-cyan-300 font-bold uppercase">ISOLATED TARGET ANALYSIS</span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-cyan-500/10 text-cyan-300 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex-1 space-y-4">
        {/* Isolated Entity Title & Stats */}
        <div>
          <h2 className="text-xl font-medium tracking-tight text-slate-100 flex items-center justify-between">
            {isolatedObject.name}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
              ID: {isolatedObject.id.toUpperCase()}
            </span>
          </h2>
          <p className="text-xs text-cyan-400/70 font-mono mt-1">
            STATUS: {isolatedObject.status || (powerState ? "CONNECTED" : "INACTIVE")}
          </p>
        </div>

        {/* Dynamic Interactive Object Representation */}
        <div className="relative h-44 bg-black/60 rounded-xl border border-cyan-500/10 overflow-hidden flex items-center justify-center group-hover:border-cyan-500/25 transition-colors">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:12px_12px]" />
          
          {isolatedObject.croppedImage && powerState ? (
            <div className="absolute inset-0 flex items-center justify-center p-2 bg-slate-950/40">
              <img 
                src={isolatedObject.croppedImage} 
                alt={isolatedObject.name}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-contain rounded-lg transition-all duration-500 ${
                  isCalibrating ? 'blur-sm scale-105 brightness-125 contrast-125' : 'blur-none scale-100'
                }`} 
              />
              {/* Dynamic Scanline/Reticle overlay */}
              <div className="absolute inset-1 border border-cyan-500/20 rounded-lg pointer-events-none" />

              {/* Dynamic Reticle sight in center */}
              <div className="absolute w-6 h-6 border border-white/10 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-ping" />
              </div>
            </div>
          ) : (
            <>
              {/* Animated Waveform / Radar visual backdrop */}
              <div className="absolute w-20 h-20 rounded-full border border-cyan-500/10 animate-[ping_4s_linear_infinite]" />
              <div className="absolute w-12 h-12 rounded-full border border-cyan-500/20 animate-[spin_10s_linear_infinite] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-dashed border-cyan-500/30" />
              </div>

              <div className="relative text-center z-10">
                <Cpu className={`w-8 h-8 mx-auto text-cyan-400 ${powerState && !isCalibrating ? 'animate-[pulse_2s_infinite]' : ''} ${isCalibrating ? 'animate-spin' : ''}`} />
                <span className="block text-[8px] font-mono text-cyan-300/60 uppercase tracking-[0.2em] mt-2">
                  {isCalibrating ? "SYNCING SENSOR..." : "SENSOR RUNNING"}
                </span>
              </div>
            </>
          )}

          {/* Calibrating indicator */}
          {isCalibrating && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 font-mono text-[9px] text-cyan-300 tracking-widest uppercase gap-1.5 animate-pulse">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>SYNCING SENSOR FEED...</span>
            </div>
          )}

          {/* Standby signal overlay */}
          {!powerState && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-10 font-mono text-[8px] text-rose-400 tracking-widest uppercase gap-1.5 border border-rose-500/20">
              <Zap className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>SENSOR OFFLINE</span>
            </div>
          )}
        </div>

        {/* Diagnostics & Descriptions (Markdown supported) */}
        {isolatedObject.diagnostics && (
          <div className="bg-[#030712]/50 border border-cyan-500/10 rounded-xl p-3 text-[12px] text-slate-300 font-normal leading-relaxed prose prose-invert prose-indigo">
            <Markdown>{isolatedObject.diagnostics}</Markdown>
          </div>
        )}

        {/* Dynamic Telemetry Matrix Grid */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(parsedTelemetry).map(([key, value]) => (
            <div key={key} className="bg-black/30 border border-cyan-500/5 p-2 rounded-xl flex items-center space-x-2">
              {key.toLowerCase().includes('conf') ? (
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              ) : key.toLowerCase().includes('temp') ? (
                <Thermometer className="w-3.5 h-3.5 text-[#fb7185]" />
              ) : key.toLowerCase().includes('power') ? (
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Gauge className="w-3.5 h-3.5 text-cyan-300/75" />
              )}
              <div className="overflow-hidden">
                <span className="block text-[7px] font-mono uppercase text-cyan-400/40 tracking-wider truncate">{key}</span>
                <span className="text-[11px] font-mono font-medium text-cyan-200 truncate block">{value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Controls Row */}
        <div className="pt-2 border-t border-cyan-500/10 flex gap-2">
          <button
            onClick={() => setPowerState(!powerState)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg border text-xs font-mono tracking-wider transition-all duration-300 uppercase ${
              powerState
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${powerState ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span>{powerState ? "Power: On" : "Power: Off"}</span>
          </button>

          <button
            onClick={startCalibration}
            disabled={isCalibrating || !powerState}
            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-mono tracking-wider transition-all duration-300 uppercase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
            <span>{isCalibrating ? "Syncing..." : "Calibrate"}</span>
          </button>
        </div>
      </div>
      
      {/* Visual clip-path accent */}
      <div className="absolute bottom-1 right-1 w-6 h-6 border-b border-r border-cyan-500/30 select-none pointer-events-none" />
    </motion.div>
  );
}
