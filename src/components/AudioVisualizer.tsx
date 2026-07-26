import { useRef, useEffect } from 'react';
import { useAIStore } from '../store/aiStore';
import { audioManager } from '../services/audioManager';

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { systemState } = useAIStore();
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;
    const BASE_RADIUS = 51; // Raza cercului de baza
    
    // Variabila pt a "netezi" volumul intre frame-uri
    let smoothedVol = 0;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      timeRef.current += 0.02;
      ctx2d.clearRect(0, 0, W, H);

      const rawData = audioManager.getFrequencyData();
      const userRawData = audioManager.getUserFrequencyData();
      const isActive = systemState === 'speaking' || systemState === 'listening';

      let data = rawData;
      if (systemState === 'listening') {
         data = userRawData;
      }

      // Calcul volum
      let sum = 0;
      if (data) {
        for (let i = 0; i < 16; i++) sum += data[i]; // Bas si medii-joase
      }
      const rawVol = data ? sum / 16 / 255 : 0;
      smoothedVol += (rawVol - smoothedVol) * 0.2; // Lerping

      // Culori in functie de stare
      const colorMain = systemState === 'speaking' ? '255, 255, 255' : '255, 0, 170'; // White pt vorbire, Hot Pink pt ascultare
      const colorGlow = systemState === 'speaking' ? '#ff2a85' : '#00e5ff'; // Neon Pink glow pt vorbire, Cyan pt idle/ascultare

      const drawBlob = (baseR: number, offsetAmnt: number, timeSpeed: number, lineWidth: number, alpha: number, fillAlpha: number) => {
        ctx2d.beginPath();
        const p = [];
        const STEPS = 30;
        
        for (let i = 0; i < STEPS; i++) {
          const angle = (i / STEPS) * Math.PI * 2;
          // Deformatie fluida prin combinarea sin si cos
          const noise = Math.sin(angle * 3 + timeRef.current * timeSpeed) * Math.cos(angle * 2 - timeRef.current * (timeSpeed * 0.8));
          const r = baseR + noise * offsetAmnt * smoothedVol;
          p.push({x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r});
        }
        
        const startX = (p[STEPS-1].x + p[0].x) / 2;
        const startY = (p[STEPS-1].y + p[0].y) / 2;
        ctx2d.moveTo(startX, startY);
        
        for (let i = 0; i < STEPS; i++) {
          const next = (i + 1) % STEPS;
          const xc = (p[i].x + p[next].x) / 2;
          const yc = (p[i].y + p[next].y) / 2;
          ctx2d.quadraticCurveTo(p[i].x, p[i].y, xc, yc);
        }
        
        ctx2d.strokeStyle = `rgba(${colorMain}, ${alpha})`;
        ctx2d.lineWidth = lineWidth;
        ctx2d.shadowBlur = isActive ? 8 * smoothedVol : 0; // Fara glow sters pe idle
        ctx2d.shadowColor = colorGlow;
        ctx2d.stroke();
        
        if (fillAlpha > 0) {
           ctx2d.fillStyle = `rgba(${colorMain}, ${fillAlpha})`;
           ctx2d.fill();
        }
        
        ctx2d.shadowBlur = 0; // reset
      };

      const activeRadius = isActive ? BASE_RADIUS + smoothedVol * 2 : BASE_RADIUS;
      
      const baseAlpha = isActive ? 0.15 : 0.02; // Foarte subtil pe idle
      const dynAlpha = baseAlpha + smoothedVol * 0.4;
      const dynFill = isActive ? 0.01 + smoothedVol * 0.08 : 0;
      
      // Inelul 1: Baza solida / Inner core, mai subtil
      drawBlob(activeRadius, 6, 1.2, 1.0, dynAlpha, dynFill);
      
      // Inelul 2: Aura exterioara mai rapida in miscare / Outer ethereal wrap
      if (isActive && smoothedVol > 0.01) {
         drawBlob(activeRadius + 3 + smoothedVol * 5, 12, -2.0, 0.8, 0.1 + smoothedVol * 0.2, 0);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [systemState]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="absolute pointer-events-none z-10"
      style={{ opacity: 0.9 }}
    />
  );
}
