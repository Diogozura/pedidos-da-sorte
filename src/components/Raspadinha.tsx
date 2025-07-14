'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  width: number;
  height: number;
  backgroundImage: string;
  overlayColor?: string;
  radius?: number;
  percentToFinish?: number;
  onComplete?: () => void;
  children?: React.ReactNode;
};

export default function RaspadinhaJogo({
  width,
  height,
  backgroundImage,
  overlayColor = '#961f1f8f',
  radius = 25,
  percentToFinish = 50,
  onComplete,
  children,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isReady, setIsReady] = useState(false); // ✅ controla o "piscado"

  const brush = new Image();
  brush.src = '/brush.png'; // coloque o brush na pasta /public



  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Cobrir completamente o canvas com cor
    const overlay = new Image();
    overlay.src = '/overlay-image.png';

    overlay.onload = () => {
      ctx.drawImage(overlay, 0, 0, width, height);
      setIsReady(true);
    };

    overlay.onerror = () => {
      ctx.fillStyle = overlayColor;
      ctx.fillRect(0, 0, width, height);
      setIsReady(true);
    };

    // ✅ Agora consideramos a imagem pronta
    setIsReady(true);

    // Raspagem
    let isDrawing = false;

    const getPosition = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing || isCompleted || !brush.complete) return;

      const { x, y } = getPosition(e);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 0.5; // controla o quão forte "apaga" (1 = total)

      const size = radius * 2;
      ctx.drawImage(brush, x - radius, y - radius, size, size);

      ctx.globalAlpha = 1; // reset para evitar afetar outros desenhos
    };

    const start = (e: MouseEvent | TouchEvent) => {
      if (isCompleted) return;
      isDrawing = true;
      document.body.style.overflow = 'hidden'; // <- trava scroll
      draw(e);
    };

    const end = () => {
      isDrawing = false;
      document.body.style.overflow = ''; // <- destrava scroll
      if (isCompleted) return;

      const imageData = ctx.getImageData(0, 0, width, height);
      let cleared = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 128) cleared++;
      }
      const percent = (cleared / (imageData.data.length / 4)) * 100;

      if (percent >= percentToFinish && !isCompleted) {
        setIsCompleted(true);

        // Faz um fade-out do canvas antes de chamar onComplete
        if (canvas) {
          canvas.style.transition = 'opacity 0.6s ease-in-out';
          canvas.style.opacity = '0';

          setTimeout(() => {
            onComplete?.();
          }, 600); // Espera o fade-out terminar
        } else {
          onComplete?.();
        }
      }
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', end);

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('mouseleave', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', end);
    };
  }, [radius, width, height, overlayColor, percentToFinish, isCompleted, onComplete]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width,
        height,
        margin: '2rem auto',
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid #000',
        backgroundImage: isReady ? `url(${backgroundImage.startsWith('/') ? backgroundImage : '/' + backgroundImage})` : 'none',
        backgroundColor: !isReady ? overlayColor : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            color: '#fff',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          pointerEvents: isCompleted ? 'none' : 'auto',
          opacity: isCompleted ? 0 : 1,
          transition: 'opacity 0.6s ease-in-out', // fade suave
        }}
      />
    </div>
  );
}
