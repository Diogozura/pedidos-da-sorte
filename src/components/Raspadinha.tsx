'use client';

import { useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';

type Props = {
  width: number;
  height: number;
  backgroundImage?: string;        // fundo (prêmio) — otimizado pelo Next
  overlayColor?: string;           // cor sólida para cobrir imediatamente
  radius?: number;
  percentToFinish?: number;        // 0–100
  onComplete?: () => void;
  onReady?: () => void; // <- AQUI
  children?: React.ReactNode;
};

export default function RaspadinhaJogo({
  width,
  height,
  backgroundImage,
  overlayColor = '#961f1fcc', // vermelho com alpha
  radius = 24,
  percentToFinish = 50,
  onComplete,
  onReady,
  children,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const brushImgRef = useRef<HTMLImageElement | null>(null);
  const dprRef = useRef<number>(1);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);

  const [completed, setCompleted] = useState(false);
  const [overlayReady, setOverlayReady] = useState(false); // overlay+brush ok
  const [bgShown, setBgShown] = useState(false);           // fundo já renderizado

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // DPI correto
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    dprRef.current = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1) COBERTURA IMEDIATA (sem aguardar rede)
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, width, height);

    let alive = true;

    // 2) Carrega overlay e brush; depois substitui a cor pelo PNG/WebP
    const overlay = new window.Image();
    overlay.src = '/raspe.png'; // use .webp (mais leve); mantenha um .png fallback se quiser
    const brush = new window.Image();
    brush.src = '/brush.png';
    brushImgRef.current = brush;

    const waitLoad = (img: HTMLImageElement) =>
      new Promise<void>((res) => {
        if (img.complete && img.naturalWidth) return res();
        img.onload = () => res();
        img.onerror = () => res(); // em erro, segue com a cor sólida
      });

    Promise.all([waitLoad(overlay), waitLoad(brush)]).then(() => {
      if (!alive) return;

      if (overlay.naturalWidth) {
        ctx.drawImage(overlay, 0, 0, width, height);
      } // senão já estamos com a cor sólida

      // canvas amostra 64x64 para medir progresso
      const sample = document.createElement('canvas');
      sample.width = 64;
      sample.height = 64;
      sampleRef.current = sample;

      setOverlayReady(true); // só após overlay+brush prontos
      onReady?.();   
    });

    // Pointer events
    const getPos = (evt: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    };

    const draw = (evt: PointerEvent) => {
      if (!drawingRef.current || completed) return;
      const brushImg = brushImgRef.current;
      if (!brushImg || !brushImg.complete) return;

      const { x, y } = getPos(evt);
      const size = radius * 2;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(brushImg, x - radius, y - radius, size, size);
      ctx.globalCompositeOperation = 'source-over';
    };

    const onDown = (evt: PointerEvent) => {
      if (completed) return;
      drawingRef.current = true;
      draw(evt);
    };
    const onMove = (evt: PointerEvent) => {
      if (evt.pointerType === 'touch') evt.preventDefault();
      draw(evt);
    };
    const onUp = () => {
      drawingRef.current = false;
      if (completed) return;

      // mede progresso (barato)
      const sample = sampleRef.current;
      if (!sample) return;
      const sctx = sample.getContext('2d');
      if (!sctx) return;

      sctx.clearRect(0, 0, sample.width, sample.height);
      sctx.drawImage(
        canvas,
        0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current,
        0, 0, sample.width, sample.height
      );

      const data = sctx.getImageData(0, 0, sample.width, sample.height).data;
      let cleared = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 128) cleared++;
      const percent = (cleared / (data.length / 4)) * 100;

      if (percent >= percentToFinish) {
        setCompleted(true);
        canvas.style.transition = 'opacity .6s ease';
        canvas.style.opacity = '0';
        setTimeout(() => onComplete?.(), 600);
      }
    };

    canvas.addEventListener('pointerdown', onDown, { passive: true });
    canvas.addEventListener('pointermove', onMove as EventListener, { passive: false });
    canvas.addEventListener('pointerup', onUp, { passive: true });
    canvas.addEventListener('pointerleave', onUp, { passive: true });
    canvas.addEventListener('pointercancel', onUp, { passive: true });

    return () => {
      alive = false;
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove as EventListener);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [width, height, radius, overlayColor, percentToFinish, onComplete, completed]);

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        margin: 'auto',
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid #000',
        // 3) nunca mostra “o que tem abaixo”:
        backgroundColor: '#000000', // qualquer cor sólida segura (não visível por baixo do overlay)
        touchAction: 'none',
      }}
    >
      {/* FUNDO do prêmio — só aparece depois do overlay estar pronto */}
      {backgroundImage && overlayReady && (
        <NextImage
          src={backgroundImage}
          alt=""
          fill
          sizes={`${width}px`}
          priority
          draggable={false}
          onLoadingComplete={() => setBgShown(true)}
          style={{
            objectFit: 'cover',
            zIndex: 0,
            opacity: bgShown ? 1 : 0,       // 4) fade-in do fundo ao terminar
            transition: 'opacity .2s ease',
          }}
        />
      )}

      {/* Conteúdo opcional central */}
      {overlayReady && children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {children}
        </div>
      )}

      {/* OVERLAY raspável (sempre por cima) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: completed ? 'none' : 'auto',
          opacity: completed ? 0 : 1,
          transition: 'opacity .6s ease',
        }}
      />
    </div>
  );
}


