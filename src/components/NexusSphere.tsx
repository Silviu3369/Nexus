import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { useAIStore } from '../store/aiStore';

export function NexusSphere({ className = "absolute inset-0 z-0 w-full h-full pointer-events-none" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Track state for animation loop without causing react re-renders
  const stateRef = useRef({
      systemState: 'idle'
  });

  useEffect(() => {
    return useAIStore.subscribe((state) => {
      stateRef.current = {
        systemState: state.systemState
      };
    });
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SETUP SCENE ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    // Pull the camera a bit closer, but the object itself will be modeled much smaller
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6.0; 

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // --- POST-PROCESSING ENHANCEMENTS (AO & Bloom) ---
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Ambient Occlusion
    const ssaoPass = new SSAOPass(scene, camera, width, height);
    ssaoPass.kernelRadius = 16;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
    composer.addPass(ssaoPass);

    // Bloom for Holographic Glow (Clean Abyss look)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.7; // Higher threshold so only exceptionally bright components have a trace of glow
    bloomPass.strength = 0.08; // Significantly reduced to dim down and clean up excessive shine
    bloomPass.radius = 0.2; // Tighter, extremely subtle spread
    composer.addPass(bloomPass);

    // Holographic Imperfections: Film grain and Scanlines
    const filmPass = new FilmPass(0.35, false); // (intensity, grayscale)
    composer.addPass(filmPass);

    // Chromatic Aberration (RGB Shift)
    const rgbShiftPass = new ShaderPass(RGBShiftShader);
    rgbShiftPass.uniforms['amount'].value = 0.0015; // Very subtle base shift
    composer.addPass(rgbShiftPass);

    const mainGroup = new THREE.Group();
    const additive = THREE.AdditiveBlending;

    // --- 1. THE HOLOGRAPHIC NEURAL MATRIX (The Sphere) ---
    
    const customUniforms = {
      uTime: { value: 0 },
      uMorph: { value: 0 }
    };

    const applyOrganicShader = (mat: THREE.Material) => {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = customUniforms.uTime;
        shader.uniforms.uMorph = customUniforms.uMorph;
        
        // Declare uniforms at the top of the shader
        shader.vertexShader = `
          uniform float uTime;
          uniform float uMorph;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          // Calculate an organic pulse displacement combining low and high frequencies
          float pulse = sin(position.x * 2.0 + uTime * 1.5) * cos(position.y * 2.0 + uTime * 1.2) * sin(position.z * 2.0 + uTime * 1.8);
          // Add higher frequency noise for detail and imperfection
          pulse += 0.4 * sin(position.x * 5.0 - uTime) * cos(position.y * 5.0 + uTime * 0.8) * sin(position.z * 5.0 - uTime * 1.3);
          pulse += 0.2 * sin(position.x * 10.0 + uTime * 2.0) * cos(position.z * 10.0 - uTime * 2.0);
          transformed *= (1.0 + pulse * (uMorph + 0.02) * 1.5);
          `
        );
      };
    };

    const isLowerEnd = (navigator.hardwareConcurrency || 4) <= 4 || /Mobi|Android/i.test(navigator.userAgent);
    const baseDetail = isLowerEnd ? 12 : 24; 
    const sphereRadius = 1.35; 

    const lodLines = new THREE.LOD();
    const lodPoints = new THREE.LOD();
    const linesMaterials: THREE.LineBasicMaterial[] = [];
    const pointsMaterials: THREE.PointsMaterial[] = [];
    const geoms: THREE.BufferGeometry[] = [];

    const levels = [
      { detail: baseDetail, distance: 0 },
      { detail: Math.max(1, baseDetail - 8), distance: 8 },
      { detail: Math.max(0, baseDetail - 16), distance: 15 }
    ];

    levels.forEach((level) => {
      const geo = new THREE.IcosahedronGeometry(sphereRadius, level.detail);
      const wire = new THREE.WireframeGeometry(geo);
      geoms.push(geo, wire);

      const linesMat = new THREE.LineBasicMaterial({
          color: new THREE.Color('#00f5ff'),
          transparent: true, opacity: 0.08, blending: additive,
          depthWrite: false
      });
      applyOrganicShader(linesMat);
      linesMaterials.push(linesMat);

      const lines = new THREE.LineSegments(wire, linesMat);
      lines.frustumCulled = true;
      lodLines.addLevel(lines, level.distance);

      const pointsMat = new THREE.PointsMaterial({
          size: 0.015,
          color: new THREE.Color('#00f5ff'),
          transparent: true, opacity: 0.3, blending: additive,
          depthWrite: false
      });
      applyOrganicShader(pointsMat);
      pointsMaterials.push(pointsMat);

      const points = new THREE.Points(geo, pointsMat);
      points.frustumCulled = true;
      lodPoints.addLevel(points, level.distance);
    });

     // Inner Core Sphere for extra depth
    const coreGeo = new THREE.IcosahedronGeometry(sphereRadius * 0.7, baseDetail > 12 ? 8 : 4);
    geoms.push(coreGeo);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00f5ff'),
      transparent: true, opacity: 0.04, blending: additive,
      wireframe: true,
      depthWrite: false
    });
    applyOrganicShader(coreMat);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);

    mainGroup.add(lodLines, lodPoints, coreMesh);

    scene.add(mainGroup);

    // --- COLORS & ANIMATION MAPPING ---
    // Make colors highly vibrant and active, increasing the morph parameter radically while speaking.
    // Specially selected digital teal-cyan, cobalt sapphire, and indigo violet premium palette.
    const config = {
      idle:      { primary: '#00f5ff', secondary: '#8b5cf6', speed: 1.0, scale: 1.00, morph: 0.015 }, // Gorgeous digital teal-cyan for rich idle presence
      listening: { primary: '#3b82f6', secondary: '#00f5ff', speed: 3.5, scale: 1.05, morph: 0.05 },  // Receptive sapphire active visual wave
      thinking:  { primary: '#8b5cf6', secondary: '#6366f1', speed: 8.0, scale: 0.95, morph: 0.15 },  // Intelligent indigo calculations
      speaking:  { primary: '#00f5ff', secondary: '#0ea5e9', speed: 6.2, scale: 1.12, morph: 0.15 },  // Fluent electric cyan acoustic energy flow (the speaker voice tone user loved)
    };

    let animationFrameId: number;
    const clock = new THREE.Clock();
    let currentMorphLerp = 0;
    let currentSpeedLerp = 1.0;
    
    // Smooth time accumulators to prevent phase jumping
    let lastT = 0;
    let smoothShaderTime = 0;
    let smoothPulseTime = 0;
    let smoothSpeedTime = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const t = clock.getElapsedTime();
      const delta = t - lastT;
      lastT = t;

      const currentConfig = stateRef.current;
      const targetState = (config as any)[currentConfig.systemState] || config.idle;

      // Add a bit of chaotic jitter when thinking
      const jitter = currentConfig.systemState === 'thinking' ? (Math.random() * 0.1 - 0.05) : 0;
      
      const targetSpeed = targetState.speed + (currentConfig.systemState === 'thinking' ? Math.random() * 4.0 : 0);
      // Smoothly interpolate speed to make acceleration/deceleration visible
      const speedLerpRate = targetSpeed > currentSpeedLerp ? 0.04 : 0.015; // Fast acceleration, slow deceleration
      currentSpeedLerp += (targetSpeed - currentSpeedLerp) * speedLerpRate;
      const finalSpeed = currentSpeedLerp;

      // Accumulate smoothed times
      smoothShaderTime += delta * (currentConfig.systemState === 'thinking' ? 2.0 : (currentConfig.systemState === 'speaking' ? 1.5 : 1.0));
      const pulseSpeedMultiplier = currentConfig.systemState === 'speaking' ? 2.5 : 1.5;
      smoothPulseTime += delta * finalSpeed * pulseSpeedMultiplier;
      smoothSpeedTime += delta * finalSpeed;

      // Update Custom Shader Uniforms
      customUniforms.uTime.value = smoothShaderTime;
      
      // Dynamic lerp rate for cooler transitions (fast ramp up, slow cool down)
      const targetMorph = targetState.morph + jitter;
      const morphLerpRate = targetMorph > currentMorphLerp ? 0.08 : 0.015; // Slow down the return to idle/listening
      currentMorphLerp += (targetMorph - currentMorphLerp) * morphLerpRate;
      customUniforms.uMorph.value = currentMorphLerp;
      
      // Adjust Holographic Imperfections over time/state
      const baseShift = currentConfig.systemState === 'thinking' ? 0.003 : (currentConfig.systemState === 'speaking' ? 0.002 : 0.001);
      const shiftFluctuation = Math.sin(t * 10.0) * (currentConfig.systemState === 'speaking' ? 0.001 : 0.0005);
      rgbShiftPass.uniforms['amount'].value = baseShift + shiftFluctuation;
      
      let currentPrimary = targetState.primary;
      if (currentConfig.systemState === 'thinking' && Math.random() > 0.9) {
          currentPrimary = '#a855f7'; 
      }

      // Smooth Float & Pulse of the whole group
      const pulseAmplitude = currentConfig.systemState === 'speaking' ? 0.04 : 0.02; // Reduced idle pulse slightly for contrast
      const pulse = Math.sin(smoothPulseTime) * pulseAmplitude;
      const targetScaleVec = new THREE.Vector3(targetState.scale + pulse, targetState.scale + pulse, targetState.scale + pulse);
      const scaleLerpRate = targetState.scale > mainGroup.scale.x ? 0.06 : 0.02; // Slower rescale when cooling down
      mainGroup.scale.lerp(targetScaleVec, scaleLerpRate);
      mainGroup.position.y = Math.sin(t * 1.0) * 0.15;

      // Rotate the whole matrix organically
      mainGroup.rotation.y += 0.002 * finalSpeed;
      mainGroup.rotation.z += 0.001 * finalSpeed;
      
      lodPoints.rotation.y += 0.003 * finalSpeed;
      lodPoints.rotation.z += 0.001 * finalSpeed;
      lodLines.rotation.copy(lodPoints.rotation);
      
      coreMesh.rotation.y -= 0.002 * finalSpeed;
      coreMesh.rotation.x += 0.001 * finalSpeed;

      // Update RGB Shift angle to create a swirling aberration effect
      rgbShiftPass.uniforms['angle'].value = t * 0.5 * finalSpeed;
      
      // Smoothly Lerp Colors bridging Primary palettes!
      // Slower lerp rate meant to give a long "crossfade" visual effect!
      pointsMaterials.forEach(m => {
        m.color.lerp(new THREE.Color(currentPrimary), 0.015);
        m.opacity = currentConfig.systemState === 'speaking' ? 0.45 : 0.25;
      });
      linesMaterials.forEach(m => {
        m.color.lerp(new THREE.Color(currentPrimary), 0.015);
        // Better balanced base opacity so neuronal links don't overglow
        const opacityBase = currentConfig.systemState === 'speaking' ? 0.20 : 0.08;
        const opacityFluctuation = currentConfig.systemState === 'speaking' ? (Math.sin(t * 20.0) * targetState.morph * 0.5) : (Math.sin(t * 8.0) * targetState.morph * 0.2);
        m.opacity = Math.min(0.5, opacityBase + opacityFluctuation);
      });
      coreMat.color.lerp(new THREE.Color(currentPrimary), 0.015);
      coreMat.opacity = currentConfig.systemState === 'speaking' ? 0.04 : 0.02;

      composer.render();
    };

    animate();

    // --- RESIZE OBSERVER (Handles smooth dynamic resizing during layout animations) ---
    const resizeObserver = new ResizeObserver((entries) => {
      if (!mountRef.current) return;
      for (const entry of entries) {
        let w = entry.contentRect.width;
        let h = entry.contentRect.height;
        // Fallback to clientDimensions if contentRect measures 0 during transition starts
        if (w === 0 || h === 0) {
          w = mountRef.current.clientWidth;
          h = mountRef.current.clientHeight;
        }
        if (w === 0 || h === 0) continue;

        renderer.setSize(w, h);
        composer.setSize(w, h);
        ssaoPass.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    });

    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    // --- CLEANUP ---
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        try {
          mountRef.current.removeChild(renderer.domElement);
        } catch (e) {
          // Ignore if already unmounted
        }
      }
      
      // Extensive memory cleanup for Vanilla Three
      scene.clear();
      geoms.forEach(g => g.dispose());
      linesMaterials.forEach(m => m.dispose());
      pointsMaterials.forEach(m => m.dispose());
      coreMat.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  return (
    <div 
      className={className}
      ref={mountRef}
    />
  );
}
