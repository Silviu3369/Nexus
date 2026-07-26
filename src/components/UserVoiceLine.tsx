import { useRef, useEffect } from 'react';
import { useAIStore } from '../store/aiStore';
import { audioManager } from '../services/audioManager';

export function UserVoiceLine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { systemState } = useAIStore();
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    let smoothedVol = 0;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      
      const W = canvas.width;
      const H = canvas.height;
      ctx2d.clearRect(0, 0, W, H);

      if (systemState !== 'listening') {
          // Slow decay over 1-2 seconds when listening stops
          smoothedVol += (0 - smoothedVol) * 0.02;
      } else {
          const userRawData = audioManager.getUserFrequencyData();
          let sum = 0;
          if (userRawData) {
              for (let i = 0; i < 16; i++) sum += userRawData[i];
          }
          const rawVol = userRawData ? sum / 16 / 255 : 0;
          
          if (rawVol > smoothedVol) {
              // Fast attack when user speaks
              smoothedVol += (rawVol - smoothedVol) * 0.3;
          } else {
              // Smooth decay over 1-2 seconds when user stops/pauses
              smoothedVol += (rawVol - smoothedVol) * 0.02;
          }
      }

      ctx2d.beginPath();
      // Draw a line that jumps in the middle based on volume
      ctx2d.moveTo(0, H / 2);
      
      const segments = 40;
      const step = W / segments;
      
      for (let i = 0; i <= segments; i++) {
         const x = i * step;
         // highest displacement in center
         const distanceToCenter = Math.abs((W / 2) - x) / (W / 2);
         const amplitude = (1 - distanceToCenter) * (H * 0.4) * Math.max(0, smoothedVol - 0.1) * 3;
         const yOffset = (Math.random() - 0.5) * 2 * amplitude;
         ctx2d.lineTo(x, (H / 2) + yOffset);
      }

      ctx2d.strokeStyle = 'rgba(34, 211, 238, ' + (0.3 + smoothedVol * 0.7) + ')'; // Cyan color
      ctx2d.lineWidth = 1.5;
      ctx2d.shadowBlur = 8 * smoothedVol;
      ctx2d.shadowColor = '#22d3ee';
      ctx2d.stroke();
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [systemState]);

  return (
    <canvas
      ref={canvasRef}
      width={100}
      height={24}
      className="opacity-80"
    />
  );
}
