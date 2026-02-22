'use client';

import { useEffect, useRef, useCallback } from 'react';

type DogPawLoaderProps = {
  size?: number;
};

// Brand colors for the paw animation
const BRAND_COLORS = ['#1A3A3A', '#F4A9A8', '#2a4a4a', '#f5b9b8'];

type PawPrint = {
  x: number;
  y: number;
  angle: number;
  opacity: number;
  isLeft: boolean;
  createdAt: number;
  colorIndex: number;
};

export default function DogPawLoader({
  size = 200,
}: DogPawLoaderProps) {
  const colorIndexRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const animateFnRef = useRef<FrameRequestCallback | null>(null);
  const pawPrintsRef = useRef<PawPrint[]>([]);
  const positionRef = useRef({ x: size / 2, y: size / 2, angle: 0 });
  const lastStepTimeRef = useRef(0);
  const isLeftRef = useRef(true);

  const drawPaw = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    isLeft: boolean,
    opacity: number,
    pawColor: string,
    scale: number = 1
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = opacity;

    const pawSize = 12 * scale;
    const toeSize = 5 * scale;
    const toeSpacing = 7 * scale;
    const toeOffset = pawSize * 0.8;

    // Mirror for left/right paw
    const mirror = isLeft ? -1 : 1;

    // Main pad (larger oval)
    ctx.beginPath();
    ctx.ellipse(0, 0, pawSize * 0.8, pawSize, 0, 0, Math.PI * 2);
    ctx.fillStyle = pawColor;
    ctx.fill();

    // Toe pads (4 smaller ovals)
    const toePositions = [
      { x: -toeSpacing * mirror, y: -toeOffset },
      { x: toeSpacing * 0.3 * mirror, y: -toeOffset - toeSize * 0.3 },
      { x: toeSpacing * mirror, y: -toeOffset },
      { x: toeSpacing * 1.5 * mirror, y: -toeOffset + toeSize * 0.5 },
    ];

    toePositions.forEach((pos) => {
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, toeSize * 0.7, toeSize, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, []);

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const stepInterval = 350; // ms between steps
    const fadeTime = 2000; // ms for paw prints to fade

    // Add new paw print periodically
    if (timestamp - lastStepTimeRef.current > stepInterval) {
      lastStepTimeRef.current = timestamp;

      // Update position with random circular motion
      const pos = positionRef.current;

      // Add some randomness to the angle change for organic walking
      const angleChange = (Math.random() - 0.5) * 0.8 + 0.15; // Slight tendency to turn
      pos.angle += angleChange;

      // Step distance
      const stepDistance = 18;
      const newX = pos.x + Math.cos(pos.angle) * stepDistance;
      const newY = pos.y + Math.sin(pos.angle) * stepDistance;

      // Boundary check - if going out of bounds, turn around
      const margin = 40;
      if (newX < margin || newX > size - margin || newY < margin || newY > size - margin) {
        pos.angle += Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
      } else {
        pos.x = newX;
        pos.y = newY;
      }

      // Add perpendicular offset for left/right paw alternation
      const perpOffset = 6;
      const perpAngle = pos.angle + Math.PI / 2;
      const offsetX = Math.cos(perpAngle) * perpOffset * (isLeftRef.current ? -1 : 1);
      const offsetY = Math.sin(perpAngle) * perpOffset * (isLeftRef.current ? -1 : 1);

      pawPrintsRef.current.push({
        x: pos.x + offsetX,
        y: pos.y + offsetY,
        angle: pos.angle - Math.PI / 2, // Paws point in walking direction
        opacity: 1,
        isLeft: isLeftRef.current,
        createdAt: timestamp,
        colorIndex: colorIndexRef.current,
      });

      isLeftRef.current = !isLeftRef.current;
      colorIndexRef.current = (colorIndexRef.current + 1) % BRAND_COLORS.length;

      // Keep only recent paw prints
      const maxPrints = 12;
      if (pawPrintsRef.current.length > maxPrints) {
        pawPrintsRef.current = pawPrintsRef.current.slice(-maxPrints);
      }
    }

    // Draw all paw prints with fading
    pawPrintsRef.current.forEach((paw) => {
      const age = timestamp - paw.createdAt;
      const opacity = Math.max(0, 1 - age / fadeTime);

      if (opacity > 0) {
        const pawColor = BRAND_COLORS[paw.colorIndex];
        drawPaw(ctx, paw.x, paw.y, paw.angle, paw.isLeft, opacity, pawColor);
      }
    });

    // Remove fully faded paw prints
    pawPrintsRef.current = pawPrintsRef.current.filter(
      (paw) => timestamp - paw.createdAt < fadeTime
    );

    animationRef.current = requestAnimationFrame((ts) => animateFnRef.current?.(ts));
  }, [size, drawPaw]);

  useEffect(() => {
    animateFnRef.current = animate;
  }, [animate]);

  useEffect(() => {
    // Reset position to center
    positionRef.current = { x: size / 2, y: size / 2, angle: Math.random() * Math.PI * 2 };
    pawPrintsRef.current = [];
    lastStepTimeRef.current = 0;

    animationRef.current = requestAnimationFrame((ts) => animateFnRef.current?.(ts));

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, animate]);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg"
        style={{ width: size, height: size }}
      />
      <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
    </div>
  );
}
